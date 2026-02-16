import { useCallback, useMemo, useRef, useState } from 'react';
import { TextInput, FlatList, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { PLATFORMS } from '@/constants/platforms';
import { useUIStore } from '@/stores/ui';
import { useRawgSearch, useRawgTopGames } from '@/hooks/use-rawg-queries';
import { useAddToBacklog } from '@/hooks/use-db-queries';
import type { RawgGame } from '@/services/rawg';

export default function BrowseScreen() {
  const router = useRouter();
  const { columns } = useOrientation();

  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const browsePlatformFilter = useUIStore((s) => s.browsePlatformFilter);
  const setBrowsePlatformFilter = useUIStore((s) => s.setBrowsePlatformFilter);
  const browseOrdering = useUIStore((s) => s.browseOrdering);

  // Debounce search input
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setDebouncedQuery(text), 300);
    },
    [setSearchQuery]
  );

  const searchResult = useRawgSearch(debouncedQuery, browsePlatformFilter, browseOrdering);
  const topResult = useRawgTopGames(
    debouncedQuery.trim() ? null : browsePlatformFilter,
    browseOrdering
  );

  const results = useMemo(() => {
    if (debouncedQuery.trim()) return searchResult.data?.results ?? [];
    if (browsePlatformFilter) return topResult.data?.results ?? [];
    return [];
  }, [debouncedQuery, browsePlatformFilter, searchResult.data, topResult.data]);

  const loading = debouncedQuery.trim()
    ? searchResult.isPending && searchResult.fetchStatus !== 'idle'
    : browsePlatformFilter
      ? topResult.isPending && topResult.fetchStatus !== 'idle'
      : false;

  const addToBacklog = useAddToBacklog();

  const renderItem = ({ item }: { item: RawgGame }) => (
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
            <Text className="text-typography-gray text-xs" numberOfLines={1}>
              {item.genres?.map((g) => g.name).join(', ') ?? ''}
            </Text>
            <MetacriticBadge score={item.metacritic} />
          </HStack>
          <Pressable
            onPress={() => addToBacklog.mutate({ rawgGame: item })}
            className="mt-1 px-2 py-1 rounded self-start"
            style={{ backgroundColor: Colors.tint }}
          >
            <Text className="text-typography-white text-xs font-bold">+ Backlog</Text>
          </Pressable>
        </Box>
      </Pressable>
    </View>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Search bar */}
      <Box className="px-4 pt-3">
        <TextInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search games..."
          placeholderTextColor={Colors.textMuted}
          style={{
            backgroundColor: Colors.surface,
            color: Colors.text,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            fontSize: 16,
          }}
        />
      </Box>

      {/* Platform filter chips */}
      <HStack className="flex-wrap gap-2 px-4 py-2">
        <Pressable
          onPress={() => setBrowsePlatformFilter(null)}
          className={`px-3 py-1 rounded-full ${browsePlatformFilter === null ? '' : 'bg-background-50'}`}
          style={browsePlatformFilter === null ? { backgroundColor: Colors.tint } : undefined}
        >
          <Text className="text-typography-white text-xs">All</Text>
        </Pressable>
        {PLATFORMS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setBrowsePlatformFilter(p.rawgId)}
            className={`px-3 py-1 rounded-full ${browsePlatformFilter === p.rawgId ? '' : 'bg-background-50'}`}
            style={browsePlatformFilter === p.rawgId ? { backgroundColor: p.accent } : undefined}
          >
            <Text className="text-typography-white text-xs">{p.shortName}</Text>
          </Pressable>
        ))}
      </HStack>

      {/* Results */}
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
            <Box className="flex-1 items-center justify-center py-20">
              <Text className="text-typography-gray">
                {searchQuery || browsePlatformFilter
                  ? 'No results found'
                  : 'Search for games or select a platform'}
              </Text>
            </Box>
          }
        />
      )}
    </Box>
  );
}
