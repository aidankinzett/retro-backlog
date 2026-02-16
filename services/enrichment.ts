import type { SQLiteDatabase } from 'expo-sqlite';
import {
  updateGameEnrichment,
  insertScreenshots,
  deleteScreenshotsByGame,
  type Game,
} from '@/services/database';
import {
  getGameDetails,
  getGameScreenshots,
  searchGames,
  type RawgGame,
  RawgError,
} from '@/services/rawg';
import { PLATFORM_MAP } from '@/constants/platforms';

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Enrich a single game with full RAWG details and screenshots.
 * Call this after inserting a game from Browse.
 */
export async function enrichGame(
  db: SQLiteDatabase,
  game: Game,
): Promise<void> {
  const slug = game.rawg_slug || (game.rawg_id ? String(game.rawg_id) : null);
  if (!slug) return;

  let details: RawgGame;
  try {
    details = await getGameDetails(slug);
  } catch (err) {
    // If slug lookup fails with 404, try searching by title as fallback
    if (err instanceof RawgError && err.status === 404 && game.title) {
      const platformRawgId = PLATFORM_MAP[game.platform]?.rawgId;
      const searchRes = await searchGames(game.title, {
        platforms: platformRawgId,
        page_size: 5, // Get a few to find a better match
      });

      const normalizedTarget = normalizeTitle(game.title);
      const bestMatch = searchRes.results.find((result) => {
        const normalizedResult = normalizeTitle(result.name);
        return (
          normalizedResult.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedResult)
        );
      });

      if (bestMatch) {
        details = bestMatch;
        // Update the stored slug and rawg_id to fix future lookups
        await db.runAsync(
          'UPDATE games SET rawg_slug = ?, rawg_id = ? WHERE id = ?',
          [details.slug, details.id, game.id],
        );
      } else {
        console.warn(
          `Enrichment: No confident match found for "${game.title}"`,
        );
        return; // Skip update if no match found
      }
    } else {
      throw err;
    }
  }

  await updateGameEnrichment(db, game.id, {
    metacritic: details.metacritic,
    rawg_rating: details.rating,
    release_date: details.released,
    background_image: details.background_image,
    developer: details.developers?.[0]?.name ?? null,
    publisher: details.publishers?.[0]?.name ?? null,
    description: details.description_raw ?? null,
    playtime: details.playtime,
    esrb_rating: details.esrb_rating?.name ?? null,
    website: details.website ?? null,
    metacritic_url: details.metacritic_url ?? null,
    rawg_id: details.id,
    genre: details.genres?.map((g) => g.name).join(', ') || null,
  });

  if (details.id) {
    const screenshotsRes = await getGameScreenshots(details.id);
    await deleteScreenshotsByGame(db, game.id);
    await insertScreenshots(
      db,
      screenshotsRes.results.map((s) => ({
        id: String(s.id),
        game_id: game.id,
        image_url: s.image,
        width: s.width,
        height: s.height,
      })),
    );
  }
}
