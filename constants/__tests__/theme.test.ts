import { describe, it, expect } from 'vitest';
import { getMetacriticColor, MetacriticColors } from '@/constants/theme';

describe('getMetacriticColor', () => {
  it('returns green for scores >= 75', () => {
    expect(getMetacriticColor(75)).toBe(MetacriticColors.green);
    expect(getMetacriticColor(100)).toBe(MetacriticColors.green);
  });

  it('returns yellow for scores 50-74', () => {
    expect(getMetacriticColor(50)).toBe(MetacriticColors.yellow);
    expect(getMetacriticColor(74)).toBe(MetacriticColors.yellow);
  });

  it('returns red for scores < 50', () => {
    expect(getMetacriticColor(49)).toBe(MetacriticColors.red);
    expect(getMetacriticColor(0)).toBe(MetacriticColors.red);
  });

  it('returns grey for null', () => {
    expect(getMetacriticColor(null)).toBe(MetacriticColors.grey);
  });
});
