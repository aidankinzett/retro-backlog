import { Image } from 'expo-image';
import { Pressable } from '@/components/ui/pressable';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MetacriticBadge } from '@/components/metacritic-badge';
import type { Game } from '@/services/database';

interface GameCardProps {
  game: Game;
  onPress: () => void;
}

export function GameCard({ game, onPress }: GameCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <Image
        source={{ uri: game.background_image ?? undefined }}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        contentFit="cover"
        placeholder={{ blurhash: 'L6Pj0^i_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <Box className="p-2 gap-1">
        <Text className="text-typography-white text-sm font-bold" numberOfLines={1}>
          {game.title}
        </Text>
        <Box className="flex-row items-center justify-between">
          {game.genre ? (
            <Text className="text-typography-gray text-xs" numberOfLines={1}>
              {game.genre}
            </Text>
          ) : (
            <Box />
          )}
          <MetacriticBadge score={game.metacritic} />
        </Box>
      </Box>
    </Pressable>
  );
}
