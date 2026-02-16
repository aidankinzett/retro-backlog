# Retro Backlog — Design Document

## Overview

Cross-platform React Native Expo app for browsing and tracking retro games using RAWG API data. Primary target: Ayn Odin 3 Android handheld in landscape, with portrait and touch fallback.

## Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Gamepad input | `react-native-earl-gamepad` | Unified WebView-based API for all gamepad input (built-in + Bluetooth) |
| Navigation | `@react-navigation/drawer` via Expo Router, toggleable | Pinned in landscape, collapsible in portrait. Supports both orientations. |
| Orientation | Responsive, landscape-primary | Landscape is optimized layout (4-col grids, pinned sidebar). Portrait adapts (2-col, collapsed drawer). |
| Accent colors | Dynamic per-system with user override | Auto-changes when browsing platforms (PS blue, Nintendo red, etc.). User can pin a color in settings. |
| Theme | Dark only | Optimized for handheld gaming sessions |
| Data | SQLite only, no sync | Simple local storage. Sync can be added later. |

## Architecture

### Navigation (Expo Router + Drawer)

```
app/
  _layout.tsx            -> Root: providers (Gluestack, Gamepad, Theme)
  (drawer)/
    _layout.tsx          -> Drawer navigator (Home, Browse, Backlog, Settings)
    index.tsx            -> Home (curated picks by system)
    browse.tsx           -> Search & explore RAWG
    backlog.tsx          -> Personal tracking list
    settings.tsx         -> Attribution, prefs, cache
  game/
    [id].tsx             -> Game detail (two-panel layout)
```

- Drawer: `drawerType: 'permanent'` in landscape, `drawerType: 'front'` in portrait.
- L1/R1 shoulder buttons cycle between drawer screens.
- Game detail screen is pushed on top of the drawer (not inside it).

### Focus System

Built on `react-native-earl-gamepad` with a custom focus management layer:

- **GamepadProvider** at app root — renders `GamepadBridge`, listens for events.
- **FocusContext** — tracks registered focusable elements by (row, col) grid position.
- **Focusable** wrapper component — registers its position on mount, applies glow/highlight border when focused.
- **Input mapping:**
  - D-pad: move focus between elements
  - A button (gamepad button 0): trigger onPress on focused element
  - B button (gamepad button 1): `router.back()`
  - L1/R1 (shoulder buttons): cycle between drawer tabs
- Auto-scroll keeps focused item visible in scrollable lists.
- Touch input still works as fallback.

### Data Layer

**SQLite** (via `expo-sqlite`) as sole data store.

**Tables:**

`games` — stores both curated and user-added games:
```sql
id              TEXT PRIMARY KEY
rawg_id         INTEGER
rawg_slug       TEXT
title           TEXT NOT NULL
platform        TEXT NOT NULL
genre           TEXT
curated_vibe    TEXT              -- 'essential', 'hidden_gem', or NULL
curated_desc    TEXT              -- recommendation blurb
metacritic      INTEGER
rawg_rating     REAL
release_date    TEXT
background_image TEXT
developer       TEXT
description     TEXT
playtime        INTEGER
backlog_status  TEXT DEFAULT 'none'
last_enriched   TEXT
created_at      TEXT DEFAULT (datetime('now'))
```

`screenshots`:
```sql
id              TEXT PRIMARY KEY
game_id         TEXT NOT NULL
image_url       TEXT NOT NULL
width           INTEGER
height          INTEGER
```

**Service layer** (`services/database.ts`): schema creation, CRUD for games and screenshots, backlog status updates, filtering/sorting queries.

**RAWG API** (`services/rawg.ts`): search, game details, screenshots, platform list. API key from `EXPO_PUBLIC_RAWG_API_KEY` in `.env`.

**Enrichment**: `useEnrichment` hook checks `last_enriched` timestamp (>7 days = stale). Fetches game details + screenshots from RAWG in background. Never blocks UI — show skeleton states for unenriched fields.

### State Management

**Zustand** for transient UI state only (SQLite is source of truth):
- `currentSystemId` — active system filter on home screen (also drives accent color)
- `searchQuery` / `searchResults` — browse screen
- `backlogFilter` / `backlogSort` — backlog screen state
- `loadingStates` — per-operation loading flags
- `accentOverride` — user's pinned accent color (null = dynamic)

### Accent Color System

- Platform-to-color mapping in `constants/platforms.ts`:
  - PlayStation: `#003791`
  - Nintendo: `#E60012`
  - Sega: `#0060A8`
  - (etc.)
- `currentSystemId` in Zustand drives the active accent color.
- User override stored in SQLite settings, loaded into Zustand on boot.
- Exposed via context/CSS variable for Gluestack and NativeWind components.

### Responsive Layout

- `useWindowDimensions` determines orientation and grid columns.
- Landscape: 4-column game grid, drawer pinned open.
- Portrait: 2-column game grid, drawer collapsed.
- Game detail: two-panel in landscape, stacked in portrait.
- Metacritic badge colors: green (75+), yellow (50-74), red (<50), grey (null).
- Minimum body text ~14-16px for handheld readability.

## Screens

### Home (Curated Picks)
- Horizontal system selector at top. L1/R1 cycle systems.
- Two sections per system: "Must Play" and "Hidden Gems".
- 3-4 column card grid: cover image, title, Metacritic badge, genre tag.
- A button on card opens game detail.
- Loads from SQLite. Empty state until seed data added.

### Browse
- Search bar with 300ms debounce.
- Platform filter chips, sort options (Metacritic, rating, release date, name).
- Optional Metacritic range filter.
- Grid results with cover art, title, score, platform icons.
- "Add to Backlog" action per result.
- Supports browsing top-rated per platform without a search query.

### Backlog
- Status categories: Want to Play, Playing, Completed, Dropped.
- Quick status switching (single button press to cycle or popup menu).
- Stats at top: total, completed, by-platform breakdown.
- Sort/filter by platform, status, score.
- D-pad navigation, face buttons change status or open details.

### Game Detail
Two-panel landscape layout:
- **Left**: Cover image, title, year, developer/publisher, Metacritic (large, color-coded), RAWG rating, genre tags, platform tags, ESRB, external links.
- **Right**: Screenshot gallery (horizontal scroll, D-pad navigable), description (plain text), playtime estimate.
- Backlog status button.
- B button goes back.

### Settings
- "Powered by RAWG" attribution with link.
- App version.
- Clear cache / re-fetch enrichment.
- Storage stats.
- Accent color override setting.

## Build Order

1. Orientation detection + responsive hooks
2. Drawer navigation with Expo Router
3. SQLite schema + CRUD service layer
4. RAWG API service
5. Home screen (system tabs + game card grid)
6. Game Detail screen (two-panel layout)
7. Browse screen (search, filters, add-to-backlog)
8. Backlog screen (status management)
9. Gamepad focus system (earl-gamepad + FocusProvider)
10. Background enrichment pipeline
11. Settings screen
