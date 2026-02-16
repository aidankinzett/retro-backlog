import { useWindowDimensions } from 'react-native';

export type Orientation = 'landscape' | 'portrait';

export function useOrientation(): {
  orientation: Orientation;
  isLandscape: boolean;
  columns: number;
} {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  return {
    orientation: isLandscape ? 'landscape' : 'portrait',
    isLandscape,
    columns: isLandscape ? 4 : 2,
  };
}
