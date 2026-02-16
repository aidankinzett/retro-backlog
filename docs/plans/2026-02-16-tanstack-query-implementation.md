# TanStack Query Adoption + Browse Navigation Bug Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the browse→detail navigation bug and adopt TanStack Query as the data fetching layer across all screens.

**Architecture:** TanStack Query handles all data fetching/caching/mutations. SQLite stays as durable persistence. Zustand is trimmed to UI-only state. Game detail route always uses RAWG slug, with DB-first → RAWG API fallback.

**Tech Stack:** @tanstack/react-query v5, expo-sqlite, zustand, expo-router

---

### Task 1: Install TanStack Query

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

Run: `pnpm add @tanstack/react-query`
Expected: Package added to dependencies

**Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @tanstack/react-query dependency"
```

---

### Task 2: Add QueryClientProvider to root layout

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Add QueryClientProvider**

Replace the full contents of `app/_layout.tsx` with:

```tsx
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { View, AppState } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { GamepadProvider } from '@/providers/gamepad-provider';
import { migrateDbIfNeeded } from '@/services/database';
import { Colors } from '@/constants/theme';
import '@/global.css';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  // React Native: refetch on app focus
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <GluestackUIProvider mode="dark">
        <ThemeProvider value={DarkTheme}>
          <SQLiteProvider databaseName="retro-backlog.db" onInit={migrateDbIfNeeded}>
            <QueryClientProvider client={queryClient}>
              <GamepadProvider>
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: Colors.background },
                  }}
                >
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
            </QueryClientProvider>
          </SQLiteProvider>
          <StatusBar style="light" />
        </ThemeProvider>
      </GluestackUIProvider>
    </View>
  );
}
```

**Step 2: Verify app still starts**

Run: `pnpm start` and open on Android emulator. Confirm no crash.

**Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add QueryClientProvider to root layout with RN focus management"
```

---

### Task 3: Create TanStack Query hooks for RAWG API

**Files:**
- Create: `hooks/use-rawg-queries.ts`

**Step 1: Create the hooks file**

```ts
import { useQuery } from '@tanstack/react-query';
import {
  searchGames,
  getTopGames,
  getGameDetails,
  getGameScreenshots,
  type RawgGame,
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
```

**Step 2: Commit**

```bash
git add hooks/use-rawg-queries.ts
git commit -m "feat: add TanStack Query hooks for RAWG API"
```

---

### Task 4: Create TanStack Query hooks for SQLite reads

**Files:**
- Create: `hooks/use-db-queries.ts`

**Step 1: Create the hooks file**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getGamesByPlatform,
  getGameByRawgSlug,
  getBacklogGames,
  getBacklogStats,
  getScreenshots,
  insertGame,
  updateBacklogStatus,
  type Game,
} from '@/services/database';
import { enrichGame } from '@/services/enrichment';
import { getGameDetails, type RawgGame } from '@/services/rawg';
import { PLATFORMS } from '@/constants/platforms';
import { randomUUID } from 'expo-crypto';
import type { BacklogStatus } from '@/stores/ui';

export function useGamesByPlatform(platformId: string, vibeFilter?: 'essential' | 'hidden_gem') {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['games', 'platform', platformId, vibeFilter],
    queryFn: () => getGamesByPlatform(db, platformId, vibeFilter),
    networkMode: 'always',
  });
}

/**
 * Game detail hook: DB-first, RAWG API fallback.
 * Returns a Game (from DB) or a partial Game-like object (from RAWG).
 */
export function useGameDetail(slug: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['game', slug],
    queryFn: async (): Promise<{ game: Game | null; rawgGame: RawgGame | null; source: 'db' | 'rawg' }> => {
      // Try local DB first
      const dbGame = await getGameByRawgSlug(db, slug!);
      if (dbGame) {
        return { game: dbGame, rawgGame: null, source: 'db' };
      }
      // Fallback to RAWG API
      const rawgGame = await getGameDetails(slug!);
      return { game: null, rawgGame, source: 'rawg' };
    },
    enabled: !!slug,
    networkMode: 'offlineFirst',
  });
}

