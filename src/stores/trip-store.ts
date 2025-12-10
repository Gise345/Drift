import { create } from 'zustand';
import { firebaseDb } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  addDoc,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import * as Location from 'expo-location';
import { useUserStore } from './user-store';
import { requestBackgroundLocationWithDisclosure } from '../utils/backgroundLocationDisclosure';

/**
 * Helper to check if document exists
 * React Native Firebase can return exists as either a boolean or function depending on version
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

let TaskManager: any = null;
try {
  TaskManager = require('expo-task-manager');
} catch (e) {
  console.warn('expo-task-manager not available:', e);
}

const LOCATION_TRACKING = 'location-tracking';

export interface TripLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

/**
 * Privacy-aware driver location tracking
 *
 * To protect driver privacy (e.g., home location), we don't broadcast
 * driver location to the rider immediately when they accept a ride.
 *
 * Location is only shared after:
 * 1. The driver has been driving for at least LOCATION_BROADCAST_DELAY_MS (60 seconds), OR
 * 2. The driver is already at or near the rider's pickup location
 *
 * This prevents riders from knowing where drivers live if they happen to
 * accept rides from their home.
 */
const LOCATION_BROADCAST_DELAY_MS = 60 * 1000; // 1 minute
const SAME_LOCATION_THRESHOLD_METERS = 200; // Consider "same location" if within 200m

// Track when driver accepted ride to calculate broadcast eligibility
let rideAcceptedTimestamp: number | null = null;
let initialDriverLocation: { latitude: number; longitude: number } | null = null;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if driver location should be broadcast to rider
 * Returns true if:
 * - Enough time has passed since ride was accepted (privacy delay), OR
 * - Driver is already at/near the pickup location (same location exception)
 */
const shouldBroadcastDriverLocation = (
  driverLocation: TripLocation,
  pickupCoordinates: { latitude: number; longitude: number }
): boolean => {
  // If ride acceptance time not set, initialize it
  if (!rideAcceptedTimestamp) {
    rideAcceptedTimestamp = Date.now();
    initialDriverLocation = {
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude,
    };
    console.log('🔒 Privacy: Initialized ride acceptance timestamp');
  }

  // Check if driver is at or near the pickup location
  const distanceToPickup = calculateDistanceMeters(
    driverLocation.latitude,
    driverLocation.longitude,
    pickupCoordinates.latitude,
    pickupCoordinates.longitude
  );

  if (distanceToPickup <= SAME_LOCATION_THRESHOLD_METERS) {
    console.log('📍 Privacy: Driver near pickup, broadcasting location');
    return true;
  }

  // Check if enough time has passed
  const elapsedTime = Date.now() - rideAcceptedTimestamp;
  if (elapsedTime >= LOCATION_BROADCAST_DELAY_MS) {
    console.log('⏱️ Privacy: Delay period passed, broadcasting location');
    return true;
  }

  // Check if driver has moved significantly from initial location (indicates they're driving, not at home)
  if (initialDriverLocation) {
    const distanceFromStart = calculateDistanceMeters(
      driverLocation.latitude,
      driverLocation.longitude,
      initialDriverLocation.latitude,
      initialDriverLocation.longitude
    );

    // If driver has moved more than 100 meters, start broadcasting
    if (distanceFromStart > 100) {
      console.log('🚗 Privacy: Driver has moved, broadcasting location');
      return true;
    }
  }

  console.log(`🔒 Privacy: Waiting before broadcasting. Elapsed: ${Math.round(elapsedTime / 1000)}s, Distance to pickup: ${Math.round(distanceToPickup)}m`);
  return false;
};

/**
 * Reset privacy tracking state (call when ride is completed/cancelled)
 */
const resetPrivacyTrackingState = () => {
  rideAcceptedTimestamp = null;
  initialDriverLocation = null;
  console.log('🔓 Privacy: Reset tracking state');
};

