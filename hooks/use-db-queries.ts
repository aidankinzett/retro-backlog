import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getGamesByPlatform,
  getGameByRawgSlug,
  getGameById,
  getBacklogGames,
  getBacklogStats,
  getScreenshots,
  insertGame,
  updateBacklogStatus,
  type Game,
} from '@/services/database';
import { enrichGame } from '@/services/enrichment';
import { getGameDetails, type RawgGame } from '@/services/rawg';
import { PLATFORMS } from '@/constants/platforms';
import { randomUUID } from 'expo-crypto';
import type { BacklogStatus } from '@/stores/ui';

export function useGamesByPlatform(platformId: string, vibeFilter?: 'essential' | 'hidden_gem') {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['games', 'platform', platformId, vibeFilter],
    queryFn: () => getGamesByPlatform(db, platformId, vibeFilter),
    networkMode: 'always',
  });
}

/**
 * Game detail hook: DB-first, RAWG API fallback.
 */
export function useGameDetail(slug: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['game', slug],
    queryFn: async (): Promise<{ game: Game | null; rawgGame: RawgGame | null; source: 'db' | 'rawg' }> => {
      // Try local DB first
      const dbGame = await getGameByRawgSlug(db, slug!);
      if (dbGame) {
        return { game: dbGame, rawgGame: null, source: 'db' };
      }
      // Fallback to RAWG API
      const rawgGame = await getGameDetails(slug!);
      return { game: null, rawgGame, source: 'rawg' };
    },
    enabled: !!slug,
    networkMode: 'offlineFirst',
  });
}

export function useGameScreenshots(gameId: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['game-screenshots', gameId],
    queryFn: () => getScreenshots(db, gameId!),
    enabled: !!gameId,
    networkMode: 'always',
  });
}

export function useBacklogGames(statusFilter?: string, platformFilter?: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['backlog', statusFilter ?? null, platformFilter ?? null],
    queryFn: () => getBacklogGames(db, statusFilter, platformFilter),
    networkMode: 'always',
  });
}

export function useBacklogStats() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['backlog-stats'],
    queryFn: () => getBacklogStats(db),
    networkMode: 'always',
  });
}

export function useSettingsCounts() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['settings', 'counts'],
    queryFn: async () => {
      const games = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM games');
      const screenshots = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM screenshots');
      return {
        gameCount: games?.count ?? 0,
        screenshotCount: screenshots?.count ?? 0,
      };
    },
    networkMode: 'always',
  });
}

// --- Mutations ---

export function useAddToBacklog() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rawgGame, status = 'want_to_play' }: { rawgGame: RawgGame; status?: BacklogStatus }) => {
      const existing = await getGameByRawgSlug(db, rawgGame.slug);
      if (existing) {
        await updateBacklogStatus(db, existing.id, status);
        return existing.id;
      }

      const gameId = randomUUID();
      const platformEntry = PLATFORMS.find((p) =>
        rawgGame.platforms?.some((rp) => rp.platform.id === p.rawgId)
      );
      await insertGame(db, {
        id: gameId,
        rawg_id: rawgGame.id,
        rawg_slug: rawgGame.slug,
        title: rawgGame.name,
        platform: platformEntry?.id ?? 'unknown',
        genre: rawgGame.genres?.map((g) => g.name).join(', ') ?? null,
        curated_vibe: null,
        curated_desc: null,
        metacritic: rawgGame.metacritic,
        rawg_rating: rawgGame.rating,
        release_date: rawgGame.released,
        background_image: rawgGame.background_image,
        developer: rawgGame.developers?.[0]?.name ?? null,
        publisher: rawgGame.publishers?.[0]?.name ?? null,
        description: rawgGame.description_raw ?? null,
        playtime: rawgGame.playtime,
        esrb_rating: rawgGame.esrb_rating?.name ?? null,
        website: rawgGame.website ?? null,
        metacritic_url: rawgGame.metacritic_url ?? null,
        backlog_status: status,
        last_enriched: null,
      });

      // Enrich in background
      const game = await getGameById(db, gameId);
      if (game && !game.last_enriched) {
        enrichGame(db, game).catch((err) =>
          console.error(`Enrichment failed for ${game.title}:`, err)
        );
      }

      return gameId;
    },
    onSuccess: (_gameId, { rawgGame }) => {
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stats'] });
      queryClient.invalidateQueries({ queryKey: ['game', rawgGame.slug] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'counts'] });
    },
  });
}

export function useUpdateBacklogStatus() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, slug, status }: { gameId: string; slug: string | null; status: BacklogStatus }) => {
      await updateBacklogStatus(db, gameId, status);
    },
    onSuccess: (_data, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stats'] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['game', slug] });
      }
    },
  });
}

export function useClearCache() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await db.execAsync("UPDATE games SET last_enriched = NULL");
      await db.execAsync("DELETE FROM screenshots");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['game-screenshots'] });
    },
  });
}
