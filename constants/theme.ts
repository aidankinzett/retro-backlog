export const Colors = {
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceLight: '#252540',
  text: '#e4e4e7',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  border: '#2e2e4a',
  tint: '#6366f1',
};

export const MetacriticColors = {
  green: '#6dc849',
  yellow: '#fdca52',
  red: '#fc4e4e',
  grey: '#71717a',
} as const;

export function getMetacriticColor(score: number | null): string {
  if (score === null || score === undefined) return MetacriticColors.grey;
  if (score >= 75) return MetacriticColors.green;
  if (score >= 50) return MetacriticColors.yellow;
  return MetacriticColors.red;
}
