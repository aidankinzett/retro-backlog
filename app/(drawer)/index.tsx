import { FlatList, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { PLATFORMS } from '@/constants/platforms';
import { useTopRetroGames } from '@/hooks/use-rawg-queries';
import { useBacklogSlugs } from '@/hooks/use-db-queries';
import { BacklogButton } from '@/components/backlog-button';
import type { RawgGame } from '@/services/rawg';

function getPlatformLabel(game: RawgGame): string | null {
  if (!game.platforms) return null;
  for (const rp of game.platforms) {
    const match = PLATFORMS.find((p) => p.rawgId === rp.platform.id);
    if (match) return match.shortName;
  }
  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { columns } = useOrientation();
  const { data, isPending, fetchStatus } = useTopRetroGames();
  const { data: backlogSlugs } = useBacklogSlugs();

  const loading = isPending && fetchStatus !== 'idle';
  const results = data?.results ?? [];

  const renderItem = ({ item }: { item: RawgGame }) => {
    const platformLabel = getPlatformLabel(item);
    return (
      <View style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
        <Pressable
          onPress={() => router.push(`/game/${item.slug}`)}
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: Colors.surface }}
        >
          <Image
            source={{ uri: item.background_image ?? undefined }}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            contentFit="cover"
            transition={200}
          />
          <Box className="p-2 gap-1">
            <Text className="text-typography-white text-sm font-bold" numberOfLines={1}>
              {item.name}
            </Text>
            <HStack className="items-center justify-between">
              <Text className="text-typography-gray text-xs flex-1" numberOfLines={1}>
                {item.genres?.map((g) => g.name).join(', ') ?? ''}
              </Text>
              <MetacriticBadge score={item.metacritic} />
            </HStack>
            <HStack className="items-center justify-between mt-1">
              {platformLabel ? (
                <Text className="text-typography-gray text-xs font-bold">{platformLabel}</Text>
              ) : (
                <View />
              )}
              <BacklogButton
                game={item}
                isInBacklog={backlogSlugs?.has(item.slug) ?? false}
              />
            </HStack>
          </Box>
        </Pressable>
      </View>
    );
  };

  return (
    <Box className="flex-1 bg-background-dark">
      {loading ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.tint} size="large" />
        </Box>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          numColumns={columns}
          key={columns}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
          renderItem={renderItem}
          ListEmptyComponent={
            <VStack className="flex-1 items-center justify-center py-20 gap-2">
              <Text className="text-typography-gray text-center">
                No top retro games found. Check your connection and try again.
              </Text>
            </VStack>
          }
        />
      )}
    </Box>
  );
}
