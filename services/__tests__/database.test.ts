import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  DATABASE_VERSION,
  migrateDbIfNeeded,
  getGamesByPlatform,
  getBacklogGames,
  getBacklogStats,
  updateGameEnrichment,
  insertScreenshots,
} from '@/services/database';

function createMockDb(): SQLiteDatabase {
  return {
    execAsync: vi.fn().mockResolvedValue(undefined),
    runAsync: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: vi.fn().mockResolvedValue(null),
    getAllAsync: vi.fn().mockResolvedValue([]),
  } as unknown as SQLiteDatabase;
}

describe('migrateDbIfNeeded', () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = createMockDb(); });

  it('skips migration when version is current', async () => {
    vi.mocked(db.getFirstAsync).mockResolvedValue({ user_version: DATABASE_VERSION });
    await migrateDbIfNeeded(db);
    expect(db.execAsync).not.toHaveBeenCalled();
  });

  it('runs migration and sets version when version is 0', async () => {
    vi.mocked(db.getFirstAsync).mockResolvedValue({ user_version: 0 });
    await migrateDbIfNeeded(db);
    expect(db.execAsync).toHaveBeenCalledTimes(2);
    expect(db.execAsync).toHaveBeenLastCalledWith(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });

  it('runs migration when user_version is null', async () => {
    vi.mocked(db.getFirstAsync).mockResolvedValue(null);
    await migrateDbIfNeeded(db);
    expect(db.execAsync).toHaveBeenCalledTimes(2);
  });
});

describe('getGamesByPlatform', () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = createMockDb(); });

  it('queries by platform without vibe filter', async () => {
    await getGamesByPlatform(db, 'ps2');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE platform = ?'),
      ['ps2']
    );
  });

  it('queries by platform with vibe filter', async () => {
    await getGamesByPlatform(db, 'ps2', 'essential');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('AND curated_vibe = ?'),
      ['ps2', 'essential']
    );
  });
});

describe('getBacklogGames', () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = createMockDb(); });

  it('queries all backlog games with no filters', async () => {
    await getBacklogGames(db);
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("backlog_status != 'none'"),
      []
    );
  });

  it('adds status filter when provided', async () => {
    await getBacklogGames(db, 'playing');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('AND backlog_status = ?'),
      ['playing']
    );
  });

  it('adds both status and platform filters', async () => {
    await getBacklogGames(db, 'playing', 'ps2');
    const [query, params] = vi.mocked(db.getAllAsync).mock.calls[0];
    expect(query).toContain('AND backlog_status = ?');
    expect(query).toContain('AND platform = ?');
    expect(params).toEqual(['playing', 'ps2']);
  });

  it('adds only platform filter when status is undefined', async () => {
    await getBacklogGames(db, undefined, 'ps2');
    const [query, params] = vi.mocked(db.getAllAsync).mock.calls[0];
    expect(query).not.toContain('AND backlog_status = ?');
    expect(query).toContain('AND platform = ?');
    expect(params).toEqual(['ps2']);
  });
});

describe('getBacklogStats', () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = createMockDb(); });

  it('aggregates stats correctly', async () => {
    vi.mocked(db.getAllAsync).mockResolvedValue([
      { backlog_status: 'want_to_play', count: 5 },
      { backlog_status: 'playing', count: 3 },
      { backlog_status: 'completed', count: 10 },
      { backlog_status: 'dropped', count: 2 },
    ]);

    const stats = await getBacklogStats(db);
    expect(stats).toEqual({
      total: 20,
      want_to_play: 5,
      playing: 3,
      completed: 10,
      dropped: 2,
    });
  });

  it('returns zeros when no backlog games exist', async () => {
    vi.mocked(db.getAllAsync).mockResolvedValue([]);
    const stats = await getBacklogStats(db);
    expect(stats).toEqual({
      total: 0,
      want_to_play: 0,
      playing: 0,
      completed: 0,
      dropped: 0,
    });
  });

  it('handles partial statuses', async () => {
    vi.mocked(db.getAllAsync).mockResolvedValue([
      { backlog_status: 'completed', count: 7 },
    ]);

    const stats = await getBacklogStats(db);
    expect(stats.total).toBe(7);
    expect(stats.completed).toBe(7);
    expect(stats.want_to_play).toBe(0);
    expect(stats.playing).toBe(0);
    expect(stats.dropped).toBe(0);
  });
});

describe('updateGameEnrichment', () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = createMockDb(); });

  it('builds SET clause only for provided fields', async () => {
    await updateGameEnrichment(db, 'game-1', {
      metacritic: 85,
      developer: 'Naughty Dog',
    });

    const [query, params] = vi.mocked(db.runAsync).mock.calls[0];
    expect(query).toContain('metacritic = ?');
    expect(query).toContain('developer = ?');
    expect(query).toContain("last_enriched = datetime('now')");
    expect(params).toContain(85);
    expect(params).toContain('Naughty Dog');
    expect(params).toContain('game-1'); // WHERE id = ?
  });

  it('does not include fields that are undefined', async () => {
    await updateGameEnrichment(db, 'game-1', {
      metacritic: 90,
    });

    const [query] = vi.mocked(db.runAsync).mock.calls[0];
    expect(query).not.toContain('developer');
    expect(query).not.toContain('publisher');
    expect(query).toContain('metacritic = ?');
  });
});

describe('insertScreenshots', () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = createMockDb(); });

  it('inserts each screenshot individually', async () => {
    await insertScreenshots(db, [
      { id: 's1', game_id: 'g1', image_url: 'url1', width: 1920, height: 1080 },
      { id: 's2', game_id: 'g1', image_url: 'url2', width: 1920, height: 1080 },
    ]);

    expect(db.runAsync).toHaveBeenCalledTimes(2);
  });
});
