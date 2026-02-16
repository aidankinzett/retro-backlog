# Retro Backlog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a retro game browsing and tracking app for the Ayn Odin 3 Android handheld, with RAWG API integration, gamepad navigation, and a landscape-first responsive UI.

**Architecture:** Expo Router with drawer navigation, SQLite for persistence, Zustand for UI state, react-native-earl-gamepad for controller input. Dark theme only with dynamic per-platform accent colors.

**Tech Stack:** Expo 54, React Native 0.81, TypeScript, Gluestack UI v3, NativeWind/Tailwind, expo-sqlite, Zustand, @react-navigation/drawer, react-native-earl-gamepad, expo-image

---

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install runtime dependencies**

Run:
```bash
pnpm add zustand @react-navigation/drawer react-native-earl-gamepad
```

**Step 2: Verify installation**

Run: `pnpm lint`
Expected: No errors

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install zustand, drawer navigator, and earl-gamepad"
```

---

### Task 2: Configure orientation and app settings

**Files:**
- Modify: `app.json`

**Step 1: Update app.json**

Change `"orientation": "portrait"` to `"orientation": "default"` to allow both orientations. Also update `userInterfaceStyle` to `"dark"` and the splash screen background to dark:

```json
{
  "expo": {
    "name": "retro-backlog",
    "slug": "retro-backlog",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/images/icon.png",
    "scheme": "retrobacklog",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#1a1a2e",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#1a1a2e"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

**Step 2: Create `hooks/use-orientation.ts`**

```typescript
import { useWindowDimensions } from 'react-native';

export type Orientation = 'landscape' | 'portrait';

export function useOrientation(): {
  orientation: Orientation;
  isLandscape: boolean;
  columns: number;
} {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  return {
    orientation: isLandscape ? 'landscape' : 'portrait',
    isLandscape,
    columns: isLandscape ? 4 : 2,
  };
}
```

**Step 3: Verify the app starts**

Run: `pnpm start` — press `a` for Android or `w` for Web. Confirm it loads without crashes.

**Step 4: Commit**

```bash
git add app.json hooks/use-orientation.ts
git commit -m "feat: configure responsive orientation and dark-only theme"
```

---

### Task 3: Define platform constants and accent color system

**Files:**
- Create: `constants/platforms.ts`
- Modify: `constants/theme.ts`

**Step 1: Create `constants/platforms.ts`**

```typescript
export interface Platform {
  id: string;
  rawgId: number;
  name: string;
  shortName: string;
  accent: string;
  manufacturer: 'sony' | 'nintendo' | 'sega';
}

export const PLATFORMS: Platform[] = [
  { id: 'ps2', rawgId: 15, name: 'PlayStation 2', shortName: 'PS2', accent: '#003791', manufacturer: 'sony' },
  { id: 'ps1', rawgId: 27, name: 'PlayStation', shortName: 'PS1', accent: '#003791', manufacturer: 'sony' },
  { id: 'gamecube', rawgId: 105, name: 'GameCube', shortName: 'GCN', accent: '#6A0DAD', manufacturer: 'nintendo' },
  { id: 'n64', rawgId: 83, name: 'Nintendo 64', shortName: 'N64', accent: '#E60012', manufacturer: 'nintendo' },
  { id: 'snes', rawgId: 79, name: 'Super Nintendo', shortName: 'SNES', accent: '#E60012', manufacturer: 'nintendo' },
  { id: 'nes', rawgId: 49, name: 'Nintendo Entertainment System', shortName: 'NES', accent: '#E60012', manufacturer: 'nintendo' },
  { id: 'gba', rawgId: 24, name: 'Game Boy Advance', shortName: 'GBA', accent: '#E60012', manufacturer: 'nintendo' },
  { id: 'megadrive', rawgId: 167, name: 'Mega Drive / Genesis', shortName: 'MD', accent: '#0060A8', manufacturer: 'sega' },
  { id: 'saturn', rawgId: 107, name: 'Sega Saturn', shortName: 'SAT', accent: '#0060A8', manufacturer: 'sega' },
  { id: 'dreamcast', rawgId: 106, name: 'Sega Dreamcast', shortName: 'DC', accent: '#0060A8', manufacturer: 'sega' },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

export function getPlatformAccent(platformId: string): string {
  return PLATFORM_MAP[platformId]?.accent ?? '#6366f1';
}
```

**Step 2: Replace `constants/theme.ts`**

Replace the existing file with a dark-only theme:

```typescript
export const Colors = {
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceLight: '#252540',
  text: '#e4e4e7',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  border: '#2e2e4a',
  tint: '#6366f1',
};

export const MetacriticColors = {
  green: '#6dc849',
  yellow: '#fdca52',
  red: '#fc4e4e',
  grey: '#71717a',
} as const;

export function getMetacriticColor(score: number | null): string {
  if (score === null || score === undefined) return MetacriticColors.grey;
  if (score >= 75) return MetacriticColors.green;
  if (score >= 50) return MetacriticColors.yellow;
  return MetacriticColors.red;
}
```

**Step 3: Commit**

```bash
git add constants/platforms.ts constants/theme.ts
git commit -m "feat: add platform constants, accent colors, and dark theme"
```

---

### Task 4: Set up drawer navigation

This replaces the existing tab-based navigation with a drawer layout.

**Files:**
- Modify: `app/_layout.tsx`
- Create: `app/(drawer)/_layout.tsx`
- Create: `app/(drawer)/index.tsx`
- Create: `app/(drawer)/browse.tsx`
- Create: `app/(drawer)/backlog.tsx`
- Create: `app/(drawer)/settings.tsx`
- Create: `app/game/[id].tsx`
- Delete: `app/(tabs)/_layout.tsx`
- Delete: `app/(tabs)/index.tsx`
- Delete: `app/(tabs)/explore.tsx`
- Delete: `app/modal.tsx`

**Step 1: Create `app/(drawer)/_layout.tsx`**

```typescript
import { Drawer } from 'expo-router/drawer';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';

export default function DrawerLayout() {
  const { isLandscape } = useOrientation();

  return (
    <Drawer
      screenOptions={{
        drawerType: isLandscape ? 'permanent' : 'front',
        drawerStyle: {
          backgroundColor: Colors.surface,
          width: isLandscape ? 200 : 260,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        drawerActiveTintColor: Colors.tint,
        drawerInactiveTintColor: Colors.textSecondary,
        headerShown: !isLandscape,
        sceneStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Drawer.Screen name="index" options={{ drawerLabel: 'Home', title: 'Home' }} />
      <Drawer.Screen name="browse" options={{ drawerLabel: 'Browse', title: 'Browse' }} />
      <Drawer.Screen name="backlog" options={{ drawerLabel: 'Backlog', title: 'Backlog' }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings', title: 'Settings' }} />
    </Drawer>
  );
}
```

**Step 2: Update `app/_layout.tsx`**

Replace the existing root layout:

```typescript
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="dark">
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen
            name="game/[id]"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
```

**Step 3: Create placeholder screens**

`app/(drawer)/index.tsx`:
```typescript
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background-dark">
      <Heading size="2xl" className="text-typography-white">Home</Heading>
      <Text className="text-typography-gray mt-2">Curated picks by system</Text>
    </Box>
  );
}
```

`app/(drawer)/browse.tsx`:
```typescript
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function BrowseScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background-dark">
      <Heading size="2xl" className="text-typography-white">Browse</Heading>
      <Text className="text-typography-gray mt-2">Search and explore RAWG</Text>
    </Box>
  );
}
```

`app/(drawer)/backlog.tsx`:
```typescript
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function BacklogScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background-dark">
      <Heading size="2xl" className="text-typography-white">Backlog</Heading>
      <Text className="text-typography-gray mt-2">Your game tracking list</Text>
    </Box>
  );
}
```

`app/(drawer)/settings.tsx`:
```typescript
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function SettingsScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background-dark">
      <Heading size="2xl" className="text-typography-white">Settings</Heading>
      <Text className="text-typography-gray mt-2">Attribution, preferences, cache</Text>
    </Box>
  );
}
```

`app/game/[id].tsx`:
```typescript
import { useLocalSearchParams } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Box className="flex-1 items-center justify-center bg-background-dark">
      <Heading size="2xl" className="text-typography-white">Game Detail</Heading>
      <Text className="text-typography-gray mt-2">Game ID: {id}</Text>
    </Box>
  );
}
```

**Step 4: Delete old tab files**

Remove `app/(tabs)/`, `app/modal.tsx`, and the old template components that are no longer needed (`components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`, `components/haptic-tab.tsx`, `components/external-link.tsx`, `components/ui/collapsible.tsx`).

**Step 5: Verify navigation works**

Run: `pnpm start` — confirm the drawer opens, all 4 screens navigate correctly, and landscape/portrait switching toggles the drawer between permanent and overlay.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: replace tab navigation with responsive drawer layout"
```

---

### Task 5: Set up SQLite schema and database service

**Files:**
- Create: `services/database.ts`
- Modify: `app/_layout.tsx` (add SQLiteProvider)

**Step 1: Create `services/database.ts`**

```typescript
import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const { user_version: currentVersion } = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version');

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
  const values: unknown[] = [];

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
```

**Step 2: Add SQLiteProvider to root layout**

Update `app/_layout.tsx` to wrap the app in `SQLiteProvider`:

```typescript
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { migrateDbIfNeeded } from '@/services/database';
import '@/global.css';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="dark">
      <ThemeProvider value={DarkTheme}>
        <SQLiteProvider databaseName="retro-backlog.db" onInit={migrateDbIfNeeded}>
          <Stack>
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            <Stack.Screen
              name="game/[id]"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
          </Stack>
        </SQLiteProvider>
        <StatusBar style="light" />
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
```

**Step 3: Verify the app starts with SQLite**

Run: `pnpm start` — confirm no crashes. The database initializes silently on first launch.

**Step 4: Commit**

```bash
git add services/database.ts app/_layout.tsx
git commit -m "feat: add SQLite schema, migration, and CRUD service layer"
```

---

### Task 6: Create RAWG API service

**Files:**
- Create: `services/rawg.ts`
- Create: `.env` (if not exists — will be gitignored)
- Modify: `.gitignore` (ensure .env is listed)

**Step 1: Create `services/rawg.ts`**

```typescript
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
```

**Step 2: Create `.env`**

```
EXPO_PUBLIC_RAWG_API_KEY=your_key_here
```

**Step 3: Ensure `.gitignore` has `.env`**

Check that `.env` is listed. If not, add it.

**Step 4: Commit**

```bash
git add services/rawg.ts .gitignore
git commit -m "feat: add RAWG API service with search, details, and screenshots"
```

---

### Task 7: Create Zustand UI store

**Files:**
- Create: `stores/ui.ts`

**Step 1: Create `stores/ui.ts`**

```typescript
import { create } from 'zustand';
import type { RawgGame } from '@/services/rawg';

export type BacklogStatus = 'none' | 'want_to_play' | 'playing' | 'completed' | 'dropped';

export const BACKLOG_STATUSES: { value: BacklogStatus; label: string }[] = [
  { value: 'want_to_play', label: 'Want to Play' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

interface UIState {
  // Home screen
  currentSystemId: string;
  setCurrentSystemId: (id: string) => void;

  // Browse screen
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: RawgGame[];
  setSearchResults: (results: RawgGame[]) => void;
  browsePlatformFilter: number | null;
  setBrowsePlatformFilter: (id: number | null) => void;
  browseOrdering: string;
  setBrowseOrdering: (ordering: string) => void;

  // Backlog screen
  backlogStatusFilter: BacklogStatus | null;
  setBacklogStatusFilter: (status: BacklogStatus | null) => void;
  backlogPlatformFilter: string | null;
  setBacklogPlatformFilter: (platform: string | null) => void;

  // Loading
  loading: Record<string, boolean>;
  setLoading: (key: string, value: boolean) => void;

  // Accent color override
  accentOverride: string | null;
  setAccentOverride: (color: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  // Home
  currentSystemId: 'ps2',
  setCurrentSystemId: (id) => set({ currentSystemId: id }),

  // Browse
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  browsePlatformFilter: null,
  setBrowsePlatformFilter: (id) => set({ browsePlatformFilter: id }),
  browseOrdering: '-metacritic',
  setBrowseOrdering: (ordering) => set({ browseOrdering: ordering }),

  // Backlog
  backlogStatusFilter: null,
  setBacklogStatusFilter: (status) => set({ backlogStatusFilter: status }),
  backlogPlatformFilter: null,
  setBacklogPlatformFilter: (platform) => set({ backlogPlatformFilter: platform }),

  // Loading
  loading: {},
  setLoading: (key, value) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } })),

  // Accent
  accentOverride: null,
  setAccentOverride: (color) => set({ accentOverride: color }),
}));
```

**Step 2: Commit**

```bash
git add stores/ui.ts
git commit -m "feat: add Zustand UI store for transient app state"
```

---

### Task 8: Build shared UI components

Reusable components used across multiple screens.

**Files:**
- Create: `components/game-card.tsx`
- Create: `components/metacritic-badge.tsx`
- Create: `components/system-selector.tsx`
- Create: `components/game-grid.tsx`

**Step 1: Create `components/metacritic-badge.tsx`**

```typescript
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { getMetacriticColor } from '@/constants/theme';

