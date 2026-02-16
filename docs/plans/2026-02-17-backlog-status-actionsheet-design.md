# Backlog Status ActionSheet Design

## Problem
The current backlog screen uses a tap-to-cycle interaction to change game status. This is unintuitive — users can't see what the next status will be, and there's no explicit way to remove a game from the backlog.

## Solution
Replace the cycle behavior with a Gluestack Actionsheet (bottom sheet) that shows all status options plus an explicit "Remove from Backlog" option. Apply to both the backlog list cards and the game detail screen.

## Component: `BacklogStatusSheet`

Reusable component at `components/backlog-status-sheet.tsx`.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `currentStatus: BacklogStatus`
- `onStatusChange: (status: BacklogStatus) => void`
- `showRemove?: boolean` — show "Remove from Backlog" option (default true)

**UI:**
- Bottom sheet with drag indicator
- "Set Status" header text
- 4 status rows: Want to Play, Playing, Completed, Dropped
- Current status highlighted with accent color (`Colors.tint`)
- "Remove from Backlog" row at the bottom in red (only when `showRemove` is true and game is in backlog)
- Dark themed: `bg-background-50` sheet background

## Backlog Screen Changes (`app/(drawer)/backlog.tsx`)
- Remove `cycleStatus` function
- Add `selectedGame` state to track which game's sheet is open
- Tap status text on card → opens ActionSheet for that game
- On selection → update status or remove from backlog

## Game Detail Screen Changes (`app/game/[id].tsx`)
- Replace horizontal chip row with a pressable status display that opens the ActionSheet
- For games not yet in backlog, tapping opens sheet to pick initial status (hide "Remove" option)

## Gluestack Actionsheet Setup
- Add Actionsheet component to `components/ui/actionsheet/` following Gluestack v3 patterns
- Style with dark theme: `bg-background-50` background, dark backdrop overlay
