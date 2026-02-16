import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { BacklogStatusSheet } from '@/components/backlog-status-sheet';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { type Game } from '@/services/database';
import { useUIStore, BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';
import {
  useBacklogGames,
  useBacklogStats,
  useUpdateBacklogStatus,
} from '@/hooks/use-db-queries';

const ALL_FILTERS: {
  value: BacklogStatus | null;
  label: string;
  shortLabel: string;
}[] = [{ value: null, label: 'All', shortLabel: 'All' }, ...BACKLOG_STATUSES];

export default function BacklogScreen() {
  const router = useRouter();
  const { columns } = useOrientation();

  const statusFilter = useUIStore((s) => s.backlogStatusFilter);
  const setStatusFilter = useUIStore((s) => s.setBacklogStatusFilter);

  const { data: games = [] } = useBacklogGames(statusFilter ?? undefined);
  const {
    data: stats = {
      total: 0,
      want_to_play: 0,
      playing: 0,
      completed: 0,
      dropped: 0,
    },
  } = useBacklogStats();
  const updateStatus = useUpdateBacklogStatus();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const renderItem = ({ item }: { item: Game }) => (
    <View style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
      <Pressable
        onPress={() => router.push(`/game/${item.rawg_slug ?? item.id}`)}
        className="overflow-hidden rounded-lg"
        style={{ backgroundColor: Colors.surface }}
      >
        <Image
          source={{ uri: item.background_image ?? undefined }}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          contentFit="cover"
          transition={200}
        />
        <Box className="gap-1 p-2">
          <Text
            className="text-sm font-bold text-typography-white"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <HStack className="items-center justify-between">
            <Pressable onPress={() => setSelectedGame(item)}>
              <Text
                style={{ color: Colors.tint }}
                className="text-xs font-bold"
              >
                {BACKLOG_STATUSES.find((s) => s.value === item.backlog_status)
                  ?.shortLabel ?? 'Unknown'}
              </Text>
            </Pressable>
            <MetacriticBadge score={item.metacritic} />
          </HStack>
        </Box>
      </Pressable>
    </View>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Stats bar */}
      <HStack className="flex-wrap gap-4 px-4 py-3">
        <VStack className="items-center">
          <Text className="text-lg font-bold text-typography-white">
            {stats.total}
          </Text>
          <Text className="text-xs text-typography-gray">Total</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-lg font-bold text-typography-white">
            {stats.completed}
          </Text>
          <Text className="text-xs text-typography-gray">Completed</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-lg font-bold text-typography-white">
            {stats.playing}
          </Text>
          <Text className="text-xs text-typography-gray">Playing</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-lg font-bold text-typography-white">
            {stats.want_to_play}
          </Text>
          <Text className="text-xs text-typography-gray">Want to Play</Text>
        </VStack>
      </HStack>

      {/* Status filter chips */}
      <HStack className="flex-wrap gap-2 px-4 pb-2">
        {ALL_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <Pressable
              key={f.value ?? 'all'}
              onPress={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 ${isActive ? '' : 'bg-background-50'}`}
              style={isActive ? { backgroundColor: Colors.tint } : undefined}
            >
              <Text
                className={`text-xs font-bold ${isActive ? 'text-typography-white' : 'text-typography-gray'}`}
              >
                {f.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </HStack>

      {/* Game list */}
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        key={columns}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
        renderItem={renderItem}
        ListEmptyComponent={
          <Box className="flex-1 items-center justify-center py-20">
            <Text className="text-typography-gray">
              {statusFilter
                ? 'No games with this status'
                : 'Your backlog is empty. Browse games to add some!'}
            </Text>
          </Box>
        }
      />
      <BacklogStatusSheet
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
        currentStatus={
          (selectedGame?.backlog_status as BacklogStatus) ?? 'none'
        }
        onStatusChange={(status) => {
          if (selectedGame) {
            updateStatus.mutate({
              gameId: selectedGame.id,
              slug: selectedGame.rawg_slug,
              status,
            });
          }
          setSelectedGame(null);
        }}
      />
    </Box>
  );
}
