import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore, BACKLOG_STATUSES } from '@/stores/ui';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      searchQuery: '',
      browsePlatformFilter: null,
      browseOrdering: '-metacritic',
      backlogStatusFilter: null,
      backlogPlatformFilter: null,
      accentOverride: null,
    });
  });

  it('has correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.searchQuery).toBe('');
    expect(state.browsePlatformFilter).toBeNull();
    expect(state.browseOrdering).toBe('-metacritic');
    expect(state.backlogStatusFilter).toBeNull();
    expect(state.backlogPlatformFilter).toBeNull();
    expect(state.accentOverride).toBeNull();
  });

  it('updates search query', () => {
    useUIStore.getState().setSearchQuery('zelda');
    expect(useUIStore.getState().searchQuery).toBe('zelda');
  });

  it('updates browse platform filter', () => {
    useUIStore.getState().setBrowsePlatformFilter(15);
    expect(useUIStore.getState().browsePlatformFilter).toBe(15);
  });

  it('clears browse platform filter', () => {
    useUIStore.getState().setBrowsePlatformFilter(15);
    useUIStore.getState().setBrowsePlatformFilter(null);
    expect(useUIStore.getState().browsePlatformFilter).toBeNull();
  });

  it('updates browse ordering', () => {
    useUIStore.getState().setBrowseOrdering('-rating');
    expect(useUIStore.getState().browseOrdering).toBe('-rating');
  });

  it('updates backlog status filter', () => {
    useUIStore.getState().setBacklogStatusFilter('playing');
    expect(useUIStore.getState().backlogStatusFilter).toBe('playing');
  });

  it('updates backlog platform filter', () => {
    useUIStore.getState().setBacklogPlatformFilter('ps2');
    expect(useUIStore.getState().backlogPlatformFilter).toBe('ps2');
  });

  it('clears backlog platform filter', () => {
    useUIStore.getState().setBacklogPlatformFilter('ps2');
    useUIStore.getState().setBacklogPlatformFilter(null);
    expect(useUIStore.getState().backlogPlatformFilter).toBeNull();
  });

  it('updates accent override', () => {
    useUIStore.getState().setAccentOverride('#ff0000');
    expect(useUIStore.getState().accentOverride).toBe('#ff0000');
  });

  it('clears accent override', () => {
    useUIStore.getState().setAccentOverride('#ff0000');
    useUIStore.getState().setAccentOverride(null);
    expect(useUIStore.getState().accentOverride).toBeNull();
  });
});

describe('BACKLOG_STATUSES', () => {
  it('has 4 statuses', () => {
    expect(BACKLOG_STATUSES).toHaveLength(4);
  });

  it('each status has value, label, and shortLabel', () => {
    for (const s of BACKLOG_STATUSES) {
      expect(s.value).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.shortLabel).toBeTruthy();
    }
  });
});
