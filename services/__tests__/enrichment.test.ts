import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SQLiteDatabase } from 'expo-sqlite';
import { enrichGame } from '@/services/enrichment';
import * as rawg from '@/services/rawg';
import * as database from '@/services/database';
import type { Game } from '@/services/database';

vi.mock('@/services/rawg');
vi.mock('@/services/database', async () => {
  const actual = await vi.importActual('@/services/database');
  return {
    ...actual,
    updateGameEnrichment: vi.fn(),
    insertScreenshots: vi.fn(),
    deleteScreenshotsByGame: vi.fn(),
  };
});

function createMockDb(): SQLiteDatabase {
  return {} as unknown as SQLiteDatabase;
}

const baseGame: Game = {
  id: 'game-1',
  rawg_id: 123,
  rawg_slug: 'test-game',
  title: 'Test Game',
  platform: 'ps2',
  genre: null,
  curated_vibe: null,
  curated_desc: null,
  metacritic: null,
  rawg_rating: null,
  release_date: null,
  background_image: null,
  developer: null,
  publisher: null,
  description: null,
  playtime: null,
  esrb_rating: null,
  website: null,
  metacritic_url: null,
  backlog_status: 'want_to_play',
  last_enriched: null,
  created_at: '2025-01-01',
};

describe('enrichGame', () => {
  let db: SQLiteDatabase;

  beforeEach(() => {
    db = createMockDb();
    vi.clearAllMocks();
  });

  it('returns early when game has no slug or rawg_id', async () => {
    const game = { ...baseGame, rawg_slug: null, rawg_id: null };
    await enrichGame(db, game);
    expect(rawg.getGameDetails).not.toHaveBeenCalled();
  });

  it('uses rawg_slug when available', async () => {
    vi.mocked(rawg.getGameDetails).mockResolvedValue({
      id: 123,
      slug: 'test-game',
      name: 'Test Game',
      released: null,
      background_image: null,
      metacritic: null,
      rating: 0,
      playtime: 0,
    });
    vi.mocked(rawg.getGameScreenshots).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    await enrichGame(db, baseGame);
    expect(rawg.getGameDetails).toHaveBeenCalledWith('test-game');
  });

  it('falls back to rawg_id when slug is null', async () => {
    const game = { ...baseGame, rawg_slug: null, rawg_id: 456 };
    vi.mocked(rawg.getGameDetails).mockResolvedValue({
      id: 456,
      slug: 'test',
      name: 'Test',
      released: null,
      background_image: null,
      metacritic: null,
      rating: 0,
      playtime: 0,
    });
    vi.mocked(rawg.getGameScreenshots).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    await enrichGame(db, game);
    expect(rawg.getGameDetails).toHaveBeenCalledWith('456');
  });

  it('maps RAWG details to enrichment data correctly', async () => {
    vi.mocked(rawg.getGameDetails).mockResolvedValue({
      id: 123,
      slug: 'test-game',
      name: 'Test Game',
      released: '2004-11-15',
      background_image: 'https://img.com/bg.jpg',
      metacritic: 92,
      rating: 4.5,
      playtime: 40,
      description_raw: 'A great game.',
      developers: [{ name: 'Naughty Dog' }],
      publishers: [{ name: 'Sony' }],
      genres: [{ name: 'Action' }, { name: 'Adventure' }],
      esrb_rating: { name: 'Teen' },
      website: 'https://example.com',
      metacritic_url: 'https://metacritic.com/game',
    });
    vi.mocked(rawg.getGameScreenshots).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    await enrichGame(db, baseGame);

    expect(database.updateGameEnrichment).toHaveBeenCalledWith(db, 'game-1', {
      metacritic: 92,
      rawg_rating: 4.5,
      release_date: '2004-11-15',
      background_image: 'https://img.com/bg.jpg',
      developer: 'Naughty Dog',
      publisher: 'Sony',
      description: 'A great game.',
      playtime: 40,
      esrb_rating: 'Teen',
      website: 'https://example.com',
      metacritic_url: 'https://metacritic.com/game',
      rawg_id: 123,
      genre: 'Action, Adventure',
    });
  });

  it('replaces screenshots when details.id exists', async () => {
    vi.mocked(rawg.getGameDetails).mockResolvedValue({
      id: 123,
      slug: 'test',
      name: 'Test',
      released: null,
      background_image: null,
      metacritic: null,
      rating: 0,
      playtime: 0,
    });
    vi.mocked(rawg.getGameScreenshots).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 1, image: 'https://img.com/1.jpg', width: 1920, height: 1080 },
        { id: 2, image: 'https://img.com/2.jpg', width: 1920, height: 1080 },
      ],
    });

    await enrichGame(db, baseGame);

    expect(database.deleteScreenshotsByGame).toHaveBeenCalledWith(db, 'game-1');
    expect(database.insertScreenshots).toHaveBeenCalledWith(db, [
      {
        id: '1',
        game_id: 'game-1',
        image_url: 'https://img.com/1.jpg',
        width: 1920,
        height: 1080,
      },
      {
        id: '2',
        game_id: 'game-1',
        image_url: 'https://img.com/2.jpg',
        width: 1920,
        height: 1080,
      },
    ]);
  });

  it('handles null optional fields gracefully', async () => {
    vi.mocked(rawg.getGameDetails).mockResolvedValue({
      id: 123,
      slug: 'test',
      name: 'Test',
      released: null,
      background_image: null,
      metacritic: null,
      rating: 0,
      playtime: 0,
      developers: [],
      publishers: [],
      genres: [],
      esrb_rating: null,
      website: undefined,
      metacritic_url: undefined,
    });
    vi.mocked(rawg.getGameScreenshots).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    await enrichGame(db, baseGame);

    expect(database.updateGameEnrichment).toHaveBeenCalledWith(
      db,
      'game-1',
      expect.objectContaining({
        developer: null,
        publisher: null,
        esrb_rating: null,
        website: null,
        metacritic_url: null,
        genre: null,
      }),
    );
  });
});
