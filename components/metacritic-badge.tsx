import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { getMetacriticColor } from '@/constants/theme';

interface MetacriticBadgeProps {
  score: number | null;
  size?: 'sm' | 'lg';
}

export function MetacriticBadge({ score, size = 'sm' }: MetacriticBadgeProps) {
  const color = getMetacriticColor(score);
  const isLarge = size === 'lg';

  return (
    <Box
      className={`items-center justify-center rounded ${isLarge ? 'h-12 w-12' : 'h-7 w-7'}`}
      style={{ backgroundColor: color }}
    >
      <Text
        className={`font-bold text-typography-black ${isLarge ? 'text-lg' : 'text-xs'}`}
      >
        {score ?? '?'}
      </Text>
    </Box>
  );
}
