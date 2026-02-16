# Vitest Unit Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Vitest with comprehensive mocking for Expo/React Native and write unit tests for the highest-value parts of the codebase.

**Architecture:** Vitest runs in JSDOM via Vite (completely separate from Metro). React Native is aliased to react-native-web. All Expo native modules are mocked in a global setup file. Tests are co-located with source in `__tests__/` directories. TanStack Query hooks use a shared QueryClient wrapper.

**Tech Stack:** Vitest, @testing-library/react-native, react-native-web (already installed), JSDOM

---

### Task 1: Install Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Install dev dependencies**

Run:

```bash
pnpm add -D vitest @testing-library/react-native @testing-library/jest-dom jsdom
```

Note: `react-native-web` is already in dependencies. `react-test-renderer` may not be needed with recent `@testing-library/react-native` versions — skip unless install complains about a missing peer dep. If it does, run `pnpm add -D react-test-renderer@19.1.0`.

**Step 2: Add test scripts to package.json**

Add these to the `"scripts"` section:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add vitest and testing-library dependencies"
```

---

### Task 2: Create Vitest Configuration

**Files:**

- Create: `vitest.config.ts`

**Step 1: Write vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    include: [
      '**/__tests__/**/*.{test,spec}.{ts,tsx}',
      '**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', '.expo', 'android', 'ios'],
    css: false,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: [
        'services/**',
        'hooks/**',
        'stores/**',
        'components/**',
        'constants/**',
      ],
      exclude: ['components/ui/**', '**/*.d.ts', 'app/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'tailwind.config': path.resolve(__dirname, './tailwind.config.js'),
      'react-native': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
  },
});
```

Key decisions:

- `react-native` aliased to `react-native-web` because Vitest runs in JSDOM, not on device.
- `.web.tsx` extension priority so Gluestack UI web variants resolve correctly.
- `css: false` because NativeWind Babel plugin doesn't run under Vite — className passes through as-is.
- `components/ui/**` excluded from coverage — these are generated Gluestack components.

**Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add vitest configuration"
```

---

### Task 3: Create Global Test Setup (Expo/RN Mocks)

**Files:**

- Create: `test/setup.ts`

**Step 1: Create the setup file**

This file mocks every native module the app imports. Without these mocks, tests will crash on import because JSDOM has no native bridge.

```typescript
import { vi, beforeEach } from 'vitest';

// ============================================================
// 1. EXPO MODULES
// ============================================================

vi.mock('expo-sqlite', () => {
  const mockDb = {
    execAsync: vi.fn().mockResolvedValue(undefined),
    runAsync: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: vi.fn().mockResolvedValue(null),
    getAllAsync: vi.fn().mockResolvedValue([]),
    closeAsync: vi.fn().mockResolvedValue(undefined),
    withTransactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
  };
  return {
    openDatabaseAsync: vi.fn().mockResolvedValue(mockDb),
    useSQLiteContext: vi.fn(() => mockDb),
    SQLiteProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    canGoBack: vi.fn(() => true),
  })),
  useLocalSearchParams: vi.fn(() => ({})),
  useGlobalSearchParams: vi.fn(() => ({})),
  useSegments: vi.fn(() => []),
  usePathname: vi.fn(() => '/'),
  useNavigation: vi.fn(() => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
    getState: vi.fn(() => ({ index: 0, routes: [] })),
    dispatch: vi.fn(),
  })),
  Link: ({ children }: any) => children,
  Stack: Object.assign(({ children }: any) => children, {
    Screen: ({ children }: any) => children,
  }),
  Tabs: Object.assign(({ children }: any) => children, {
    Screen: ({ children }: any) => children,
  }),
  Slot: ({ children }: any) => children,
  router: { push: vi.fn(), back: vi.fn(), replace: vi.fn() },
}));

vi.mock('expo-crypto', () => ({
  randomUUID: vi.fn(
    () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  ),
}));

vi.mock('expo-image', () => ({
  Image: ({ source, style, ...props }: any) => {
    const { createElement } = require('react');
    return createElement('img', {
      src: typeof source === 'object' ? source.uri : source,
      style,
      ...props,
    });
  },
}));

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: { name: 'retro-backlog', slug: 'retro-backlog' },
    executionEnvironment: 'storeClient',
  },
}));