interface MetacriticBadgeProps {
  score: number | null;
  size?: 'sm' | 'lg';
}

export function MetacriticBadge({ score, size = 'sm' }: MetacriticBadgeProps) {
  const color = getMetacriticColor(score);
  const isLarge = size === 'lg';

  return (
    <Box
      className={`items-center justify-center rounded ${isLarge ? 'h-12 w-12' : 'h-7 w-7'}`}
      style={{ backgroundColor: color }}
    >
      <Text
        className={`font-bold text-typography-black ${isLarge ? 'text-lg' : 'text-xs'}`}
      >
        {score ?? '?'}
      </Text>
    </Box>
  );
}
```

**Step 2: Create `components/game-card.tsx`**

```typescript
import { Image } from 'expo-image';
import { Pressable } from '@/components/ui/pressable';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MetacriticBadge } from '@/components/metacritic-badge';
import type { Game } from '@/services/database';

interface GameCardProps {
  game: Game;
  onPress: () => void;
}

export function GameCard({ game, onPress }: GameCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <Image
        source={{ uri: game.background_image ?? undefined }}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        contentFit="cover"
        placeholder={{ blurhash: 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <Box className="p-2 gap-1">
        <Text className="text-typography-white text-sm font-bold" numberOfLines={1}>
          {game.title}
        </Text>
        <Box className="flex-row items-center justify-between">
          {game.genre ? (
            <Text className="text-typography-gray text-xs" numberOfLines={1}>
              {game.genre}
            </Text>
          ) : (
            <Box />
          )}
          <MetacriticBadge score={game.metacritic} />
        </Box>
      </Box>
    </Pressable>
  );
}
```

**Step 3: Create `components/system-selector.tsx`**

```typescript
import { ScrollView } from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { PLATFORMS } from '@/constants/platforms';
import { HStack } from '@/components/ui/hstack';

interface SystemSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function SystemSelector({ selectedId, onSelect }: SystemSelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <HStack className="gap-2 px-4 py-2">
        {PLATFORMS.map((platform) => {
          const isSelected = platform.id === selectedId;
          return (
            <Pressable
              key={platform.id}
              onPress={() => onSelect(platform.id)}
              className={`px-4 py-2 rounded-full ${isSelected ? '' : 'bg-background-800'}`}
              style={isSelected ? { backgroundColor: platform.accent } : undefined}
            >
              <Text
                className={`text-sm font-bold ${isSelected ? 'text-typography-white' : 'text-typography-gray'}`}
              >
                {platform.shortName}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    </ScrollView>
  );
}
```

**Step 4: Create `components/game-grid.tsx`**

```typescript
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { GameCard } from '@/components/game-card';
import { useOrientation } from '@/hooks/use-orientation';
import type { Game } from '@/services/database';

interface GameGridProps {
  games: Game[];
}

export function GameGrid({ games }: GameGridProps) {
  const { columns } = useOrientation();
  const router = useRouter();

  return (
    <FlatList
      data={games}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      key={columns}
      contentContainerStyle={{ padding: 12, gap: 12 }}
      columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
      renderItem={({ item }) => (
        <GameCard
          game={item}
          onPress={() => router.push(`/game/${item.id}`)}
        />
      )}
      style={{ flex: 1 }}
    />
  );
}
```

Note: `FlatList` with dynamic `numColumns` requires a `key` prop that changes when columns change, forcing a re-render.

**Step 5: Commit**

```bash
git add components/metacritic-badge.tsx components/game-card.tsx components/system-selector.tsx components/game-grid.tsx
git commit -m "feat: add shared UI components (game card, metacritic badge, system selector, grid)"
```

---

### Task 9: Build the Home screen

**Files:**
- Modify: `app/(drawer)/index.tsx`

**Step 1: Implement the Home screen**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { SystemSelector } from '@/components/system-selector';
import { GameGrid } from '@/components/game-grid';
import { useUIStore } from '@/stores/ui';
import { getGamesByPlatform, type Game } from '@/services/database';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const currentSystemId = useUIStore((s) => s.currentSystemId);
  const setCurrentSystemId = useUIStore((s) => s.setCurrentSystemId);

  const [essentials, setEssentials] = useState<Game[]>([]);
  const [hiddenGems, setHiddenGems] = useState<Game[]>([]);

  const loadGames = useCallback(async () => {
    const [ess, gems] = await Promise.all([
      getGamesByPlatform(db, currentSystemId, 'essential'),
      getGamesByPlatform(db, currentSystemId, 'hidden_gem'),
    ]);
    setEssentials(ess);
    setHiddenGems(gems);
  }, [db, currentSystemId]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const allGames = [...essentials, ...hiddenGems];
  const hasGames = allGames.length > 0;

  return (
    <Box className="flex-1 bg-background-dark">
      <SystemSelector selectedId={currentSystemId} onSelect={setCurrentSystemId} />

      {hasGames ? (
        <GameGrid games={allGames} />
      ) : (
        <VStack className="flex-1 items-center justify-center gap-2 px-8">
          <Heading size="xl" className="text-typography-white">No games yet</Heading>
          <Text className="text-typography-gray text-center">
            Curated picks will appear here once seed data is loaded. Browse games to add them to your collection.
          </Text>
        </VStack>
      )}
    </Box>
  );
}
```

**Step 2: Verify the home screen renders**

Run: `pnpm start` — confirm the Home screen shows the system selector and the empty state. Tapping system chips should switch the selected system.

**Step 3: Commit**

```bash
git add app/(drawer)/index.tsx
git commit -m "feat: implement home screen with system selector and game grid"
```

---

### Task 10: Build the Game Detail screen

**Files:**
- Modify: `app/game/[id].tsx`

**Step 1: Implement the two-panel Game Detail screen**

```typescript
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSQLiteContext } from 'expo-sqlite';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { PLATFORM_MAP } from '@/constants/platforms';
import {
  getGameById,
  getScreenshots,
  updateBacklogStatus,
  type Game,
  type Screenshot,
} from '@/services/database';
import { BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { isLandscape } = useOrientation();

  const [game, setGame] = useState<Game | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);

  useEffect(() => {
    if (!id) return;
    getGameById(db, id).then(setGame);
    getScreenshots(db, id).then(setScreenshots);
  }, [db, id]);

  const handleStatusChange = async (status: BacklogStatus) => {
    if (!game) return;
    await updateBacklogStatus(db, game.id, status);
    setGame({ ...game, backlog_status: status });
  };

  if (!game) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-dark">
        <Text className="text-typography-gray">Loading...</Text>
      </Box>
    );
  }

  const platform = PLATFORM_MAP[game.platform];

  const leftPanel = (
    <VStack className={`gap-4 ${isLandscape ? 'flex-1' : ''} p-4`}>
      {game.background_image && (
        <Image
          source={{ uri: game.background_image }}
          style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 8 }}
          contentFit="cover"
          transition={200}
        />
      )}
      <Heading size="2xl" className="text-typography-white">{game.title}</Heading>

      <HStack className="items-center gap-3">
        <MetacriticBadge score={game.metacritic} size="lg" />
        {game.rawg_rating && (
          <VStack>
            <Text className="text-typography-gray text-xs">RAWG</Text>
            <Text className="text-typography-white font-bold">{game.rawg_rating.toFixed(1)}</Text>
          </VStack>
        )}
      </HStack>

      {game.release_date && (
        <Text className="text-typography-gray">Released: {game.release_date}</Text>
      )}
      {game.developer && (
        <Text className="text-typography-gray">Developer: {game.developer}</Text>
      )}
      {game.publisher && (
        <Text className="text-typography-gray">Publisher: {game.publisher}</Text>
      )}
      {platform && (
        <Box
          className="self-start px-3 py-1 rounded-full"
          style={{ backgroundColor: platform.accent }}
        >
          <Text className="text-typography-white text-xs font-bold">{platform.name}</Text>
        </Box>
      )}
      {game.genre && (
        <HStack className="flex-wrap gap-2">
          {game.genre.split(',').map((g) => (
            <Box key={g.trim()} className="px-2 py-1 rounded bg-background-800">
              <Text className="text-typography-gray text-xs">{g.trim()}</Text>
            </Box>
          ))}
        </HStack>
      )}
      {game.esrb_rating && (
        <Text className="text-typography-gray text-xs">ESRB: {game.esrb_rating}</Text>
      )}

      {/* Backlog status */}
      <VStack className="gap-2 mt-2">
        <Text className="text-typography-gray text-sm font-bold">Backlog Status</Text>
        <HStack className="flex-wrap gap-2">
          {BACKLOG_STATUSES.map((s) => {
            const isActive = game.backlog_status === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => handleStatusChange(isActive ? 'none' : s.value)}
                className={`px-3 py-1.5 rounded-full ${isActive ? '' : 'bg-background-800'}`}
                style={isActive ? { backgroundColor: Colors.tint } : undefined}
              >
                <Text
                  className={`text-xs font-bold ${isActive ? 'text-typography-white' : 'text-typography-gray'}`}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </VStack>
    </VStack>
  );

  const rightPanel = (
    <VStack className={`gap-4 ${isLandscape ? 'flex-1' : ''} p-4`}>
      {screenshots.length > 0 && (
        <VStack className="gap-2">
          <Text className="text-typography-gray text-sm font-bold">Screenshots</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack className="gap-2">
              {screenshots.map((s) => (
                <Image
                  key={s.id}
                  source={{ uri: s.image_url }}
                  style={{ width: 280, height: 158, borderRadius: 8 }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </HStack>
          </ScrollView>
        </VStack>
      )}

      {game.description && (
        <VStack className="gap-2">
          <Text className="text-typography-gray text-sm font-bold">About</Text>
          <Text className="text-typography-white text-sm leading-relaxed">
            {game.description}
          </Text>
        </VStack>
      )}

      {game.playtime != null && game.playtime > 0 && (
        <Text className="text-typography-gray text-sm">
          Average playtime: {game.playtime} hours
        </Text>
      )}

      {game.curated_desc && (
        <Box className="p-3 rounded-lg bg-background-800 border border-outline-800">
          <Text className="text-typography-gray text-xs font-bold mb-1">Why this game?</Text>
          <Text className="text-typography-white text-sm">{game.curated_desc}</Text>
        </Box>
      )}
    </VStack>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Back button */}
      <Box className="px-4 pt-3 pb-1">
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary-400 text-sm">← Back</Text>
        </Pressable>
      </Box>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {isLandscape ? (
          <HStack className="flex-1">
            <ScrollView style={{ flex: 1 }}>{leftPanel}</ScrollView>
            <ScrollView style={{ flex: 1 }}>{rightPanel}</ScrollView>
          </HStack>
        ) : (
          <VStack>
            {leftPanel}
            {rightPanel}
          </VStack>
        )}
      </ScrollView>
    </Box>
  );
}
```

**Step 2: Verify by navigating to a game detail (requires seed data or manual insert)**

For now, visually confirm the loading state renders. Full testing will come after enrichment pipeline.

**Step 3: Commit**

```bash
git add app/game/[id].tsx
git commit -m "feat: implement two-panel game detail screen with backlog status"
```

---

### Task 11: Build the Browse screen

**Files:**
- Modify: `app/(drawer)/browse.tsx`

**Step 1: Implement the Browse screen**

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSQLiteContext } from 'expo-sqlite';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { PLATFORMS, PLATFORM_MAP } from '@/constants/platforms';
import { useUIStore } from '@/stores/ui';
import { searchGames, getTopGames, type RawgGame } from '@/services/rawg';
import { insertGame, getGameByRawgSlug, updateBacklogStatus } from '@/services/database';
import { randomUUID } from 'expo-crypto';

export default function BrowseScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { columns } = useOrientation();

  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const browsePlatformFilter = useUIStore((s) => s.browsePlatformFilter);
  const setBrowsePlatformFilter = useUIStore((s) => s.setBrowsePlatformFilter);
  const browseOrdering = useUIStore((s) => s.browseOrdering);

  const [results, setResults] = useState<RawgGame[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const res = await searchGames(searchQuery, {
          platforms: browsePlatformFilter ?? undefined,
          ordering: browseOrdering,
        });
        setResults(res.results);
      } else if (browsePlatformFilter) {
        const res = await getTopGames(browsePlatformFilter, {
          ordering: browseOrdering,
        });
        setResults(res.results);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Browse search error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, browsePlatformFilter, browseOrdering]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSearch, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [doSearch]);

  const handleAddToBacklog = async (rawgGame: RawgGame) => {
    const existing = await getGameByRawgSlug(db, rawgGame.slug);
    if (existing) {
      await updateBacklogStatus(db, existing.id, 'want_to_play');
    } else {
      const platformEntry = PLATFORMS.find((p) =>
        rawgGame.platforms?.some((rp) => rp.platform.id === p.rawgId)
      );
      await insertGame(db, {
        id: randomUUID(),
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
        backlog_status: 'want_to_play',
        last_enriched: new Date().toISOString(),
      });
    }
  };

  const renderItem = ({ item }: { item: RawgGame }) => (
    <Pressable
      onPress={() => {
        // Navigate to game detail if it exists in local DB, otherwise show RAWG data
        router.push(`/game/${item.slug}`);
      }}
      className="rounded-lg overflow-hidden flex-1"
      style={{ backgroundColor: Colors.surface }}
    >
      <Image
        source={{ uri: item.background_image ?? undefined }}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        contentFit="cover"
        transition={200}
      />
      <Box className="p-2 gap-1">
        <Text className="text-typography-white text-sm font-bold" numberOfLines={1}>
          {item.name}
        </Text>
        <HStack className="items-center justify-between">
          <Text className="text-typography-gray text-xs" numberOfLines={1}>
            {item.genres?.map((g) => g.name).join(', ') ?? ''}
          </Text>
          <MetacriticBadge score={item.metacritic} />
        </HStack>
        <Pressable
          onPress={() => handleAddToBacklog(item)}
          className="mt-1 px-2 py-1 rounded bg-primary-600 self-start"
        >
          <Text className="text-typography-white text-xs font-bold">+ Backlog</Text>
        </Pressable>
      </Box>
    </Pressable>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Search bar */}
      <Box className="px-4 pt-3">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search games..."
          placeholderTextColor={Colors.textMuted}
          style={{
            backgroundColor: Colors.surface,
            color: Colors.text,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            fontSize: 16,
          }}
        />
      </Box>

      {/* Platform filter chips */}
      <HStack className="flex-wrap gap-2 px-4 py-2">
        <Pressable
          onPress={() => setBrowsePlatformFilter(null)}
          className={`px-3 py-1 rounded-full ${browsePlatformFilter === null ? 'bg-primary-600' : 'bg-background-800'}`}
        >
          <Text className="text-typography-white text-xs">All</Text>
        </Pressable>
        {PLATFORMS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setBrowsePlatformFilter(p.rawgId)}
            className={`px-3 py-1 rounded-full ${browsePlatformFilter === p.rawgId ? '' : 'bg-background-800'}`}
            style={browsePlatformFilter === p.rawgId ? { backgroundColor: p.accent } : undefined}
          >
            <Text className="text-typography-white text-xs">{p.shortName}</Text>
          </Pressable>
        ))}
      </HStack>

      {/* Results */}
      {loading ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.tint} size="large" />
        </Box>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          numColumns={columns}
          key={columns}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
          renderItem={renderItem}
          ListEmptyComponent={
            <Box className="flex-1 items-center justify-center py-20">
              <Text className="text-typography-gray">
                {searchQuery || browsePlatformFilter
                  ? 'No results found'
                  : 'Search for games or select a platform'}
              </Text>
            </Box>
          }
        />
      )}
    </Box>
  );
}
```

Note: This task uses `expo-crypto`'s `randomUUID()` for generating IDs. Verify it's available in Expo 54 (it should be — it's a built-in module). If not, fall back to a simple `Date.now().toString(36) + Math.random().toString(36)` approach.

**Step 2: Verify search works**

Run the app, navigate to Browse, type a game name. Confirm results load after 300ms debounce. Confirm platform filter chips work. Confirm "Add to Backlog" button doesn't crash (check SQLite insertion).

**Step 3: Commit**

```bash
git add app/(drawer)/browse.tsx
git commit -m "feat: implement browse screen with search, filters, and add-to-backlog"
```

---

### Task 12: Build the Backlog screen

**Files:**
- Modify: `app/(drawer)/backlog.tsx`

**Step 1: Implement the Backlog screen**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import {
  getBacklogGames,
  getBacklogStats,
  updateBacklogStatus,
  type Game,
} from '@/services/database';
import { useUIStore, BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';

const ALL_FILTERS: { value: BacklogStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  ...BACKLOG_STATUSES,
];

export default function BacklogScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { columns } = useOrientation();

  const statusFilter = useUIStore((s) => s.backlogStatusFilter);
  const setStatusFilter = useUIStore((s) => s.setBacklogStatusFilter);

  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState({ total: 0, want_to_play: 0, playing: 0, completed: 0, dropped: 0 });

  const loadData = useCallback(async () => {
    const [gamesResult, statsResult] = await Promise.all([
      getBacklogGames(db, statusFilter ?? undefined),
      getBacklogStats(db),
    ]);
    setGames(gamesResult);
    setStats(statsResult);
  }, [db, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const cycleStatus = async (game: Game) => {
    const order: BacklogStatus[] = ['want_to_play', 'playing', 'completed', 'dropped', 'none'];
    const currentIndex = order.indexOf(game.backlog_status as BacklogStatus);
    const nextStatus = order[(currentIndex + 1) % order.length];
    await updateBacklogStatus(db, game.id, nextStatus);
    loadData();
  };

  const renderItem = ({ item }: { item: Game }) => (
    <Pressable
      onPress={() => router.push(`/game/${item.id}`)}
      className="rounded-lg overflow-hidden flex-1"
      style={{ backgroundColor: Colors.surface }}
    >
      <Image
        source={{ uri: item.background_image ?? undefined }}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        contentFit="cover"
        transition={200}
      />
      <Box className="p-2 gap-1">
        <Text className="text-typography-white text-sm font-bold" numberOfLines={1}>
          {item.title}
        </Text>
        <HStack className="items-center justify-between">
          <Pressable onPress={() => cycleStatus(item)}>
            <Text className="text-primary-400 text-xs font-bold">
              {BACKLOG_STATUSES.find((s) => s.value === item.backlog_status)?.label ?? 'Unknown'}
            </Text>
          </Pressable>
          <MetacriticBadge score={item.metacritic} />
        </HStack>
      </Box>
    </Pressable>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Stats bar */}
      <HStack className="px-4 py-3 gap-4 flex-wrap">
        <VStack className="items-center">
          <Text className="text-typography-white font-bold text-lg">{stats.total}</Text>
          <Text className="text-typography-gray text-xs">Total</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-typography-white font-bold text-lg">{stats.completed}</Text>
          <Text className="text-typography-gray text-xs">Completed</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-typography-white font-bold text-lg">{stats.playing}</Text>
          <Text className="text-typography-gray text-xs">Playing</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-typography-white font-bold text-lg">{stats.want_to_play}</Text>
          <Text className="text-typography-gray text-xs">Want to Play</Text>
        </VStack>
      </HStack>

      {/* Status filter chips */}
      <HStack className="flex-wrap gap-2 px-4 pb-2">
        {ALL_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <Pressable
              key={f.value ?? 'all'}
              onPress={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-full ${isActive ? 'bg-primary-600' : 'bg-background-800'}`}
            >
              <Text
                className={`text-xs font-bold ${isActive ? 'text-typography-white' : 'text-typography-gray'}`}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </HStack>

      {/* Game list */}
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        key={columns}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
        renderItem={renderItem}
        ListEmptyComponent={
          <Box className="flex-1 items-center justify-center py-20">
            <Text className="text-typography-gray">
              {statusFilter ? 'No games with this status' : 'Your backlog is empty. Browse games to add some!'}
            </Text>
          </Box>
        }
      />
    </Box>
  );
}
```

**Step 2: Verify backlog works end-to-end**

Add a game from Browse → confirm it appears in Backlog → tap status to cycle → navigate to detail and back.

**Step 3: Commit**

```bash
git add app/(drawer)/backlog.tsx
git commit -m "feat: implement backlog screen with status management and stats"
```

---

### Task 13: Set up gamepad input with react-native-earl-gamepad

**Files:**
- Create: `providers/gamepad-provider.tsx`
- Create: `hooks/use-gamepad-navigation.ts`
- Modify: `app/_layout.tsx` (add GamepadProvider)

**Step 1: Create `providers/gamepad-provider.tsx`**

```typescript
import { createContext, useContext, type ReactNode } from 'react';
import { GamepadBridge, useGamepad } from 'react-native-earl-gamepad';
import { useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';

interface GamepadContextValue {
  pressedButtons: Set<string>;
  isPressed: (button: string) => boolean;
}

const GamepadContext = createContext<GamepadContextValue>({
  pressedButtons: new Set(),
  isPressed: () => false,
});

export function useGamepadContext() {
  return useContext(GamepadContext);
}

const DRAWER_ROUTES = ['index', 'browse', 'backlog', 'settings'];

export function GamepadProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const navigation = useNavigation();

  const { pressedButtons, isPressed, bridge } = useGamepad({
    enabled: true,
  });

  // Handle global button actions
  const handleButton = (event: { button: string; pressed: boolean }) => {
    if (!event.pressed) return;

    // B button = back
    if (event.button === 'B') {
      router.back();
      return;
    }

    // Shoulder buttons = tab switching
    if (event.button === 'LB' || event.button === 'RB') {
      try {
        const state = navigation.getState();
        const currentIndex = state?.index ?? 0;
        const direction = event.button === 'RB' ? 1 : -1;
        const nextIndex = Math.max(0, Math.min(DRAWER_ROUTES.length - 1, currentIndex + direction));
        const nextRoute = DRAWER_ROUTES[nextIndex];
        if (nextRoute) {
          navigation.dispatch(DrawerActions.jumpTo(nextRoute));
        }
      } catch {
        // Navigation state may not be available
      }
    }
  };

  return (
    <GamepadContext.Provider value={{ pressedButtons, isPressed }}>
      <GamepadBridge
        enabled
        onButton={handleButton}
      />
      {children}
    </GamepadContext.Provider>
  );
}
```

**Step 2: Create `hooks/use-gamepad-navigation.ts`**

A hook for components that need to respond to D-pad focus changes:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useGamepad } from 'react-native-earl-gamepad';

interface FocusGridOptions {
  rows: number;
  columns: number;
  onSelect?: (row: number, col: number) => void;
  onFocusChange?: (row: number, col: number) => void;
}

export function useFocusGrid({ rows, columns, onSelect, onFocusChange }: FocusGridOptions) {
  const focusRow = useRef(0);
  const focusCol = useRef(0);

  const { bridge } = useGamepad({
    enabled: true,
    onDpad: (event) => {
      let newRow = focusRow.current;
      let newCol = focusCol.current;

      if (event.direction === 'up') newRow = Math.max(0, newRow - 1);
      if (event.direction === 'down') newRow = Math.min(rows - 1, newRow + 1);
      if (event.direction === 'left') newCol = Math.max(0, newCol - 1);
      if (event.direction === 'right') newCol = Math.min(columns - 1, newCol + 1);

      if (newRow !== focusRow.current || newCol !== focusCol.current) {
        focusRow.current = newRow;
        focusCol.current = newCol;
        onFocusChange?.(newRow, newCol);
      }
    },
    onButton: (event) => {
      if (event.button === 'A' && event.pressed) {
        onSelect?.(focusRow.current, focusCol.current);
      }
    },
  });

  const getFocusIndex = useCallback(
    () => focusRow.current * columns + focusCol.current,
    [columns]
  );

  return { focusRow, focusCol, getFocusIndex };
}
```

