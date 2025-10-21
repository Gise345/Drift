import { create } from 'zustand';
import { CarpoolRequest, CarpoolTrip, RecentActivityItem, SavedRoute } from '@/src/types/carpool';

interface CarpoolState {
  // Current requests and trips
  activeRequest: CarpoolRequest | null;
  activeTrip: CarpoolTrip | null;

  // History
  recentActivity: RecentActivityItem[];
  savedRoutes: SavedRoute[];

  // Stats
  totalTrips: number;
  activeTripsCount: number;

  // Loading states
  isLoading: boolean;

  // Actions
  setActiveRequest: (request: CarpoolRequest | null) => void;
  setActiveTrip: (trip: CarpoolTrip | null) => void;
  setRecentActivity: (activity: RecentActivityItem[]) => void;
  addRecentActivity: (item: RecentActivityItem) => void;
  setSavedRoutes: (routes: SavedRoute[]) => void;
  addSavedRoute: (route: SavedRoute) => void;
  removeSavedRoute: (routeId: string) => void;
  updateStats: (totalTrips: number, activeTripsCount: number) => void;
  setLoading: (loading: boolean) => void;
  clearActiveRequest: () => void;
  clearActiveTrip: () => void;
  reset: () => void;
}

const initialState = {
  activeRequest: null,
  activeTrip: null,
  recentActivity: [],
  savedRoutes: [],
  totalTrips: 0,
  activeTripsCount: 0,
  isLoading: false,
};

/**
 * Zustand store for managing carpool-related state
 * Handles active requests, trips, activity history, and saved routes
 */
export const useCarpoolStore = create<CarpoolState>((set) => ({
  ...initialState,

  setActiveRequest: (request) => set({ activeRequest: request }),

  setActiveTrip: (trip) => set({ activeTrip: trip }),

  setRecentActivity: (activity) => set({ recentActivity: activity }),

  addRecentActivity: (item) =>
    set((state) => ({
      recentActivity: [item, ...state.recentActivity].slice(0, 10), // Keep only 10 most recent
    })),

  setSavedRoutes: (routes) => set({ savedRoutes: routes }),

  addSavedRoute: (route) =>
    set((state) => ({
      savedRoutes: [route, ...state.savedRoutes],
    })),

  removeSavedRoute: (routeId) =>
    set((state) => ({
      savedRoutes: state.savedRoutes.filter((r) => r.id !== routeId),
    })),

  updateStats: (totalTrips, activeTripsCount) =>
    set({ totalTrips, activeTripsCount }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearActiveRequest: () => set({ activeRequest: null }),

  clearActiveTrip: () => set({ activeTrip: null }),

  reset: () => set(initialState),
}));