export function useGameScreenshots(gameId: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['game-screenshots', gameId],
    queryFn: () => getScreenshots(db, gameId!),
    enabled: !!gameId,
    networkMode: 'always',
  });
}

export function useBacklogGames(statusFilter?: string, platformFilter?: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['backlog', statusFilter ?? null, platformFilter ?? null],
    queryFn: () => getBacklogGames(db, statusFilter, platformFilter),
    networkMode: 'always',
  });
}

export function useBacklogStats() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['backlog-stats'],
    queryFn: () => getBacklogStats(db),
    networkMode: 'always',
  });
}

export function useSettingsCounts() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['settings', 'counts'],
    queryFn: async () => {
      const games = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM games');
      const screenshots = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM screenshots');
      return {
        gameCount: games?.count ?? 0,
        screenshotCount: screenshots?.count ?? 0,
      };
    },
    networkMode: 'always',
  });
}

// --- Mutations ---

export function useAddToBacklog() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rawgGame, status = 'want_to_play' }: { rawgGame: RawgGame; status?: BacklogStatus }) => {
      const existing = await getGameByRawgSlug(db, rawgGame.slug);
      if (existing) {
        await updateBacklogStatus(db, existing.id, status);
        return existing.id;
      }

      const gameId = randomUUID();
      const platformEntry = PLATFORMS.find((p) =>
        rawgGame.platforms?.some((rp) => rp.platform.id === p.rawgId)
      );
      await insertGame(db, {
        id: gameId,
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
        backlog_status: status,
        last_enriched: null,
      });

      // Enrich in background
      const game = await import('@/services/database').then((m) => m.getGameById(db, gameId));
      if (game && !game.last_enriched) {
        enrichGame(db, game).catch((err) =>
          console.error(`Enrichment failed for ${game.title}:`, err)
        );
      }

      return gameId;
    },
    onSuccess: (_gameId, { rawgGame }) => {
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stats'] });
      queryClient.invalidateQueries({ queryKey: ['game', rawgGame.slug] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'counts'] });
    },
  });
}

export function useUpdateBacklogStatus() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, slug, status }: { gameId: string; slug: string | null; status: BacklogStatus }) => {
      await updateBacklogStatus(db, gameId, status);
    },
    onSuccess: (_data, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stats'] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['game', slug] });
      }
    },
  });
}