vi.mock('expo-font', () => ({
  useFonts: vi.fn(() => [true, null]),
  isLoaded: vi.fn(() => true),
  loadAsync: vi.fn(),
}));

vi.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: vi.fn().mockResolvedValue(true),
  hideAsync: vi.fn().mockResolvedValue(true),
}));

vi.mock('expo-status-bar', () => ({ StatusBar: () => null }));

vi.mock('expo-linking', () => ({
  openURL: vi.fn(),
  createURL: vi.fn((path: string) => `retrobacklog://${path}`),
  canOpenURL: vi.fn().mockResolvedValue(true),
}));

vi.mock('expo-web-browser', () => ({
  openBrowserAsync: vi.fn(),
}));

// ============================================================
// 2. REACT NATIVE LIBRARIES
// ============================================================

vi.mock('react-native-reanimated', () => ({
  default: {
    createAnimatedComponent: (component: any) => component,
  },
  useSharedValue: vi.fn((init: any) => ({ value: init })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((val: any) => val),
  withSpring: vi.fn((val: any) => val),
  withDelay: vi.fn((_: number, val: any) => val),
  FadeIn: { duration: vi.fn().mockReturnThis() },
  FadeOut: { duration: vi.fn().mockReturnThis() },
  Layout: { duration: vi.fn().mockReturnThis() },
  runOnJS: vi.fn((fn: any) => fn),
  runOnUI: vi.fn((fn: any) => fn),
}));

vi.mock('react-native-gesture-handler', () => {
  const {
    View,
    TouchableOpacity,
    ScrollView,
    FlatList,
  } = require('react-native-web');
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    RawButton: TouchableOpacity,
    BaseButton: TouchableOpacity,
    RectButton: TouchableOpacity,
    BorderlessButton: TouchableOpacity,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Gesture: { Pan: vi.fn().mockReturnThis, Tap: vi.fn().mockReturnThis },
    GestureDetector: View,
    Directions: {},
  };
});

vi.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native-web');
  return {
    SafeAreaProvider: View,
    SafeAreaView: View,
    useSafeAreaInsets: vi.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
    useSafeAreaFrame: vi.fn(() => ({ x: 0, y: 0, width: 375, height: 812 })),
  };
});

vi.mock('react-native-screens', () => {
  const { View } = require('react-native-web');
  return {
    enableScreens: vi.fn(),
    Screen: View,
    ScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    NativeScreen: View,
    NativeScreenContainer: View,
  };
});

vi.mock('react-native-earl-gamepad/dist/useGamepad', () => ({
  default: vi.fn(() => ({
    pressedButtons: new Set(),
    isPressed: vi.fn(() => false),
    bridge: null,
  })),
}));

vi.mock('react-native-webview', () => {
  const { View } = require('react-native-web');
  return { default: View, WebView: View };
});

vi.mock('react-native-worklets/plugin', () => ({}));
vi.mock('react-native-worklets', () => ({
  createRunOnJS: vi.fn((fn: any) => fn),
  createRunOnUI: vi.fn((fn: any) => fn),
}));

// ============================================================
// 3. NATIVEWIND / GLUESTACK / NAVIGATION
// ============================================================

vi.mock('@gluestack-ui/core/overlay/creator', () => ({
  OverlayProvider: ({ children }: any) => children,
}));

vi.mock('@gluestack-ui/core/toast/creator', () => ({
  ToastProvider: ({ children }: any) => children,
}));

vi.mock('nativewind', () => ({
  useColorScheme: vi.fn(() => ({
    colorScheme: 'dark',
    setColorScheme: vi.fn(),
    toggleColorScheme: vi.fn(),
  })),
  styled: (component: any) => component,
  cssInterop: vi.fn(),
  remapProps: vi.fn(),
}));

vi.mock('react-native-css-interop', () => ({
  cssInterop: vi.fn(),
  remapProps: vi.fn(),
  createInteropElement: vi.fn(),
}));

vi.mock('@react-navigation/native', async () => {
  const actual = await vi.importActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: vi.fn(() => ({
      navigate: vi.fn(),
      goBack: vi.fn(),
      getState: vi.fn(() => ({ index: 0, routes: [] })),
      dispatch: vi.fn(),
      addListener: vi.fn(() => vi.fn()),
    })),
    useRoute: vi.fn(() => ({ key: 'test', name: 'test' })),
    useFocusEffect: vi.fn(),
    useIsFocused: vi.fn(() => true),
  };
});

