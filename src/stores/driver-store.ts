import { create } from 'zustand';
import {
  listenForRideRequests,
  acceptRideRequest as acceptRideService,
  declineRideRequest as declineRideService,
  RideRequest as FirebaseRideRequest,
} from '../services/ride-request.service';
import { useTripStore } from './trip-store';
import { firebaseDb } from '../config/firebase';
import { doc, getDoc } from '@react-native-firebase/firestore';
import {
  sendRideRequestNotification,
  dismissRideRequestNotifications,
  isAppInBackground,
} from '../services/driver-notification.service';

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
  gender: 'male' | 'female';
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  rating: number;
  totalTrips: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  registrationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended' | 'pending_reapproval';
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
    gender: 'male' | 'female';
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
}

export interface RideRequest {
  id: string;
  riderId: string;
  riderName: string;
  riderPhoto?: string;
  riderRating: number;
  riderGender?: 'male' | 'female';
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
  womenOnlyRide?: boolean; // Women-only ride request flag
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
  // Route history - actual GPS coordinates recorded during trip for safety/investigation
  routeHistory?: Array<{ latitude: number; longitude: number }>;
  // Actual distance traveled in meters (calculated from GPS)
  actualDistanceTraveled?: number;
  // Actual duration in seconds (calculated from trip start to end)
  actualDurationSeconds?: number;
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

  // Track requests we've already processed to prevent re-showing on app refresh
  processedRequestIds: Set<string>;

  // Actions - Registration
  setRegistrationStep: (step: number) => void;
  updateRegistrationData: (data: Partial<DriverRegistration>) => void;
  submitRegistration: () => Promise<void>;
  setRegistrationStatus: (status: 'incomplete' | 'pending' | 'approved' | 'rejected') => void;
  loadSavedRegistrationProgress: (userId: string) => Promise<void>;
  
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
  markRequestProcessed: (requestId: string) => void;
  clearProcessedRequests: () => void;
  
  // Actions - Active Ride
  setActiveRide: (ride: ActiveRide | null) => void;
  updateRideStatus: (status: ActiveRide['status']) => void;
  startNavigation: () => void;
  arrivedAtPickup: () => void;
  startRide: () => void;
  addStop: (stop: { lat: number; lng: number; address: string }) => void;
  addRouteHistoryPoint: (point: { latitude: number; longitude: number }) => void;
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
  processedRequestIds: new Set<string>(),
  
  // Registration actions
  setRegistrationStep: (step) => {
    set({ registrationStep: step });
    // Auto-save progress to Firebase when step changes
    const { saveRegistrationProgress } = require('../services/driver-registration.service');
    const { getCurrentUser } = require('../services/firebase-auth-service');
    const currentUser = getCurrentUser();
    if (currentUser?.uid) {
      console.log('📍 Setting registration step to:', step);
      saveRegistrationProgress(currentUser.uid, step, get().registrationData)
        .then(() => console.log('✅ Step saved to Firebase'))
        .catch((err: any) => console.error('❌ Failed to save step:', err));
    } else {
      console.warn('⚠️ Cannot save step: no current user');
    }
  },

