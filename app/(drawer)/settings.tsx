import { Linking, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';
import { PLATFORMS } from '@/constants/platforms';
import { useUIStore } from '@/stores/ui';
import {
  useSettingsCounts,
  useClearCache,
  useClearDatabase,
} from '@/hooks/use-db-queries';

export default function SettingsScreen() {
  const accentOverride = useUIStore((s) => s.accentOverride);
  const setAccentOverride = useUIStore((s) => s.setAccentOverride);

  const { data: counts = { gameCount: 0, screenshotCount: 0 } } =
    useSettingsCounts();
  const clearCache = useClearCache();
  const clearDb = useClearDatabase();

  const accentOptions = [
    { label: 'Dynamic (per system)', color: null },
    ...PLATFORMS.map((p) => ({ label: p.shortName, color: p.accent })),
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Box className="p-6">
        <VStack className="max-w-lg gap-8">
          {/* Attribution */}
          <VStack className="gap-2">
            <Heading size="lg" className="text-typography-white">
              Attribution
            </Heading>
            <Pressable onPress={() => Linking.openURL('https://rawg.io')}>
              <Text className="text-sm text-typography-gray">
                Game data provided by{' '}
                <Text style={{ color: Colors.tint }} className="text-sm">
                  RAWG
                </Text>{' '}
                &mdash; The largest video game database.
              </Text>
            </Pressable>
          </VStack>

          {/* Accent Color */}
          <VStack className="gap-2">
            <Heading size="lg" className="text-typography-white">
              Accent Color
            </Heading>
            <HStack className="flex-wrap gap-2">
              {accentOptions.map((opt) => {
                const isActive = accentOverride === opt.color;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => setAccentOverride(opt.color)}
                    className="rounded-lg px-3 py-2"
                    style={{
                      backgroundColor: isActive
                        ? (opt.color ?? Colors.tint)
                        : Colors.surface,
                      borderWidth: isActive ? 2 : 0,
                      borderColor: Colors.text,
                    }}
                  >
                    <Text
                      className={`text-xs font-bold ${isActive ? 'text-typography-white' : 'text-typography-gray'}`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          </VStack>

          {/* Storage Stats */}
          <VStack className="gap-2">
            <Heading size="lg" className="text-typography-white">
              Storage
            </Heading>
            <Text className="text-sm text-typography-gray">
              Games in database: {counts.gameCount}
            </Text>
            <Text className="text-sm text-typography-gray">
              Cached screenshots: {counts.screenshotCount}
            </Text>

            <HStack className="mt-2 gap-2">
              <Pressable
                onPress={() => clearCache.mutate()}
                className="rounded px-4 py-2"
                style={{ backgroundColor: '#b91c1c' }}
              >
                <Text className="text-sm font-bold text-typography-white">
                  Clear Cache
                </Text>
              </Pressable>
              <Pressable
                onPress={() => clearDb.mutate()}
                className="rounded px-4 py-2"
                style={{ backgroundColor: '#b91c1c' }}
              >
                <Text className="text-sm font-bold text-typography-white">
                  Clear Database
                </Text>
              </Pressable>
            </HStack>
          </VStack>

          {/* App Info */}
          <VStack className="gap-1">
            <Heading size="lg" className="text-typography-white">
              About
            </Heading>
            <Text className="text-sm text-typography-gray">
              Retro Backlog v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </VStack>
        </VStack>
      </Box>
    </ScrollView>
  );
}
