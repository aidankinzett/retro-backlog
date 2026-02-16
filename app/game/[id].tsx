import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { PLATFORM_MAP, PLATFORMS } from '@/constants/platforms';
import { useGameDetail, useGameScreenshots, useUpdateBacklogStatus, useAddToBacklog } from '@/hooks/use-db-queries';
import { BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';

export default function GameDetailScreen() {
  const { id: slug } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isLandscape } = useOrientation();
  const insets = useSafeAreaInsets();

  const { data, isPending, isError } = useGameDetail(slug);
  const updateStatus = useUpdateBacklogStatus();
  const addToBacklog = useAddToBacklog();

  // Derive display values from either DB game or RAWG game
  const game = data?.game;
  const rawgGame = data?.rawgGame;

  const title = game?.title ?? rawgGame?.name ?? '';
  const backgroundImage = game?.background_image ?? rawgGame?.background_image;
  const metacritic = game?.metacritic ?? rawgGame?.metacritic ?? null;
  const rawgRating = game?.rawg_rating ?? rawgGame?.rating ?? null;
  const releaseDate = game?.release_date ?? rawgGame?.released;
  const developer = game?.developer ?? rawgGame?.developers?.[0]?.name;
  const publisher = game?.publisher ?? rawgGame?.publishers?.[0]?.name;
  const genre = game?.genre ?? rawgGame?.genres?.map((g) => g.name).join(', ');
  const description = game?.description ?? rawgGame?.description_raw;
  const playtime = game?.playtime ?? rawgGame?.playtime;
  const esrbRating = game?.esrb_rating ?? rawgGame?.esrb_rating?.name;
  const curatedDesc = game?.curated_desc;
  const backlogStatus = game?.backlog_status ?? 'none';

  const platformId = game?.platform ?? (() => {
    const entry = PLATFORMS.find((p) =>
      rawgGame?.platforms?.some((rp) => rp.platform.id === p.rawgId)
    );
    return entry?.id;
  })();
  const platform = platformId ? PLATFORM_MAP[platformId] : undefined;

  // Screenshots from DB (only available for games in the database)
  const { data: screenshots = [] } = useGameScreenshots(game?.id);

  const handleStatusChange = async (status: BacklogStatus) => {
    const newStatus = backlogStatus === status ? 'none' : status;
    if (game) {
      updateStatus.mutate({ gameId: game.id, slug: game.rawg_slug, status: newStatus });
    } else if (rawgGame) {
      addToBacklog.mutate({ rawgGame, status: newStatus === 'none' ? 'want_to_play' : newStatus });
    }
  };

  if (isPending) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-dark">
        <Text className="text-typography-gray">Loading...</Text>
      </Box>
    );
  }

  if (isError || (!game && !rawgGame)) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-dark">
        <Text className="text-typography-gray">Game not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2 rounded-lg bg-background-50">
          <Text style={{ color: Colors.tint }} className="font-bold">← Go Back</Text>
        </Pressable>
      </Box>
    );
  }

  const leftPanel = (
    <VStack className={`gap-2 ${isLandscape ? 'flex-1' : ''} p-4`}>
      {backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
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
      <Heading size="lg" className="text-typography-white">{title}</Heading>

      <HStack className="items-center gap-3">
        <MetacriticBadge score={metacritic} size="lg" />
        {rawgRating != null && (
          <VStack>
            <Text className="text-typography-gray text-xs">RAWG</Text>
            <Text className="text-typography-white font-bold">{rawgRating.toFixed(1)}</Text>
          </VStack>
        )}
      </HStack>

      {releaseDate && (
        <Text className="text-typography-gray">Released: {releaseDate}</Text>
      )}
      {developer && (
        <Text className="text-typography-gray">Developer: {developer}</Text>
      )}
      {publisher && (
        <Text className="text-typography-gray">Publisher: {publisher}</Text>
      )}
      {platform && (
        <Box
          className="self-start px-3 py-1 rounded-full"
          style={{ backgroundColor: platform.accent }}
        >
          <Text className="text-typography-white text-xs font-bold">{platform.name}</Text>
        </Box>
      )}
      {genre ? (
        <HStack className="flex-wrap gap-2">
          {genre.split(',').map((g) => (
            <Box key={g.trim()} className="px-2 py-1 rounded bg-background-50">
              <Text className="text-typography-gray text-xs">{g.trim()}</Text>
            </Box>
          ))}
        </HStack>
      ) : null}
      {esrbRating && (
        <Text className="text-typography-gray text-xs">ESRB: {esrbRating}</Text>
      )}

      {/* Backlog status */}
      <VStack className="gap-2 mt-2">
        <Text className="text-typography-gray text-sm font-bold">Backlog Status</Text>
        <HStack className="flex-wrap gap-2">
          {BACKLOG_STATUSES.map((s) => {
            const isActive = backlogStatus === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => handleStatusChange(s.value)}
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
      {description && (
        <VStack className="gap-2">
          <Text className="text-typography-gray text-sm font-bold">About</Text>
          <Text className="text-typography-white text-sm leading-relaxed" numberOfLines={isLandscape ? 8 : undefined}>
            {description}
          </Text>
        </VStack>
      )}

      {playtime != null && playtime > 0 && (
        <Text className="text-typography-gray text-sm">
          Average playtime: {playtime} hours
        </Text>
      )}

      {curatedDesc && (
        <Box className="p-3 rounded-lg bg-background-50 border border-outline-100">
          <Text className="text-typography-gray text-xs font-bold mb-1">Why this game?</Text>
          <Text className="text-typography-white text-sm">{curatedDesc}</Text>
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
