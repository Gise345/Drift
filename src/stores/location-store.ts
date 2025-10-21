import { create } from 'zustand';
import { Location } from '@/src/types/carpool';

interface LocationState {
  // Current location
  currentLocation: Location | null;

  // Location permissions
  hasLocationPermission: boolean;
  isLocationEnabled: boolean;

  // Loading states
  isLoadingLocation: boolean;

  // Actions
  setCurrentLocation: (location: Location | null) => void;
  setLocationPermission: (hasPermission: boolean) => void;
  setLocationEnabled: (isEnabled: boolean) => void;
  setLoadingLocation: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentLocation: null,
  hasLocationPermission: false,
  isLocationEnabled: false,
  isLoadingLocation: false,
};

/**
 * Zustand store for managing location-related state
 * Handles current location, permissions, and loading states
 */
export const useLocationStore = create<LocationState>((set) => ({
  ...initialState,

  setCurrentLocation: (location) => set({ currentLocation: location }),

  setLocationPermission: (hasPermission) => set({ hasLocationPermission: hasPermission }),

  setLocationEnabled: (isEnabled) => set({ isLocationEnabled: isEnabled }),

  setLoadingLocation: (loading) => set({ isLoadingLocation: loading }),

  reset: () => set(initialState),
}));
