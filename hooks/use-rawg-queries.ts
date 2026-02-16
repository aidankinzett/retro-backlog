import { useQuery } from '@tanstack/react-query';
import {
  searchGames,
  getTopGames,
  getTopRetroGames,
  getGameDetails,
  getGameScreenshots,
} from '@/services/rawg';

export function useRawgSearch(
  query: string,
  platformFilter: number | null,
  ordering: string
) {
  return useQuery({
    queryKey: ['rawg', 'search', query, platformFilter, ordering],
    queryFn: () =>
      searchGames(query, {
        platforms: platformFilter ?? undefined,
        ordering,
      }),
    enabled: !!query.trim(),
  });
}

export function useRawgTopGames(
  platformId: number | null,
  ordering: string
) {
  return useQuery({
    queryKey: ['rawg', 'top', platformId, ordering],
    queryFn: () => getTopGames(platformId!, { ordering }),
    enabled: !!platformId,
  });
}

export function useTopRetroGames() {
  return useQuery({
    queryKey: ['rawg', 'top-retro'],
    queryFn: () => getTopRetroGames(),
  });
}

export function useRawgGameDetails(slug: string | undefined) {
  return useQuery({
    queryKey: ['rawg', 'game', slug],
    queryFn: () => getGameDetails(slug!),
    enabled: !!slug,
  });
}

export function useRawgScreenshots(gameId: number | undefined) {
  return useQuery({
    queryKey: ['rawg', 'screenshots', gameId],
    queryFn: () => getGameScreenshots(gameId!),
    enabled: !!gameId,
  });
}
