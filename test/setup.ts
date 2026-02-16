import { vi, beforeEach } from 'vitest';
import type * as React from 'react';

// ============================================================
// 1. EXPO MODULES
// ============================================================

vi.mock('expo-sqlite', () => {
  const mockDb = {
    execAsync: vi.fn().mockResolvedValue(undefined),
    runAsync: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: vi.fn().mockResolvedValue(null),
    getAllAsync: vi.fn().mockResolvedValue([]),
    closeAsync: vi.fn().mockResolvedValue(undefined),
    withTransactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
  };
  return {
    openDatabaseAsync: vi.fn().mockResolvedValue(mockDb),
    useSQLiteContext: vi.fn(() => mockDb),
    SQLiteProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    canGoBack: vi.fn(() => true),
  })),
  useLocalSearchParams: vi.fn(() => ({})),
  useGlobalSearchParams: vi.fn(() => ({})),
  useSegments: vi.fn(() => []),
  usePathname: vi.fn(() => '/'),
  useNavigation: vi.fn(() => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
    getState: vi.fn(() => ({ index: 0, routes: [] })),
    dispatch: vi.fn(),
  })),
  Link: ({ children }: any) => children,
  Stack: Object.assign(({ children }: any) => children, {
    Screen: ({ children }: any) => children,
  }),
  Tabs: Object.assign(({ children }: any) => children, {
    Screen: ({ children }: any) => children,
  }),
  Slot: ({ children }: any) => children,
  router: { push: vi.fn(), back: vi.fn(), replace: vi.fn() },
}));

vi.mock('expo-crypto', () => ({
  randomUUID: vi.fn(
    () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  ),
}));

vi.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: ({ source, style, ...props }: any) => {
      return React.createElement('img', {
        src: source && typeof source === 'object' ? source.uri : source,
        style,
        ...props,
      });
    },
  };
});

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: { name: 'retro-backlog', slug: 'retro-backlog' },
    executionEnvironment: 'storeClient',
  },
}));

vi.mock('expo-font', () => ({
  useFonts: vi.fn(() => [true, null]),
  isLoaded: vi.fn(() => true),
  loadAsync: vi.fn(),
}));

vi.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: vi.fn().mockResolvedValue(true),
  hideAsync: vi.fn().mockResolvedValue(true),
}));

vi.mock('expo-status-bar', () => ({ StatusBar: () => null }));

vi.mock('expo-linking', () => ({
  openURL: vi.fn(),
  createURL: vi.fn((path: string) => `retrobacklog://${path}`),
  canOpenURL: vi.fn().mockResolvedValue(true),
}));

vi.mock('expo-web-browser', () => ({
  openBrowserAsync: vi.fn(),
}));

// ============================================================
// 2. REACT NATIVE LIBRARIES
// ============================================================

vi.mock('react-native-reanimated', () => ({
  default: {
    createAnimatedComponent: (component: any) => component,
  },
  useSharedValue: vi.fn((init: any) => ({ value: init })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((val: any) => val),
  withSpring: vi.fn((val: any) => val),
  withDelay: vi.fn((_: number, val: any) => val),
  FadeIn: { duration: vi.fn().mockReturnThis() },
  FadeOut: { duration: vi.fn().mockReturnThis() },
  Layout: { duration: vi.fn().mockReturnThis() },
  runOnJS: vi.fn((fn: any) => fn),
  runOnUI: vi.fn((fn: any) => fn),
}));

vi.mock('react-native-gesture-handler', () => {
  const {
    View,
    TouchableOpacity,
    ScrollView,
    FlatList,
  } = require('react-native-web');
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    RawButton: TouchableOpacity,
    BaseButton: TouchableOpacity,
    RectButton: TouchableOpacity,
    BorderlessButton: TouchableOpacity,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Gesture: { Pan: vi.fn().mockReturnThis(), Tap: vi.fn().mockReturnThis() },
    GestureDetector: View,
    Directions: {},
  };
});

vi.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native-web');
  return {
    SafeAreaProvider: View,
    SafeAreaView: View,
    useSafeAreaInsets: vi.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
    useSafeAreaFrame: vi.fn(() => ({ x: 0, y: 0, width: 375, height: 812 })),
  };
});

vi.mock('react-native-screens', () => {
  const { View } = require('react-native-web');
  return {
    enableScreens: vi.fn(),
    Screen: View,
    ScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    NativeScreen: View,
    NativeScreenContainer: View,
  };
});

vi.mock('react-native-earl-gamepad/dist/useGamepad', () => ({
  default: vi.fn(() => ({
    pressedButtons: new Set(),
    isPressed: vi.fn(() => false),
    bridge: null,
  })),
}));

vi.mock('react-native-webview', () => {
  const { View } = require('react-native-web');
  return { default: View, WebView: View };
});

vi.mock('react-native-worklets/plugin', () => ({}));
vi.mock('react-native-worklets', () => ({
  createRunOnJS: vi.fn((fn: any) => fn),
  createRunOnUI: vi.fn((fn: any) => fn),
}));

// ============================================================
// 3. NATIVEWIND / GLUESTACK / NAVIGATION
// ============================================================

vi.mock('@gluestack-ui/core/overlay/creator', () => ({
  OverlayProvider: ({ children }: any) => children,
}));

vi.mock('@gluestack-ui/core/toast/creator', () => ({
  ToastProvider: ({ children }: any) => children,
}));

vi.mock('nativewind', () => ({
  useColorScheme: vi.fn(() => ({
    colorScheme: 'dark',
    setColorScheme: vi.fn(),
    toggleColorScheme: vi.fn(),
  })),
  styled: (component: any) => component,
  cssInterop: vi.fn(),
  remapProps: vi.fn(),
}));

vi.mock('react-native-css-interop', () => ({
  cssInterop: vi.fn(),
  remapProps: vi.fn(),
  createInteropElement: vi.fn(),
}));

vi.mock('@react-navigation/native', async () => {
  const actual = await vi.importActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: vi.fn(() => ({
      navigate: vi.fn(),
      goBack: vi.fn(),
      getState: vi.fn(() => ({ index: 0, routes: [] })),
      dispatch: vi.fn(),
      addListener: vi.fn(() => vi.fn()),
    })),
    useRoute: vi.fn(() => ({ key: 'test', name: 'test' })),
    useFocusEffect: vi.fn(),
    useIsFocused: vi.fn(() => true),
  };
});

vi.mock('@react-navigation/drawer', () => {
  const { View } = require('react-native-web');
  return {
    createDrawerNavigator: vi.fn(() => ({ Navigator: View, Screen: View })),
    DrawerActions: {
      openDrawer: vi.fn(),
      closeDrawer: vi.fn(),
      toggleDrawer: vi.fn(),
      jumpTo: vi.fn(),
    },
  };
});

// ============================================================
// 4. CLEANUP
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
});
