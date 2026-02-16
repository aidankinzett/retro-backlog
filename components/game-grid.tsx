import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GameCard } from '@/components/game-card';
import { useOrientation } from '@/hooks/use-orientation';
import type { Game } from '@/services/database';

interface GameGridProps {
  games: Game[];
}

export function GameGrid({ games }: GameGridProps) {
  const { columns } = useOrientation();
  const router = useRouter();

  return (
    <FlatList
      data={games}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      key={columns}
      contentContainerStyle={{ padding: 12, gap: 12 }}
      columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
      renderItem={({ item }) => (
        <View style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
          <GameCard
            game={item}
            onPress={() => router.push(`/game/${item.rawg_slug ?? item.id}`)}
          />
        </View>
      )}
      style={{ flex: 1 }}
    />
  );
}
