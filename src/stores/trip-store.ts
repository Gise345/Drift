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
  addDoc
} from '@react-native-firebase/firestore';
import * as Location from 'expo-location';

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

export interface Trip {
  id: string;
  riderId: string;
  driverId?: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
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
  
  // Tracking
  driverLocation?: TripLocation;
  riderLocation?: TripLocation;
  route?: Array<{ latitude: number; longitude: number }>;
  
  // Timestamps
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
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
  updateDriverLocation: (tripId: string, location: TripLocation) => Promise<void>;
  subscribeToTrip: (tripId: string) => () => void;
  
  // Ride sharing
  shareTrip: (tripId: string, contacts: Array<{ name: string; phone: string; email?: string }>) => Promise<void>;
  getTripByShareToken: (token: string) => Promise<Trip | null>;
  
  // State management
  setCurrentTrip: (trip: Trip | null) => void;
  setLoading: (loading: boolean) => void;
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
      const newTrip = {
        ...tripData,
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
        set({ currentTrip: { ...currentTrip, ...updates } });
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
      
      if (tripDoc.exists) {
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
      
      const tripsRef = collection(firebaseDb, 'trips');
      const q = query(
        tripsRef,
        where('riderId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const trips: Trip[] = [];
      
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() } as Trip);
      });
      
      // Separate past and upcoming trips
      const pastTrips = trips.filter(trip => 
        trip.status === 'COMPLETED' || trip.status === 'CANCELLED'
      );
      const upcomingTrips = trips.filter(trip => 
        trip.status === 'REQUESTED' || trip.status === 'ACCEPTED' || trip.status === 'DRIVER_ARRIVING'
      );
      
      set({ pastTrips, upcomingTrips, loading: false });
    } catch (error) {
      console.error('Failed to get trip history:', error);
      set({ loading: false });
      throw error;
    }
  },
  
  startLocationTracking: async (_tripId) => {
    try {
      // Request location permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }
      
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        throw new Error('Background location permission not granted');
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
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      throw error;
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
  
  updateDriverLocation: async (tripId, location) => {
    try {
      const tripRef = doc(firebaseDb, 'trips', tripId);
      await updateDoc(tripRef, {
        driverLocation: location,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update driver location:', error);
    }
  },
  
  subscribeToTrip: (tripId) => {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    
    const unsubscribe = onSnapshot(tripRef, (docSnapshot) => {
      if (docSnapshot.exists) {
        const tripData = { id: docSnapshot.id, ...docSnapshot.data() } as Trip;
        set({ currentTrip: tripData });
      }
    });
    
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
      // Example: https://drift.ky/track/ABC123XYZ
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
  
  const trackingUrl = `https://drift.ky/track/${shareToken}`;
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