export function useClearCache() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await db.execAsync("UPDATE games SET last_enriched = NULL");
      await db.execAsync("DELETE FROM screenshots");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['game-screenshots'] });
    },
  });
}
```

**Step 2: Commit**

```bash
git add hooks/use-db-queries.ts
git commit -m "feat: add TanStack Query hooks for SQLite reads and mutations"
```

---

### Task 5: Convert browse screen to TanStack Query

**Files:**
- Modify: `app/(drawer)/browse.tsx`

**Step 1: Rewrite browse screen**

Replace the full contents of `app/(drawer)/browse.tsx` with:

```tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import { TextInput, FlatList, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { PLATFORMS } from '@/constants/platforms';
import { useUIStore } from '@/stores/ui';
import { useRawgSearch, useRawgTopGames } from '@/hooks/use-rawg-queries';
import { useAddToBacklog } from '@/hooks/use-db-queries';
import type { RawgGame } from '@/services/rawg';

export default function BrowseScreen() {
  const router = useRouter();
  const { columns } = useOrientation();

  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const browsePlatformFilter = useUIStore((s) => s.browsePlatformFilter);
  const setBrowsePlatformFilter = useUIStore((s) => s.setBrowsePlatformFilter);
  const browseOrdering = useUIStore((s) => s.browseOrdering);

  // Debounce search input
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setDebouncedQuery(text), 300);
    },
    [setSearchQuery]
  );

  const searchResult = useRawgSearch(debouncedQuery, browsePlatformFilter, browseOrdering);
  const topResult = useRawgTopGames(
    debouncedQuery.trim() ? null : browsePlatformFilter,
    browseOrdering
  );

  const results = useMemo(() => {
    if (debouncedQuery.trim()) return searchResult.data?.results ?? [];
    if (browsePlatformFilter) return topResult.data?.results ?? [];
    return [];
  }, [debouncedQuery, browsePlatformFilter, searchResult.data, topResult.data]);

  const loading = debouncedQuery.trim() ? searchResult.isPending && searchResult.fetchStatus !== 'idle' : browsePlatformFilter ? topResult.isPending && topResult.fetchStatus !== 'idle' : false;

  const addToBacklog = useAddToBacklog();

  const renderItem = ({ item }: { item: RawgGame }) => (
    <View style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
      <Pressable
        onPress={() => router.push(`/game/${item.slug}`)}
        className="rounded-lg overflow-hidden"
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
            onPress={() => addToBacklog.mutate({ rawgGame: item })}
            className="mt-1 px-2 py-1 rounded self-start"
            style={{ backgroundColor: Colors.tint }}
          >
            <Text className="text-typography-white text-xs font-bold">+ Backlog</Text>
          </Pressable>
        </Box>
      </Pressable>
    </View>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Search bar */}
      <Box className="px-4 pt-3">
        <TextInput
          value={searchQuery}
          onChangeText={handleSearchChange}
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
          className={`px-3 py-1 rounded-full ${browsePlatformFilter === null ? '' : 'bg-background-50'}`}
          style={browsePlatformFilter === null ? { backgroundColor: Colors.tint } : undefined}
        >
          <Text className="text-typography-white text-xs">All</Text>
        </Pressable>
        {PLATFORMS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setBrowsePlatformFilter(p.rawgId)}
            className={`px-3 py-1 rounded-full ${browsePlatformFilter === p.rawgId ? '' : 'bg-background-50'}`}
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

**Step 2: Verify browse screen works**

Run on Android emulator. Test:
- Search for a game → results appear
- Select platform filter → top games load
- Tap a game → navigates to `/game/<slug>`

**Step 3: Commit**

```bash
git add app/(drawer)/browse.tsx
git commit -m "refactor: convert browse screen to TanStack Query"
```

---

### Task 6: Fix game detail screen — slug-based + RAWG fallback

**Files:**
- Modify: `app/game/[id].tsx`

**Step 1: Rewrite game detail screen**

Replace the full contents of `app/game/[id].tsx` with:

