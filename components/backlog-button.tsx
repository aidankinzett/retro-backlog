import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useAddToBacklog } from '@/hooks/use-db-queries';
import { Colors } from '@/constants/theme';
import type { RawgGame } from '@/services/rawg';

interface BacklogButtonProps {
  game: RawgGame;
  isInBacklog: boolean;
}

export function BacklogButton({ game, isInBacklog }: BacklogButtonProps) {
  const addToBacklog = useAddToBacklog();
  const [added, setAdded] = useState(false);

  const disabled = isInBacklog || added || addToBacklog.isPending;

  const handlePress = async () => {
    await addToBacklog.mutateAsync({ rawgGame: game });
    setAdded(true);
  };

  if (disabled && !addToBacklog.isPending) {
    return (
      <Pressable
        disabled
        className="self-start rounded bg-background-50 px-2 py-1"
      >
        <Text className="text-xs font-bold text-typography-gray">
          In Backlog
        </Text>
      </Pressable>
    );
  }

  if (addToBacklog.isPending) {
    return (
      <Pressable
        disabled
        className="self-start rounded px-2 py-1 opacity-60"
        style={{ backgroundColor: Colors.tint }}
      >
        <ActivityIndicator size={12} color="#fff" />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="self-start rounded px-2 py-1"
      style={{ backgroundColor: Colors.tint }}
    >
      <Text className="text-xs font-bold text-typography-white">+ Backlog</Text>
    </Pressable>
  );
}
