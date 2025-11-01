import { create } from 'zustand';
import { CarpoolRequest, CarpoolTrip, RecentActivityItem, SavedRoute, Location } from '@/src/types/carpool';

interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polylinePoints: Array<{ latitude: number; longitude: number }>;
  origin?: Location;
  destination?: Location;
  stops?: Location[]; // Support for multi-stop routes
}

interface EstimatedCost {
  min: number;
  max: number;
  currency: string;
}

interface CarpoolState {
  // Current requests and trips
  activeRequest: CarpoolRequest | null;
  activeTrip: CarpoolTrip | null;

  // Booking flow state
  pickupLocation: Location | null;
  destination: Location | null;
  stops: Location[]; // Multi-stop support (max 2 stops)
  route: RouteInfo | null;
  vehicleType: string | null;
  estimatedCost: EstimatedCost | null;
  selectedPaymentMethod: string | null;

  // History
  recentActivity: RecentActivityItem[];
  savedRoutes: SavedRoute[];

  // Stats
  totalTrips: number;
  activeTripsCount: number;

  // Loading states
  isLoading: boolean;

  // Actions - Booking Flow
  setPickupLocation: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
  setStops: (stops: Location[]) => void;
  addStop: (stop: Location) => void;
  removeStop: (index: number) => void;
  setRoute: (route: RouteInfo | null) => void;
  setVehicleType: (vehicleType: string | null) => void;
  setEstimatedCost: (cost: EstimatedCost | null) => void;
  setSelectedPaymentMethod: (method: string | null) => void;
  clearBookingFlow: () => void;

  // Actions - Requests & Trips
  setActiveRequest: (request: CarpoolRequest | null) => void;
  setActiveTrip: (trip: CarpoolTrip | null) => void;
  
  // Actions - History
  setRecentActivity: (activity: RecentActivityItem[]) => void;
  addRecentActivity: (item: RecentActivityItem) => void;
  setSavedRoutes: (routes: SavedRoute[]) => void;
  addSavedRoute: (route: SavedRoute) => void;
  removeSavedRoute: (routeId: string) => void;
  
  // Actions - Stats
  updateStats: (totalTrips: number, activeTripsCount: number) => void;
  setLoading: (loading: boolean) => void;
  
  // Actions - Clear
  clearActiveRequest: () => void;
  clearActiveTrip: () => void;
  reset: () => void;
}

const initialState = {
  activeRequest: null,
  activeTrip: null,
  pickupLocation: null,
  destination: null,
  stops: [],
  route: null,
  vehicleType: null,
  estimatedCost: null,
  selectedPaymentMethod: null,
  recentActivity: [],
  savedRoutes: [],
  totalTrips: 0,
  activeTripsCount: 0,
  isLoading: false,
};

/**
 * Zustand store for managing carpool-related state
 * Handles active requests, trips, booking flow, activity history, and saved routes
 * NOW WITH MULTI-STOP SUPPORT (up to 2 additional stops)
 */
export const useCarpoolStore = create<CarpoolState>((set) => ({
  ...initialState,

  // Booking Flow Actions
  setPickupLocation: (location) => set({ pickupLocation: location }),
  
  setDestination: (location) => set({ destination: location }),
  
  setStops: (stops) => set({ stops: stops.slice(0, 2) }), // Max 2 stops
  
  addStop: (stop) => set((state) => {
    if (state.stops.length < 2) {
      return { stops: [...state.stops, stop] };
    }
    return state;
  }),
  
  removeStop: (index) => set((state) => ({
    stops: state.stops.filter((_, i) => i !== index)
  })),
  
  setRoute: (route) => set({ route }),
  
  setVehicleType: (vehicleType) => set({ vehicleType }),
  
  setEstimatedCost: (cost) => set({ estimatedCost: cost }),
  
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  
  clearBookingFlow: () => set({
    pickupLocation: null,
    destination: null,
    stops: [],
    route: null,
    vehicleType: null,
    estimatedCost: null,
    selectedPaymentMethod: null,
  }),

  // Request & Trip Actions
  setActiveRequest: (request) => set({ activeRequest: request }),

  setActiveTrip: (trip) => set({ activeTrip: trip }),

  // History Actions
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

  // Stats Actions
  updateStats: (totalTrips, activeTripsCount) =>
    set({ totalTrips, activeTripsCount }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Clear Actions
  clearActiveRequest: () => set({ activeRequest: null }),

  clearActiveTrip: () => set({ activeTrip: null }),

  reset: () => set(initialState),
}));