**Step 3: Add GamepadProvider to root layout**

Update `app/_layout.tsx` to wrap the app:

```typescript
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { GamepadProvider } from '@/providers/gamepad-provider';
import { migrateDbIfNeeded } from '@/services/database';
import '@/global.css';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="dark">
      <ThemeProvider value={DarkTheme}>
        <SQLiteProvider databaseName="retro-backlog.db" onInit={migrateDbIfNeeded}>
          <GamepadProvider>
            <Stack>
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen
                name="game/[id]"
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
            </Stack>
          </GamepadProvider>
        </SQLiteProvider>
        <StatusBar style="light" />
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
```

**Step 4: Verify gamepad works**

Connect a Bluetooth gamepad or use the Odin 3's built-in controls. Confirm:
- B button navigates back
- L1/R1 switch drawer tabs
- No crashes when gamepad is not connected

**Step 5: Commit**

```bash
git add providers/gamepad-provider.tsx hooks/use-gamepad-navigation.ts app/_layout.tsx
git commit -m "feat: add gamepad provider and focus grid navigation hook"
```

---

### Task 14: Build the background enrichment pipeline

**Files:**
- Create: `hooks/use-enrichment.ts`
- Modify: `app/_layout.tsx` (add enrichment trigger)

**Step 1: Create `hooks/use-enrichment.ts`**