```tsx
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { PLATFORM_MAP, PLATFORMS } from '@/constants/platforms';
import { useGameDetail, useGameScreenshots, useUpdateBacklogStatus, useAddToBacklog } from '@/hooks/use-db-queries';
import { BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';

export default function GameDetailScreen() {
  const { id: slug } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isLandscape } = useOrientation();
  const insets = useSafeAreaInsets();

  const { data, isPending, isError } = useGameDetail(slug);
  const updateStatus = useUpdateBacklogStatus();
  const addToBacklog = useAddToBacklog();

  // Derive display values from either DB game or RAWG game
  const game = data?.game;
  const rawgGame = data?.rawgGame;
  const source = data?.source;

  const title = game?.title ?? rawgGame?.name ?? '';
  const backgroundImage = game?.background_image ?? rawgGame?.background_image;
  const metacritic = game?.metacritic ?? rawgGame?.metacritic ?? null;
  const rawgRating = game?.rawg_rating ?? rawgGame?.rating ?? null;
  const releaseDate = game?.release_date ?? rawgGame?.released;
  const developer = game?.developer ?? rawgGame?.developers?.[0]?.name;
  const publisher = game?.publisher ?? rawgGame?.publishers?.[0]?.name;
  const genre = game?.genre ?? rawgGame?.genres?.map((g) => g.name).join(', ');
  const description = game?.description ?? rawgGame?.description_raw;
  const playtime = game?.playtime ?? rawgGame?.playtime;
  const esrbRating = game?.esrb_rating ?? rawgGame?.esrb_rating?.name;
  const curatedDesc = game?.curated_desc;
  const backlogStatus = game?.backlog_status ?? 'none';

  const platformId = game?.platform ?? (() => {
    const entry = PLATFORMS.find((p) =>
      rawgGame?.platforms?.some((rp) => rp.platform.id === p.rawgId)
    );
    return entry?.id;
  })();
  const platform = platformId ? PLATFORM_MAP[platformId] : undefined;

  // Screenshots from DB (only available for games in the database)
  const { data: screenshots = [] } = useGameScreenshots(game?.id);

  const handleStatusChange = async (status: BacklogStatus) => {
    const newStatus = backlogStatus === status ? 'none' : status;
    if (game) {
      // Game is in DB — update directly
      updateStatus.mutate({ gameId: game.id, slug: game.rawg_slug, status: newStatus });
    } else if (rawgGame) {
      // Game not in DB — insert it with this status
      addToBacklog.mutate({ rawgGame, status: newStatus === 'none' ? 'want_to_play' : newStatus });
    }
  };

  if (isPending) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-dark">
        <Text className="text-typography-gray">Loading...</Text>
      </Box>
    );
  }

  if (isError || (!game && !rawgGame)) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-dark">
        <Text className="text-typography-gray">Game not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2 rounded-lg bg-background-50">
          <Text style={{ color: Colors.tint }} className="font-bold">← Go Back</Text>
        </Pressable>
      </Box>
    );
  }

  const leftPanel = (
    <VStack className={`gap-2 ${isLandscape ? 'flex-1' : ''} p-4`}>
      {backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
          style={{
            width: '100%',
            height: isLandscape ? 120 : undefined,
            aspectRatio: isLandscape ? undefined : 16 / 9,
            borderRadius: 8,
          }}
          contentFit="cover"
          transition={200}
        />
      )}
      <Heading size="lg" className="text-typography-white">{title}</Heading>

      <HStack className="items-center gap-3">
        <MetacriticBadge score={metacritic} size="lg" />
        {rawgRating != null && (
          <VStack>
            <Text className="text-typography-gray text-xs">RAWG</Text>
            <Text className="text-typography-white font-bold">{rawgRating.toFixed(1)}</Text>
          </VStack>
        )}
      </HStack>

      {releaseDate && (
        <Text className="text-typography-gray">Released: {releaseDate}</Text>
      )}
      {developer && (
        <Text className="text-typography-gray">Developer: {developer}</Text>
      )}
      {publisher && (
        <Text className="text-typography-gray">Publisher: {publisher}</Text>
      )}
      {platform && (
        <Box
          className="self-start px-3 py-1 rounded-full"
          style={{ backgroundColor: platform.accent }}
        >
          <Text className="text-typography-white text-xs font-bold">{platform.name}</Text>
        </Box>
      )}
      {genre ? (
        <HStack className="flex-wrap gap-2">
          {genre.split(',').map((g) => (
            <Box key={g.trim()} className="px-2 py-1 rounded bg-background-50">
              <Text className="text-typography-gray text-xs">{g.trim()}</Text>
            </Box>
          ))}
        </HStack>
      ) : null}
      {esrbRating && (
        <Text className="text-typography-gray text-xs">ESRB: {esrbRating}</Text>
      )}

      {/* Backlog status */}
      <VStack className="gap-2 mt-2">
        <Text className="text-typography-gray text-sm font-bold">Backlog Status</Text>
        <HStack className="flex-wrap gap-2">
          {BACKLOG_STATUSES.map((s) => {
            const isActive = backlogStatus === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => handleStatusChange(s.value)}
                className={`px-3 py-1.5 rounded-full ${isActive ? '' : 'bg-background-50'}`}
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
    <VStack className={`gap-3 ${isLandscape ? 'flex-1' : ''} p-4`}>
      {description && (
        <VStack className="gap-2">
          <Text className="text-typography-gray text-sm font-bold">About</Text>
          <Text className="text-typography-white text-sm leading-relaxed" numberOfLines={isLandscape ? 8 : undefined}>
            {description}
          </Text>
        </VStack>
      )}

      {playtime != null && playtime > 0 && (
        <Text className="text-typography-gray text-sm">
          Average playtime: {playtime} hours
        </Text>
      )}

      {curatedDesc && (
        <Box className="p-3 rounded-lg bg-background-50 border border-outline-100">
          <Text className="text-typography-gray text-xs font-bold mb-1">Why this game?</Text>
          <Text className="text-typography-white text-sm">{curatedDesc}</Text>
        </Box>
      )}

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
    </VStack>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Back button */}
      <Box className="px-4 pb-1" style={{ paddingTop: Math.max(insets.top, 12) }}>
        <Pressable
          onPress={() => router.back()}
          className="self-start px-3 py-2 rounded-lg bg-background-50"
        >
          <Text style={{ color: Colors.tint }} className="text-base font-bold">← Back</Text>
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

**Step 2: Verify the bug is fixed**

On Android emulator:
- Go to Browse → search for "Half-Life 2" → tap the card
- Game detail should load from RAWG API (not stuck on "Loading...")
- Tap a backlog status → game gets inserted into DB
- Navigate back, then tap it again → should load from DB this time

**Step 3: Commit**

```bash
git add app/game/[id].tsx
git commit -m "fix: game detail screen uses slug with DB-first, RAWG API fallback"
```

---

### Task 7: Update home screen and game-grid to use slugs + TanStack Query

**Files:**
- Modify: `app/(drawer)/index.tsx`
- Modify: `components/game-grid.tsx`

**Step 1: Rewrite home screen**

Replace the full contents of `app/(drawer)/index.tsx` with:

```tsx
import { useMemo } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { SystemSelector } from '@/components/system-selector';
import { GameGrid } from '@/components/game-grid';
import { useUIStore } from '@/stores/ui';
import { useGamesByPlatform } from '@/hooks/use-db-queries';

