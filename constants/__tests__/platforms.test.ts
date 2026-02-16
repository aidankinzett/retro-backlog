import { describe, it, expect } from 'vitest';
import { PLATFORMS, PLATFORM_MAP, getPlatformAccent } from '@/constants/platforms';

describe('platforms', () => {
  it('has 10 platforms defined', () => {
    expect(PLATFORMS).toHaveLength(10);
  });

  it('maps all platforms by id', () => {
    for (const p of PLATFORMS) {
      expect(PLATFORM_MAP[p.id]).toBe(p);
    }
  });

  it('returns correct accent for known platforms', () => {
    expect(getPlatformAccent('ps2')).toBe('#003791');
    expect(getPlatformAccent('n64')).toBe('#E60012');
    expect(getPlatformAccent('dreamcast')).toBe('#0060A8');
  });

  it('returns default accent for unknown platform', () => {
    expect(getPlatformAccent('unknown')).toBe('#6366f1');
  });

  it('each platform has required fields', () => {
    for (const p of PLATFORMS) {
      expect(p.id).toBeTruthy();
      expect(p.rawgId).toBeGreaterThan(0);
      expect(p.name).toBeTruthy();
      expect(p.shortName).toBeTruthy();
      expect(p.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(['sony', 'nintendo', 'sega']).toContain(p.manufacturer);
    }
  });
});
