import { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSQLiteContext } from 'expo-sqlite';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { MetacriticBadge } from '@/components/metacritic-badge';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';
import { PLATFORMS } from '@/constants/platforms';
import { useUIStore } from '@/stores/ui';
import { searchGames, getTopGames, type RawgGame } from '@/services/rawg';
import { insertGame, getGameByRawgSlug, updateBacklogStatus } from '@/services/database';
import { randomUUID } from 'expo-crypto';

export default function BrowseScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { columns } = useOrientation();

  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const browsePlatformFilter = useUIStore((s) => s.browsePlatformFilter);
  const setBrowsePlatformFilter = useUIStore((s) => s.setBrowsePlatformFilter);
  const browseOrdering = useUIStore((s) => s.browseOrdering);

  const [results, setResults] = useState<RawgGame[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const res = await searchGames(searchQuery, {
          platforms: browsePlatformFilter ?? undefined,
          ordering: browseOrdering,
        });
        setResults(res.results);
      } else if (browsePlatformFilter) {
        const res = await getTopGames(browsePlatformFilter, {
          ordering: browseOrdering,
        });
        setResults(res.results);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Browse search error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, browsePlatformFilter, browseOrdering]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSearch, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [doSearch]);

  const handleAddToBacklog = async (rawgGame: RawgGame) => {
    const existing = await getGameByRawgSlug(db, rawgGame.slug);
    if (existing) {
      await updateBacklogStatus(db, existing.id, 'want_to_play');
    } else {
      const platformEntry = PLATFORMS.find((p) =>
        rawgGame.platforms?.some((rp) => rp.platform.id === p.rawgId)
      );
      await insertGame(db, {
        id: randomUUID(),
        rawg_id: rawgGame.id,
        rawg_slug: rawgGame.slug,
        title: rawgGame.name,
        platform: platformEntry?.id ?? 'unknown',
        genre: rawgGame.genres?.map((g) => g.name).join(', ') ?? null,
        curated_vibe: null,
        curated_desc: null,
        metacritic: rawgGame.metacritic,
        rawg_rating: rawgGame.rating,
        release_date: rawgGame.released,
        background_image: rawgGame.background_image,
        developer: rawgGame.developers?.[0]?.name ?? null,
        publisher: rawgGame.publishers?.[0]?.name ?? null,
        description: rawgGame.description_raw ?? null,
        playtime: rawgGame.playtime,
        esrb_rating: rawgGame.esrb_rating?.name ?? null,
        website: rawgGame.website ?? null,
        metacritic_url: rawgGame.metacritic_url ?? null,
        backlog_status: 'want_to_play',
        last_enriched: new Date().toISOString(),
      });
    }
  };

  const renderItem = ({ item }: { item: RawgGame }) => (
    <Pressable
      onPress={() => {
        router.push(`/game/${item.slug}`);
      }}
      className="rounded-lg overflow-hidden flex-1"
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
          onPress={() => handleAddToBacklog(item)}
          className="mt-1 px-2 py-1 rounded self-start"
          style={{ backgroundColor: Colors.tint }}
        >
          <Text className="text-typography-white text-xs font-bold">+ Backlog</Text>
        </Pressable>
      </Box>
    </Pressable>
  );

  return (
    <Box className="flex-1 bg-background-dark">
      {/* Search bar */}
      <Box className="px-4 pt-3">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
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