  updateRegistrationData: (data) => {
    set((state) => {
      // Deep merge for nested objects (vehicle, documents, personalInfo)
      const mergedData = {
        ...state.registrationData,
        ...data,
      };

      // Deep merge for vehicle (including photos)
      if (data.vehicle) {
        mergedData.vehicle = {
          ...state.registrationData.vehicle,
          ...data.vehicle,
          // Deep merge photos if present
          photos: data.vehicle.photos
            ? {
                ...state.registrationData.vehicle?.photos,
                ...data.vehicle.photos,
              }
            : state.registrationData.vehicle?.photos,
        };
      }

      // Deep merge for documents (including nested license, insurance, etc.)
      if (data.documents) {
        mergedData.documents = {
          ...state.registrationData.documents,
          ...data.documents,
          // Deep merge license if present
          license: data.documents.license
            ? {
                ...state.registrationData.documents?.license,
                ...data.documents.license,
              }
            : state.registrationData.documents?.license,
        };
      }

      // Deep merge for personalInfo (including nested address)
      if (data.personalInfo) {
        mergedData.personalInfo = {
          ...state.registrationData.personalInfo,
          ...data.personalInfo,
          address: data.personalInfo.address
            ? {
                ...state.registrationData.personalInfo?.address,
                ...data.personalInfo.address,
              }
            : state.registrationData.personalInfo?.address,
        };
      }

      return { registrationData: mergedData };
    });

    // Auto-save progress to Firebase when data changes
    const { saveRegistrationProgress } = require('../services/driver-registration.service');
    const { getCurrentUser } = require('../services/firebase-auth-service');
    const currentUser = getCurrentUser();
    if (currentUser?.uid) {
      const state = get();
      console.log('💾 Auto-saving registration progress...', {
        step: state.registrationStep,
        hasVehicle: !!state.registrationData.vehicle,
        hasPhotos: !!state.registrationData.vehicle?.photos,
        hasDocuments: !!state.registrationData.documents,
      });
      saveRegistrationProgress(currentUser.uid, state.registrationStep, state.registrationData)
        .then(() => console.log('✅ Registration progress auto-saved'))
        .catch((err: any) => console.error('❌ Failed to auto-save registration progress:', err));
    } else {
      console.warn('⚠️ Cannot auto-save: no current user');
    }
  },
  
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

  loadSavedRegistrationProgress: async (userId: string) => {
    const { loadRegistrationProgress } = require('../services/driver-registration.service');
    try {
      const progress = await loadRegistrationProgress(userId);
      if (progress) {
        set({
          registrationStep: progress.currentStep,
          registrationData: progress.registrationData,
        });
        console.log('✅ Loaded saved registration progress at step:', progress.currentStep);
      }
    } catch (error) {
      console.error('❌ Error loading registration progress:', error);
    }
  },

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

  goOnline: async () => {
    const state = get();
    const driverId = state.driver?.id;

    if (!driverId) {
      console.error('❌ Cannot go online: no driver ID');
      return;
    }

    try {
      // Update Firebase online status
      const { updateDriverOnlineStatus } = require('../services/driver-profile.service');
      await updateDriverOnlineStatus(driverId, true);

      // Register push token for background notifications
      const { registerPushToken } = require('../services/driver-notification.service');
      await registerPushToken(driverId);

      set({ isOnline: true });
      get().startListeningForRequests();
      console.log('🟢 Driver went online - listening for ride requests');
    } catch (error) {
      console.error('❌ Error going online:', error);
    }
  },