export default function HomeScreen() {
  const currentSystemId = useUIStore((s) => s.currentSystemId);
  const setCurrentSystemId = useUIStore((s) => s.setCurrentSystemId);

  const { data: essentials = [] } = useGamesByPlatform(currentSystemId, 'essential');
  const { data: hiddenGems = [] } = useGamesByPlatform(currentSystemId, 'hidden_gem');

  const allGames = useMemo(() => [...essentials, ...hiddenGems], [essentials, hiddenGems]);
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

**Step 2: Update game-grid to use slug**

Replace the full contents of `components/game-grid.tsx` with:

```tsx
import { FlatList, View } from 'react-native';
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
        <View style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
          <GameCard
            game={item}
            onPress={() => router.push(`/game/${item.rawg_slug ?? item.id}`)}
          />
        </View>
      )}
      style={{ flex: 1 }}
    />
  );
}
```

**Step 3: Commit**

```bash
git add app/(drawer)/index.tsx components/game-grid.tsx
git commit -m "refactor: convert home screen to TanStack Query, use slug in game-grid"
```

---

### Task 8: Convert backlog screen to TanStack Query + slug navigation

**Files:**
- Modify: `app/(drawer)/backlog.tsx`

**Step 1: Rewrite backlog screen**

Replace the full contents of `app/(drawer)/backlog.tsx` with:

```tsx
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { type Game } from '@/services/database';
import { useUIStore, BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';
import { useBacklogGames, useBacklogStats, useUpdateBacklogStatus } from '@/hooks/use-db-queries';

const ALL_FILTERS: { value: BacklogStatus | null; label: string; shortLabel: string }[] = [
  { value: null, label: 'All', shortLabel: 'All' },
  ...BACKLOG_STATUSES,
];

export default function BacklogScreen() {
  const router = useRouter();
  const { columns } = useOrientation();

  const statusFilter = useUIStore((s) => s.backlogStatusFilter);
  const setStatusFilter = useUIStore((s) => s.setBacklogStatusFilter);

  const { data: games = [] } = useBacklogGames(statusFilter ?? undefined);
  const { data: stats = { total: 0, want_to_play: 0, playing: 0, completed: 0, dropped: 0 } } = useBacklogStats();
  const updateStatus = useUpdateBacklogStatus();

  const cycleStatus = (game: Game) => {
    const order: BacklogStatus[] = ['want_to_play', 'playing', 'completed', 'dropped', 'none'];
    const currentIndex = order.indexOf(game.backlog_status as BacklogStatus);
    const nextStatus = order[(currentIndex + 1) % order.length];
    updateStatus.mutate({ gameId: game.id, slug: game.rawg_slug, status: nextStatus });
  };

  const renderItem = ({ item }: { item: Game }) => (
    <View style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
      <Pressable
        onPress={() => router.push(`/game/${item.rawg_slug ?? item.id}`)}
        className="rounded-lg overflow-hidden"
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
              <Text style={{ color: Colors.tint }} className="text-xs font-bold">
                {BACKLOG_STATUSES.find((s) => s.value === item.backlog_status)?.shortLabel ?? 'Unknown'}
              </Text>
            </Pressable>
            <MetacriticBadge score={item.metacritic} />
          </HStack>
        </Box>
      </Pressable>
    </View>
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
              className={`px-3 py-1 rounded-full ${isActive ? '' : 'bg-background-50'}`}
              style={isActive ? { backgroundColor: Colors.tint } : undefined}
            >
              <Text
                className={`text-xs font-bold ${isActive ? 'text-typography-white' : 'text-typography-gray'}`}
              >
                {f.shortLabel}
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

**Step 2: Verify backlog screen works**

On Android emulator:
- Navigate to Backlog tab → games load
- Tap status filter → list updates
- Tap status text on card → cycles status
- Tap a card → navigates to game detail via slug

**Step 3: Commit**

```bash
git add app/(drawer)/backlog.tsx
git commit -m "refactor: convert backlog screen to TanStack Query with slug navigation"
```

---

### Task 9: Convert settings screen to TanStack Query

**Files:**
- Modify: `app/(drawer)/settings.tsx`

**Step 1: Rewrite settings screen**

Replace the full contents of `app/(drawer)/settings.tsx` with:

```tsx
import { Linking, ScrollView } from 'react-native';
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
import { useSettingsCounts, useClearCache } from '@/hooks/use-db-queries';

export default function SettingsScreen() {
  const accentOverride = useUIStore((s) => s.accentOverride);
  const setAccentOverride = useUIStore((s) => s.setAccentOverride);

  const { data: counts = { gameCount: 0, screenshotCount: 0 } } = useSettingsCounts();
  const clearCache = useClearCache();

  const accentOptions = [
    { label: 'Dynamic (per system)', color: null },
    ...PLATFORMS.map((p) => ({ label: p.shortName, color: p.accent })),
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Box className="p-6">
        <VStack className="gap-8 max-w-lg">
          {/* Attribution */}
          <VStack className="gap-2">
            <Heading size="lg" className="text-typography-white">Attribution</Heading>
            <Pressable onPress={() => Linking.openURL('https://rawg.io')}>
              <Text className="text-typography-gray text-sm">
                Game data provided by{' '}
                <Text style={{ color: Colors.tint }} className="text-sm">RAWG</Text>
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
            <Text className="text-typography-gray text-sm">Games in database: {counts.gameCount}</Text>
            <Text className="text-typography-gray text-sm">Cached screenshots: {counts.screenshotCount}</Text>
            <Pressable
              onPress={() => clearCache.mutate()}
              className="mt-2 px-4 py-2 rounded self-start"
              style={{ backgroundColor: '#b91c1c' }}
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
    </ScrollView>
  );
}
```

**Step 2: Commit**

```bash
git add app/(drawer)/settings.tsx
git commit -m "refactor: convert settings screen to TanStack Query"
```

---

### Task 10: Clean up Zustand store — remove server state

**Files:**
- Modify: `stores/ui.ts`

**Step 1: Remove searchResults and loading from store**

Replace the full contents of `stores/ui.ts` with:

```ts
import { create } from 'zustand';

export type BacklogStatus = 'none' | 'want_to_play' | 'playing' | 'completed' | 'dropped';

export const BACKLOG_STATUSES: { value: BacklogStatus; label: string; shortLabel: string }[] = [
  { value: 'want_to_play', label: 'Want to Play', shortLabel: 'Wishlist' },
  { value: 'playing', label: 'Playing', shortLabel: 'Playing' },
  { value: 'completed', label: 'Completed', shortLabel: 'Done' },
  { value: 'dropped', label: 'Dropped', shortLabel: 'Dropped' },
];

interface UIState {
  // Home screen
  currentSystemId: string;
  setCurrentSystemId: (id: string) => void;

  // Browse screen
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  browsePlatformFilter: number | null;
  setBrowsePlatformFilter: (id: number | null) => void;
  browseOrdering: string;
  setBrowseOrdering: (ordering: string) => void;

  // Backlog screen
  backlogStatusFilter: BacklogStatus | null;
  setBacklogStatusFilter: (status: BacklogStatus | null) => void;
  backlogPlatformFilter: string | null;
  setBacklogPlatformFilter: (platform: string | null) => void;

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
  browsePlatformFilter: null,
  setBrowsePlatformFilter: (id) => set({ browsePlatformFilter: id }),
  browseOrdering: '-metacritic',
  setBrowseOrdering: (ordering) => set({ browseOrdering: ordering }),

  // Backlog
  backlogStatusFilter: null,
  setBacklogStatusFilter: (status) => set({ backlogStatusFilter: status }),
  backlogPlatformFilter: null,
  setBacklogPlatformFilter: (platform) => set({ backlogPlatformFilter: platform }),

  // Accent
  accentOverride: null,
  setAccentOverride: (color) => set({ accentOverride: color }),
}));
```

**Step 2: Verify no remaining references to removed state**

Run: `grep -r "searchResults\|setSearchResults\|setLoading\b" app/ stores/ hooks/ components/ --include="*.ts" --include="*.tsx"`
Expected: No matches

**Step 3: Commit**

```bash
git add stores/ui.ts
git commit -m "refactor: remove server state from Zustand store (now in TanStack Query)"
```

---

### Task 11: Verify everything works end-to-end on emulator

**Step 1: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 2: Start dev server and test on emulator**

Run: `pnpm start` → open on Android emulator (emulator-5554)

Test checklist:
- [ ] Home screen loads games for selected platform
- [ ] Switching platforms updates game grid
- [ ] Browse screen: search returns results
- [ ] Browse screen: platform filter shows top games
- [ ] Browse screen: tap game card → game detail loads (not stuck on Loading)
- [ ] Game detail: shows RAWG data for games not in DB
- [ ] Game detail: tap backlog status → inserts game into DB
- [ ] Game detail: navigate back and tap again → loads from DB
- [ ] Backlog screen: shows games with backlog status
- [ ] Backlog screen: filter chips work
- [ ] Backlog screen: tap card → game detail via slug
- [ ] Settings screen: shows game/screenshot counts
- [ ] Settings screen: clear cache works

**Step 3: Commit all remaining changes (if any lint/type fixes needed)**

```bash
git add -A
git commit -m "fix: address lint/type issues from TanStack Query migration"
```
