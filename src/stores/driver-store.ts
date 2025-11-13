import { create } from 'zustand';

/**
 * DRIVER STORE
 * 
 * Central state management for driver app
 * Handles registration, online status, rides, earnings
 */

// ===== TYPES =====

export interface Driver {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  rating: number;
  totalTrips: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: Date;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
  photos: {
    front?: string;
    back?: string;
    leftSide?: string;
    rightSide?: string;
    interior?: string;
  };
}

export interface Document {
  id: string;
  type: 'license' | 'insurance' | 'registration' | 'inspection';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  frontImageUrl?: string;
  backImageUrl?: string;
  expiryDate?: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface DriverRegistration {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  vehicle: Vehicle;
  documents: {
    license?: { front: string; back: string };
    insurance?: { image: string };
    registration?: { image: string };
    inspection?: { image: string };
  };
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
  backgroundCheck: {
    consented: boolean;
    consentedAt?: Date;
    status?: 'pending' | 'cleared' | 'failed';
  };
}

export interface RideRequest {
  id: string;
  riderId: string;
  riderName: string;
  riderPhoto?: string;
  riderRating: number;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  stops?: Array<{
    lat: number;
    lng: number;
    address: string;
  }>;
  distance: number;
  estimatedDuration: number;
  estimatedEarnings: number;
  requestedAt: Date;
  expiresAt: Date;
  riderTrips?: number;
  passengers?: number;
  notes?: string;
}

export interface ActiveRide extends RideRequest {
  status: 'accepted' | 'navigating_to_pickup' | 'arrived' | 'started' | 'in_progress' | 'completed';
  acceptedAt: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  actualEarnings?: number;
  tip?: number;
  route?: {
    polyline: string;
    distance: number;
    duration: number;
  };
}

export interface Earnings {
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  allTime: number;
}

export interface DriverStats {
  totalTrips: number;
  acceptanceRate: number;
  cancellationRate: number;
  rating: number;
  totalRatings: number;
  onlineHours: number;
  totalDistance: number;
}

// ===== STORE =====

interface DriverStore {
  // Driver profile
  driver: Driver | null;
  vehicle: Vehicle | null;
  documents: Document[];
  
  // Registration flow
  registrationStep: number;
  registrationData: Partial<DriverRegistration>;
  isRegistrationComplete: boolean;
  registrationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
  
  // Online status
  isOnline: boolean;
  lastOnlineAt: Date | null;
  
  // Active session
  activeRide: ActiveRide | null;
  incomingRequests: RideRequest[];
  rideHistory: ActiveRide[];
  
  // Earnings & Stats
  earnings: Earnings;
  stats: DriverStats;
  balance: number;
  todayEarnings: number;
  todayTrips: number;
  
  // Location
  currentLocation: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
  } | null;
  
  // Actions - Registration
  setRegistrationStep: (step: number) => void;
  updateRegistrationData: (data: Partial<DriverRegistration>) => void;
  submitRegistration: () => Promise<void>;
  setRegistrationStatus: (status: 'incomplete' | 'pending' | 'approved' | 'rejected') => void;
  
  // Actions - Profile
  setDriver: (driver: Driver) => void;
  updateDriver: (updates: Partial<Driver>) => void;
  setVehicle: (vehicle: Vehicle) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  
  // Actions - Online Status
  toggleOnline: () => void;
  goOnline: () => void;
  goOffline: () => void;
  
  // Actions - Requests
  addIncomingRequest: (request: RideRequest) => void;
  removeIncomingRequest: (requestId: string) => void;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string, reason: string) => Promise<void>;
  
  // Actions - Active Ride
  setActiveRide: (ride: ActiveRide) => void;
  updateRideStatus: (status: ActiveRide['status']) => void;
  startNavigation: () => void;
  arrivedAtPickup: () => void;
  startRide: () => void;
  addStop: (stop: { lat: number; lng: number; address: string }) => void;
  completeRide: (earnings: number, tip?: number) => Promise<void>;
  
  // Actions - Location
  updateLocation: (location: { lat: number; lng: number; heading: number; speed: number }) => void;
  
  // Actions - Earnings
  refreshEarnings: () => Promise<void>;
  requestPayout: (amount: number) => Promise<void>;
  setTodayEarnings: (earnings: number) => void;
  setTodayTrips: (trips: number) => void;
  
  // Reset
  resetStore: () => void;
}

