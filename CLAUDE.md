# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Retro Backlog is a game browsing and backlog tracking app built for the Ayn Odin 3 Android handheld. Built with Expo (managed workflow), React Native, and TypeScript. Dark theme only, landscape-first responsive UI with gamepad navigation support.

## Commands

```bash
pnpm install          # Install dependencies
pnpm start            # Start Expo dev server
pnpm android          # Start on Android
pnpm ios              # Start on iOS
pnpm web              # Start on Web
pnpm lint             # Run ESLint (expo lint)
```

## Environment

Requires a `.env` file with:

```
EXPO_PUBLIC_RAWG_API_KEY=your_key_here
```

Get a free API key from [RAWG](https://rawg.io/apidocs).

## Architecture

### Routing

File-based routing via Expo Router with drawer navigation:

- `app/_layout.tsx` — Root layout: GluestackUIProvider → ThemeProvider → SQLiteProvider → GamepadProvider → Stack. Also runs `EnrichmentRunner` for background data enrichment.
- `app/(drawer)/_layout.tsx` — Responsive drawer navigator (permanent in landscape, overlay in portrait)
- `app/(drawer)/index.tsx` — Home screen with system selector and curated game grid
- `app/(drawer)/browse.tsx` — Browse/search games via RAWG API with platform filters
- `app/(drawer)/backlog.tsx` — Backlog management with status filters and stats
- `app/(drawer)/settings.tsx` — Settings with RAWG attribution, accent color picker, cache management
- `app/game/[id].tsx` — Game detail screen with two-panel layout, screenshots, backlog status

Typed routes are enabled (`typedRoutes` experiment in app.json).

### Data Layer

- **SQLite** (`expo-sqlite`) — Local persistence for games and screenshots. Schema and migrations in `services/database.ts`. Tables: `games`, `screenshots`.
- **RAWG API** — Game data source. Service in `services/rawg.ts`. Provides search, top games by platform, game details, and screenshots.
- **Background Enrichment** — `hooks/use-enrichment.ts` automatically enriches games with full RAWG details (description, developer, screenshots, etc.) every 5 minutes.

### State Management

- **Zustand** (`stores/ui.ts`) — Transient UI state: current system selection, search query/results, browse filters, backlog filters, loading states, accent color override.
- **SQLite** — Persistent data (games, backlog status, screenshots).

### Gamepad Input

- **react-native-earl-gamepad** — WebView-based gamepad bridge for controller support. Provider in `providers/gamepad-provider.tsx`.
  - B button → navigate back
  - LB/RB → switch drawer tabs
  - D-pad/A button → grid navigation via `hooks/use-gamepad-navigation.ts`
- **Important**: The bridge WebView must be wrapped in a zero-size overflow-hidden container to prevent layout issues.

### UI & Styling

Two-layer system:

1. **Gluestack UI v3** — Component library in `components/ui/`. Components use `forwardRef`, TVA (Tailwind Variants API) for variants, and accept `className` props.
2. **NativeWind + Tailwind CSS** — Utility-class styling via `className` prop on all components.

**Critical dark mode note**: Gluestack's dark theme **inverts** the color scale:

- Low numbers (0, 50) = **dark** colors → use `bg-background-50` for dark surfaces
- High numbers (800, 950) = **light** colors → `bg-background-800` is nearly white
- `bg-primary-*` classes render as grayscale in dark mode → use inline `style={{ backgroundColor: Colors.tint }}` for colored accents

Theme constants in `constants/theme.ts` (flat dark-only `Colors` object). Platform accent colors in `constants/platforms.ts`.

### Shared Components

- `components/metacritic-badge.tsx` — Color-coded score badge (green/yellow/red)
- `components/game-card.tsx` — Game card with image, title, genre, metacritic score
- `components/system-selector.tsx` — Horizontal scrollable platform chip selector
- `components/game-grid.tsx` — Responsive FlatList grid with orientation-based columns

### Key Conventions

- **Import alias**: `@/` maps to project root
- **Package manager**: pnpm
- **Dark theme only**: `userInterfaceStyle: "dark"` in app.json, `GluestackUIProvider mode="dark"`
- **Orientation**: `"default"` — supports both landscape and portrait. Use `hooks/use-orientation.ts` for responsive layouts (4 columns landscape, 2 portrait).
- **React Compiler** and **New Architecture** are both enabled
- **Edge-to-edge**: `edgeToEdgeEnabled: true` on Android — app draws behind system bars

### Configuration

- `metro.config.js` — Wrapped with `withNativeWind` for NativeWind support
- `babel.config.js` — Includes `nativewind/babel` preset and `module-resolver` plugin
- `tailwind.config.js` — Extended color palette with semantic names
- TypeScript strict mode is enabled
