import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <HStack className="items-center gap-2">
        <Heading size="3xl">Welcome!</Heading>
        <HelloWave />
      </HStack>
      <Box className="gap-2 mb-2">
        <Heading size="lg">Step 1: Try it</Heading>
        <Text size="md">
          Edit <Text size="md" bold>app/(tabs)/index.tsx</Text> to see changes.
          Press{' '}
          <Text size="md" bold>
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </Text>{' '}
          to open developer tools.
        </Text>
      </Box>
      <Box className="gap-2 mb-2">
        <Link href="/modal">
          <Link.Trigger>
            <Heading size="lg">Step 2: Explore</Heading>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <Text size="md">
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </Text>
      </Box>
      <Box className="gap-2 mb-2">
        <Heading size="lg">Step 3: Get a fresh start</Heading>
        <Text size="md">
          {`When you're ready, run `}
          <Text size="md" bold>npm run reset-project</Text> to get a fresh{' '}
          <Text size="md" bold>app</Text> directory. This will move the current{' '}
          <Text size="md" bold>app</Text> to{' '}
          <Text size="md" bold>app-example</Text>.
        </Text>
      </Box>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
