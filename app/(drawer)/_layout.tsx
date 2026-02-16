import { Drawer } from 'expo-router/drawer';
import { useOrientation } from '@/hooks/use-orientation';
import { Colors } from '@/constants/theme';

export default function DrawerLayout() {
  const { isLandscape } = useOrientation();

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