```typescript
import { useEffect, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getGamesNeedingEnrichment,
  updateGameEnrichment,
  insertScreenshots,
  deleteScreenshotsByGame,
} from '@/services/database';
import { getGameDetails, getGameScreenshots } from '@/services/rawg';

export function useEnrichment() {
  const db = useSQLiteContext();
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;

    const enrichBatch = async () => {
      runningRef.current = true;
      try {
        const games = await getGamesNeedingEnrichment(db);
        for (const game of games) {
          try {
            const slug = game.rawg_slug ?? game.rawg_id;
            if (!slug) continue;

            const details = await getGameDetails(slug);

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
              genre: details.genres?.map((g) => g.name).join(', ') ?? null,
            });

            // Fetch and store screenshots
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
                }))
              );
            }

            // Small delay between API calls to be respectful
            await new Promise((r) => setTimeout(r, 500));
          } catch (err) {
            console.error(`Enrichment failed for ${game.title}:`, err);
          }
        }
      } finally {
        runningRef.current = false;
      }
    };

    enrichBatch();

    // Re-run every 5 minutes
    const interval = setInterval(enrichBatch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [db]);
}
```

**Step 2: Add enrichment to root layout**

Create a small component that runs the hook inside the SQLiteProvider tree. Add it to `app/_layout.tsx`:

```typescript
// Add this component inside the file
function EnrichmentRunner() {
  useEnrichment();
  return null;
}

// Then inside the RootLayout JSX, add <EnrichmentRunner /> as a sibling to <Stack>
```

Update the full `app/_layout.tsx`:

```typescript
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { GamepadProvider } from '@/providers/gamepad-provider';
import { migrateDbIfNeeded } from '@/services/database';
import { useEnrichment } from '@/hooks/use-enrichment';
import '@/global.css';

function EnrichmentRunner() {
  useEnrichment();
  return null;
}

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="dark">
      <ThemeProvider value={DarkTheme}>
        <SQLiteProvider databaseName="retro-backlog.db" onInit={migrateDbIfNeeded}>
          <GamepadProvider>
            <EnrichmentRunner />
            <Stack>
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen
                name="game/[id]"
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
            </Stack>
          </GamepadProvider>
        </SQLiteProvider>
        <StatusBar style="light" />
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
```

**Step 3: Verify enrichment runs**

Add a game via Browse → check console logs → after a few seconds, the game's details should be enriched (view in Game Detail screen to confirm).

**Step 4: Commit**

```bash
git add hooks/use-enrichment.ts app/_layout.tsx
git commit -m "feat: add background enrichment pipeline for RAWG data"
```

