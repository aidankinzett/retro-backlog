import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <HStack className="gap-2">
        <Heading
          size="3xl"
          className="font-heading"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Explore
        </Heading>
      </HStack>
      <Text size="md">This app includes example code to help you get started.</Text>
      <Collapsible title="File-based routing">
        <Text size="md">
          This app has two screens:{' '}
          <Text size="md" bold>app/(tabs)/index.tsx</Text> and{' '}
          <Text size="md" bold>app/(tabs)/explore.tsx</Text>
        </Text>
        <Text size="md">
          The layout file in <Text size="md" bold>app/(tabs)/_layout.tsx</Text>{' '}
          sets up the tab navigator.
        </Text>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <Text size="md" className="text-info-700 leading-[30px]">Learn more</Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <Text size="md">
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <Text size="md" bold>w</Text> in the terminal running this project.
        </Text>
      </Collapsible>
      <Collapsible title="Images">
        <Text size="md">
          For static images, you can use the <Text size="md" bold>@2x</Text> and{' '}
          <Text size="md" bold>@3x</Text> suffixes to provide files for
          different screen densities
        </Text>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <Text size="md" className="text-info-700 leading-[30px]">Learn more</Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <Text size="md">
          This template has light and dark mode support. The{' '}
          <Text size="md" bold>useColorScheme()</Text> hook lets you inspect
          what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
        </Text>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <Text size="md" className="text-info-700 leading-[30px]">Learn more</Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <Text size="md">
          This template includes an example of an animated component. The{' '}
          <Text size="md" bold>components/HelloWave.tsx</Text> component uses
          the powerful{' '}
          <Text size="md" bold style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </Text>{' '}
          library to create a waving hand animation.
        </Text>
        {Platform.select({
          ios: (
            <Text size="md">
              The <Text size="md" bold>components/ParallaxScrollView.tsx</Text>{' '}
              component provides a parallax effect for the header image.
            </Text>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
});
