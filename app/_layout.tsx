import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { View } from 'react-native';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { GamepadProvider } from '@/providers/gamepad-provider';
import { migrateDbIfNeeded } from '@/services/database';
import { useEnrichment } from '@/hooks/use-enrichment';
import { Colors } from '@/constants/theme';
import '@/global.css';

function EnrichmentRunner() {
  useEnrichment();
  return null;
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <GluestackUIProvider mode="dark">
        <ThemeProvider value={DarkTheme}>
          <SQLiteProvider databaseName="retro-backlog.db" onInit={migrateDbIfNeeded}>
            <GamepadProvider>
              <EnrichmentRunner />
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: Colors.background },
                }}
              >
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="game/[id]"
                  options={{
                    headerShown: false,
                    presentation: 'card',
                  }}
                />
              </Stack>
            </GamepadProvider>
          </SQLiteProvider>
          <StatusBar style="light" />
        </ThemeProvider>
      </GluestackUIProvider>
    </View>
  );
}
