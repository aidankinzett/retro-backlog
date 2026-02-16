import { createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';
import useGamepad from 'react-native-earl-gamepad/dist/useGamepad';
import type { ButtonEvent, GamepadButtonName } from 'react-native-earl-gamepad/dist/types';
import { useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';

interface GamepadContextValue {
  pressedButtons: Set<GamepadButtonName>;
  isPressed: (button: GamepadButtonName) => boolean;
}

const GamepadContext = createContext<GamepadContextValue>({
  pressedButtons: new Set(),
  isPressed: () => false,
});

export function useGamepadContext() {
  return useContext(GamepadContext);
}

const DRAWER_ROUTES = ['index', 'browse', 'backlog', 'settings'];

export function GamepadProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const navigation = useNavigation();

  const handleButton = (event: ButtonEvent) => {
    if (!event.pressed) return;

    // B button = back
    if (event.button === 'b') {
      router.back();
      return;
    }

    // Shoulder buttons = tab switching
    if (event.button === 'lb' || event.button === 'rb') {
      try {
        const state = navigation.getState();
        const currentIndex = state?.index ?? 0;
        const direction = event.button === 'rb' ? 1 : -1;
        const nextIndex = Math.max(0, Math.min(DRAWER_ROUTES.length - 1, currentIndex + direction));
        const nextRoute = DRAWER_ROUTES[nextIndex];
        if (nextRoute) {
          navigation.dispatch(DrawerActions.jumpTo(nextRoute));
        }
      } catch {
        // Navigation state may not be available
      }
    }
  };

  const { pressedButtons, isPressed, bridge } = useGamepad({
    enabled: true,
    onButton: handleButton,
  });

  return (
    <GamepadContext.Provider value={{ pressedButtons, isPressed }}>
      <View style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        {bridge}
      </View>
      {children}
    </GamepadContext.Provider>
  );
}
