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
 * Complete the trip - marks as AWAITING_TIP first to allow rider to add tip
 * Driver should call this when they arrive at destination
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
      status: 'AWAITING_TIP',
      finalCost,
      actualDistance,
      actualDuration,
      completedAt: serverTimestamp(),
      paymentStatus: 'PENDING',
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Trip marked as AWAITING_TIP:', tripId);
  } catch (error) {
    console.error('Failed to complete trip:', error);
    throw error;
  }
}

/**
 * Add tip to a completed trip
 * Called by rider after trip completion
 */
export async function addTipToTrip(
  tripId: string,
  tipAmount: number,
  driverId: string
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);

    // Get current trip data to calculate total
    const tripDoc = await getDoc(tripRef);
    if (!documentExists(tripDoc)) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data();
    const finalCost = tripData?.finalCost || tripData?.estimatedCost || 0;

    // Update trip with tip
    await updateDoc(tripRef, {
      tip: tipAmount,
      totalWithTip: finalCost + tipAmount,
      status: 'COMPLETED',
      updatedAt: serverTimestamp(),
    });

    // Update driver's earnings in Firebase
    await updateDriverEarnings(driverId, finalCost, tipAmount);

    console.log('✅ Tip added to trip:', tripId, 'Amount:', tipAmount);
  } catch (error) {
    console.error('Failed to add tip:', error);
    throw error;
  }
}

/**
 * Skip tip and finalize trip
 * Called by rider if they choose not to tip
 */
export async function skipTipAndFinalize(tripId: string, driverId: string): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);

    // Get trip data for earnings
    const tripDoc = await getDoc(tripRef);
    if (!documentExists(tripDoc)) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data();
    const finalCost = tripData?.finalCost || tripData?.estimatedCost || 0;

    await updateDoc(tripRef, {
      tip: 0,
      totalWithTip: finalCost,
      status: 'COMPLETED',
      updatedAt: serverTimestamp(),
    });

    // Update driver's earnings (no tip)
    await updateDriverEarnings(driverId, finalCost, 0);

    console.log('✅ Trip finalized without tip:', tripId);
  } catch (error) {
    console.error('Failed to finalize trip:', error);
    throw error;
  }
}

/**
 * Update driver's earnings in Firebase
 */
async function updateDriverEarnings(
  driverId: string,
  tripEarnings: number,
  tipAmount: number
): Promise<void> {
  try {
    const driverRef = doc(firebaseDb, 'drivers', driverId);
    const driverDoc = await getDoc(driverRef);

    if (documentExists(driverDoc)) {
      const driverData = driverDoc.data();
      const currentTodayEarnings = driverData?.todayEarnings || 0;
      const currentTotalEarnings = driverData?.totalEarnings || 0;
      const currentTotalTrips = driverData?.totalTrips || 0;
      const currentTotalTips = driverData?.totalTips || 0;

      await updateDoc(driverRef, {
        todayEarnings: currentTodayEarnings + tripEarnings + tipAmount,
        totalEarnings: currentTotalEarnings + tripEarnings + tipAmount,
        totalTrips: currentTotalTrips + 1,
        totalTips: currentTotalTips + tipAmount,
        lastTripAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Driver earnings updated:', driverId, 'Total:', tripEarnings + tipAmount);
    }
  } catch (error) {
    console.error('Failed to update driver earnings:', error);
    // Don't throw - earnings update failure shouldn't block trip completion
  }
}

/**
 * Finalize trip from driver side (after tip window expires or rider tips)
 * This is called when driver presses "Finish" button
 */
export async function finalizeTrip(tripId: string): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);

    if (!documentExists(tripDoc)) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data();

    // If still awaiting tip, finalize without tip
    if (tripData?.status === 'AWAITING_TIP') {
      await updateDoc(tripRef, {
        status: 'COMPLETED',
        tip: tripData?.tip || 0,
        updatedAt: serverTimestamp(),
      });

      // Update driver earnings if not already done
      if (tripData?.driverId) {
        const finalCost = tripData?.finalCost || tripData?.estimatedCost || 0;
        await updateDriverEarnings(tripData.driverId, finalCost, tripData?.tip || 0);
      }
    }

    console.log('✅ Trip finalized:', tripId);
  } catch (error) {
    console.error('Failed to finalize trip:', error);
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

/**
 * Get active trip for a rider
 * Returns the most recent trip that is in an active state (not completed or cancelled)
 */
export async function getActiveRiderTrip(riderId: string): Promise<RideRequest | null> {
  try {
    const tripsRef = collection(firebaseDb, 'trips');

    // Query for active trips for this rider
    // Active statuses: REQUESTED, ACCEPTED, DRIVER_ARRIVING, DRIVER_ARRIVED, IN_PROGRESS
    const q = query(
      tripsRef,
      where('riderId', '==', riderId),
      orderBy('requestedAt', 'desc'),
      limit(5) // Get recent trips to check
    );

    const snapshot = await firestore().collection('trips')
      .where('riderId', '==', riderId)
      .orderBy('requestedAt', 'desc')
      .limit(5)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const status = data.status;

      // Check if trip is in an active state
      if (['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(status)) {
        console.log('✅ Found active rider trip:', doc.id, 'Status:', status);

        return {
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          acceptedAt: data.acceptedAt?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
        } as RideRequest;
      }
    }

    console.log('ℹ️ No active trip found for rider:', riderId);
    return null;
  } catch (error) {
    console.error('❌ Error fetching active rider trip:', error);
    return null;
  }
}

/**
 * Get rider info from users collection
 * Use this when rider name is not stored in trip data
 */
export async function getRiderInfo(riderId: string): Promise<{ name: string; rating: number; photo?: string } | null> {
  try {
    const userDoc = await firestore().collection('users').doc(riderId).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        name: userData?.name || userData?.firstName || 'Rider',
        rating: userData?.rating || 5.0,
        photo: userData?.profilePhotoUrl || userData?.photoUrl,
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching rider info:', error);
    return null;
  }
}

/**
 * Get active trip for a driver
 * Returns the most recent trip that is assigned to this driver and in an active state
 */
export async function getActiveDriverTrip(driverId: string): Promise<RideRequest | null> {
  try {
    const snapshot = await firestore().collection('trips')
      .where('driverId', '==', driverId)
      .orderBy('acceptedAt', 'desc')
      .limit(5)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const status = data.status;

      // Check if trip is in an active state for driver
      if (['ACCEPTED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(status)) {
        console.log('✅ Found active driver trip:', doc.id, 'Status:', status);

        // If riderName is missing, fetch from users collection
        let riderName = data.riderName;
        let riderRating = data.riderProfileRating || data.riderRating; // Support both field names
        let riderPhoto = data.riderPhoto;

        if (!riderName && data.riderId) {
          console.log('⚠️ Rider name not in trip, fetching from users collection...');
          const riderInfo = await getRiderInfo(data.riderId);
          if (riderInfo) {
            riderName = riderInfo.name;
            riderRating = riderInfo.rating;
            riderPhoto = riderInfo.photo;
          }
        }

        return {
          id: doc.id,
          ...data,
          riderName: riderName || 'Rider',
          riderRating: riderRating || 5.0,
          riderPhoto: riderPhoto,
          requestedAt: data.requestedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          acceptedAt: data.acceptedAt?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
        } as RideRequest;
      }
    }

    console.log('ℹ️ No active trip found for driver:', driverId);
    return null;
  } catch (error) {
    console.error('❌ Error fetching active driver trip:', error);
    return null;
  }
}