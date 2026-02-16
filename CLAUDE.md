# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Retro Backlog is a cross-platform mobile/web app built with Expo (managed workflow), React Native, and TypeScript. It targets iOS, Android, and Web.

## Commands

```bash
pnpm install          # Install dependencies
pnpm start            # Start Expo dev server
pnpm android          # Start on Android
pnpm ios              # Start on iOS
pnpm web              # Start on Web
pnpm lint             # Run ESLint (expo lint)
```

## Architecture

### Routing

File-based routing via Expo Router. Routes live in `app/`:
- `app/_layout.tsx` — Root layout wrapping the app in `GluestackUIProvider` and theme providers
- `app/(tabs)/_layout.tsx` — Bottom tab navigator with haptic feedback tab buttons
- `app/(tabs)/index.tsx` — Home tab
- `app/(tabs)/explore.tsx` — Explore tab
- `app/modal.tsx` — Modal screen (presented modally)

Typed routes are enabled (`typedRoutes` experiment in app.json).

### UI & Styling

Two-layer system:
1. **Gluestack UI v3** — Component library in `components/ui/`. Components use `forwardRef`, TVA (Tailwind Variants API) for variants, and accept `className` props. Each component has platform-specific files (`.web.tsx`).
2. **NativeWind + Tailwind CSS** — Utility-class styling via `className` prop on all components. Config in `tailwind.config.js`.

Theme colors are defined as CSS custom properties in `components/ui/gluestack-ui-provider/config.ts` with light/dark mode support. Use semantic Tailwind classes like `text-primary-500`, `bg-error-200`.

Dark mode uses Tailwind's `class` strategy.

### Key Conventions

- **Import alias**: `@/` maps to project root (e.g., `import { Box } from '@/components/ui/box'`)
- **Platform-specific files**: Use `.web.tsx` / `.ios.tsx` suffixes for platform variants
- **Animations**: Use `react-native-reanimated` (see `components/parallax-scroll-view.tsx`)
- **React Compiler** and **New Architecture** are both enabled
- **Package manager**: pnpm

### Configuration

- `metro.config.js` — Wrapped with `withNativeWind` for NativeWind support
- `babel.config.js` — Includes `nativewind/babel` preset and `module-resolver` plugin (for `@/` and `tailwind.config` aliases)
- `tailwind.config.js` — Extended color palette with semantic names (primary, secondary, error, success, etc.), custom fonts, custom box shadows
- TypeScript strict mode is enabled
