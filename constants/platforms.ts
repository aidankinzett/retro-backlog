export interface Platform {
  id: string;
  rawgId: number;
  name: string;
  shortName: string;
  accent: string;
  manufacturer: 'sony' | 'nintendo' | 'sega';
}

export const PLATFORMS: Platform[] = [
  { id: 'ps2', rawgId: 15, name: 'PlayStation 2', shortName: 'PS2', accent: '#003791', manufacturer: 'sony' },
  { id: 'ps1', rawgId: 27, name: 'PlayStation', shortName: 'PS1', accent: '#003791', manufacturer: 'sony' },
  { id: 'gamecube', rawgId: 105, name: 'GameCube', shortName: 'GCN', accent: '#6A0DAD', manufacturer: 'nintendo' },
  { id: 'n64', rawgId: 83, name: 'Nintendo 64', shortName: 'N64', accent: '#E60012', manufacturer: 'nintendo' },
  { id: 'snes', rawgId: 79, name: 'Super Nintendo', shortName: 'SNES', accent: '#E60012', manufacturer: 'nintendo' },
  { id: 'nes', rawgId: 49, name: 'Nintendo Entertainment System', shortName: 'NES', accent: '#E60012', manufacturer: 'nintendo' },
  { id: 'gba', rawgId: 24, name: 'Game Boy Advance', shortName: 'GBA', accent: '#E60012', manufacturer: 'nintendo' },
  { id: 'megadrive', rawgId: 167, name: 'Mega Drive / Genesis', shortName: 'MD', accent: '#0060A8', manufacturer: 'sega' },
  { id: 'saturn', rawgId: 107, name: 'Sega Saturn', shortName: 'SAT', accent: '#0060A8', manufacturer: 'sega' },
  { id: 'dreamcast', rawgId: 106, name: 'Sega Dreamcast', shortName: 'DC', accent: '#0060A8', manufacturer: 'sega' },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

export function getPlatformAccent(platformId: string): string {
  return PLATFORM_MAP[platformId]?.accent ?? '#6366f1';
}