---

### Task 15: Build the Settings screen

**Files:**
- Modify: `app/(drawer)/settings.tsx`

**Step 1: Implement the Settings screen**

```typescript
import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';
import { PLATFORMS } from '@/constants/platforms';
import { useUIStore } from '@/stores/ui';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const accentOverride = useUIStore((s) => s.accentOverride);
  const setAccentOverride = useUIStore((s) => s.setAccentOverride);
  const [gameCount, setGameCount] = useState(0);
  const [screenshotCount, setScreenshotCount] = useState(0);

  useEffect(() => {
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM games').then(
      (r) => r && setGameCount(r.count)
    );
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM screenshots').then(
      (r) => r && setScreenshotCount(r.count)
    );
  }, [db]);

  const handleClearCache = async () => {
    await db.execAsync("UPDATE games SET last_enriched = NULL");
    await db.execAsync("DELETE FROM screenshots");
    setScreenshotCount(0);
  };

  const accentOptions = [
    { label: 'Dynamic (per system)', color: null },
    ...PLATFORMS.map((p) => ({ label: p.shortName, color: p.accent })),
  ];

  return (
    <Box className="flex-1 bg-background-dark p-6">
      <VStack className="gap-8 max-w-lg">
        {/* Attribution */}
        <VStack className="gap-2">
          <Heading size="lg" className="text-typography-white">Attribution</Heading>
          <Pressable onPress={() => Linking.openURL('https://rawg.io')}>
            <Text className="text-typography-gray text-sm">
              Game data provided by{' '}
              <Text className="text-primary-400 text-sm">RAWG</Text>
              {' '}&mdash; The largest video game database.
            </Text>
          </Pressable>
        </VStack>

        {/* Accent Color */}
        <VStack className="gap-2">
          <Heading size="lg" className="text-typography-white">Accent Color</Heading>
          <HStack className="flex-wrap gap-2">
            {accentOptions.map((opt) => {
              const isActive = accentOverride === opt.color;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setAccentOverride(opt.color)}
                  className="px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: isActive
                      ? (opt.color ?? Colors.tint)
                      : Colors.surface,
                    borderWidth: isActive ? 2 : 0,
                    borderColor: Colors.text,
                  }}
                >
                  <Text className={`text-xs font-bold ${isActive ? 'text-typography-white' : 'text-typography-gray'}`}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        </VStack>

        {/* Storage Stats */}
        <VStack className="gap-2">
          <Heading size="lg" className="text-typography-white">Storage</Heading>
          <Text className="text-typography-gray text-sm">Games in database: {gameCount}</Text>
          <Text className="text-typography-gray text-sm">Cached screenshots: {screenshotCount}</Text>
          <Pressable
            onPress={handleClearCache}
            className="mt-2 px-4 py-2 rounded bg-error-700 self-start"
          >
            <Text className="text-typography-white text-sm font-bold">Clear Cache &amp; Re-enrich</Text>
          </Pressable>
        </VStack>

        {/* App Info */}
        <VStack className="gap-1">
          <Heading size="lg" className="text-typography-white">About</Heading>
          <Text className="text-typography-gray text-sm">
            Retro Backlog v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
```