export interface Trip {
  id: string;
  riderId: string;
  riderName?: string;  // Rider's display name
  riderPhoto?: string; // Rider's profile photo URL
  riderProfileRating?: number; // Rider's profile rating (from their account)
  driverId?: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'DRIVER_ARRIVED' | 'IN_PROGRESS' | 'AWAITING_TIP' | 'COMPLETED' | 'CANCELLED';

  // Tip and final cost
  tip?: number;
  totalWithTip?: number;

  // Route info
  pickup: {
    address: string;
    coordinates: { latitude: number; longitude: number };
    placeName?: string;
  };
  destination: {
    address: string;
    coordinates: { latitude: number; longitude: number };
    placeName?: string;
  };
  stops?: Array<{
    address: string;
    coordinates: { latitude: number; longitude: number };
    placeName?: string;
    completed: boolean;
  }>;

  // Trip details
  vehicleType: string;
  distance: number;
  duration: number;
  estimatedCost: number;
  finalCost?: number;

  // Driver info (populated when driver accepts)
  driverInfo?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    totalTrips: number;
    photo?: string;
    vehicle: {
      make: string;
      model: string;
      year: number;
      color: string;
      plate: string;
    };
  };

  // Tracking
  driverLocation?: TripLocation;
  riderLocation?: TripLocation;
  route?: Array<{ latitude: number; longitude: number }>;
  driverFinalLocation?: { latitude: number; longitude: number }; // Driver's location when trip completed

  // Timestamps
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  ratingDeadline?: Date; // 3-day window for rating/tipping after completion

  // Payment
  paymentMethod: string;
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';

  // Ratings
  riderRating?: number;
  riderFeedback?: string;
  driverRating?: number;
  driverFeedback?: string;

  // Sharing
  sharedWith?: Array<{
    name: string;
    phone: string;
    email?: string;
    shareToken: string;
  }>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface TripStore {
  currentTrip: Trip | null;
  pastTrips: Trip[];
  upcomingTrips: Trip[];
  loading: boolean;
  trackingEnabled: boolean;
  
  // Actions
  createTrip: (tripData: Partial<Trip>) => Promise<string>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  getTrip: (tripId: string) => Promise<Trip | null>;
  getTripHistory: (userId: string) => Promise<void>;
  
  // Real-time tracking
  startLocationTracking: (tripId: string) => Promise<void>;
  stopLocationTracking: () => Promise<void>;
  updateDriverLocation: (tripId: string, location: TripLocation, pickupCoordinates?: { latitude: number; longitude: number }) => Promise<void>;
  subscribeToTrip: (tripId: string) => () => void;
  resetPrivacyTracking: () => void;
  
  // Ride sharing
  shareTrip: (tripId: string, contacts: Array<{ name: string; phone: string; email?: string }>) => Promise<void>;
  getTripByShareToken: (token: string) => Promise<Trip | null>;
  
  // State management
  setCurrentTrip: (trip: Trip | null) => void;
  setLoading: (loading: boolean) => void;

  // Reset store (for logout)
  resetStore: () => Promise<void>;
}

