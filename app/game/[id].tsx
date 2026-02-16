import { useLocalSearchParams } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Box className="flex-1 items-center justify-center bg-background-dark">
      <Heading size="2xl" className="text-typography-white">Game Detail</Heading>
      <Text className="text-typography-gray mt-2">Game ID: {id}</Text>
    </Box>
  );
}
