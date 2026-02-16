import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function BacklogScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background-dark">
      <Heading size="2xl" className="text-typography-white">Backlog</Heading>
      <Text className="text-typography-gray mt-2">Your game tracking list</Text>
    </Box>
  );
}