vi.mock('@react-navigation/drawer', () => {
  const { View } = require('react-native-web');
  return {
    createDrawerNavigator: vi.fn(() => ({ Navigator: View, Screen: View })),
    DrawerActions: {
      openDrawer: vi.fn(),
      closeDrawer: vi.fn(),
      toggleDrawer: vi.fn(),
      jumpTo: vi.fn(),
    },
  };
});

// ============================================================
// 4. CLEANUP
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
});
```

**Step 2: Run vitest to verify setup loads without errors**

Run: `pnpm test`

Expected: 0 tests found, no setup errors. If there are module resolution errors, add the failing packages to `deps.inline` in `vitest.config.ts` or add missing mocks.

**Step 3: Commit**

```bash
git add test/setup.ts
git commit -m "chore: add vitest global test setup with Expo/RN mocks"
```

---

### Task 4: Create Shared Test Utilities

**Files:**

- Create: `test/test-utils.tsx`

**Step 1: Write the test utilities file**

This provides a QueryClient wrapper for testing TanStack Query hooks.

```typescript
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, type RenderHookOptions } from '@testing-library/react-native';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

export function renderHookWithProviders<TResult>(
  hook: () => TResult,
  options?: Omit<RenderHookOptions<any>, 'wrapper'>
) {
  return renderHook(hook, {
    wrapper: createWrapper(),
    ...options,
  });
}
```

**Step 2: Commit**

```bash
git add test/test-utils.tsx
git commit -m "chore: add shared test utilities with QueryClient wrapper"
```

---

### Task 5: Test Pure Functions — constants/theme.ts

**Files:**

- Create: `constants/__tests__/theme.test.ts`
- Test target: `constants/theme.ts` — `getMetacriticColor()` function

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { getMetacriticColor, MetacriticColors } from '@/constants/theme';

describe('getMetacriticColor', () => {
  it('returns green for scores >= 75', () => {
    expect(getMetacriticColor(75)).toBe(MetacriticColors.green);
    expect(getMetacriticColor(100)).toBe(MetacriticColors.green);
  });

  it('returns yellow for scores 50-74', () => {
    expect(getMetacriticColor(50)).toBe(MetacriticColors.yellow);
    expect(getMetacriticColor(74)).toBe(MetacriticColors.yellow);
  });

  it('returns red for scores < 50', () => {
    expect(getMetacriticColor(49)).toBe(MetacriticColors.red);
    expect(getMetacriticColor(0)).toBe(MetacriticColors.red);
  });

  it('returns grey for null', () => {
    expect(getMetacriticColor(null)).toBe(MetacriticColors.grey);
  });
});
```

**Step 2: Run the test**

Run: `pnpm test constants/__tests__/theme.test.ts`

Expected: PASS (4 tests). These are pure functions — if this fails, the Vitest config has a resolution issue.

**Step 3: Commit**

```bash
git add constants/__tests__/theme.test.ts
git commit -m "test: add unit tests for getMetacriticColor"
```

---

### Task 6: Test Pure Functions — constants/platforms.ts

**Files:**

- Create: `constants/__tests__/platforms.test.ts`
- Test target: `constants/platforms.ts` — `getPlatformAccent()`, `PLATFORM_MAP`, `PLATFORMS`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import {
  PLATFORMS,
  PLATFORM_MAP,
  getPlatformAccent,
} from '@/constants/platforms';

