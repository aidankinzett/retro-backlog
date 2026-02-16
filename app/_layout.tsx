import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { GamepadProvider } from '@/providers/gamepad-provider';
import { migrateDbIfNeeded } from '@/services/database';
import '@/global.css';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="dark">
      <ThemeProvider value={DarkTheme}>
        <SQLiteProvider databaseName="retro-backlog.db" onInit={migrateDbIfNeeded}>
          <GamepadProvider>
            <Stack>
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
  );
}
