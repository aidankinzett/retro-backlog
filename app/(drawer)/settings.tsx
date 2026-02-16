import { useState, useEffect } from 'react';
import { Linking, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
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

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const accentOverride = useUIStore((s) => s.accentOverride);
  const setAccentOverride = useUIStore((s) => s.setAccentOverride);
  const [gameCount, setGameCount] = useState(0);
  const [screenshotCount, setScreenshotCount] = useState(0);

  useEffect(() => {
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM games').then(
      (r) => r && setGameCount(r.count)
    );
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM screenshots').then(
      (r) => r && setScreenshotCount(r.count)
    );
  }, [db]);

  const handleClearCache = async () => {
    await db.execAsync("UPDATE games SET last_enriched = NULL");
    await db.execAsync("DELETE FROM screenshots");
    setScreenshotCount(0);
  };

  const accentOptions = [
    { label: 'Dynamic (per system)', color: null },
    ...PLATFORMS.map((p) => ({ label: p.shortName, color: p.accent })),
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Box className="p-6">
        <VStack className="gap-8 max-w-lg">
          {/* Attribution */}
          <VStack className="gap-2">
            <Heading size="lg" className="text-typography-white">Attribution</Heading>
            <Pressable onPress={() => Linking.openURL('https://rawg.io')}>
              <Text className="text-typography-gray text-sm">
                Game data provided by{' '}
                <Text style={{ color: Colors.tint }} className="text-sm">RAWG</Text>
                {' '}&mdash; The largest video game database.
              </Text>
            </Pressable>
          </VStack>

          {/* Accent Color */}
          <VStack className="gap-2">
            <Heading size="lg" className="text-typography-white">Accent Color</Heading>
            <HStack className="flex-wrap gap-2">
              {accentOptions.map((opt) => {
                const isActive = accentOverride === opt.color;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => setAccentOverride(opt.color)}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: isActive
                        ? (opt.color ?? Colors.tint)
                        : Colors.surface,
                      borderWidth: isActive ? 2 : 0,
                      borderColor: Colors.text,
                    }}
                  >
                    <Text className={`text-xs font-bold ${isActive ? 'text-typography-white' : 'text-typography-gray'}`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          </VStack>

          {/* Storage Stats */}
          <VStack className="gap-2">
            <Heading size="lg" className="text-typography-white">Storage</Heading>
            <Text className="text-typography-gray text-sm">Games in database: {gameCount}</Text>
            <Text className="text-typography-gray text-sm">Cached screenshots: {screenshotCount}</Text>
            <Pressable
              onPress={handleClearCache}
              className="mt-2 px-4 py-2 rounded self-start"
              style={{ backgroundColor: '#b91c1c' }}
            >
              <Text className="text-typography-white text-sm font-bold">Clear Cache &amp; Re-enrich</Text>
            </Pressable>
          </VStack>

          {/* App Info */}
          <VStack className="gap-1">
            <Heading size="lg" className="text-typography-white">About</Heading>
            <Text className="text-typography-gray text-sm">
              Retro Backlog v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </VStack>
        </VStack>
      </Box>
    </ScrollView>
  );
}
