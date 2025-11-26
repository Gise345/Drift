/**
 * Ride Request Service
 * Handles real-time ride request matching between riders and drivers
 * Production-ready Firebase implementation with Zone-Based Pricing Support
 */

import { firebaseDb } from '../config/firebase';
import firestore, {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  getDoc,
  orderBy,
  limit,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { Trip } from '../stores/trip-store';
import type { PricingResult } from '../stores/carpool-store';

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

export interface RideRequest extends Trip {
  distanceFromDriver?: number; // in meters
  estimatedPickupTime?: number; // in minutes
  pricing?: PricingResult; // ✅ NEW: Zone-based pricing information
  lockedContribution?: number; // ✅ NEW: The locked contribution amount from rider
}

/**
 * Listen for incoming ride requests for a specific driver
 * Only shows requests that are:
 * - Status: REQUESTED (not yet accepted by another driver)
 * - Within a reasonable distance from driver
 * - Not declined by this driver
 * - Not cancelled
 */
export function listenForRideRequests(
  driverLocation: { latitude: number; longitude: number },
  maxDistanceKm: number = 10,
  callback: (requests: RideRequest[]) => void,
  driverId?: string // Pass driver ID to filter out declined requests
): () => void {
  const tripsRef = collection(firebaseDb, 'trips');

  // Query for requested trips (not yet accepted)
  const q = query(
    tripsRef,
    where('status', '==', 'REQUESTED'),
    orderBy('requestedAt', 'desc'),
    limit(20) // Limit to recent 20 requests
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const requests: RideRequest[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Log what we're checking
        console.log('🔍 Checking request:', doc.id, {
          status: data.status,
          paymentStatus: data.paymentStatus,
          driverId: data.driverId || 'none',
          acceptedAt: data.acceptedAt ? 'yes' : 'no',
          cancelledAt: data.cancelledAt ? 'yes' : 'no',
        });

        // Skip if this driver has already declined this request
        if (driverId && data.declinedBy && Array.isArray(data.declinedBy)) {
          if (data.declinedBy.includes(driverId)) {
            console.log('⏭️ Skipping declined request:', doc.id);
            return; // Skip this request
          }
        }

        // Skip cancelled requests (double-check even though query filters by REQUESTED)
        if (data.status === 'CANCELLED') {
          console.log('⏭️ Skipping cancelled request:', doc.id);
          return;
        }

        // Skip requests that already have a driver assigned (being handled or accepted)
        if (data.driverId) {
          console.log('⏭️ Skipping request with assigned driver:', doc.id, 'driver:', data.driverId);
          return;
        }

        // Double-check status is still REQUESTED (Firestore query should handle this but verify)
        if (data.status !== 'REQUESTED') {
          console.log('⏭️ Skipping non-REQUESTED status:', doc.id, 'status:', data.status);
          return;
        }

        // Skip requests where payment is not completed
        if (data.paymentStatus !== 'COMPLETED') {
          console.log('⏭️ Skipping unpaid request:', doc.id, 'paymentStatus:', data.paymentStatus);
          return;
        }

        // Skip requests that were previously accepted (have acceptedAt timestamp)
        if (data.acceptedAt) {
          console.log('⏭️ Skipping previously accepted request:', doc.id);
          return;
        }

        // Skip requests that were previously cancelled
        if (data.cancelledAt || data.cancelledBy) {
          console.log('⏭️ Skipping previously cancelled request:', doc.id);
          return;
        }

        // Skip requests that are too old (older than 5 minutes)
        // This is aggressive but prevents stale requests from showing up
        // Riders should re-request if no driver accepts within 5 minutes
        const requestedAt = data.requestedAt?.toDate?.() || data.requestedAt;
        if (requestedAt) {
          const ageInMinutes = (Date.now() - new Date(requestedAt).getTime()) / (1000 * 60);
          if (ageInMinutes > 5) {
            console.log('⏭️ Skipping old request:', doc.id, 'age:', Math.round(ageInMinutes), 'minutes (max 5 min)');
            return;
          }
        } else {
          // If no requestedAt timestamp, skip it (shouldn't happen but safety check)
          console.log('⏭️ Skipping request without timestamp:', doc.id);
          return;
        }

        const request: RideRequest = {
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          acceptedAt: data.acceptedAt?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          // ✅ NEW: Include pricing data
          pricing: data.pricing,
          lockedContribution: data.lockedContribution,
        } as RideRequest;

        // Calculate distance from driver to pickup location
        const distance = calculateDistance(
          driverLocation.latitude,
          driverLocation.longitude,
          request.pickup.coordinates.latitude,
          request.pickup.coordinates.longitude
        );

        request.distanceFromDriver = distance;
        request.estimatedPickupTime = Math.ceil(distance / 500); // Rough estimate: 500m per minute

        // Only include requests within max distance
        if (distance <= maxDistanceKm * 1000) {
          requests.push(request);
        }
      });

      // Sort by distance (closest first)
      requests.sort((a, b) => (a.distanceFromDriver || 0) - (b.distanceFromDriver || 0));

      console.log('📱 Filtered ride requests for driver:', requests.length);
      callback(requests);
    },
    (error) => {
      console.error('Error listening for ride requests:', error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Accept a ride request as a driver
 */
export async function acceptRideRequest(
  tripId: string,
  driverId: string,
  driverInfo: {
    name: string;
    phone: string;
    vehicleModel: string;
    vehiclePlate: string;
    vehicleColor: string;
    rating: number;
  }
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);

    // First, check if ride is still available
    const tripDoc = await getDoc(tripRef);
    if (!documentExists(tripDoc)) {
      throw new Error('Ride request not found');
    }

    const tripData = tripDoc.data();
    if (tripData?.status !== 'REQUESTED') {
      throw new Error('Ride has already been accepted by another driver');
    }

    // ✅ NEW: Log the locked contribution amount
    if (tripData?.lockedContribution) {
      console.log('💰 Driver accepting ride with locked contribution:', tripData.lockedContribution);
    } else if (tripData?.pricing?.suggestedContribution) {
      console.log('💰 Driver accepting ride with pricing contribution:', tripData.pricing.suggestedContribution);
    }

    // Parse vehicle model to extract make, model, and year
    const vehicleModelParts = driverInfo.vehicleModel.split(' ');
    const make = vehicleModelParts[0] || 'Unknown';
    const model = vehicleModelParts.slice(1).join(' ') || 'Unknown';

    // Format driver info to match Trip interface
    const formattedDriverInfo = {
      id: driverId,
      name: driverInfo.name,
      phone: driverInfo.phone,
      rating: driverInfo.rating,
      totalTrips: 0, // Will be populated later from driver profile
      vehicle: {
        make,
        model,
        year: new Date().getFullYear(), // Default to current year
        color: driverInfo.vehicleColor,
        plate: driverInfo.vehiclePlate,
      },
    };

    // Accept the ride and set status to DRIVER_ARRIVING
    // This immediately transitions the rider to the "driver arriving" screen
    console.log('🔄 Updating trip document with driver info...');
    console.log('  - Trip ID:', tripId);
    console.log('  - Driver ID:', driverId);
    console.log('  - New Status: DRIVER_ARRIVING');
    console.log('  - Driver Info:', formattedDriverInfo);

    await updateDoc(tripRef, {
      driverId,
      driverInfo: formattedDriverInfo,
      status: 'DRIVER_ARRIVING',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅✅✅ Ride accepted successfully - Firebase should notify rider now:', tripId);
  } catch (error) {
    console.error('❌ Failed to accept ride:', error);
    throw error;
  }
}

/**
 * Decline a ride request
 * Adds driver to a "declined by" list so they won't see it again
 */
export async function declineRideRequest(
  tripId: string,
  driverId: string
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);

    // Add driver to declined list (so they don't see this request again)
    await updateDoc(tripRef, {
      declinedBy: firestore.FieldValue.arrayUnion(driverId),
      updatedAt: serverTimestamp(),
    });

    console.log('Ride declined:', tripId);
  } catch (error) {
    console.error('Failed to decline ride:', error);
    throw error;
  }
}

/**
 * Update driver's arrival status
 */
export async function updateDriverArrivalStatus(
  tripId: string,
  status: 'DRIVER_ARRIVING' | 'DRIVER_ARRIVED'
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    await updateDoc(tripRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update arrival status:', error);
    throw error;
  }
}

/**
 * Start the trip
 */
export async function startTrip(tripId: string): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    await updateDoc(tripRef, {
      status: 'IN_PROGRESS',
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to start trip:', error);
    throw error;
  }
}

/**
 * Complete the trip
 */
export async function completeTrip(
  tripId: string,
  finalCost: number,
  actualDistance?: number,
  actualDuration?: number
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    await updateDoc(tripRef, {
      status: 'COMPLETED',
      finalCost,
      actualDistance,
      actualDuration,
      completedAt: serverTimestamp(),
      paymentStatus: 'PENDING',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to complete trip:', error);
    throw error;
  }
}

/**
 * Cancel the trip
 */
export async function cancelTrip(
  tripId: string,
  cancelledBy: 'DRIVER' | 'RIDER',
  reason: string
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    await updateDoc(tripRef, {
      status: 'CANCELLED',
      cancelledBy,
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to cancel trip:', error);
    throw error;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format time for display
 */
export function formatTime(minutes: number): string {
  if (minutes < 1) {
    return '< 1 min';
  }
  return `${Math.round(minutes)} min`;
}