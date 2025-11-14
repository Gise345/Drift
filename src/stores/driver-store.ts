import { create } from 'zustand';
import {
  listenForRideRequests,
  acceptRideRequest as acceptRideService,
  declineRideRequest as declineRideService,
  RideRequest as FirebaseRideRequest,
} from '../services/ride-request.service';
import { useTripStore } from './trip-store';

/**
 * DRIVER STORE - Production Mode
 *
 * Central state management for driver app
 * Connected to Firebase for real-time ride requests
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
  vin: string;
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

  // Real-time listeners
  rideRequestListener: (() => void) | null;

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
  startListeningForRequests: () => void;
  stopListeningForRequests: () => void;
  
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

  // Actions - Profile Loading
  loadDriverProfile: (userId: string) => Promise<boolean>;

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
  todayEarnings: 0, // No more mock data - will load from Firebase
  todayTrips: 0,
  currentLocation: null,
  rideRequestListener: null,
  
  // Registration actions
  setRegistrationStep: (step) => set({ registrationStep: step }),
  
  updateRegistrationData: (data) => set((state) => ({
    registrationData: {
      ...state.registrationData,
      ...data,
      // Deep merge for nested documents object
      documents: data.documents
        ? {
            ...state.registrationData.documents,
            ...data.documents,
          }
        : state.registrationData.documents,
    }
  })),
  
  submitRegistration: async () => {
    const { submitDriverRegistration } = require('../services/driver-registration.service');

    try {
      const registrationData = get().registrationData as DriverRegistration;

      console.log('🔍 Validating registration data:', {
        hasPersonalInfo: !!registrationData.personalInfo,
        hasVehicle: !!registrationData.vehicle,
        hasDocuments: !!registrationData.documents,
        hasLicense: !!registrationData.documents?.license,
        hasInsurance: !!registrationData.documents?.insurance,
        hasRegistration: !!registrationData.documents?.registration,
        hasBackgroundCheck: !!registrationData.backgroundCheck,
      });

      // Validate required fields
      if (!registrationData.personalInfo?.firstName || !registrationData.personalInfo?.lastName) {
        throw new Error('Personal information is incomplete');
      }
      if (!registrationData.vehicle?.make || !registrationData.vehicle?.model) {
        throw new Error('Vehicle information is incomplete');
      }
      if (!registrationData.documents?.license?.front || !registrationData.documents?.license?.back) {
        throw new Error('Driver\'s license (both front and back) is required');
      }
      if (!registrationData.documents?.insurance?.image) {
        throw new Error('Vehicle insurance is required');
      }
      if (!registrationData.documents?.registration?.image) {
        throw new Error('Vehicle registration is required');
      }
      if (!registrationData.backgroundCheck?.consented) {
        throw new Error('Background check consent is required');
      }

      console.log('📝 Submitting driver registration to Firebase...');

      // Submit to Firebase
      await submitDriverRegistration(registrationData);

      set({
        isRegistrationComplete: true,
        registrationStatus: 'pending'
      });

      console.log('✅ Registration submitted successfully');
    } catch (error: any) {
      console.error('❌ Error submitting registration:', error);
      throw error;
    }
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
  toggleOnline: () => {
    const state = get();
    if (state.isOnline) {
      get().goOffline();
    } else {
      get().goOnline();
    }
  },

  goOnline: () => {
    set({ isOnline: true });
    get().startListeningForRequests();
    console.log('🟢 Driver went online - listening for ride requests');
  },

  goOffline: () => {
    set({ isOnline: false, lastOnlineAt: new Date() });
    get().stopListeningForRequests();
    console.log('🔴 Driver went offline - stopped listening for requests');
  },

  startListeningForRequests: () => {
    const state = get();

    // Don't start if already listening or if no location
    if (state.rideRequestListener || !state.currentLocation) {
      console.log('⚠️ Cannot start listening:', {
        hasListener: !!state.rideRequestListener,
        hasLocation: !!state.currentLocation,
      });
      return;
    }

    // Start listening for ride requests within 10km
    const unsubscribe = listenForRideRequests(
      {
        latitude: state.currentLocation.lat,
        longitude: state.currentLocation.lng,
      },
      10, // 10km radius
      (requests: FirebaseRideRequest[]) => {
        console.log('📱 Received ride requests:', requests.length);

        // Convert Firebase requests to app format
        const appRequests: RideRequest[] = requests.map((req) => ({
          id: req.id,
          riderId: req.riderId,
          riderName: 'Rider', // TODO: Fetch rider name from users collection
          riderRating: 4.5, // TODO: Fetch from users collection
          pickup: {
            lat: req.pickup.coordinates.latitude,
            lng: req.pickup.coordinates.longitude,
            address: req.pickup.address,
          },
          destination: {
            lat: req.destination.coordinates.latitude,
            lng: req.destination.coordinates.longitude,
            address: req.destination.address,
          },
          distance: req.distance,
          estimatedDuration: req.duration,
          estimatedEarnings: req.estimatedCost,
          requestedAt: req.requestedAt,
          expiresAt: new Date(req.requestedAt.getTime() + 5 * 60 * 1000), // 5 min expiry
        }));

        set({ incomingRequests: appRequests });
      }
    );

    set({ rideRequestListener: unsubscribe });
    console.log('✅ Started listening for ride requests');
  },

  stopListeningForRequests: () => {
    const state = get();
    if (state.rideRequestListener) {
      state.rideRequestListener();
      set({ rideRequestListener: null, incomingRequests: [] });
      console.log('🛑 Stopped listening for ride requests');
    }
  },
  
  // Request actions
  addIncomingRequest: (request) => set((state) => ({
    incomingRequests: [...state.incomingRequests, request]
  })),
  
  removeIncomingRequest: (requestId) => set((state) => ({
    incomingRequests: state.incomingRequests.filter(r => r.id !== requestId)
  })),
  
  acceptRequest: async (requestId) => {
    const state = get();
    const request = state.incomingRequests.find((r) => r.id === requestId);
    const driver = state.driver;
    const vehicle = state.vehicle;

    if (!request || !driver || !vehicle) {
      console.error('❌ Cannot accept: missing request, driver, or vehicle data');
      return;
    }

    try {
      // Accept ride in Firebase
      await acceptRideService(requestId, driver.id, {
        name: `${driver.firstName} ${driver.lastName}`,
        phone: driver.phone,
        vehicleModel: `${vehicle.make} ${vehicle.model}`,
        vehiclePlate: vehicle.licensePlate,
        vehicleColor: vehicle.color,
        rating: driver.rating,
      });

      // Update local state
      const activeRide: ActiveRide = {
        ...request,
        status: 'accepted',
        acceptedAt: new Date(),
      };

      set({
        activeRide,
        incomingRequests: state.incomingRequests.filter((r) => r.id !== requestId),
      });

      console.log('✅ Accepted ride request:', requestId);
    } catch (error) {
      console.error('❌ Failed to accept ride:', error);
      throw error;
    }
  },

  declineRequest: async (requestId, reason) => {
    const state = get();
    const driver = state.driver;

    if (!driver) {
      console.error('❌ Cannot decline: missing driver data');
      return;
    }

    try {
      // Decline ride in Firebase
      await declineRideService(requestId, driver.id);

      // Remove from local state
      set((state) => ({
        incomingRequests: state.incomingRequests.filter((r) => r.id !== requestId),
      }));

      console.log('✅ Declined ride request:', requestId, 'Reason:', reason);
    } catch (error) {
      console.error('❌ Failed to decline ride:', error);
      throw error;
    }
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
  
  // Load driver profile from Firebase
  loadDriverProfile: async (userId: string) => {
    try {
      const { loadDriverProfile, loadDriverEarnings, loadDriverStats } = require(
        '../services/driver-profile.service'
      );

      console.log('📥 Loading driver profile from Firebase...');

      // Load profile data
      const { driver, vehicle, documents } = await loadDriverProfile(userId);

      if (!driver) {
        console.log('⚠️ No driver profile found');
        return false;
      }

      // Load earnings and stats
      const earningsData = await loadDriverEarnings(userId);
      const statsData = await loadDriverStats(userId);

      // Update store with proper typing
      set({
        driver,
        vehicle,
        documents,
        earnings: earningsData ? {
          today: earningsData.today || 0,
          yesterday: earningsData.yesterday || 0,
          thisWeek: earningsData.thisWeek || 0,
          lastWeek: earningsData.lastWeek || 0,
          thisMonth: earningsData.thisMonth || 0,
          lastMonth: earningsData.lastMonth || 0,
          allTime: earningsData.allTime || 0,
        } : undefined,
        stats: statsData ? {
          totalTrips: statsData.totalTrips || 0,
          acceptanceRate: statsData.acceptanceRate || 0,
          cancellationRate: statsData.cancellationRate || 0,
          rating: statsData.rating || 0,
          totalRatings: statsData.totalRatings || 0,
          onlineHours: statsData.onlineHours || 0,
          totalDistance: statsData.totalDistance || 0,
        } : undefined,
        registrationStatus: driver.status as any,
        todayEarnings: earningsData?.today || 0,
        todayTrips: statsData?.totalTrips || 0,
      });

      console.log('✅ Driver profile loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading driver profile:', error);
      return false;
    }
  },

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