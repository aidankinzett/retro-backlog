# Backlog Status ActionSheet Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the tap-to-cycle backlog status behavior with a Gluestack Actionsheet bottom sheet, and add an explicit "Remove from Backlog" option. Apply to both backlog list and game detail screens.

**Architecture:** Add the Gluestack Actionsheet UI component, create a reusable `BacklogStatusSheet` component that wraps it with backlog-specific logic, then integrate into both screens.

**Tech Stack:** Gluestack UI v3 (actionsheet creator), @legendapp/motion (animations), NativeWind/tva (styling)

---

### Task 1: Add Gluestack Actionsheet UI Component

**Files:**

- Create: `components/ui/actionsheet/index.tsx`

This is the Gluestack UI component following the same pattern as existing components in `components/ui/`. Copy the official Gluestack v3 actionsheet component source.

**Step 1: Create the actionsheet component file**

Create `components/ui/actionsheet/index.tsx` with the official Gluestack v3 source. This is a copy-paste from the upstream repo (`src/components/ui/actionsheet/index.tsx`), adapted for the dark theme.

The file uses:

- `createActionsheet` from `@gluestack-ui/core/actionsheet/creator`
- `@legendapp/motion` for animations (already installed)
- `PrimitiveIcon, UIIcon` from `@gluestack-ui/core/icon/creator`
- `H4` from `@expo/html-elements` (already installed)
- `tva` from `@gluestack-ui/utils/nativewind-utils`
- `cssInterop` from `nativewind`

Key style values (dark-theme aware):

- `actionsheetContentStyle` base: `'items-center rounded-tl-3xl rounded-tr-3xl p-5 pt-2 bg-background-0 web:pointer-events-auto web:select-none shadow-hard-5 border border-b-0 border-outline-100 pb-safe'`
- `actionsheetBackdropStyle` base: `'absolute left-0 top-0 right-0 bottom-0 bg-background-dark web:cursor-default web:pointer-events-auto'`
- `actionsheetItemStyle` base: `'w-full flex-row items-center p-3 rounded-sm data-[disabled=true]:opacity-40 hover:bg-background-50 active:bg-background-100 data-[focus=true]:bg-background-100 gap-2'`

Exports: `Actionsheet, ActionsheetContent, ActionsheetItem, ActionsheetItemText, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetBackdrop, ActionsheetScrollView, ActionsheetVirtualizedList, ActionsheetFlatList, ActionsheetSectionList, ActionsheetSectionHeaderText, ActionsheetIcon`

**Step 2: Commit**

```bash
git add components/ui/actionsheet/index.tsx
git commit -m "feat: add Gluestack Actionsheet UI component"
```

---

### Task 2: Create BacklogStatusSheet Component

**Files:**

- Create: `components/backlog-status-sheet.tsx`

**Step 1: Create the component**

```tsx
import React from 'react';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { Colors } from '@/constants/theme';
import { BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';

interface BacklogStatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: BacklogStatus;
  onStatusChange: (status: BacklogStatus) => void;
  showRemove?: boolean;
}

export function BacklogStatusSheet({
  isOpen,
  onClose,
  currentStatus,
  onStatusChange,
  showRemove = true,
}: BacklogStatusSheetProps) {
  const handleSelect = (status: BacklogStatus) => {
    onStatusChange(status);
    onClose();
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="bg-background-50">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        <Box className="w-full pb-2">
          <Text className="px-3 text-base font-bold text-typography-white">
            Set Status
          </Text>
        </Box>
        {BACKLOG_STATUSES.filter((s) => s.value !== 'none').map((s) => {
          const isActive = currentStatus === s.value;
          return (
            <ActionsheetItem
              key={s.value}
              onPress={() => handleSelect(s.value)}
              style={isActive ? { backgroundColor: Colors.tint } : undefined}
            >
              <ActionsheetItemText
                className={
                  isActive
                    ? 'font-bold text-typography-white'
                    : 'text-typography-white'
                }
              >
                {s.label}
              </ActionsheetItemText>
            </ActionsheetItem>
          );
        })}
        {showRemove && currentStatus !== 'none' && (
          <>
            <Box className="my-1 h-px w-full bg-background-100" />
            <ActionsheetItem onPress={() => handleSelect('none')}>
              <ActionsheetItemText className="font-bold text-red-400">
                Remove from Backlog
              </ActionsheetItemText>
            </ActionsheetItem>
          </>
        )}
      </ActionsheetContent>
    </Actionsheet>
  );
}
```

**Step 2: Verify it builds**

Run: `pnpm lint`
Expected: No errors related to the new file.

**Step 3: Commit**

```bash
git add components/backlog-status-sheet.tsx
git commit -m "feat: add BacklogStatusSheet reusable component"
```

---

### Task 3: Integrate ActionSheet into Backlog Screen

**Files:**

- Modify: `app/(drawer)/backlog.tsx`

**Step 1: Update the backlog screen**

Changes:

1. Import `BacklogStatusSheet`
2. Add `selectedGame` state (`Game | null`)
3. Remove `cycleStatus` function
4. Replace the `<Pressable onPress={() => cycleStatus(item)}>` with one that sets `selectedGame`
5. Add `BacklogStatusSheet` at the bottom of the component, passing:
   - `isOpen={!!selectedGame}`
   - `onClose={() => setSelectedGame(null)}`
   - `currentStatus={selectedGame?.backlog_status as BacklogStatus}`
   - `onStatusChange` that calls `updateStatus.mutate`

The full updated `renderItem` should change the status text Pressable from:

```tsx
<Pressable onPress={() => cycleStatus(item)}>
  <Text style={{ color: Colors.tint }} className="text-xs font-bold">
    {BACKLOG_STATUSES.find((s) => s.value === item.backlog_status)
      ?.shortLabel ?? 'Unknown'}
  </Text>
</Pressable>
```

to:

```tsx
<Pressable onPress={() => setSelectedGame(item)}>
  <Text style={{ color: Colors.tint }} className="text-xs font-bold">
    {BACKLOG_STATUSES.find((s) => s.value === item.backlog_status)
      ?.shortLabel ?? 'Unknown'}
  </Text>
</Pressable>
```

Add after the `FlatList` closing tag (but still inside the root `Box`):

```tsx
<BacklogStatusSheet
  isOpen={!!selectedGame}
  onClose={() => setSelectedGame(null)}
  currentStatus={(selectedGame?.backlog_status as BacklogStatus) ?? 'none'}
  onStatusChange={(status) => {
    if (selectedGame) {
      updateStatus.mutate({
        gameId: selectedGame.id,
        slug: selectedGame.rawg_slug,
        status,
      });
    }
    setSelectedGame(null);
  }}
/>
```

**Step 2: Verify it builds**

Run: `pnpm lint`

**Step 3: Commit**

```bash
git add app/\(drawer\)/backlog.tsx
git commit -m "feat: replace cycle-status with ActionSheet on backlog screen"
```

---

### Task 4: Integrate ActionSheet into Game Detail Screen

**Files:**

- Modify: `app/game/[id].tsx`

**Step 1: Update the game detail screen**

Changes:

1. Import `BacklogStatusSheet` and add `useState` for `showStatusSheet`
2. Replace the horizontal chip row (lines 143-164) with a single pressable status display:

Replace the entire backlog status section:

```tsx
{
  /* Backlog status */
}
<VStack className="mt-2 gap-2">
  <Text className="text-sm font-bold text-typography-gray">Backlog Status</Text>
  <HStack className="flex-wrap gap-2">
    {BACKLOG_STATUSES.map((s) => {
      const isActive = backlogStatus === s.value;
      return (
        <Pressable
          key={s.value}
          onPress={() => handleStatusChange(s.value)}
          className={`rounded-full px-3 py-1.5 ${isActive ? '' : 'bg-background-50'}`}
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
</VStack>;
```

With:

```tsx
{
  /* Backlog status */
}
<VStack className="mt-2 gap-2">
  <Text className="text-sm font-bold text-typography-gray">Backlog Status</Text>
  <Pressable
    onPress={() => setShowStatusSheet(true)}
    className="flex-row items-center gap-2 self-start rounded-lg bg-background-50 px-4 py-2"
  >
    <Text
      style={backlogStatus !== 'none' ? { color: Colors.tint } : undefined}
      className="text-sm font-bold text-typography-gray"
    >
      {BACKLOG_STATUSES.find((s) => s.value === backlogStatus)?.label ??
        'Add to Backlog'}
    </Text>
    <Text className="text-xs text-typography-gray">▼</Text>
  </Pressable>
</VStack>;
```

3. Update `handleStatusChange` to work with the ActionSheet:

```tsx
const handleStatusChange = (status: BacklogStatus) => {
  if (game) {
    updateStatus.mutate({ gameId: game.id, slug: game.rawg_slug, status });
  } else if (rawgGame) {
    addToBacklog.mutate({
      rawgGame,
      status: status === 'none' ? 'want_to_play' : status,
    });
  }
};
```

4. Add `BacklogStatusSheet` at the bottom of the return (inside the root `Box`, after `ScrollView`):

```tsx
<BacklogStatusSheet
  isOpen={showStatusSheet}
  onClose={() => setShowStatusSheet(false)}
  currentStatus={backlogStatus as BacklogStatus}
  onStatusChange={(status) => {
    handleStatusChange(status);
    setShowStatusSheet(false);
  }}
  showRemove={!!game}
/>
```

**Step 2: Verify it builds**

Run: `pnpm lint`

**Step 3: Commit**

```bash
git add app/game/\[id\].tsx
git commit -m "feat: replace status chips with ActionSheet on game detail screen"
```

---

### Task 5: Manual Verification on Android Emulator

**Step 1: Start the dev server and verify**

Use the mobile MCP to verify:

1. Open the backlog screen — tap a game's status text → ActionSheet should slide up
2. Select a different status → sheet closes, status updates
3. Tap "Remove from Backlog" → game is removed
4. Open a game detail → tap the status button → ActionSheet opens
5. For a game not in the backlog, "Remove from Backlog" should not appear

**Step 2: Final commit if any fixes needed**