// Define background location task
if (TaskManager?.defineTask) {
  TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }: any) => {
    if (error) {
      console.error('Location tracking error:', error);
      return;
    }

    if (data) {
      const { locations } = data;
      const location = locations[0];

      if (location) {
        try {
          // Get current trip ID from async storage or state
          const tripId = await getCurrentTripId();
          if (tripId) {
            const tripLocation: TripLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date(location.timestamp),
              accuracy: location.coords.accuracy,
              speed: location.coords.speed,
              heading: location.coords.heading,
            };

            // Update location in Firestore
            const tripRef = doc(firebaseDb, 'trips', tripId);
            await updateDoc(tripRef, {
              riderLocation: tripLocation,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      }
    }
  });
}

// Helper to get current trip ID (implement this based on your needs)
async function getCurrentTripId(): Promise<string | null> {
  // You could store this in AsyncStorage or SecureStore
  return null;
}

export const useTripStore = create<TripStore>((set, get) => ({
  currentTrip: null,
  pastTrips: [],
  upcomingTrips: [],
  loading: false,
  trackingEnabled: false,
  
  createTrip: async (tripData) => {
    try {
      const tripsRef = collection(firebaseDb, 'trips');

      // Recursively remove undefined values - Firestore doesn't accept them
      const removeUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined);
        }
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, removeUndefined(value)])
        );
      };

      const cleanTripData = removeUndefined(tripData);

      const newTrip = {
        ...cleanTripData,
        status: 'REQUESTED',
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(tripsRef, newTrip);

      // Set as current trip
      set({ currentTrip: { ...newTrip, id: docRef.id } as unknown as Trip });
      
      return docRef.id;
    } catch (error) {
      console.error('Failed to create trip:', error);
      throw error;
    }
  },
  
  updateTrip: async (tripId, updates) => {
    try {
      const tripRef = doc(firebaseDb, 'trips', tripId);
      await updateDoc(tripRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      const currentTrip = get().currentTrip;
      if (currentTrip?.id === tripId) {
        const updatedTrip = { ...currentTrip, ...updates };
        set({ currentTrip: updatedTrip });

        // If trip is being marked as COMPLETED, save to recent travels
        if (updates.status === 'COMPLETED' && updatedTrip) {
          try {
            const { addRecentTravel } = useUserStore.getState();
            await addRecentTravel({
              tripId: updatedTrip.id,
              pickup: {
                name: updatedTrip.pickup.placeName || 'Pickup',
                address: updatedTrip.pickup.address,
                latitude: updatedTrip.pickup.coordinates.latitude,
                longitude: updatedTrip.pickup.coordinates.longitude,
              },
              destination: {
                name: updatedTrip.destination.placeName || 'Destination',
                address: updatedTrip.destination.address,
                latitude: updatedTrip.destination.coordinates.latitude,
                longitude: updatedTrip.destination.coordinates.longitude,
              },
              vehicleType: updatedTrip.vehicleType,
              cost: updatedTrip.finalCost || updatedTrip.estimatedCost,
            });
            console.log('Trip saved to recent travels');
          } catch (travelError) {
            console.warn('Failed to save recent travel:', travelError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update trip:', error);
      throw error;
    }
  },
  
  getTrip: async (tripId) => {
    try {
      const tripRef = doc(firebaseDb, 'trips', tripId);
      const tripDoc = await getDoc(tripRef);
      
      if (documentExists(tripDoc)) {
        return { id: tripDoc.id, ...tripDoc.data() } as Trip;
      }
      return null;
    } catch (error) {
      console.error('Failed to get trip:', error);
      return null;
    }
  },
  
  getTripHistory: async (userId) => {
    try {
      set({ loading: true });

      console.log('📋 Fetching trip history for user:', userId);

      const tripsRef = collection(firebaseDb, 'trips');
      const q = query(
        tripsRef,
        where('riderId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const trips: Trip[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Convert Firestore timestamps to Dates
        const trip: Trip = {
          id: docSnapshot.id,
          ...data,
          requestedAt: data.requestedAt?.toDate?.() || data.requestedAt,
          acceptedAt: data.acceptedAt?.toDate?.() || data.acceptedAt,
          startedAt: data.startedAt?.toDate?.() || data.startedAt,
          completedAt: data.completedAt?.toDate?.() || data.completedAt,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as Trip;
        trips.push(trip);
      });

      console.log('📋 Found', trips.length, 'total trips');

      // Separate past and upcoming trips
      const pastTrips = trips.filter(trip =>
        trip.status === 'COMPLETED' || trip.status === 'CANCELLED'
      );
      const upcomingTrips = trips.filter(trip =>
        trip.status === 'REQUESTED' || trip.status === 'ACCEPTED' || trip.status === 'DRIVER_ARRIVING' || trip.status === 'DRIVER_ARRIVED' || trip.status === 'IN_PROGRESS'
      );

      console.log('📋 Past trips:', pastTrips.length, 'Upcoming trips:', upcomingTrips.length);

      set({ pastTrips, upcomingTrips, loading: false });
    } catch (error) {
      console.error('Failed to get trip history:', error);
      set({ loading: false });
      throw error;
    }
  },
  
  startLocationTracking: async (_tripId) => {
    try {
      // Request location permissions with Google Play-compliant disclosure
      // Note: This is called for riders sharing their trip
      const backgroundGranted = await requestBackgroundLocationWithDisclosure('rider');

      if (!backgroundGranted) {
        // Fall back to foreground permission
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          console.warn('⚠️ Foreground location permission not granted');
          return;
        }
        console.warn('⚠️ Background location not granted - tracking in foreground only');
        return;
      }

      // Only start background location tracking if both permissions are granted
      if (TaskManager?.isTaskDefined && !(await TaskManager.isTaskDefined(LOCATION_TRACKING))) {
        console.log('⚠️ Location tracking task not defined, skipping background tracking');
        return;
      }

      // Start background location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
        foregroundService: {
          notificationTitle: 'Drift - Trip in Progress',
          notificationBody: 'Your location is being shared for safety',
          notificationColor: '#5d1289',
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });

      set({ trackingEnabled: true });
      console.log('✅ Background location tracking started');
    } catch (error) {
      console.error('❌ Failed to start background location tracking:', error);
      // Don't throw - let foreground tracking continue via the hook
      console.log('⚠️ Falling back to foreground-only tracking');
    }
  },
  
  stopLocationTracking: async () => {
    try {
      const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
      if (isTracking) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }
      set({ trackingEnabled: false });
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
    }
  },
  
  updateDriverLocation: async (tripId, location, pickupCoordinates?: { latitude: number; longitude: number }) => {
    try {
      const tripRef = doc(firebaseDb, 'trips', tripId);

      // If pickup coordinates are provided, check privacy before broadcasting
      if (pickupCoordinates) {
        if (!shouldBroadcastDriverLocation(location, pickupCoordinates)) {
          // Don't broadcast location yet - privacy delay in effect
          // Just update the timestamp so rider knows driver is active
          await updateDoc(tripRef, {
            updatedAt: serverTimestamp(),
          });
          return;
        }
      }

      // Broadcast location - either privacy delay passed or no pickup coordinates to check
      await updateDoc(tripRef, {
        driverLocation: location,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update driver location:', error);
    }
  },

  /**
   * Reset privacy tracking state - call when ride is completed or cancelled
   */
  resetPrivacyTracking: () => {
    resetPrivacyTrackingState();
  },
  
  subscribeToTrip: (tripId) => {
    const tripRef = doc(firebaseDb, 'trips', tripId);

    console.log('🔔🔔🔔 Setting up trip subscription for:', tripId);

    const unsubscribe = onSnapshot(
      tripRef,
      (docSnapshot) => {
        // Use helper that handles both boolean and function versions
        if (documentExists(docSnapshot)) {
          const data = docSnapshot.data();
          const tripData = {
            id: docSnapshot.id,
            ...data,
            // Properly convert Firestore timestamps to Dates
            requestedAt: data?.requestedAt?.toDate?.() || data?.requestedAt,
            acceptedAt: data?.acceptedAt?.toDate?.() || data?.acceptedAt,
            startedAt: data?.startedAt?.toDate?.() || data?.startedAt,
            completedAt: data?.completedAt?.toDate?.() || data?.completedAt,
            createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
            updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
          } as Trip;

          console.log('📍📍📍 Trip update received from Firebase:');
          console.log('  - Trip ID:', tripData.id);
          console.log('  - Status:', tripData.status);
          console.log('  - Driver ID:', tripData.driverId || 'None');
          console.log('  - Driver Name:', tripData.driverInfo?.name || 'None');

          // Check if trip is completed or cancelled - clear from store after delay
          if (tripData.status === 'CANCELLED') {
            console.log('🏁 Trip cancelled - updating store with cancelled trip data');
            // IMPORTANT: First update the store so UI screens can detect the cancellation
            set({ currentTrip: tripData });
            // Then clear after delay to allow UI to show cancellation alert
            setTimeout(() => {
              set({ currentTrip: null });
              console.log('✅ Current trip cleared from store');
            }, 3000);
          } else if (tripData.status === 'COMPLETED') {
            console.log('🏁 Trip completed');
            // Don't clear immediately - let the UI screens handle navigation
            // The trip-complete or add-tip screens will clear when user dismisses
            set({ currentTrip: tripData });
            console.log('✅ Store updated with completed trip data');
          } else {
            // Update the store with active trip (including AWAITING_TIP status)
            set({ currentTrip: tripData });
            console.log('✅ Store updated with new trip data');
          }
        } else {
          console.log('⚠️ Trip document does not exist:', tripId);
        }
      },
      (error) => {
        console.error('❌ Trip subscription error:', error);
        console.error('Error details:', error.message);
      }
    );

    return unsubscribe;
  },
  
  shareTrip: async (tripId, contacts) => {
    try {
      const trip = await get().getTrip(tripId);
      if (!trip) throw new Error('Trip not found');
      
      // Generate unique share tokens for each contact
      const sharedWith = contacts.map(contact => ({
        ...contact,
        shareToken: generateShareToken(),
      }));
      
      // Update trip with shared contacts
      await get().updateTrip(tripId, { sharedWith });
      
      // TODO: Send SMS/Email notifications with tracking link
      // Example: https://drift-global.web.app/track?session=ABC123XYZ
      for (const contact of sharedWith) {
        await sendShareNotification(contact, trip, contact.shareToken);
      }
    } catch (error) {
      console.error('Failed to share trip:', error);
      throw error;
    }
  },
  
  getTripByShareToken: async (token) => {
    try {
      const tripsRef = collection(firebaseDb, 'trips');
      const q = query(
        tripsRef,
        where('sharedWith', 'array-contains-any', [{ shareToken: token }])
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Trip;
      }
      return null;
    } catch (error) {
      console.error('Failed to get trip by share token:', error);
      return null;
    }
  },
  
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setLoading: (loading) => set({ loading }),

  /**
   * Reset entire store - call on logout to prevent data leakage between users
   */
  resetStore: async () => {
    console.log('🧹 Resetting trip store...');

    // Stop any active location tracking
    try {
      const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
      if (isTracking) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }
    } catch (e) {
      // Ignore errors - tracking might not be active
    }

    // Reset privacy tracking state
    resetPrivacyTrackingState();

    // Reset all state
    set({
      currentTrip: null,
      pastTrips: [],
      upcomingTrips: [],
      loading: false,
      trackingEnabled: false,
    });

    console.log('✅ Trip store reset complete');
  },
}));

// Helper functions
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

async function sendShareNotification(
  contact: { name: string; phone: string; email?: string },
  trip: Trip,
  shareToken: string
) {
  // TODO: Implement SMS/Email sending
  // You can use Twilio for SMS, SendGrid for email, or Firebase Cloud Functions
  
  const trackingUrl = `https://drift-global.web.app/track?session=${shareToken}`;
  const message = `${trip.pickup.address} to ${trip.destination.address}. Track my ride: ${trackingUrl}`;
  
  console.log(`Sharing trip with ${contact.name}:`, message);
  
  // Implementation example:
  // await fetch('YOUR_SMS_API', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     to: contact.phone,
  //     message: message,
  //   }),
  // });
}