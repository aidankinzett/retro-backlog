import { Link } from 'expo-router';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';

export default function ModalScreen() {
  return (
    <Box className="flex-1 items-center justify-center p-5 bg-background-0">
      <Heading size="3xl">This is a modal</Heading>
      <Link href="/" dismissTo className="mt-4 py-4">
        <Text size="md" className="text-info-700 leading-[30px]">Go to home screen</Text>
      </Link>
    </Box>
  );
}
