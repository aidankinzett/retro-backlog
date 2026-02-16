import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        rawg_id INTEGER,
        rawg_slug TEXT,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        genre TEXT,
        curated_vibe TEXT,
        curated_desc TEXT,
        metacritic INTEGER,
        rawg_rating REAL,
        release_date TEXT,
        background_image TEXT,
        developer TEXT,
        publisher TEXT,
        description TEXT,
        playtime INTEGER,
        esrb_rating TEXT,
        website TEXT,
        metacritic_url TEXT,
        backlog_status TEXT DEFAULT 'none',
        last_enriched TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS screenshots (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
      CREATE INDEX IF NOT EXISTS idx_games_backlog ON games(backlog_status);
      CREATE INDEX IF NOT EXISTS idx_games_rawg_slug ON games(rawg_slug);
      CREATE INDEX IF NOT EXISTS idx_screenshots_game ON screenshots(game_id);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

// --- Game CRUD ---

export interface Game {
  id: string;
  rawg_id: number | null;
  rawg_slug: string | null;
  title: string;
  platform: string;
  genre: string | null;
  curated_vibe: string | null;
  curated_desc: string | null;
  metacritic: number | null;
  rawg_rating: number | null;
  release_date: string | null;
  background_image: string | null;
  developer: string | null;
  publisher: string | null;
  description: string | null;
  playtime: number | null;
  esrb_rating: string | null;
  website: string | null;
  metacritic_url: string | null;
  backlog_status: string;
  last_enriched: string | null;
  created_at: string;
}

export interface Screenshot {
  id: string;
  game_id: string;
  image_url: string;
  width: number | null;
  height: number | null;
}

export async function getGamesByPlatform(
  db: SQLiteDatabase,
  platform: string,
  vibeFilter?: 'essential' | 'hidden_gem'
): Promise<Game[]> {
  if (vibeFilter) {
    return db.getAllAsync<Game>(
      'SELECT * FROM games WHERE platform = ? AND curated_vibe = ? ORDER BY metacritic DESC',
      [platform, vibeFilter]
    );
  }
  return db.getAllAsync<Game>(
    'SELECT * FROM games WHERE platform = ? ORDER BY metacritic DESC',
    [platform]
  );
}

export async function getGameById(db: SQLiteDatabase, id: string): Promise<Game | null> {
  return db.getFirstAsync<Game>('SELECT * FROM games WHERE id = ?', [id]);
}

export async function getGameByRawgSlug(db: SQLiteDatabase, slug: string): Promise<Game | null> {
  return db.getFirstAsync<Game>('SELECT * FROM games WHERE rawg_slug = ?', [slug]);
}

export async function insertGame(db: SQLiteDatabase, game: Omit<Game, 'created_at'>): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO games (
      id, rawg_id, rawg_slug, title, platform, genre, curated_vibe, curated_desc,
      metacritic, rawg_rating, release_date, background_image, developer, publisher,
      description, playtime, esrb_rating, website, metacritic_url, backlog_status, last_enriched
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      game.id, game.rawg_id, game.rawg_slug, game.title, game.platform, game.genre,
      game.curated_vibe, game.curated_desc, game.metacritic, game.rawg_rating,
      game.release_date, game.background_image, game.developer, game.publisher,
      game.description, game.playtime, game.esrb_rating, game.website,
      game.metacritic_url, game.backlog_status, game.last_enriched,
    ]
  );
}

export async function updateBacklogStatus(
  db: SQLiteDatabase,
  gameId: string,
  status: string
): Promise<void> {
  await db.runAsync('UPDATE games SET backlog_status = ? WHERE id = ?', [status, gameId]);
}

export async function updateGameEnrichment(
  db: SQLiteDatabase,
  gameId: string,
  data: Partial<Game>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const enrichableFields = [
    'metacritic', 'rawg_rating', 'release_date', 'background_image',
    'developer', 'publisher', 'description', 'playtime', 'esrb_rating',
    'website', 'metacritic_url', 'rawg_id', 'genre',
  ] as const;

  for (const field of enrichableFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  fields.push("last_enriched = datetime('now')");
  values.push(gameId);

  await db.runAsync(`UPDATE games SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function getBacklogGames(
  db: SQLiteDatabase,
  status?: string,
  platform?: string
): Promise<Game[]> {
  let query = "SELECT * FROM games WHERE backlog_status != 'none'";
  const params: string[] = [];

  if (status) {
    query += ' AND backlog_status = ?';
    params.push(status);
  }
  if (platform) {
    query += ' AND platform = ?';
    params.push(platform);
  }

  query += ' ORDER BY created_at DESC';
  return db.getAllAsync<Game>(query, params);
}

export async function getBacklogStats(db: SQLiteDatabase): Promise<{
  total: number;
  want_to_play: number;
  playing: number;
  completed: number;
  dropped: number;
}> {
  const rows = await db.getAllAsync<{ backlog_status: string; count: number }>(
    "SELECT backlog_status, COUNT(*) as count FROM games WHERE backlog_status != 'none' GROUP BY backlog_status"
  );
  const stats = { total: 0, want_to_play: 0, playing: 0, completed: 0, dropped: 0 };
  for (const row of rows) {
    const key = row.backlog_status as keyof typeof stats;
    if (key in stats) stats[key] = row.count;
    stats.total += row.count;
  }
  return stats;
}

export async function getGamesNeedingEnrichment(db: SQLiteDatabase): Promise<Game[]> {
  return db.getAllAsync<Game>(
    `SELECT * FROM games
     WHERE rawg_slug IS NOT NULL
     AND (last_enriched IS NULL OR datetime(last_enriched, '+7 days') < datetime('now'))
     LIMIT 10`
  );
}

// --- Screenshot CRUD ---

export async function getScreenshots(db: SQLiteDatabase, gameId: string): Promise<Screenshot[]> {
  return db.getAllAsync<Screenshot>(
    'SELECT * FROM screenshots WHERE game_id = ?',
    [gameId]
  );
}

export async function insertScreenshots(db: SQLiteDatabase, screenshots: Screenshot[]): Promise<void> {
  for (const s of screenshots) {
    await db.runAsync(
      'INSERT OR REPLACE INTO screenshots (id, game_id, image_url, width, height) VALUES (?, ?, ?, ?, ?)',
      [s.id, s.game_id, s.image_url, s.width, s.height]
    );
  }
}

export async function deleteScreenshotsByGame(db: SQLiteDatabase, gameId: string): Promise<void> {
  await db.runAsync('DELETE FROM screenshots WHERE game_id = ?', [gameId]);
}
