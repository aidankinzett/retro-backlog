import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSQLiteContext } from 'expo-sqlite';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { PLATFORM_MAP } from '@/constants/platforms';
import {
  getGameById,
  getScreenshots,
  updateBacklogStatus,
  type Game,
  type Screenshot,
} from '@/services/database';
import { BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { isLandscape } = useOrientation();
  const insets = useSafeAreaInsets();

  const [game, setGame] = useState<Game | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);

  useEffect(() => {
    if (!id) return;
    getGameById(db, id).then(setGame);
    getScreenshots(db, id).then(setScreenshots);
  }, [db, id]);

  const handleStatusChange = async (status: BacklogStatus) => {
    if (!game) return;
    await updateBacklogStatus(db, game.id, status);
    setGame({ ...game, backlog_status: status });
  };

  if (!game) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-dark">
        <Text className="text-typography-gray">Loading...</Text>
      </Box>
    );
  }

  const platform = PLATFORM_MAP[game.platform];

  const leftPanel = (
    <VStack className={`gap-2 ${isLandscape ? 'flex-1' : ''} p-4`}>
      {game.background_image && (
        <Image
          source={{ uri: game.background_image }}
          style={{
            width: '100%',
            height: isLandscape ? 120 : undefined,
            aspectRatio: isLandscape ? undefined : 16 / 9,
            borderRadius: 8,
          }}
          contentFit="cover"
          transition={200}
        />
      )}
      <Heading size="lg" className="text-typography-white">{game.title}</Heading>

      <HStack className="items-center gap-3">
        <MetacriticBadge score={game.metacritic} size="lg" />
        {game.rawg_rating && (
          <VStack>
            <Text className="text-typography-gray text-xs">RAWG</Text>
            <Text className="text-typography-white font-bold">{game.rawg_rating.toFixed(1)}</Text>
          </VStack>
        )}
      </HStack>

      {game.release_date && (
        <Text className="text-typography-gray">Released: {game.release_date}</Text>
      )}
      {game.developer && (
        <Text className="text-typography-gray">Developer: {game.developer}</Text>
      )}
      {game.publisher && (
        <Text className="text-typography-gray">Publisher: {game.publisher}</Text>
      )}
      {platform && (
        <Box
          className="self-start px-3 py-1 rounded-full"
          style={{ backgroundColor: platform.accent }}
        >
          <Text className="text-typography-white text-xs font-bold">{platform.name}</Text>
        </Box>
      )}
      {game.genre && (
        <HStack className="flex-wrap gap-2">
          {game.genre.split(',').map((g) => (
            <Box key={g.trim()} className="px-2 py-1 rounded bg-background-50">
              <Text className="text-typography-gray text-xs">{g.trim()}</Text>
            </Box>
          ))}
        </HStack>
      )}
      {game.esrb_rating && (
        <Text className="text-typography-gray text-xs">ESRB: {game.esrb_rating}</Text>
      )}

      {/* Backlog status */}
      <VStack className="gap-2 mt-2">
        <Text className="text-typography-gray text-sm font-bold">Backlog Status</Text>
        <HStack className="flex-wrap gap-2">
          {BACKLOG_STATUSES.map((s) => {
            const isActive = game.backlog_status === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => handleStatusChange(isActive ? 'none' : s.value)}
                className={`px-3 py-1.5 rounded-full ${isActive ? '' : 'bg-background-50'}`}
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
      </VStack>
    </VStack>
  );

  const rightPanel = (
    <VStack className={`gap-3 ${isLandscape ? 'flex-1' : ''} p-4`}>
      {game.description && (
        <VStack className="gap-2">
          <Text className="text-typography-gray text-sm font-bold">About</Text>
          <Text className="text-typography-white text-sm leading-relaxed" numberOfLines={isLandscape ? 8 : undefined}>
            {game.description}
          </Text>
        </VStack>
      )}

      {game.playtime != null && game.playtime > 0 && (
        <Text className="text-typography-gray text-sm">
          Average playtime: {game.playtime} hours
        </Text>
      )}

      {game.curated_desc && (
        <Box className="p-3 rounded-lg bg-background-50 border border-outline-100">
          <Text className="text-typography-gray text-xs font-bold mb-1">Why this game?</Text>
          <Text className="text-typography-white text-sm">{game.curated_desc}</Text>
        </Box>
      )}

      {screenshots.length > 0 && (
        <VStack className="gap-2">
          <Text className="text-typography-gray text-sm font-bold">Screenshots</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack className="gap-2">
              {screenshots.map((s) => (
                <Image
                  key={s.id}
                  source={{ uri: s.image_url }}
                  style={{ width: 280, height: 158, borderRadius: 8 }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </HStack>
          </ScrollView>
        </VStack>
      )}
    </VStack>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Back button */}
      <Box className="px-4 pb-1" style={{ paddingTop: Math.max(insets.top, 12) }}>
        <Pressable
          onPress={() => router.back()}
          className="self-start px-3 py-2 rounded-lg bg-background-50"
        >
          <Text style={{ color: Colors.tint }} className="text-base font-bold">← Back</Text>
        </Pressable>
      </Box>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {isLandscape ? (
          <HStack className="flex-1">
            <ScrollView style={{ flex: 1 }}>{leftPanel}</ScrollView>
            <ScrollView style={{ flex: 1 }}>{rightPanel}</ScrollView>
          </HStack>
        ) : (
          <VStack>
            {leftPanel}
            {rightPanel}
          </VStack>
        )}
      </ScrollView>
    </Box>
  );
}