**Step 2: Verify settings screen**

Run app → navigate to Settings. Confirm RAWG attribution link opens browser. Confirm accent color selector works. Confirm "Clear Cache" doesn't crash.

**Step 3: Commit**

```bash
git add app/(drawer)/settings.tsx
git commit -m "feat: implement settings screen with attribution, accent color, and cache management"
```

---

### Task 16: Update CLAUDE.md with new architecture

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update CLAUDE.md**

Add sections covering the new architecture: drawer navigation, SQLite data layer, RAWG API service, Zustand store, gamepad input, and the enrichment pipeline. Update the routing section to reflect the drawer layout. Add the `.env` requirement for RAWG API key.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with full app architecture"
```

---

## Summary

| Task | Description | New Dependencies |
|------|-------------|-----------------|
| 1 | Install deps | zustand, @react-navigation/drawer, react-native-earl-gamepad |
| 2 | Orientation + dark theme config | — |
| 3 | Platform constants + accent colors | — |
| 4 | Drawer navigation | — |
| 5 | SQLite schema + CRUD service | — |
| 6 | RAWG API service | — |
| 7 | Zustand UI store | — |
| 8 | Shared UI components (card, badge, grid, selector) | — |
| 9 | Home screen | — |
| 10 | Game Detail screen | — |
| 11 | Browse screen | expo-crypto (built-in) |
| 12 | Backlog screen | — |
| 13 | Gamepad input + focus system | — |
| 14 | Background enrichment pipeline | — |
| 15 | Settings screen | — |
| 16 | Update CLAUDE.md | — |
