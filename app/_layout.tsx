import { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { View, AppState } from 'react-native';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from '@tanstack/react-query';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { GamepadProvider } from '@/providers/gamepad-provider';
import { migrateDbIfNeeded } from '@/services/database';
import { Colors } from '@/constants/theme';
import '@/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  // React Native: refetch on app focus
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <GluestackUIProvider mode="dark">
        <ThemeProvider value={DarkTheme}>
          <SQLiteProvider
            databaseName="retro-backlog.db"
            onInit={migrateDbIfNeeded}
          >
            <QueryClientProvider client={queryClient}>
              <GamepadProvider>
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: Colors.background },
                  }}
                >
                  <Stack.Screen
                    name="(drawer)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="game/[id]"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                </Stack>
              </GamepadProvider>
            </QueryClientProvider>
          </SQLiteProvider>
          <StatusBar style="light" />
        </ThemeProvider>
      </GluestackUIProvider>
    </View>
  );
}
