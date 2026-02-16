import { PLATFORMS } from '@/constants/platforms';

const RAWG_BASE_URL = 'https://api.rawg.io/api';
const DEFAULT_PROXY_URL =
  'https://ghexjephfeibvsfmttoz.supabase.co/functions/v1/rawg-proxy';

function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_RAWG_API_KEY;
}

function getProxyUrl(): string | undefined {
  const envUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  if (envUrl === '') return undefined;
  return envUrl || DEFAULT_PROXY_URL;
}

function buildUrl(
  path: string,
  params: Record<string, string | number | undefined> = {},
): string {
  // If we have a proxy (default or env), use it. Otherwise fallback to direct RAWG.
  const proxyUrl = getProxyUrl();
  const isUsingProxy = !!proxyUrl;
  const base = proxyUrl || RAWG_BASE_URL;

  const url = new URL(`${base}${path}`);

  // Only add key if calling RAWG directly
  if (!isUsingProxy) {
    const key = getApiKey();
    if (!key) throw new Error('EXPO_PUBLIC_RAWG_API_KEY is not set in .env');
    url.searchParams.set('key', key);
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

// --- Types ---

export class RawgError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RawgError';
    this.status = status;
  }
}

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
  } = {},
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
  if (!res.ok) throw new RawgError(`RAWG API error: ${res.status}`, res.status);
  return res.json();
}

export async function getTopGames(
  platformId: number,
  options: {
    ordering?: string;
    metacritic?: string;
    page_size?: number;
    page?: number;
  } = {},
): Promise<RawgPaginatedResponse<RawgGame>> {
  const url = buildUrl('/games', {
    platforms: platformId,
    ordering: options.ordering ?? '-metacritic',
    metacritic: options.metacritic,
    page_size: options.page_size ?? 40,
    page: options.page,
  });

  const res = await fetch(url);
  if (!res.ok) throw new RawgError(`RAWG API error: ${res.status}`, res.status);
  return res.json();
}

export async function getGameDetails(
  idOrSlug: number | string,
): Promise<RawgGame> {
  const url = buildUrl(`/games/${idOrSlug}`);
  const res = await fetch(url);
  if (!res.ok) throw new RawgError(`RAWG API error: ${res.status}`, res.status);
  return res.json();
}

export async function getGameScreenshots(
  gameId: number,
): Promise<RawgPaginatedResponse<RawgScreenshot>> {
  const url = buildUrl(`/games/${gameId}/screenshots`);
  const res = await fetch(url);
  if (!res.ok) throw new RawgError(`RAWG API error: ${res.status}`, res.status);
  return res.json();
}

export async function getTopRetroGames(
  options: { page_size?: number; page?: number } = {},
): Promise<RawgPaginatedResponse<RawgGame>> {
  const allPlatformIds = PLATFORMS.map((p) => p.rawgId).join(',');
  const url = buildUrl('/games', {
    platforms: allPlatformIds,
    ordering: '-metacritic',
    page_size: options.page_size ?? 40,
    page: options.page,
  });

  const res = await fetch(url);
  if (!res.ok) throw new RawgError(`RAWG API error: ${res.status}`, res.status);
  return res.json();
}

export async function getPlatforms(): Promise<
  RawgPaginatedResponse<RawgPlatform>
> {
  const url = buildUrl('/platforms', { page_size: 50 });
  const res = await fetch(url);
  if (!res.ok) throw new RawgError(`RAWG API error: ${res.status}`, res.status);
  return res.json();
}
