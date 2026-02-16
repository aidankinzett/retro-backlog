const BASE_URL = 'https://api.rawg.io/api';

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_RAWG_API_KEY;
  if (!key) throw new Error('EXPO_PUBLIC_RAWG_API_KEY is not set in .env');
  return key;
}

function buildUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('key', getApiKey());
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

// --- Types ---

export interface RawgGame {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  metacritic: number | null;
  rating: number;
  playtime: number;
  description_raw?: string;
  developers?: { name: string }[];
  publishers?: { name: string }[];
  genres?: { name: string }[];
  platforms?: { platform: { id: number; name: string } }[];
  tags?: { name: string }[];
  esrb_rating?: { name: string } | null;
  website?: string;
  metacritic_url?: string;
}

export interface RawgScreenshot {
  id: number;
  image: string;
  width: number;
  height: number;
}

export interface RawgPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RawgPlatform {
  id: number;
  name: string;
  slug: string;
}

// --- API Functions ---

export async function searchGames(
  query: string,
  options: {
    platforms?: number;
    ordering?: string;
    metacritic?: string;
    page_size?: number;
    page?: number;
  } = {}
): Promise<RawgPaginatedResponse<RawgGame>> {
  const url = buildUrl('/games', {
    search: query,
    search_precise: 'true',
    page_size: options.page_size ?? 20,
    platforms: options.platforms,
    ordering: options.ordering,
    metacritic: options.metacritic,
    page: options.page,
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}

export async function getTopGames(
  platformId: number,
  options: {
    ordering?: string;
    metacritic?: string;
    page_size?: number;
    page?: number;
  } = {}
): Promise<RawgPaginatedResponse<RawgGame>> {
  const url = buildUrl('/games', {
    platforms: platformId,
    ordering: options.ordering ?? '-metacritic',
    metacritic: options.metacritic,
    page_size: options.page_size ?? 40,
    page: options.page,
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}

export async function getGameDetails(idOrSlug: number | string): Promise<RawgGame> {
  const url = buildUrl(`/games/${idOrSlug}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}

export async function getGameScreenshots(
  gameId: number
): Promise<RawgPaginatedResponse<RawgScreenshot>> {
  const url = buildUrl(`/games/${gameId}/screenshots`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}

export async function getPlatforms(): Promise<RawgPaginatedResponse<RawgPlatform>> {
  const url = buildUrl('/platforms', { page_size: 50 });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}
