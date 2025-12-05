/**
 * Ride Request Service
 * Handles real-time ride request matching between riders and drivers
 * Production-ready Firebase implementation with Zone-Based Pricing Support
 */

import { firebaseDb, firebaseFunctions } from '../config/firebase';
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
import { getCompleteBlockList, hasMutualBlock } from './blocking.service';

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
 * - NOT from users blocked by this driver (or who have blocked this driver)
 */
export function listenForRideRequests(
  driverLocation: { latitude: number; longitude: number },
  maxDistanceKm: number = 10,
  callback: (requests: RideRequest[]) => void,
  driverId?: string // Pass driver ID to filter out declined requests
): () => void {
  const tripsRef = collection(firebaseDb, 'trips');

  // Cache for blocked users - updated periodically
  let blockedUserIds: string[] = [];
  let blockListLastUpdated = 0;
  const BLOCK_LIST_CACHE_TTL = 60000; // 1 minute cache

  // Function to update blocked users list
  const updateBlockList = async () => {
    if (driverId && Date.now() - blockListLastUpdated > BLOCK_LIST_CACHE_TTL) {
      try {
        blockedUserIds = await getCompleteBlockList(driverId);
        blockListLastUpdated = Date.now();
        console.log('🚫 Updated block list for driver:', blockedUserIds.length, 'blocked users');
      } catch (error) {
        console.error('❌ Error fetching block list:', error);
      }
    }
  };

  // Initial fetch of block list
  updateBlockList();

  // Query for requested trips (not yet accepted)
  const q = query(
    tripsRef,
    where('status', '==', 'REQUESTED'),
    orderBy('requestedAt', 'desc'),
    limit(20) // Limit to recent 20 requests
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      // Refresh block list periodically
      await updateBlockList();

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

        // Skip requests from blocked riders (or riders who blocked this driver)
        if (driverId && data.riderId && blockedUserIds.includes(data.riderId)) {
          console.log('🚫 Skipping request from blocked rider:', doc.id, 'riderId:', data.riderId);
          return; // Skip blocked user's request
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
    photo?: string;
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

    // Check if driver and rider have blocked each other
    if (tripData?.riderId) {
      const isBlocked = await hasMutualBlock(driverId, tripData.riderId);
      if (isBlocked) {
        console.log('🚫 Cannot accept ride - mutual block exists between driver and rider');
        throw new Error('You cannot accept rides from this user');
      }
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
    const formattedDriverInfo: any = {
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

    // Include photo if provided
    if (driverInfo.photo) {
      formattedDriverInfo.photo = driverInfo.photo;
    }

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
 *
 * Rating/Tip Window: Riders have 3 days from trip completion to rate and tip
 * After 3 days, the rating/tip option will no longer be available
 *
 * @param tripId - The trip ID
 * @param finalCost - The final cost of the trip
 * @param actualDistance - The actual distance traveled (optional)
 * @param actualDuration - The actual duration of the trip (optional)
 * @param driverFinalLocation - The driver's final location for safety check (optional)
 * @param routeHistory - Array of coordinates representing the actual route taken (optional)
 */
export async function completeTrip(
  tripId: string,
  finalCost: number,
  actualDistance?: number,
  actualDuration?: number,
  driverFinalLocation?: { latitude: number; longitude: number } | null,
  routeHistory?: Array<{ latitude: number; longitude: number }>
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);

    // Calculate 3-day rating/tip deadline
    const now = new Date();
    const ratingDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    const updateData: any = {
      status: 'AWAITING_TIP',
      finalCost,
      actualDistance,
      actualDuration,
      completedAt: serverTimestamp(),
      ratingDeadline: firestore.Timestamp.fromDate(ratingDeadline),
      paymentStatus: 'PENDING',
      updatedAt: serverTimestamp(),
    };

    // Include driver's final location for safety check on rider side
    if (driverFinalLocation) {
      updateData.driverFinalLocation = driverFinalLocation;
    }

    // Include route history for safety/investigation purposes
    // Store the actual path taken during the trip
    if (routeHistory && routeHistory.length > 0) {
      // Limit to 500 points to avoid Firestore document size limits
      // Sample points if there are too many
      const maxPoints = 500;
      if (routeHistory.length > maxPoints) {
        const samplingRate = Math.ceil(routeHistory.length / maxPoints);
        updateData.routeHistory = routeHistory.filter((_, index) => index % samplingRate === 0);
      } else {
        updateData.routeHistory = routeHistory;
      }
      console.log(`📍 Saving ${updateData.routeHistory.length} route points for trip ${tripId}`);
    }

    await updateDoc(tripRef, updateData);
    console.log('✅ Trip marked as AWAITING_TIP:', tripId);
    console.log('📅 Rating/tip deadline:', ratingDeadline.toISOString());
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

    // Ensure we have a valid driverId (fallback to tripData if not provided)
    const effectiveDriverId = driverId || tripData?.driverId || tripData?.driverInfo?.id;
    if (effectiveDriverId) {
      // Update driver's earnings via Cloud Function
      await updateDriverEarnings(effectiveDriverId, tripId, finalCost, tipAmount);
    } else {
      console.warn('⚠️ No driverId found for tip update:', tripId);
    }

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

    // Ensure we have a valid driverId (fallback to tripData if not provided)
    const effectiveDriverId = driverId || tripData?.driverId || tripData?.driverInfo?.id;
    if (effectiveDriverId) {
      // Update driver's earnings via Cloud Function (no tip)
      await updateDriverEarnings(effectiveDriverId, tripId, finalCost, 0);
    } else {
      console.warn('⚠️ No driverId found for earnings update:', tripId);
    }

    console.log('✅ Trip finalized without tip:', tripId);
  } catch (error) {
    console.error('Failed to finalize trip:', error);
    throw error;
  }
}

/**
 * Update driver's earnings via Cloud Function
 * This is more secure than direct Firestore updates
 */
async function updateDriverEarnings(
  driverId: string,
  tripId: string,
  tripEarnings: number,
  tipAmount: number
): Promise<void> {
  try {
    const updateEarnings = firebaseFunctions.httpsCallable('updateDriverEarnings');

    const result = await updateEarnings({
      driverId,
      tripId,
      tripEarnings,
      tipAmount,
    });

    const data = result.data as { success: boolean; alreadyUpdated?: boolean };

    if (data.alreadyUpdated) {
      console.log('ℹ️ Driver earnings already updated for trip:', tripId);
    } else {
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
      console.error('❌ Trip not found for finalization:', tripId);
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

      // Update driver earnings via Cloud Function if not already done
      const driverId = tripData?.driverId || tripData?.driverInfo?.id;
      if (driverId) {
        const finalCost = tripData?.finalCost || tripData?.estimatedCost || 0;
        await updateDriverEarnings(driverId, tripId, finalCost, tripData?.tip || 0);
      } else {
        console.warn('⚠️ No driverId found for trip, skipping earnings update:', tripId);
      }
    }

    console.log('✅ Trip finalized:', tripId);
  } catch (error) {
    console.error('Failed to finalize trip:', error);
    throw error;
  }
}

// Cancellation reason types for determining fee applicability
export type CancellationReason =
  // Rider-fault reasons (50% fee applies)
  | 'RIDER_CANCELLED_AFTER_DRIVER_LEFT'
  | 'RIDER_NO_SHOW'
  | 'RIDER_NOT_RESPONDING'
  | 'RIDER_REQUESTED_CANCELLATION'
  // Driver-fault reasons (full refund)
  | 'DRIVER_EMERGENCY'
  | 'DRIVER_VEHICLE_ISSUE'
  | 'DRIVER_CANCELLED_OWN_FAULT'
  // No fee reasons (before driver accepts or en route)
  | 'RIDER_CANCELLED_WHILE_SEARCHING'
  | 'DRIVER_DECLINED'
  | 'NO_DRIVERS_AVAILABLE'
  | 'OTHER';

// Reasons that incur 50% cancellation fee for rider
const RIDER_FAULT_REASONS: CancellationReason[] = [
  'RIDER_CANCELLED_AFTER_DRIVER_LEFT',
  'RIDER_NO_SHOW',
  'RIDER_NOT_RESPONDING',
  'RIDER_REQUESTED_CANCELLATION',
];

// Reasons that give full refund (driver fault)
const DRIVER_FAULT_REASONS: CancellationReason[] = [
  'DRIVER_EMERGENCY',
  'DRIVER_VEHICLE_ISSUE',
  'DRIVER_CANCELLED_OWN_FAULT',
];

/**
 * Cancel the trip with intelligent fee logic
 *
 * Fee Logic:
 * - If rider cancels BEFORE driver accepts: No fee
 * - If rider cancels AFTER driver accepts but before driver leaves: No fee
 * - If rider cancels AFTER driver has left/is en route: 50% fee
 * - If driver cancels due to rider fault (no show, not responding): 50% fee
 * - If driver cancels due to own fault (emergency, vehicle issue): Full refund
 */
export async function cancelTrip(
  tripId: string,
  cancelledBy: 'DRIVER' | 'RIDER',
  reason: string,
  cancellationReason?: CancellationReason
): Promise<{ cancellationFee: number; refundAmount: number; driverCompensation: number }> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);

    if (!documentExists(tripDoc)) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data();
    const status = tripData?.status;
    const driverId = tripData?.driverId || tripData?.driverInfo?.id;
    const estimatedCost = tripData?.lockedContribution || tripData?.estimatedCost || tripData?.pricing?.suggestedContribution || 0;

    let cancellationFee = 0;
    let refundAmount = estimatedCost;
    let driverCompensation = 0;
    let shouldChargeFee = false;
    let fullRefund = false;

    // Determine if fee should be charged based on status and reason
    const driverHasAccepted = ['ACCEPTED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(status);

    if (cancelledBy === 'RIDER') {
      // Rider cancellation logic
      if (driverHasAccepted && (status === 'DRIVER_ARRIVING' || status === 'DRIVER_ARRIVED')) {
        // Driver is on the way or has arrived - charge 50% fee
        shouldChargeFee = true;
      } else if (cancellationReason && RIDER_FAULT_REASONS.includes(cancellationReason)) {
        shouldChargeFee = true;
      }
    } else if (cancelledBy === 'DRIVER') {
      // Driver cancellation logic
      if (cancellationReason && RIDER_FAULT_REASONS.includes(cancellationReason)) {
        // Driver cancelling due to rider's fault - charge rider 50%
        shouldChargeFee = true;
      } else if (cancellationReason && DRIVER_FAULT_REASONS.includes(cancellationReason)) {
        // Driver cancelling due to own fault - full refund
        fullRefund = true;
      }
    }

    // Calculate fees
    if (shouldChargeFee) {
      cancellationFee = Math.round((estimatedCost * 0.5) * 100) / 100;
      refundAmount = Math.round((estimatedCost - cancellationFee) * 100) / 100;
      driverCompensation = cancellationFee; // Driver gets the fee
    } else if (fullRefund) {
      cancellationFee = 0;
      refundAmount = estimatedCost;
      driverCompensation = 0;
    }

    console.log('💰 Cancellation calculation:', {
      tripId,
      status,
      cancelledBy,
      cancellationReason,
      estimatedCost,
      cancellationFee,
      refundAmount,
      driverCompensation,
    });

    // Update trip with cancellation details
    await updateDoc(tripRef, {
      status: 'CANCELLED',
      cancelledBy,
      cancellationReason: reason,
      cancellationReasonType: cancellationReason || 'OTHER',
      cancellationFee,
      refundAmount,
      driverCompensation,
      // For displaying in trip details
      wasRiderFault: shouldChargeFee && cancelledBy === 'DRIVER',
      wasDriverFault: fullRefund && cancelledBy === 'DRIVER',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Credit driver compensation if applicable
    if (driverId && driverCompensation > 0) {
      await updateDriverCancellationEarnings(driverId, driverCompensation);
    }

    console.log('✅ Trip cancelled:', {
      tripId,
      cancellationFee,
      refundAmount,
    });

    return { cancellationFee, refundAmount, driverCompensation };
  } catch (error) {
    console.error('Failed to cancel trip:', error);
    throw error;
  }
}

/**
 * Cancel the trip with cancellation fee
 * Used when rider cancels AFTER driver has arrived
 * Driver receives 50% of the estimated fare as compensation
 *
 * @param tripId - The trip ID
 * @param cancelledBy - Who cancelled ('DRIVER' | 'RIDER')
 * @param reason - Cancellation reason
 * @param driverId - The driver's ID (to credit earnings)
 * @returns Object with cancellation fee amount
 */
export async function cancelTripWithFee(
  tripId: string,
  cancelledBy: 'DRIVER' | 'RIDER',
  reason: string,
  driverId: string
): Promise<{ cancellationFee: number; refundAmount: number }> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);

    if (!documentExists(tripDoc)) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data();
    const estimatedCost = tripData?.estimatedCost || tripData?.pricing?.suggestedContribution || 0;

    // Calculate 50% cancellation fee for driver
    const cancellationFee = Math.round((estimatedCost * 0.5) * 100) / 100;
    const refundAmount = Math.round((estimatedCost - cancellationFee) * 100) / 100;

    console.log('💰 Processing cancellation with fee:', {
      tripId,
      estimatedCost,
      cancellationFee,
      refundAmount,
      cancelledBy,
    });

    // Update trip with cancellation details
    await updateDoc(tripRef, {
      status: 'CANCELLED',
      cancelledBy,
      cancellationReason: reason,
      cancellationFee,
      refundAmount,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Credit cancellation fee to driver's earnings
    if (driverId && cancellationFee > 0) {
      await updateDriverCancellationEarnings(driverId, cancellationFee);
    }

    console.log('✅ Trip cancelled with fee:', {
      tripId,
      cancellationFee,
      refundAmount,
    });

    return { cancellationFee, refundAmount };
  } catch (error) {
    console.error('Failed to cancel trip with fee:', error);
    throw error;
  }
}

/**
 * Update driver's earnings for cancellation fee
 */
async function updateDriverCancellationEarnings(
  driverId: string,
  cancellationFee: number
): Promise<void> {
  try {
    const driverRef = doc(firebaseDb, 'drivers', driverId);
    const driverDoc = await getDoc(driverRef);

    if (documentExists(driverDoc)) {
      const driverData = driverDoc.data();
      const currentTodayEarnings = driverData?.todayEarnings || 0;
      const currentTotalEarnings = driverData?.totalEarnings || 0;
      const currentCancellationEarnings = driverData?.cancellationEarnings || 0;

      await updateDoc(driverRef, {
        todayEarnings: currentTodayEarnings + cancellationFee,
        totalEarnings: currentTotalEarnings + cancellationFee,
        cancellationEarnings: currentCancellationEarnings + cancellationFee,
        lastCancellationFeeAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Driver cancellation earnings updated:', driverId, 'Fee:', cancellationFee);
    }
  } catch (error) {
    console.error('Failed to update driver cancellation earnings:', error);
    // Don't throw - earnings update failure shouldn't block cancellation
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
 * Check if the rating/tip window is still open for a trip
 * Riders have 3 days from trip completion to rate and tip
 *
 * @param tripData - The trip data object (must have completedAt and optionally ratingDeadline)
 * @returns Object with canRate/canTip boolean and remaining time info
 */
export function canRateOrTipTrip(tripData: {
  completedAt?: Date | { toDate?: () => Date };
  ratingDeadline?: Date | { toDate?: () => Date };
  driverRating?: number;
  tip?: number;
  status?: string;
}): {
  canRate: boolean;
  canTip: boolean;
  hasRated: boolean;
  hasTipped: boolean;
  remainingTime?: string;
  deadlineDate?: Date;
} {
  // If no completedAt, trip isn't finished yet
  if (!tripData.completedAt) {
    return { canRate: false, canTip: false, hasRated: false, hasTipped: false };
  }

  const hasRated = tripData.driverRating !== undefined && tripData.driverRating > 0;
  const hasTipped = tripData.tip !== undefined && tripData.tip > 0;

  // Calculate deadline
  let deadline: Date;
  if (tripData.ratingDeadline) {
    // Use stored deadline if available
    deadline = typeof tripData.ratingDeadline === 'object' && 'toDate' in tripData.ratingDeadline && tripData.ratingDeadline.toDate
      ? tripData.ratingDeadline.toDate()
      : new Date(tripData.ratingDeadline as Date);
  } else {
    // Calculate 3 days from completion for legacy trips
    const completedAt = typeof tripData.completedAt === 'object' && 'toDate' in tripData.completedAt && tripData.completedAt.toDate
      ? tripData.completedAt.toDate()
      : new Date(tripData.completedAt as Date);
    deadline = new Date(completedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
  }

  const now = new Date();
  const isWithinWindow = now < deadline;

  // Calculate remaining time
  let remainingTime: string | undefined;
  if (isWithinWindow) {
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) {
      remainingTime = `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      remainingTime = `${hours} hour${hours !== 1 ? 's' : ''} left`;
    } else {
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      remainingTime = `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
    }
  }

  return {
    canRate: isWithinWindow && !hasRated,
    canTip: isWithinWindow && !hasTipped,
    hasRated,
    hasTipped,
    remainingTime,
    deadlineDate: deadline,
  };
}

/**
 * Add a late tip to a completed trip
 * This is for trips that were already finalized but rider wants to tip within 3-day window
 *
 * @param tripId - The trip ID
 * @param tipAmount - The tip amount
 * @returns Success boolean and message
 */
export async function addLateTip(
  tripId: string,
  tipAmount: number
): Promise<{ success: boolean; message: string }> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);

    if (!documentExists(tripDoc)) {
      return { success: false, message: 'Trip not found' };
    }

    const tripData = tripDoc.data();

    // Check if trip is completed
    if (tripData?.status !== 'COMPLETED') {
      return { success: false, message: 'Trip is not completed' };
    }

    // Check rating window
    const ratingStatus = canRateOrTipTrip(tripData as any);
    if (!ratingStatus.canTip) {
      if (ratingStatus.hasTipped) {
        return { success: false, message: 'You have already tipped for this trip' };
      }
      return { success: false, message: 'The 3-day tipping window has expired' };
    }

    // Get driver ID
    const driverId = tripData?.driverId || tripData?.driverInfo?.id;
    if (!driverId) {
      return { success: false, message: 'Driver information not found' };
    }

    const finalCost = tripData?.finalCost || tripData?.estimatedCost || 0;
    const existingTip = tripData?.tip || 0;
    const newTotalTip = existingTip + tipAmount;

    // Update trip with late tip
    await updateDoc(tripRef, {
      tip: newTotalTip,
      totalWithTip: finalCost + newTotalTip,
      lateTipAdded: true,
      lateTipAmount: tipAmount,
      lateTipAddedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update driver earnings
    await updateDriverEarningsForLateTip(driverId, tripId, tipAmount);

    console.log('✅ Late tip added to trip:', tripId, 'Amount:', tipAmount);
    return { success: true, message: 'Tip added successfully!' };
  } catch (error) {
    console.error('Failed to add late tip:', error);
    return { success: false, message: 'Failed to add tip. Please try again.' };
  }
}

/**
 * Update driver's earnings for a late tip
 */
async function updateDriverEarningsForLateTip(
  driverId: string,
  tripId: string,
  tipAmount: number
): Promise<void> {
  try {
    const updateEarnings = firebaseFunctions.httpsCallable('updateDriverEarnings');

    await updateEarnings({
      driverId,
      tripId,
      tripEarnings: 0, // No additional trip earnings, just tip
      tipAmount,
      isLateTip: true,
    });

    console.log('✅ Driver late tip earnings updated:', driverId, 'Tip:', tipAmount);
  } catch (error) {
    console.error('Failed to update driver late tip earnings:', error);
    // Don't throw - earnings update failure shouldn't block tip submission
  }
}

/**
 * Get active trip for a rider
 * Returns the most recent trip that is in an active state (not completed or cancelled)
 * Also cleans up stale REQUESTED trips that were never accepted
 */
export async function getActiveRiderTrip(riderId: string): Promise<RideRequest | null> {
  try {
    // First, clean up any stale REQUESTED trips (older than 30 minutes)
    // This runs in the background and doesn't block the main query
    cleanupStaleRiderTripsInternal(riderId, 30).catch(err => {
      console.warn('Background cleanup failed:', err);
    });

    const snapshot = await firestore().collection('trips')
      .where('riderId', '==', riderId)
      .orderBy('requestedAt', 'desc')
      .limit(5)
      .get();

    for (const tripDoc of snapshot.docs) {
      const data = tripDoc.data();
      const status = data.status;

      // Skip trips that have been completed (have completedAt timestamp)
      if (data.completedAt) {
        console.log('⏭️ Skipping completed trip:', tripDoc.id, 'completedAt:', data.completedAt);
        continue;
      }

      // Skip trips that have been cancelled
      if (data.cancelledAt || status === 'CANCELLED') {
        console.log('⏭️ Skipping cancelled trip:', tripDoc.id);
        continue;
      }

      // Skip expired trips
      if (status === 'EXPIRED') {
        console.log('⏭️ Skipping expired trip:', tripDoc.id);
        continue;
      }

      // Skip trips awaiting tip or already completed (these are finished trips)
      if (status === 'AWAITING_TIP' || status === 'COMPLETED') {
        console.log('⏭️ Skipping finished trip:', tripDoc.id, 'Status:', status);
        continue;
      }

      // For REQUESTED status, check if it's too old (stale)
      if (status === 'REQUESTED') {
        const requestedAt = data.requestedAt?.toDate?.() || data.requestedAt;
        if (requestedAt) {
          const ageMinutes = (Date.now() - new Date(requestedAt).getTime()) / (1000 * 60);
          if (ageMinutes > 30) {
            console.log('⏭️ Skipping stale REQUESTED trip:', tripDoc.id, 'Age:', Math.round(ageMinutes), 'min');
            continue;
          }
        }
      }

      // Check if trip is in an active state
      if (['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(status)) {
        console.log('✅ Found active rider trip:', tripDoc.id, 'Status:', status);

        return {
          id: tripDoc.id,
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
 * Internal cleanup function - same as cleanupStaleRiderTrips but doesn't log as much
 * Used for background cleanup during getActiveRiderTrip
 */
async function cleanupStaleRiderTripsInternal(
  riderId: string,
  maxAgeMinutes: number
): Promise<number> {
  try {
    const snapshot = await firestore().collection('trips')
      .where('riderId', '==', riderId)
      .where('status', '==', 'REQUESTED')
      .orderBy('requestedAt', 'desc')
      .limit(10)
      .get();

    let cleanedCount = 0;
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    for (const tripDoc of snapshot.docs) {
      const data = tripDoc.data();
      const requestedAt = data.requestedAt?.toDate?.() || data.requestedAt;

      if (!requestedAt) {
        await updateDoc(doc(firebaseDb, 'trips', tripDoc.id), {
          status: 'EXPIRED',
          expiredAt: serverTimestamp(),
          expiredReason: 'No requestedAt timestamp',
          updatedAt: serverTimestamp(),
        });
        cleanedCount++;
        continue;
      }

      const ageMs = now - new Date(requestedAt).getTime();

      if (ageMs > maxAgeMs) {
        console.log('🧹 Auto-expiring stale trip:', tripDoc.id);
        await updateDoc(doc(firebaseDb, 'trips', tripDoc.id), {
          status: 'EXPIRED',
          expiredAt: serverTimestamp(),
          expiredReason: `No driver accepted within ${maxAgeMinutes} minutes`,
          updatedAt: serverTimestamp(),
        });
        cleanedCount++;
      }
    }

    return cleanedCount;
  } catch (error) {
    // Silently fail - this is background cleanup
    return 0;
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

/**
 * Resend a ride request to notify drivers again
 * Used when no driver accepts within the timeout period
 * Clears the declinedBy array and updates the requestedAt timestamp
 *
 * @param tripId - The trip ID to resend
 * @returns boolean indicating success
 */
export async function resendRideRequest(tripId: string): Promise<boolean> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);

    if (!documentExists(tripDoc)) {
      console.error('❌ Trip not found for resend:', tripId);
      return false;
    }

    const tripData = tripDoc.data();

    // Only resend if still in REQUESTED status
    if (tripData?.status !== 'REQUESTED') {
      console.log('⚠️ Cannot resend - trip status is:', tripData?.status);
      return false;
    }

    // Update trip to reset for new drivers
    await updateDoc(tripRef, {
      declinedBy: [], // Clear declined drivers so they can see it again
      requestedAt: serverTimestamp(), // Reset timestamp so it appears fresh
      resendCount: (tripData?.resendCount || 0) + 1,
      lastResendAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('🔄 Ride request resent:', tripId, 'Count:', (tripData?.resendCount || 0) + 1);

    // TODO: Trigger push notification to nearby drivers
    // This would call a Cloud Function to send FCM notifications

    return true;
  } catch (error) {
    console.error('❌ Failed to resend ride request:', error);
    return false;
  }
}

/**
 * Clean up stale/orphaned trips for a rider
 * Automatically expires old REQUESTED trips that were never accepted
 * This prevents old ride requests from showing up as "active"
 *
 * @param riderId - The rider's ID
 * @param maxAgeMinutes - Maximum age in minutes before a REQUESTED trip is considered stale (default: 30)
 */
export async function cleanupStaleRiderTrips(
  riderId: string,
  maxAgeMinutes: number = 30
): Promise<number> {
  try {
    const snapshot = await firestore().collection('trips')
      .where('riderId', '==', riderId)
      .where('status', '==', 'REQUESTED')
      .orderBy('requestedAt', 'desc')
      .limit(10)
      .get();

    let cleanedCount = 0;
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    for (const tripDoc of snapshot.docs) {
      const data = tripDoc.data();
      const requestedAt = data.requestedAt?.toDate?.() || data.requestedAt;

      if (!requestedAt) {
        // No timestamp - mark as expired
        console.log('🧹 Cleaning up trip without timestamp:', tripDoc.id);
        await updateDoc(doc(firebaseDb, 'trips', tripDoc.id), {
          status: 'EXPIRED',
          expiredAt: serverTimestamp(),
          expiredReason: 'No requestedAt timestamp',
          updatedAt: serverTimestamp(),
        });
        cleanedCount++;
        continue;
      }

      const ageMs = now - new Date(requestedAt).getTime();

      if (ageMs > maxAgeMs) {
        console.log('🧹 Cleaning up stale REQUESTED trip:', tripDoc.id,
          'Age:', Math.round(ageMs / 60000), 'minutes');

        await updateDoc(doc(firebaseDb, 'trips', tripDoc.id), {
          status: 'EXPIRED',
          expiredAt: serverTimestamp(),
          expiredReason: `No driver accepted within ${maxAgeMinutes} minutes`,
          updatedAt: serverTimestamp(),
        });
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} stale trip(s) for rider:`, riderId);
    }

    return cleanedCount;
  } catch (error) {
    console.error('❌ Error cleaning up stale trips:', error);
    return 0;
  }
}