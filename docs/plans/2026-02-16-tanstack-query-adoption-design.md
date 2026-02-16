# TanStack Query Adoption + Browse Navigation Bug Fix

## Date: 2026-02-16

## Problem

1. Browse screen navigates with `item.slug` but game detail screen calls `getGameById(db, id)` which searches by UUID — never matches, stuck on "Loading..."
2. Games browsed from RAWG may not exist in SQLite (only inserted on "+ Backlog" tap)

## Decision: Always use RAWG slug for game detail route

All navigation to `/game/[id]` uses `rawg_slug` consistently. The detail screen tries the local DB first, falls back to RAWG API.

## Architecture

### Layer separation

- **TanStack Query** — all data fetching, caching, loading/error states, mutations
- **SQLite** (`expo-sqlite`) — durable persistence for games, screenshots, backlog
- **Zustand** — UI-only state (selected filters, search text, accent color)
- **RAWG API** — external data source (unchanged)

### Query key structure

```
['rawg', 'search', query, platformFilter, ordering]  — Browse search
['rawg', 'top', platformId, ordering]                 — Top games by platform
['rawg', 'game', slug]                                — Game details from API
['games', 'platform', platformId, vibeFilter]         — Home screen (SQLite)
['backlog', statusFilter, platformFilter]              — Backlog list (SQLite)
['backlog-stats']                                      — Backlog stats (SQLite)
['game', slug]                                         — Game detail (DB → RAWG fallback)
['game-screenshots', gameId]                           — Screenshots (SQLite)
['settings', 'counts']                                 — Settings counts (SQLite)
```

### Custom hooks (new files in hooks/)

- `useRawgSearch(query, platformFilter, ordering)` — browse search
- `useRawgTopGames(platformId, ordering)` — browse top games
- `useGameDetail(slug)` — DB-first, RAWG fallback
- `useGamesByPlatform(platformId, vibeFilter)` — home screen
- `useBacklogGames(statusFilter, platformFilter)` — backlog list
- `useBacklogStats()` — backlog stats bar
- `useAddToBacklog()` — mutation: insert game + invalidate backlog queries
- `useUpdateBacklogStatus()` — mutation: update status + invalidate

### Game detail screen (bug fix)

`useGameDetail(slug)` hook:
1. Query with key `['game', slug]`
2. `queryFn`: call `getGameByRawgSlug(db, slug)` — if found, return it
3. If not in DB, call `getGameDetails(slug)` from RAWG API, map to display shape
4. For RAWG-only games, backlog status buttons trigger `useAddToBacklog` mutation which inserts, then invalidates `['game', slug]`

### Navigation changes

- `game-grid.tsx` and `backlog.tsx` switch from `item.id` to `item.rawg_slug`
- All three sources (home, browse, backlog) use slug consistently

### Provider setup

In `app/_layout.tsx`:
```
GluestackUIProvider → ThemeProvider → SQLiteProvider → QueryClientProvider → GamepadProvider → Stack
```

QueryClient config:
- `staleTime: 5 minutes` default
- React Native: `focusManager` with AppState, `onlineManager` with network

### Zustand cleanup

Remove: `searchResults`, `setSearchResults`, `loading`, `setLoading`

Keep: `currentSystemId`, `searchQuery`, `browsePlatformFilter`, `browseOrdering`, `backlogStatusFilter`, `backlogPlatformFilter`, `accentOverride`

## Scope

Convert all screens at once: browse, game detail, home, backlog, settings. No AsyncStorage cache persistence (YAGNI).
