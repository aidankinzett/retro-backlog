import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchGames, getTopGames, getGameDetails } from '@/services/rawg';

vi.stubEnv('EXPO_PUBLIC_RAWG_API_KEY', 'test-api-key');

function mockFetch(data: any) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  });
}

function mockFetchError(status: number) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
  });
}

const emptyPaginated = { count: 0, next: null, previous: null, results: [] };

describe('searchGames', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('includes search query and API key in URL', async () => {
    mockFetch(emptyPaginated);
    await searchGames('zelda');

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('search=zelda');
    expect(url).toContain('key=test-api-key');
    expect(url).toContain('search_precise=true');
  });

  it('uses default page_size of 20', async () => {
    mockFetch(emptyPaginated);
    await searchGames('test');

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('page_size=20');
  });

  it('passes optional platform filter', async () => {
    mockFetch(emptyPaginated);
    await searchGames('test', { platforms: 15 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('platforms=15');
  });

  it('returns parsed response', async () => {
    const data = { count: 1, next: null, previous: null, results: [{ id: 1 }] };
    mockFetch(data);

    const result = await searchGames('test');
    expect(result.count).toBe(1);
    expect(result.results).toHaveLength(1);
  });
});

describe('getTopGames', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('defaults ordering to -metacritic', async () => {
    mockFetch(emptyPaginated);
    await getTopGames(15);

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('ordering=-metacritic');
  });

  it('defaults page_size to 40', async () => {
    mockFetch(emptyPaginated);
    await getTopGames(15);

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('page_size=40');
  });
});

describe('getGameDetails', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('fetches game by slug', async () => {
    mockFetch({ id: 1, slug: 'zelda', name: 'Zelda' });
    const result = await getGameDetails('zelda');

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('/games/zelda');
    expect(result.name).toBe('Zelda');
  });

  it('fetches game by numeric id', async () => {
    mockFetch({ id: 123, slug: 'test', name: 'Test' });
    await getGameDetails(123);

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('/games/123');
  });
});

describe('error handling', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('throws on 401', async () => {
    mockFetchError(401);
    await expect(searchGames('test')).rejects.toThrow('RAWG API error: 401');
  });

  it('throws on 404', async () => {
    mockFetchError(404);
    await expect(getGameDetails('nonexistent')).rejects.toThrow('RAWG API error: 404');
  });

  it('throws on 500', async () => {
    mockFetchError(500);
    await expect(getTopGames(15)).rejects.toThrow('RAWG API error: 500');
  });
});

describe('getApiKey', () => {
  it('throws when API key is not set', async () => {
    vi.stubEnv('EXPO_PUBLIC_RAWG_API_KEY', '');
    mockFetch(emptyPaginated);

    await expect(searchGames('test')).rejects.toThrow('EXPO_PUBLIC_RAWG_API_KEY is not set');

    // Restore for other tests
    vi.stubEnv('EXPO_PUBLIC_RAWG_API_KEY', 'test-api-key');
  });
});