describe('platforms', () => {
  it('has 10 platforms defined', () => {
    expect(PLATFORMS).toHaveLength(10);
  });

  it('maps all platforms by id', () => {
    for (const p of PLATFORMS) {
      expect(PLATFORM_MAP[p.id]).toBe(p);
    }
  });

  it('returns correct accent for known platforms', () => {
    expect(getPlatformAccent('ps2')).toBe('#003791');
    expect(getPlatformAccent('n64')).toBe('#E60012');
    expect(getPlatformAccent('dreamcast')).toBe('#0060A8');
  });

  it('returns default accent for unknown platform', () => {
    expect(getPlatformAccent('unknown')).toBe('#6366f1');
  });

  it('each platform has required fields', () => {
    for (const p of PLATFORMS) {
      expect(p.id).toBeTruthy();
      expect(p.rawgId).toBeGreaterThan(0);
      expect(p.name).toBeTruthy();
      expect(p.shortName).toBeTruthy();
      expect(p.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(['sony', 'nintendo', 'sega']).toContain(p.manufacturer);
    }
  });
});
```

**Step 2: Run the test**

Run: `pnpm test constants/__tests__/platforms.test.ts`

Expected: PASS (5 tests).

**Step 3: Commit**

```bash
git add constants/__tests__/platforms.test.ts
git commit -m "test: add unit tests for platforms constants"
```

---

### Task 7: Test Zustand Store — stores/ui.ts

**Files:**

- Create: `stores/__tests__/ui.test.ts`
- Test target: `stores/ui.ts` — `useUIStore` initial state and all setters

**Step 1: Write the test**

Zustand stores can be tested outside React using `getState()` and `setState()`.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore, BACKLOG_STATUSES } from '@/stores/ui';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      currentSystemId: 'ps2',
      searchQuery: '',
      browsePlatformFilter: null,
      browseOrdering: '-metacritic',
      backlogStatusFilter: null,
      backlogPlatformFilter: null,
      accentOverride: null,
    });
  });

  it('has correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.currentSystemId).toBe('ps2');
    expect(state.searchQuery).toBe('');
    expect(state.browsePlatformFilter).toBeNull();
    expect(state.browseOrdering).toBe('-metacritic');
    expect(state.backlogStatusFilter).toBeNull();
    expect(state.backlogPlatformFilter).toBeNull();
    expect(state.accentOverride).toBeNull();
  });

  it('updates current system', () => {
    useUIStore.getState().setCurrentSystemId('gamecube');
    expect(useUIStore.getState().currentSystemId).toBe('gamecube');
  });

  it('updates search query', () => {
    useUIStore.getState().setSearchQuery('zelda');
    expect(useUIStore.getState().searchQuery).toBe('zelda');
  });

  it('updates browse platform filter', () => {
    useUIStore.getState().setBrowsePlatformFilter(15);
    expect(useUIStore.getState().browsePlatformFilter).toBe(15);
  });

  it('clears browse platform filter', () => {
    useUIStore.getState().setBrowsePlatformFilter(15);
    useUIStore.getState().setBrowsePlatformFilter(null);
    expect(useUIStore.getState().browsePlatformFilter).toBeNull();
  });

  it('updates browse ordering', () => {
    useUIStore.getState().setBrowseOrdering('-rating');
    expect(useUIStore.getState().browseOrdering).toBe('-rating');
  });

  it('updates backlog status filter', () => {
    useUIStore.getState().setBacklogStatusFilter('playing');
    expect(useUIStore.getState().backlogStatusFilter).toBe('playing');
  });

  it('updates accent override', () => {
    useUIStore.getState().setAccentOverride('#ff0000');
    expect(useUIStore.getState().accentOverride).toBe('#ff0000');
  });

  it('clears accent override', () => {
    useUIStore.getState().setAccentOverride('#ff0000');
    useUIStore.getState().setAccentOverride(null);
    expect(useUIStore.getState().accentOverride).toBeNull();
  });
});

describe('BACKLOG_STATUSES', () => {
  it('has 4 statuses', () => {
    expect(BACKLOG_STATUSES).toHaveLength(4);
  });

  it('each status has value, label, and shortLabel', () => {
    for (const s of BACKLOG_STATUSES) {
      expect(s.value).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.shortLabel).toBeTruthy();
    }
  });
});
```

**Step 2: Run the test**

Run: `pnpm test stores/__tests__/ui.test.ts`

Expected: PASS (11 tests).

**Step 3: Commit**

```bash
git add stores/__tests__/ui.test.ts
git commit -m "test: add unit tests for UI Zustand store"
```

---

### Task 8: Test Database Service — services/database.ts

**Files:**

- Create: `services/__tests__/database.test.ts`
- Test target: `services/database.ts` — migration logic, query building, stats aggregation

This is the highest-value service test. The database functions build SQL dynamically (`getBacklogGames` adds conditional WHERE clauses, `updateGameEnrichment` builds SET clauses from partial data) and aggregate data (`getBacklogStats` sums counts).

**Step 1: Write the test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  migrateDbIfNeeded,
  getGamesByPlatform,
  getGameById,
  getGameByRawgSlug,
  getBacklogGames,
  getBacklogStats,
  getGamesNeedingEnrichment,
  updateGameEnrichment,
  updateBacklogStatus,
  insertGame,
  getScreenshots,
  insertScreenshots,
  deleteScreenshotsByGame,
  type Game,
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
  beforeEach(() => {
    db = createMockDb();
  });

  it('skips migration when version is current', async () => {
    vi.mocked(db.getFirstAsync).mockResolvedValue({ user_version: 1 });
    await migrateDbIfNeeded(db);
    expect(db.execAsync).not.toHaveBeenCalled();
  });

  it('runs migration and sets version when version is 0', async () => {
    vi.mocked(db.getFirstAsync).mockResolvedValue({ user_version: 0 });
    await migrateDbIfNeeded(db);
    expect(db.execAsync).toHaveBeenCalledTimes(2);
    expect(db.execAsync).toHaveBeenLastCalledWith('PRAGMA user_version = 1');
  });

  it('runs migration when user_version is null', async () => {
    vi.mocked(db.getFirstAsync).mockResolvedValue(null);
    await migrateDbIfNeeded(db);
    expect(db.execAsync).toHaveBeenCalledTimes(2);
  });
});