export const useDriverStore = create<DriverStore>((set, get) => ({
  // Initial state
  driver: null,
  vehicle: null,
  documents: [],
  registrationStep: 0,
  registrationData: {},
  isRegistrationComplete: false,
  registrationStatus: 'incomplete',
  isOnline: false,
  lastOnlineAt: null,
  activeRide: null,
  incomingRequests: [],
  rideHistory: [],
  earnings: {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    allTime: 0,
  },
  stats: {
    totalTrips: 0,
    acceptanceRate: 0,
    cancellationRate: 0,
    rating: 5.0,
    totalRatings: 0,
    onlineHours: 0,
    totalDistance: 0,
  },
  balance: 0,
  todayEarnings: 125.50, // Default mock data
  todayTrips: 8,
  currentLocation: null,
  
  // Registration actions
  setRegistrationStep: (step) => set({ registrationStep: step }),
  
  updateRegistrationData: (data) => set((state) => ({
    registrationData: { ...state.registrationData, ...data }
  })),
  
  submitRegistration: async () => {
    // TODO: Submit to Firebase
    console.log('Submitting registration:', get().registrationData);
    set({ isRegistrationComplete: true, registrationStatus: 'pending' });
  },
  
  setRegistrationStatus: (status) => set({ registrationStatus: status }),
  
  // Profile actions
  setDriver: (driver) => set({ driver }),
  
  updateDriver: (updates) => set((state) => ({
    driver: state.driver ? { ...state.driver, ...updates } : null
  })),
  
  setVehicle: (vehicle) => set({ vehicle }),
  
  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document]
  })),
  
  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map(doc =>
      doc.id === id ? { ...doc, ...updates } : doc
    )
  })),
  
  // Online status actions
  toggleOnline: () => set((state) => ({
    isOnline: !state.isOnline,
    lastOnlineAt: state.isOnline ? new Date() : state.lastOnlineAt
  })),
  
  goOnline: () => set({ isOnline: true }),
  
  goOffline: () => set({ 
    isOnline: false,
    lastOnlineAt: new Date()
  }),
  
  // Request actions
  addIncomingRequest: (request) => set((state) => ({
    incomingRequests: [...state.incomingRequests, request]
  })),
  
  removeIncomingRequest: (requestId) => set((state) => ({
    incomingRequests: state.incomingRequests.filter(r => r.id !== requestId)
  })),
  
  acceptRequest: async (requestId) => {
    const request = get().incomingRequests.find(r => r.id === requestId);
    if (request) {
      const activeRide: ActiveRide = {
        ...request,
        status: 'accepted',
        acceptedAt: new Date(),
      };
      set({
        activeRide,
        incomingRequests: get().incomingRequests.filter(r => r.id !== requestId)
      });
      
      // TODO: Update Firebase
      console.log('Accepted request:', requestId);
    }
  },
  
  declineRequest: async (requestId, reason) => {
    set((state) => ({
      incomingRequests: state.incomingRequests.filter(r => r.id !== requestId)
    }));
    
    // TODO: Update Firebase with decline reason
    console.log('Declined request:', requestId, 'Reason:', reason);
  },
  
  // Active ride actions
  setActiveRide: (ride) => set({ activeRide: ride }),
  
  updateRideStatus: (status) => set((state) => ({
    activeRide: state.activeRide ? { ...state.activeRide, status } : null
  })),
  
  startNavigation: () => set((state) => ({
    activeRide: state.activeRide ? {
      ...state.activeRide,
      status: 'navigating_to_pickup'
    } : null
  })),
  
  arrivedAtPickup: () => set((state) => ({
    activeRide: state.activeRide ? {
      ...state.activeRide,
      status: 'arrived',
      arrivedAt: new Date()
    } : null
  })),
  
  startRide: () => set((state) => ({
    activeRide: state.activeRide ? {
      ...state.activeRide,
      status: 'started',
      startedAt: new Date()
    } : null
  })),
  
  addStop: (stop) => set((state) => ({
    activeRide: state.activeRide ? {
      ...state.activeRide,
      stops: [...(state.activeRide.stops || []), stop]
    } : null
  })),
  
  completeRide: async (earnings, tip = 0) => {
    const ride = get().activeRide;
    if (ride) {
      const completedRide: ActiveRide = {
        ...ride,
        status: 'completed',
        completedAt: new Date(),
        actualEarnings: earnings,
        tip,
      };
      
      set((state) => ({
        activeRide: null,
        rideHistory: [completedRide, ...state.rideHistory],
        earnings: {
          ...state.earnings,
          today: state.earnings.today + earnings + tip,
          thisWeek: state.earnings.thisWeek + earnings + tip,
          thisMonth: state.earnings.thisMonth + earnings + tip,
          allTime: state.earnings.allTime + earnings + tip,
        },
        balance: state.balance + earnings + tip,
        todayEarnings: state.todayEarnings + earnings + tip,
        todayTrips: state.todayTrips + 1,
        stats: {
          ...state.stats,
          totalTrips: state.stats.totalTrips + 1,
        }
      }));
      
      // TODO: Update Firebase
      console.log('Completed ride:', completedRide);
    }
  },
  
  // Location actions
  updateLocation: (location) => set({ currentLocation: location }),
  
  // Earnings actions
  refreshEarnings: async () => {
    // TODO: Fetch from Firebase
    console.log('Refreshing earnings...');
  },
  
  requestPayout: async (amount) => {
    // TODO: Process payout request
    console.log('Requesting payout:', amount);
    set((state) => ({
      balance: state.balance - amount
    }));
  },
  
  setTodayEarnings: (earnings) => set({ todayEarnings: earnings }),
  
  setTodayTrips: (trips) => set({ todayTrips: trips }),
  
  // Reset
  resetStore: () => set({
    driver: null,
    vehicle: null,
    documents: [],
    registrationStep: 0,
    registrationData: {},
    isRegistrationComplete: false,
    registrationStatus: 'incomplete',
    isOnline: false,
    lastOnlineAt: null,
    activeRide: null,
    incomingRequests: [],
    rideHistory: [],
    balance: 0,
    todayEarnings: 0,
    todayTrips: 0,
    currentLocation: null,
  }),
}));