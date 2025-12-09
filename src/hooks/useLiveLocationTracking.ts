import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from '@react-native-firebase/firestore';
import { hasBackgroundLocationPermission } from '@/src/utils/backgroundLocationDisclosure';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface LocationData {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  timestamp: number;
}

interface UseLiveLocationTrackingOptions {
  tripId: string;
  userId: string;
  userType: 'rider' | 'driver';
  updateInterval?: number; // milliseconds
  enabled?: boolean;
}

/**
 * Live Location Tracking Hook - PRODUCTION VERSION
 * 
 * Uses React Native Firebase (@react-native-firebase/firestore)
 * Handles real-time location tracking for both riders and drivers
 * Updates Firestore with current location
 * Subscribes to other participant's location
 * 
 * Usage:
 * const { 
 *   myLocation, 
 *   otherUserLocation, 
 *   isTracking,
 *   error 
 * } = useLiveLocationTracking({
 *   tripId: 'trip123',
 *   userId: 'user456',
 *   userType: 'rider',
 *   enabled: true
 * });
 */
export const useLiveLocationTracking = ({
  tripId,
  userId,
  userType,
  updateInterval = 3000, // Update every 3 seconds
  enabled = true,
}: UseLiveLocationTrackingOptions) => {
  const [myLocation, setMyLocation] = useState<LocationData | null>(null);
  const [otherUserLocation, setOtherUserLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !tripId || !userId) {
      console.log('🛑 Location tracking disabled or missing required params');
      return;
    }

    let isMounted = true;

    const startTracking = async () => {
      try {
        // Check if background permission is already granted
        // NOTE: Background permission should be requested with a prominent disclosure modal
        // BEFORE starting tracking. Use useBackgroundLocationPermission hook in the parent component.
        const backgroundGranted = await hasBackgroundLocationPermission();

        if (!backgroundGranted) {
          // Fall back to foreground-only permission
          // NOTE: Don't request permissions here - that should be done by the
          // disclosure modal flow in the parent component. Just check status.
          const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
          if (foregroundStatus !== 'granted') {
            setError('Location permission not granted - please enable in settings');
            console.error('❌ Location permission not granted');
            return;
          }
          console.warn('⚠️ Background location not granted - tracking in foreground only');
        }

        console.log('✅ Location permissions granted');
        setIsTracking(true);

        // Start watching location
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: updateInterval,
            distanceInterval: 10, // Update every 10 meters
          },
          async (location) => {
            if (!isMounted) return;

            const now = Date.now();
            
            // Throttle updates to Firestore
            if (now - lastUpdateRef.current < updateInterval) {
              return;
            }
            
            lastUpdateRef.current = now;

            const locationData: LocationData = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: location.coords.heading,
              speed: location.coords.speed,
              accuracy: location.coords.accuracy,
              timestamp: now,
            };

            setMyLocation(locationData);

            // Update Firestore with current location using React Native Firebase
            try {
              const tripRef = doc(db, 'trips', tripId);
              const updateField = userType === 'driver' ? 'driverLocation' : 'riderLocation';

              await updateDoc(tripRef, {
                [updateField]: locationData,
                [`${updateField}UpdatedAt`]: serverTimestamp(),
              });

              console.log(`📍 Updated ${userType} location:`, {
                lat: locationData.latitude.toFixed(6),
                lng: locationData.longitude.toFixed(6),
                speed: locationData.speed?.toFixed(2),
              });
            } catch (error) {
              console.error('❌ Failed to update location in Firestore:', error);
            }
          }
        );

        locationSubscriptionRef.current = subscription;

        // Subscribe to other user's location from Firestore
        const tripRef = doc(db, 'trips', tripId);
        const otherUserField = userType === 'driver' ? 'riderLocation' : 'driverLocation';

        const unsubscribe = onSnapshot(tripRef, (snapshot) => {
          if (!isMounted) return;

          const data = snapshot.data();
          if (data && data[otherUserField]) {
            setOtherUserLocation(data[otherUserField] as LocationData);
            console.log(`📍 Received ${userType === 'driver' ? 'rider' : 'driver'} location update`);
          }
        }, (error) => {
          console.error('❌ Firestore snapshot error:', error);
        });

        firestoreUnsubscribeRef.current = unsubscribe;

      } catch (err) {
        console.error('❌ Location tracking error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsTracking(false);
      }
    };

    startTracking();

    // Cleanup
    return () => {
      isMounted = false;
      
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
        console.log('🛑 Stopped location tracking');
      }
      
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
        firestoreUnsubscribeRef.current = null;
        console.log('🛑 Unsubscribed from Firestore location updates');
      }
      
      setIsTracking(false);
    };
  }, [enabled, tripId, userId, userType, updateInterval]);

  return {
    myLocation,
    otherUserLocation,
    isTracking,
    error,
  };
};

/**
 * Calculate ETA based on current location and destination
 */
export const calculateETA = (
  currentLocation: LocationData,
  destinationLocation: { latitude: number; longitude: number }
): number => {
  // Haversine formula for distance
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (currentLocation.latitude * Math.PI) / 180;
  const φ2 = (destinationLocation.latitude * Math.PI) / 180;
  const Δφ = ((destinationLocation.latitude - currentLocation.latitude) * Math.PI) / 180;
  const Δλ = ((destinationLocation.longitude - currentLocation.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters

  // Estimate ETA based on current speed or default speed
  const speed = currentLocation.speed && currentLocation.speed > 0 
    ? currentLocation.speed // m/s
    : 13.4; // Default: 30 mph = 13.4 m/s

  const eta = distance / speed; // ETA in seconds
  return Math.ceil(eta / 60); // Return in minutes
};

export default useLiveLocationTracking;