describe('getGamesByPlatform', () => {
  let db: SQLiteDatabase;
  beforeEach(() => {
    db = createMockDb();
  });

  it('queries by platform without vibe filter', async () => {
    await getGamesByPlatform(db, 'ps2');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE platform = ?'),
      ['ps2'],
    );
  });

  it('queries by platform with vibe filter', async () => {
    await getGamesByPlatform(db, 'ps2', 'essential');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('AND curated_vibe = ?'),
      ['ps2', 'essential'],
    );
  });
});

describe('getBacklogGames', () => {
  let db: SQLiteDatabase;
  beforeEach(() => {
    db = createMockDb();
  });

  it('queries all backlog games with no filters', async () => {
    await getBacklogGames(db);
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("backlog_status != 'none'"),
      [],
    );
  });

  it('adds status filter when provided', async () => {
    await getBacklogGames(db, 'playing');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('AND backlog_status = ?'),
      ['playing'],
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
  beforeEach(() => {
    db = createMockDb();
  });

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
  beforeEach(() => {
    db = createMockDb();
  });

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
  beforeEach(() => {
    db = createMockDb();
  });

  it('inserts each screenshot individually', async () => {
    await insertScreenshots(db, [
      { id: 's1', game_id: 'g1', image_url: 'url1', width: 1920, height: 1080 },
      { id: 's2', game_id: 'g1', image_url: 'url2', width: 1920, height: 1080 },
    ]);

    expect(db.runAsync).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Run the test**

Run: `pnpm test services/__tests__/database.test.ts`

Expected: PASS (all tests). If `vi.mocked` causes type errors, ensure `globals: true` is set in vitest.config.ts.

**Step 3: Commit**

```bash
git add services/__tests__/database.test.ts
git commit -m "test: add unit tests for database service"
```

---

### Task 9: Test RAWG API Service — services/rawg.ts

**Files:**

- Create: `services/__tests__/rawg.test.ts`
- Test target: `services/rawg.ts` — URL construction, error handling, default parameters

**Step 1: Write the test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchGames,
  getTopGames,
  getGameDetails,
  getGameScreenshots,
  getPlatforms,
} from '@/services/rawg';

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
    await expect(getGameDetails('nonexistent')).rejects.toThrow(
      'RAWG API error: 404',
    );
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

    await expect(searchGames('test')).rejects.toThrow(
      'EXPO_PUBLIC_RAWG_API_KEY is not set',
    );

    // Restore for other tests
    vi.stubEnv('EXPO_PUBLIC_RAWG_API_KEY', 'test-api-key');
  });
});
```

**Step 2: Run the test**

Run: `pnpm test services/__tests__/rawg.test.ts`

Expected: PASS (all tests).

**Step 3: Commit**

```bash
git add services/__tests__/rawg.test.ts
git commit -m "test: add unit tests for RAWG API service"
```

---

### Task 10: Test Enrichment Service — services/enrichment.ts

**Files:**

- Create: `services/__tests__/enrichment.test.ts`
- Test target: `services/enrichment.ts` — `enrichGame()` data mapping and early returns

**Step 1: Write the test**

```typescript
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
      }),
    );
  });
});
```

**Step 2: Run the test**

Run: `pnpm test services/__tests__/enrichment.test.ts`

Expected: PASS (all tests).

**Step 3: Commit**

```bash
git add services/__tests__/enrichment.test.ts
git commit -m "test: add unit tests for enrichment service"
```

---

### Task 11: Test TanStack Query Hooks — hooks/use-rawg-queries.ts

**Files:**

- Create: `hooks/__tests__/use-rawg-queries.test.ts`
- Test target: `hooks/use-rawg-queries.ts` — `enabled` conditions on queries

**Step 1: Write the test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHookWithProviders } from '@/test/test-utils';
import { useRawgSearch, useRawgTopGames } from '@/hooks/use-rawg-queries';
import { waitFor } from '@testing-library/react-native';

vi.mock('@/services/rawg', () => ({
  searchGames: vi.fn().mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [
      { id: 1, slug: 'zelda', name: 'Zelda', rating: 4.5, playtime: 50 },
    ],
  }),
  getTopGames: vi.fn().mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [
      { id: 2, slug: 'mario', name: 'Mario', rating: 4.8, playtime: 30 },
    ],
  }),
  getGameDetails: vi.fn(),
  getGameScreenshots: vi.fn(),
}));

describe('useRawgSearch', () => {
  it('does not fetch when query is empty', () => {
    const { result } = renderHookWithProviders(() =>
      useRawgSearch('', null, '-metacritic'),
    );
    expect(result.current.isFetching).toBe(false);
  });

  it('does not fetch when query is whitespace', () => {
    const { result } = renderHookWithProviders(() =>
      useRawgSearch('   ', null, '-metacritic'),
    );
    expect(result.current.isFetching).toBe(false);
  });

  it('fetches when query is provided', async () => {
    const { result } = renderHookWithProviders(() =>
      useRawgSearch('zelda', null, '-metacritic'),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.results).toHaveLength(1);
    expect(result.current.data?.results[0].name).toBe('Zelda');
  });
});

describe('useRawgTopGames', () => {
  it('does not fetch when platformId is null', () => {
    const { result } = renderHookWithProviders(() =>
      useRawgTopGames(null, '-metacritic'),
    );
    expect(result.current.isFetching).toBe(false);
  });

  it('fetches when platformId is provided', async () => {
    const { result } = renderHookWithProviders(() =>
      useRawgTopGames(15, '-metacritic'),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.results).toHaveLength(1);
  });
});
```

