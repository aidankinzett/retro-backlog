import { useMemo } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { SystemSelector } from '@/components/system-selector';
import { GameGrid } from '@/components/game-grid';
import { useUIStore } from '@/stores/ui';
import { useGamesByPlatform } from '@/hooks/use-db-queries';

export default function HomeScreen() {
  const currentSystemId = useUIStore((s) => s.currentSystemId);
  const setCurrentSystemId = useUIStore((s) => s.setCurrentSystemId);

  const { data: essentials = [] } = useGamesByPlatform(currentSystemId, 'essential');
  const { data: hiddenGems = [] } = useGamesByPlatform(currentSystemId, 'hidden_gem');

  const allGames = useMemo(() => [...essentials, ...hiddenGems], [essentials, hiddenGems]);
  const hasGames = allGames.length > 0;

  return (
    <Box className="flex-1 bg-background-dark">
      <SystemSelector selectedId={currentSystemId} onSelect={setCurrentSystemId} />

      {hasGames ? (
        <GameGrid games={allGames} />
      ) : (
        <VStack className="flex-1 items-center justify-center gap-2 px-8">
          <Heading size="xl" className="text-typography-white">No games yet</Heading>
          <Text className="text-typography-gray text-center">
            Curated picks will appear here once seed data is loaded. Browse games to add them to your collection.
          </Text>
        </VStack>
      )}
    </Box>
  );
}