  goOffline: async () => {
    const state = get();
    const driverId = state.driver?.id;

    if (!driverId) {
      console.error('❌ Cannot go offline: no driver ID');
      return;
    }

    try {
      // Update Firebase online status
      const { updateDriverOnlineStatus } = require('../services/driver-profile.service');
      await updateDriverOnlineStatus(driverId, false);

      set({ isOnline: false, lastOnlineAt: new Date() });
      get().stopListeningForRequests();
      console.log('🔴 Driver went offline - stopped listening for requests');
    } catch (error) {
      console.error('❌ Error going offline:', error);
    }
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

    const driverId = state.driver?.id;
    if (!driverId) {
      console.error('❌ Cannot start listening: no driver ID');
      return;
    }

    // Cache for rider info to avoid repeated Firebase calls
    const riderCache: Map<string, { name: string; rating: number }> = new Map();

    // Helper to fetch rider info from Firebase
    const fetchRiderInfo = async (riderId: string): Promise<{ name: string; rating: number }> => {
      // Check cache first
      if (riderCache.has(riderId)) {
        return riderCache.get(riderId)!;
      }

      try {
        const userRef = doc(firebaseDb, 'users', riderId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists) {
          const userData = userDoc.data();
          const riderInfo = {
            name: userData?.name || userData?.firstName || 'Rider',
            rating: userData?.rating || 4.5,
          };
          riderCache.set(riderId, riderInfo);
          console.log('👤 Fetched rider info:', riderId, riderInfo.name);
          return riderInfo;
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch rider info:', riderId, error);
      }

      // Default fallback
      const defaultInfo = { name: 'Rider', rating: 4.5 };
      riderCache.set(riderId, defaultInfo);
      return defaultInfo;
    };

    // Track notified request IDs to avoid duplicate notifications
    const notifiedRequestIds = new Set<string>();

    // Start listening for ride requests within 10km
    // Pass driver ID to filter out requests this driver has declined
    const unsubscribe = listenForRideRequests(
      {
        latitude: state.currentLocation.lat,
        longitude: state.currentLocation.lng,
      },
      10, // 10km radius
      async (requests: FirebaseRideRequest[]) => {
        console.log('📱 Received ride requests from Firebase:', requests.length);
        // Log all request IDs for debugging
        if (requests.length > 0) {
          console.log('📋 Available request IDs (newest first):', requests.map(r => r.id).join(', '));
        }

        // NOTE: We do NOT filter by processedRequestIds here because the driver home screen
        // needs to find the request in incomingRequests when accepting.
        // The filtering for showing the modal is done in the UI component instead.

        // Convert Firebase requests to app format with actual rider names
        const appRequests: RideRequest[] = await Promise.all(
          requests.map(async (req) => {
            // Fetch actual rider info from Firebase users collection
            const riderInfo = await fetchRiderInfo(req.riderId);

            return {
              id: req.id,
              riderId: req.riderId,
              riderName: riderInfo.name,
              riderRating: riderInfo.rating,
              riderGender: (req as any).riderGender,
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
              distanceFromDriver: (req as any).distanceFromDriver,
              womenOnlyRide: (req as any).womenOnlyRide,
            };
          })
        );

        // Send push notification for NEW requests (not already notified)
        // This ensures driver gets notified even when app is in background
        for (const request of appRequests) {
          if (!notifiedRequestIds.has(request.id) && !get().processedRequestIds.has(request.id)) {
            notifiedRequestIds.add(request.id);

            // Send push notification
            sendRideRequestNotification(
              request.id,
              request.riderName,
              request.pickup.address,
              request.destination.address,
              request.estimatedEarnings,
              (request as any).distanceFromDriver || 0
            );

            console.log('🔔 Sent push notification for ride request:', request.id);
          }
        }

        set({ incomingRequests: appRequests });
      },
      driverId // Pass driver ID to filter out declined requests
    );

    set({ rideRequestListener: unsubscribe });
    console.log('✅ Started listening for ride requests for driver:', driverId);
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

  markRequestProcessed: (requestId) => {
    const newProcessedIds = new Set(get().processedRequestIds);
    newProcessedIds.add(requestId);
    set({ processedRequestIds: newProcessedIds });
    console.log('✓ Marked request as processed:', requestId);
  },

  clearProcessedRequests: () => {
    set({ processedRequestIds: new Set<string>() });
    console.log('🧹 Cleared processed request IDs');
  },

  acceptRequest: async (requestId) => {
    const state = get();
    const request = state.incomingRequests.find((r) => r.id === requestId);
    const driver = state.driver;
    const vehicle = state.vehicle;

    if (!request || !driver || !vehicle) {
      console.error('❌ Cannot accept: missing request, driver, or vehicle data', {
        hasRequest: !!request,
        hasDriver: !!driver,
        hasVehicle: !!vehicle,
        requestId,
        incomingRequestsCount: state.incomingRequests.length,
      });
      return;
    }

    // Mark as processed immediately to prevent re-showing
    get().markRequestProcessed(requestId);

    // Dismiss any ride request notifications
    dismissRideRequestNotifications();

    try {
      console.log('🚗 Accepting ride request in Firebase:', requestId);

      // Accept ride in Firebase
      await acceptRideService(requestId, driver.id, {
        name: `${driver.firstName} ${driver.lastName}`,
        phone: driver.phone,
        vehicleModel: `${vehicle.make} ${vehicle.model}`,
        vehiclePlate: vehicle.licensePlate,
        vehicleColor: vehicle.color,
        rating: driver.rating,
        photo: driver.photoUrl,
      });

      // Update local state - set status to 'navigating_to_pickup' to indicate driver is en route
      const activeRide: ActiveRide = {
        ...request,
        status: 'navigating_to_pickup',
        acceptedAt: new Date(),
      };

      // Stop listening for new requests while we have an active ride
      // This prevents other requests from coming in and confusing the UI
      // NOTE: We do NOT change isOnline status - driver remains online
      get().stopListeningForRequests();

      set({
        activeRide,
        incomingRequests: [], // Clear all incoming requests - we only handle one at a time
        // isOnline stays true - driver is still online, just busy with a ride
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

    // Mark as processed immediately to prevent re-showing
    get().markRequestProcessed(requestId);

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

  addRouteHistoryPoint: (point) => set((state) => {
    if (!state.activeRide) return { activeRide: null };

    // Only record points during active ride (started/in_progress status)
    if (state.activeRide.status !== 'started' && state.activeRide.status !== 'in_progress') {
      return { activeRide: state.activeRide };
    }

    const currentHistory = state.activeRide.routeHistory || [];

    // Avoid adding duplicate points that are too close together
    // (within ~10 meters to save storage)
    if (currentHistory.length > 0) {
      const lastPoint = currentHistory[currentHistory.length - 1];
      const latDiff = Math.abs(lastPoint.latitude - point.latitude);
      const lngDiff = Math.abs(lastPoint.longitude - point.longitude);
      // Approximately 10 meters
      if (latDiff < 0.0001 && lngDiff < 0.0001) {
        return { activeRide: state.activeRide };
      }
    }

    return {
      activeRide: {
        ...state.activeRide,
        routeHistory: [...currentHistory, point],
      }
    };
  }),

  completeRide: async (earnings, tip = 0) => {
    const ride = get().activeRide;
    const wasOnline = get().isOnline;

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

      // Clear processed request IDs so driver can receive new requests
      get().clearProcessedRequests();

      // If driver was online, restart listening for new requests immediately
      // This fixes the issue where driver has to go offline/online to receive new requests
      if (wasOnline) {
        console.log('🔄 Ride completed - restarting listener for new requests...');
        // Small delay to ensure state is updated
        setTimeout(() => {
          if (get().isOnline && get().currentLocation) {
            get().startListeningForRequests();
          }
        }, 500);
      }

      console.log('✅ Completed ride:', completedRide.id);
    }
  },
  
  // Location actions
  updateLocation: async (location) => {
    const state = get();
    const driverId = state.driver?.id;

    // Update local state
    set({ currentLocation: location });

    // Update Firebase if driver is online and has ID
    if (driverId && state.isOnline) {
      try {
        const { updateDriverLocation } = require('../services/driver-profile.service');
        await updateDriverLocation(driverId, location);
      } catch (error) {
        console.error('❌ Error updating location in Firebase:', error);
      }
    }
  },
  
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
      const { loadDriverProfile, loadDriverEarnings, loadDriverStats, getDriverOnlineStatus } = require(
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

      // Check if driver was online before app closed (restore online status)
      const wasOnline = await getDriverOnlineStatus(userId);
      console.log('📡 Restoring driver online status:', wasOnline);

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
        isOnline: wasOnline, // Restore online status from Firebase
      });

      // If driver was online, register push token and restart listening for requests
      if (wasOnline) {
        console.log('🔄 Driver was online - registering push token and will start listening once location is available');
        // Register push token for background notifications
        const { registerPushToken } = require('../services/driver-notification.service');
        await registerPushToken(userId);
        // The startListeningForRequests will be called from the driver home screen
        // once the location is updated
      }

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
    processedRequestIds: new Set<string>(),
  }),
}));