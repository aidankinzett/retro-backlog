import { create } from 'zustand';
import type { RawgGame } from '@/services/rawg';

export type BacklogStatus = 'none' | 'want_to_play' | 'playing' | 'completed' | 'dropped';

export const BACKLOG_STATUSES: { value: BacklogStatus; label: string; shortLabel: string }[] = [
  { value: 'want_to_play', label: 'Want to Play', shortLabel: 'Wishlist' },
  { value: 'playing', label: 'Playing', shortLabel: 'Playing' },
  { value: 'completed', label: 'Completed', shortLabel: 'Done' },
  { value: 'dropped', label: 'Dropped', shortLabel: 'Dropped' },
];

interface UIState {
  // Home screen
  currentSystemId: string;
  setCurrentSystemId: (id: string) => void;

  // Browse screen
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: RawgGame[];
  setSearchResults: (results: RawgGame[]) => void;
  browsePlatformFilter: number | null;
  setBrowsePlatformFilter: (id: number | null) => void;
  browseOrdering: string;
  setBrowseOrdering: (ordering: string) => void;

  // Backlog screen
  backlogStatusFilter: BacklogStatus | null;
  setBacklogStatusFilter: (status: BacklogStatus | null) => void;
  backlogPlatformFilter: string | null;
  setBacklogPlatformFilter: (platform: string | null) => void;

  // Loading
  loading: Record<string, boolean>;
  setLoading: (key: string, value: boolean) => void;

  // Accent color override
  accentOverride: string | null;
  setAccentOverride: (color: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  // Home
  currentSystemId: 'ps2',
  setCurrentSystemId: (id) => set({ currentSystemId: id }),

  // Browse
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  browsePlatformFilter: null,
  setBrowsePlatformFilter: (id) => set({ browsePlatformFilter: id }),
  browseOrdering: '-metacritic',
  setBrowseOrdering: (ordering) => set({ browseOrdering: ordering }),

  // Backlog
  backlogStatusFilter: null,
  setBacklogStatusFilter: (status) => set({ backlogStatusFilter: status }),
  backlogPlatformFilter: null,
  setBacklogPlatformFilter: (platform) => set({ backlogPlatformFilter: platform }),

  // Loading
  loading: {},
  setLoading: (key, value) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } })),

  // Accent
  accentOverride: null,
  setAccentOverride: (color) => set({ accentOverride: color }),
}));
