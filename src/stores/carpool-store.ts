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

// ============================================================================
// PRICING TYPES - Zone-Based Pricing System
// ============================================================================

export interface PricingBreakdown {
  baseZoneFee?: number;
  distanceCost?: number;
  timeCost?: number;
  flatRate?: number;
  timeMultiplier?: number;
  timeMultiplierName?: string;
}

export interface PricingResult {
  pickupZoneId: string;
  pickupZoneName: string;
  destinationZoneId: string;
  destinationZoneName: string;
  isWithinZone: boolean;
  isAirportTrip: boolean;
  breakdown: PricingBreakdown;
  suggestedContribution: number;
  minContribution: number;
  maxContribution: number;
  displayText: string;
  calculatedAt: Date;
}

export interface ZoneInfo {
  pickupZone: {
    id: string;
    name: string;
    displayName: string;
  } | null;
  destinationZone: {
    id: string;
    name: string;
    displayName: string;
  } | null;
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
  womenOnlyRide: boolean; // Women-only ride preference

  // ============================================================================
  // PRICING STATE - Zone-Based Pricing
  // ============================================================================
  pricing: PricingResult | null; // Full pricing calculation result
  zoneInfo: ZoneInfo | null; // Zone information for pickup and destination
  lockedContribution: number | null; // Amount locked when request is created (CANNOT CHANGE)

  // History
  recentActivity: RecentActivityItem[];
  savedRoutes: SavedRoute[];

  // Stats
  totalTrips: number;
  activeTripsCount: number;

  // Loading states
  isLoading: boolean;
  isPricingCalculating: boolean;

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
  setWomenOnlyRide: (enabled: boolean) => void;
  clearBookingFlow: () => void;

  // ============================================================================
  // PRICING ACTIONS - Zone-Based Pricing
  // ============================================================================
  setPricing: (pricing: PricingResult | null) => void;
  setZoneInfo: (zoneInfo: ZoneInfo | null) => void;
  lockContribution: (amount: number) => void;
  clearPricing: () => void;
  setPricingCalculating: (calculating: boolean) => void;

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
  womenOnlyRide: false,

  // Pricing initial state
  pricing: null,
  zoneInfo: null,
  lockedContribution: null,

  recentActivity: [],
  savedRoutes: [],
  totalTrips: 0,
  activeTripsCount: 0,
  isLoading: false,
  isPricingCalculating: false,
};

/**
 * Zustand store for managing carpool-related state
 * Handles active requests, trips, booking flow, activity history, and saved routes
 * NOW WITH MULTI-STOP SUPPORT (up to 2 additional stops)
 * NOW WITH ZONE-BASED PRICING SYSTEM
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

  setWomenOnlyRide: (enabled) => set({ womenOnlyRide: enabled }),

  clearBookingFlow: () => set({
    pickupLocation: null,
    destination: null,
    stops: [],
    route: null,
    vehicleType: null,
    estimatedCost: null,
    selectedPaymentMethod: null,
    womenOnlyRide: false,
    pricing: null,
    zoneInfo: null,
    lockedContribution: null,
  }),

  // ============================================================================
  // PRICING ACTIONS - Zone-Based Pricing
  // ============================================================================
  
  setPricing: (pricing) => set({ pricing }),
  
  setZoneInfo: (zoneInfo) => set({ zoneInfo }),
  
  lockContribution: (amount) => {
    console.log('🔒 Locking contribution amount:', amount);
    set({ lockedContribution: amount });
  },
  
  clearPricing: () => set({ 
    pricing: null, 
    zoneInfo: null, 
    lockedContribution: null 
  }),
  
  setPricingCalculating: (calculating) => set({ isPricingCalculating: calculating }),

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