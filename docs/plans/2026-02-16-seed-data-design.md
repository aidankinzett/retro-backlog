# Seed Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pre-populate the SQLite database with 112 curated retro games on first launch, and refactor the migration system to support future migrations.

**Architecture:** Embed seed data as a TypeScript array in `services/seed-data.ts`. Refactor `services/database.ts` to use a sequential migration runner (array of migration functions keyed by version). Migration 1 creates the schema and seeds data.

**Tech Stack:** expo-sqlite, expo-crypto (randomUUID), TypeScript

---

### Task 1: Create seed data file

**Files:**

- Create: `services/seed-data.ts`

**Step 1: Create `services/seed-data.ts` with the embedded game array and seed function**

The file exports:

1. `SEED_GAMES` — a typed array of 112 game objects from the CSV
2. `seedGames(db)` — inserts each game, skipping duplicates by `rawg_slug + platform`

```typescript
import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';

interface SeedGame {
  title: string;
  platform: string;
  genre: string;
  curated_vibe: 'essential' | 'hidden_gem';
  rawg_slug: string;
  curated_desc: string;
}

const SEED_GAMES: SeedGame[] = [
  // All 112 entries from seed_games.csv, e.g.:
  {
    title: 'Final Fantasy X',
    platform: 'ps2',
    genre: 'JRPG',
    curated_vibe: 'essential',
    rawg_slug: 'final-fantasy-x',
    curated_desc:
      'One of the most beloved JRPGs ever. Incredible story, memorable characters, and deep turn-based combat.',
  },
  // ... all other entries
];

export async function seedGames(db: SQLiteDatabase): Promise<void> {
  for (const game of SEED_GAMES) {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM games WHERE rawg_slug = ? AND platform = ?',
      [game.rawg_slug, game.platform],
    );
    if (existing) continue;

    await db.runAsync(
      `INSERT INTO games (id, title, platform, genre, curated_vibe, curated_desc, rawg_slug, backlog_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'none')`,
      [
        randomUUID(),
        game.title,
        game.platform,
        game.genre,
        game.curated_vibe,
        game.curated_desc,
        game.rawg_slug,
      ],
    );
  }
}
```

**Step 2: Verify no TypeScript errors**

Run: `pnpm lint`
Expected: No errors in `services/seed-data.ts`

**Step 3: Commit**

```bash
git add services/seed-data.ts
git commit -m "feat: add embedded seed data for 112 curated retro games"
```

---

### Task 2: Refactor migration system and wire in seed

**Files:**

- Modify: `services/database.ts`

**Step 1: Refactor `migrateDbIfNeeded` to use a sequential migration runner**

Replace the current `if (currentVersion === 0)` pattern with an array of migration functions. Each migration runs in order from `currentVersion` to the latest. `PRAGMA user_version` is bumped after each migration.

```typescript
import type { SQLiteDatabase } from 'expo-sqlite';
import { seedGames } from './seed-data';

type Migration = (db: SQLiteDatabase) => Promise<void>;

const migrations: Migration[] = [
  // Migration 1: version 0 → 1 — Create schema + seed
  async (db) => {
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

    await seedGames(db);
  },
  // Future migrations go here as new array entries
];

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= migrations.length) return;

  for (let i = currentVersion; i < migrations.length; i++) {
    await migrations[i](db);
    await db.execAsync(`PRAGMA user_version = ${i + 1}`);
  }
}
```

Remove the old `DATABASE_VERSION` constant. The rest of the file (Game interface, CRUD functions) stays unchanged.

**Step 2: Verify no TypeScript errors**

Run: `pnpm lint`
Expected: No errors

**Step 3: Commit**

```bash
git add services/database.ts
git commit -m "feat: refactor migration system to sequential runner, seed on first launch"
```

---

### Task 3: Verify on Android emulator

**Step 1: Clear app data to trigger fresh migration**

Uninstall the app from the emulator so the database is recreated from scratch.

**Step 2: Launch the app**

Run: `pnpm android`

**Step 3: Verify seed data appears**

Open the home screen, select a platform (e.g. PS2). The curated games should appear in the grid. Check multiple platforms to confirm all data loaded.
