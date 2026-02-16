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
        className="px-2 py-1 rounded bg-background-50 self-start"
      >
        <Text className="text-typography-gray text-xs font-bold">In Backlog</Text>
      </Pressable>
    );
  }

  if (addToBacklog.isPending) {
    return (
      <Pressable
        disabled
        className="px-2 py-1 rounded self-start opacity-60"
        style={{ backgroundColor: Colors.tint }}
      >
        <ActivityIndicator size={12} color="#fff" />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="px-2 py-1 rounded self-start"
      style={{ backgroundColor: Colors.tint }}
    >
      <Text className="text-typography-white text-xs font-bold">+ Backlog</Text>
    </Pressable>
  );
}
