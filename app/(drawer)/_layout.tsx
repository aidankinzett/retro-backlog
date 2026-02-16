import { Drawer } from 'expo-router/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';

export default function DrawerLayout() {
  const { isLandscape } = useOrientation();
  const insets = useSafeAreaInsets();

  return (
    <Drawer
      screenOptions={{
        drawerType: isLandscape ? 'permanent' : 'front',
        drawerStyle: {
          backgroundColor: Colors.surface,
          width: isLandscape ? 200 : 260,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        drawerActiveTintColor: Colors.tint,
        drawerInactiveTintColor: Colors.textSecondary,
        headerShown: !isLandscape,
        sceneStyle: {
          backgroundColor: Colors.background,
          paddingTop: isLandscape ? insets.top : 0,
        },
      }}
    >
      <Drawer.Screen name="index" options={{ drawerLabel: 'Home', title: 'Home' }} />
      <Drawer.Screen name="browse" options={{ drawerLabel: 'Browse', title: 'Browse' }} />
      <Drawer.Screen name="backlog" options={{ drawerLabel: 'Backlog', title: 'Backlog' }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings', title: 'Settings' }} />
    </Drawer>
  );
}
