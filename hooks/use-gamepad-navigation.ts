import { useRef, useCallback } from 'react';
import useGamepad from 'react-native-earl-gamepad/dist/useGamepad';

interface FocusGridOptions {
  rows: number;
  columns: number;
  onSelect?: (row: number, col: number) => void;
  onFocusChange?: (row: number, col: number) => void;
}

export function useFocusGrid({ rows, columns, onSelect, onFocusChange }: FocusGridOptions) {
  const focusRow = useRef(0);
  const focusCol = useRef(0);

  useGamepad({
    enabled: true,
    onDpad: (event) => {
      if (!event.pressed) return;

      let newRow = focusRow.current;
      let newCol = focusCol.current;

      if (event.key === 'up') newRow = Math.max(0, newRow - 1);
      if (event.key === 'down') newRow = Math.min(rows - 1, newRow + 1);
      if (event.key === 'left') newCol = Math.max(0, newCol - 1);
      if (event.key === 'right') newCol = Math.min(columns - 1, newCol + 1);

      if (newRow !== focusRow.current || newCol !== focusCol.current) {
        focusRow.current = newRow;
        focusCol.current = newCol;
        onFocusChange?.(newRow, newCol);
      }
    },
    onButton: (event) => {
      if (event.button === 'a' && event.pressed) {
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
