import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import {
  getBacklogGames,
  getBacklogStats,
  updateBacklogStatus,
  type Game,
} from '@/services/database';
import { useUIStore, BACKLOG_STATUSES, type BacklogStatus } from '@/stores/ui';

const ALL_FILTERS: { value: BacklogStatus | null; label: string; shortLabel: string }[] = [
  { value: null, label: 'All', shortLabel: 'All' },
  ...BACKLOG_STATUSES,
];

export default function BacklogScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { columns } = useOrientation();

  const statusFilter = useUIStore((s) => s.backlogStatusFilter);
  const setStatusFilter = useUIStore((s) => s.setBacklogStatusFilter);

  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState({ total: 0, want_to_play: 0, playing: 0, completed: 0, dropped: 0 });

  const loadData = useCallback(async () => {
    const [gamesResult, statsResult] = await Promise.all([
      getBacklogGames(db, statusFilter ?? undefined),
      getBacklogStats(db),
    ]);
    setGames(gamesResult);
    setStats(statsResult);
  }, [db, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const cycleStatus = async (game: Game) => {
    const order: BacklogStatus[] = ['want_to_play', 'playing', 'completed', 'dropped', 'none'];
    const currentIndex = order.indexOf(game.backlog_status as BacklogStatus);
    const nextStatus = order[(currentIndex + 1) % order.length];
    await updateBacklogStatus(db, game.id, nextStatus);
    loadData();
  };

  const renderItem = ({ item }: { item: Game }) => (
    <View style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
    <Pressable
      onPress={() => router.push(`/game/${item.id}`)}
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
          {item.title}
        </Text>
        <HStack className="items-center justify-between">
          <Pressable onPress={() => cycleStatus(item)}>
            <Text style={{ color: Colors.tint }} className="text-xs font-bold">
              {BACKLOG_STATUSES.find((s) => s.value === item.backlog_status)?.shortLabel ?? 'Unknown'}
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
      <HStack className="px-4 py-3 gap-4 flex-wrap">
        <VStack className="items-center">
          <Text className="text-typography-white font-bold text-lg">{stats.total}</Text>
          <Text className="text-typography-gray text-xs">Total</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-typography-white font-bold text-lg">{stats.completed}</Text>
          <Text className="text-typography-gray text-xs">Completed</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-typography-white font-bold text-lg">{stats.playing}</Text>
          <Text className="text-typography-gray text-xs">Playing</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="text-typography-white font-bold text-lg">{stats.want_to_play}</Text>
          <Text className="text-typography-gray text-xs">Want to Play</Text>
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
              className={`px-3 py-1 rounded-full ${isActive ? '' : 'bg-background-50'}`}
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
              {statusFilter ? 'No games with this status' : 'Your backlog is empty. Browse games to add some!'}
            </Text>
          </Box>
        }
      />
    </Box>
  );
}
