import { ScrollView } from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { PLATFORMS } from '@/constants/platforms';
import { HStack } from '@/components/ui/hstack';

interface SystemSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function SystemSelector({ selectedId, onSelect }: SystemSelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <HStack className="gap-2 px-4 py-2">
        {PLATFORMS.map((platform) => {
          const isSelected = platform.id === selectedId;
          return (
            <Pressable
              key={platform.id}
              onPress={() => onSelect(platform.id)}
              className={`px-4 py-2 rounded-full ${isSelected ? '' : 'bg-background-50'}`}
              style={isSelected ? { backgroundColor: platform.accent } : undefined}
            >
              <Text
                className={`text-sm font-bold ${isSelected ? 'text-typography-white' : 'text-typography-gray'}`}
              >
                {platform.shortName}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    </ScrollView>
  );
}
