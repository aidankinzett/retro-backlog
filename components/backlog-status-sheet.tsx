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
          <Text className="text-typography-white font-bold text-base px-3">
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
                    ? 'text-typography-white font-bold'
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
            <Box className="w-full h-px bg-background-100 my-1" />
            <ActionsheetItem onPress={() => handleSelect('none')}>
              <ActionsheetItemText className="text-red-400 font-bold">
                Remove from Backlog
              </ActionsheetItemText>
            </ActionsheetItem>
          </>
        )}
      </ActionsheetContent>
    </Actionsheet>
  );
}