**Step 2: Run the test**

Run: `pnpm test hooks/__tests__/use-rawg-queries.test.ts`

Expected: PASS (all tests).

**Step 3: Commit**

```bash
git add hooks/__tests__/use-rawg-queries.test.ts
git commit -m "test: add unit tests for RAWG query hooks"
```

---

### Task 12: Run Full Test Suite and Fix Issues

**Step 1: Run all tests**

Run: `pnpm test`

Expected: All tests pass. If any module resolution or mock errors occur, fix them by:

- Adding failing packages to `test.deps.inline` in `vitest.config.ts`
- Adding missing mocks to `test/setup.ts`
- Fixing import path issues

**Step 2: Run with coverage**

Run: `pnpm test:coverage`

Review coverage output to verify the tested files show good coverage.

**Step 3: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve test setup issues from full suite run"
```

---

## Summary

| Task | What                                      | Tests     |
| ---- | ----------------------------------------- | --------- |
| 1    | Install dependencies                      | —         |
| 2    | vitest.config.ts                          | —         |
| 3    | test/setup.ts (global mocks)              | —         |
| 4    | test/test-utils.tsx (QueryClient wrapper) | —         |
| 5    | constants/theme.ts                        | 4 tests   |
| 6    | constants/platforms.ts                    | 5 tests   |
| 7    | stores/ui.ts                              | 11 tests  |
| 8    | services/database.ts                      | ~15 tests |
| 9    | services/rawg.ts                          | ~12 tests |
| 10   | services/enrichment.ts                    | ~6 tests  |
| 11   | hooks/use-rawg-queries.ts                 | ~5 tests  |
| 12   | Full suite run + fixes                    | —         |

**Total: ~58 tests across the highest-value parts of the codebase.**

## Future test additions (not in this plan)

- `hooks/use-db-queries.ts` — particularly `useAddToBacklog` mutation (complex platform matching + data transformation)
- Component render tests for `MetacriticBadge`, `GameCard`, `SystemSelector`
- Integration-style tests for screen components once the foundation is stable
