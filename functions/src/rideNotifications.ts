/**
 * Ride Notification Cloud Functions
 * Handles push notifications for:
 * - Ride requests to nearby drivers
 * - Trip completion notifications
 * - Safety alerts
 * - Stop requests
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Using 'main' database (restored from backup)
const db = getFirestore(admin.app(), 'main');
const messaging = admin.messaging();

// Distance threshold for notifying drivers (10 km)
const MAX_DISTANCE_KM = 10;

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
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
}

/**
 * Firestore trigger: Send notifications to nearby drivers when a new ride is requested
 */
export const onRideRequested = onDocumentCreated(
  { document: 'trips/{tripId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data in snapshot');
      return null;
    }

    const tripData = snapshot.data();
    const { tripId } = event.params;

    // Only process if status is REQUESTED and payment is ready (or PENDING for new flow)
    // PENDING = new flow (rider pays after driver accepts)
    // VERIFIED = card verified flow (card verified, charge when driver accepts)
    // AUTHORIZED = legacy flow (payment hold, capture when driver accepts)
    // CAPTURED/COMPLETED = legacy statuses (for backwards compatibility)
    const validPaymentStatuses = ['PENDING', 'VERIFIED', 'AUTHORIZED', 'CAPTURED', 'COMPLETED', 'requires_capture', 'succeeded'];
    const hasValidPayment = validPaymentStatuses.includes(tripData.paymentStatus);

    if (tripData.status !== 'REQUESTED' || !hasValidPayment) {
      console.log(`Trip ${tripId} not ready for driver notification:`, {
        status: tripData.status,
        paymentStatus: tripData.paymentStatus,
        validPaymentStatuses,
      });
      return null;
    }

    // Get pickup location
    const pickupLat = tripData.pickup?.coordinates?.latitude;
    const pickupLng = tripData.pickup?.coordinates?.longitude;

    if (!pickupLat || !pickupLng) {
      console.log(`Trip ${tripId} missing pickup coordinates`);
      return null;
    }

    console.log(`📍 New ride request ${tripId} at ${pickupLat}, ${pickupLng}`);

    try {
      // Get all online drivers
      const driversSnapshot = await db
        .collection('drivers')
        .where('isOnline', '==', true)
        .get();

      if (driversSnapshot.empty) {
        console.log('No online drivers found');
        return null;
      }

      const tokens: string[] = [];
      const notifiedDriverIds: string[] = [];

      for (const driverDoc of driversSnapshot.docs) {
        const driverData = driverDoc.data();
        const driverId = driverDoc.id;

        // Skip if driver is the rider (shouldn't happen but safety check)
        if (driverId === tripData.riderId) continue;

        // Skip drivers without location
        const driverLat = driverData.currentLocation?.latitude || driverData.location?.latitude;
        const driverLng = driverData.currentLocation?.longitude || driverData.location?.longitude;

        if (!driverLat || !driverLng) {
          console.log(`Driver ${driverId} missing location`);
          continue;
        }

        // Check distance
        const distance = calculateDistance(pickupLat, pickupLng, driverLat, driverLng);
        if (distance > MAX_DISTANCE_KM) {
          console.log(`Driver ${driverId} too far: ${distance.toFixed(1)} km`);
          continue;
        }

        // Skip drivers who already declined this ride
        if (tripData.declinedBy?.includes(driverId)) {
          console.log(`Driver ${driverId} already declined this ride`);
          continue;
        }

        // Get FCM token
        const fcmToken = driverData.fcmToken || driverData.pushToken;
        if (fcmToken) {
          tokens.push(fcmToken);
          notifiedDriverIds.push(driverId);
          console.log(`✅ Adding driver ${driverId} (${distance.toFixed(1)} km away)`);
        }
      }

      if (tokens.length === 0) {
        console.log('No eligible drivers with FCM tokens found');
        return null;
      }

      // Build notification
      const pickupAddress = tripData.pickup?.address || 'Unknown location';
      const destinationAddress = tripData.destination?.address || 'Unknown destination';
      const estimatedFare = tripData.estimatedCost || tripData.lockedContribution || 0;

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: '🚗 New Ride Request!',
          body: `Pickup: ${pickupAddress.substring(0, 50)}${pickupAddress.length > 50 ? '...' : ''}`,
        },
        data: {
          type: 'RIDE_REQUEST',
          tripId,
          pickupAddress,
          destinationAddress,
          estimatedFare: estimatedFare.toString(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'ride_requests',
            priority: 'max',
            defaultSound: true,
            defaultVibrateTimings: true,
            icon: 'ic_notification',
            color: '#5d1289',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: '🚗 New Ride Request!',
                body: `Pickup: ${pickupAddress.substring(0, 50)}`,
              },
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
      };

      // Send to all eligible drivers
      const response = await messaging.sendEachForMulticast(message);
      console.log(
        `📱 Ride request notifications sent: ${response.successCount} success, ${response.failureCount} failed`
      );

      // Log any failures
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to driver ${notifiedDriverIds[idx]}:`, resp.error);
          }
        });
      }

      // Update trip with notification info
      await snapshot.ref.update({
        notifiedDrivers: notifiedDriverIds,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, notifiedCount: response.successCount };
    } catch (error) {
      console.error('Error sending ride request notifications:', error);
      return { success: false, error };
    }
  }
);

/**
 * Firestore trigger: Send notification when a ride request is resent
 * (when declinedBy array is cleared and requestedAt is updated)
 */
export const onRideResent = onDocumentUpdated(
  { document: 'trips/{tripId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return null;

    // Check if this is a resend (declinedBy cleared and status still REQUESTED)
    // PENDING = new flow (rider pays after driver accepts)
    // VERIFIED = card verified flow, AUTHORIZED = legacy flow
    const validPaymentStatuses = ['PENDING', 'VERIFIED', 'AUTHORIZED', 'CAPTURED', 'COMPLETED', 'requires_capture', 'succeeded'];
    const hasValidPayment = validPaymentStatuses.includes(after.paymentStatus);

    const wasResent =
      after.status === 'REQUESTED' &&
      hasValidPayment &&
      before.declinedBy?.length > 0 &&
      (after.declinedBy?.length === 0 || !after.declinedBy) &&
      after.resendCount > (before.resendCount || 0);

    if (!wasResent) return null;

    const { tripId } = event.params;
    console.log(`🔄 Ride request ${tripId} was resent, sending new notifications`);

    // Get pickup location
    const pickupLat = after.pickup?.coordinates?.latitude;
    const pickupLng = after.pickup?.coordinates?.longitude;

    if (!pickupLat || !pickupLng) {
      console.log(`Trip ${tripId} missing pickup coordinates`);
      return null;
    }

    try {
      // Get all online drivers
      const driversSnapshot = await db
        .collection('drivers')
        .where('isOnline', '==', true)
        .get();

      if (driversSnapshot.empty) {
        console.log('No online drivers found');
        return null;
      }

      const tokens: string[] = [];
      const notifiedDriverIds: string[] = [];

      for (const driverDoc of driversSnapshot.docs) {
        const driverData = driverDoc.data();
        const driverId = driverDoc.id;

        // Skip if driver is the rider
        if (driverId === after.riderId) continue;

        // Get driver location
        const driverLat = driverData.currentLocation?.latitude || driverData.location?.latitude;
        const driverLng = driverData.currentLocation?.longitude || driverData.location?.longitude;

        if (!driverLat || !driverLng) continue;

        // Check distance
        const distance = calculateDistance(pickupLat, pickupLng, driverLat, driverLng);
        if (distance > MAX_DISTANCE_KM) continue;

        // Get FCM token
        const fcmToken = driverData.fcmToken || driverData.pushToken;
        if (fcmToken) {
          tokens.push(fcmToken);
          notifiedDriverIds.push(driverId);
        }
      }

      if (tokens.length === 0) {
        console.log('No eligible drivers with FCM tokens found');
        return null;
      }

      // Build notification
      const pickupAddress = after.pickup?.address || 'Unknown location';
      const estimatedFare = after.estimatedCost || after.lockedContribution || 0;

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: '🚗 Ride Still Available!',
          body: `Pickup: ${pickupAddress.substring(0, 50)}${pickupAddress.length > 50 ? '...' : ''}`,
        },
        data: {
          type: 'RIDE_REQUEST',
          tripId,
          pickupAddress,
          destinationAddress: after.destination?.address || '',
          estimatedFare: estimatedFare.toString(),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'ride_requests',
            priority: 'max',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: '🚗 Ride Still Available!',
                body: `Pickup: ${pickupAddress.substring(0, 50)}`,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log(
        `📱 Resend notifications: ${response.successCount} success, ${response.failureCount} failed`
      );

      return { success: true, notifiedCount: response.successCount };
    } catch (error) {
      console.error('Error sending resend notifications:', error);
      return { success: false, error };
    }
  }
);

/**
 * Send notification when a stop is requested during a trip
 * Driver needs to approve the stop
 */
export const onStopRequested = onDocumentUpdated(
  { document: 'trips/{tripId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return null;

    // Check if a new stop request was added
    const hadPendingStop = before.pendingStopRequest?.status === 'pending';
    const hasPendingStop = after.pendingStopRequest?.status === 'pending';

    // Only notify if a NEW pending stop request was added
    if (hadPendingStop || !hasPendingStop) return null;

    const { tripId } = event.params;
    const stopRequest = after.pendingStopRequest;

    // Only notify driver for rider-initiated requests
    if (stopRequest.requestedBy !== 'rider') return null;

    console.log(`📍 Stop requested for trip ${tripId} by rider`);

    try {
      // Get driver's FCM token
      const driverId = after.driverId;
      if (!driverId) {
        console.log('No driver assigned to trip');
        return null;
      }

      const driverDoc = await db.collection('drivers').doc(driverId).get();
      const driverData = driverDoc.data();
      const fcmToken = driverData?.fcmToken || driverData?.pushToken;

      if (!fcmToken) {
        console.log(`No FCM token for driver ${driverId}`);
        return null;
      }

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: '📍 Stop Request',
          body: `Rider wants to add a stop: ${stopRequest.placeName || stopRequest.address}`,
        },
        data: {
          type: 'STOP_REQUEST',
          tripId,
          stopAddress: stopRequest.address,
          stopPlaceName: stopRequest.placeName || '',
          estimatedAdditionalCost: (stopRequest.estimatedAdditionalCost || 0).toString(),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'trip_updates',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: '📍 Stop Request',
                body: `Rider wants to add a stop: ${stopRequest.placeName || stopRequest.address}`,
              },
              sound: 'default',
            },
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`📱 Stop request notification sent to driver: ${response}`);

      return { success: true };
    } catch (error) {
      console.error('Error sending stop request notification:', error);
      return { success: false, error };
    }
  }
);

/**
 * Send notification when a stop request is approved/declined
 * Notify the rider of the decision
 */
export const onStopDecision = onDocumentUpdated(
  { document: 'trips/{tripId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return null;

    // Check if stop request status changed from pending
    const wasPending = before.pendingStopRequest?.status === 'pending';
    const isApproved = after.pendingStopRequest?.status === 'approved';
    const isDeclined = after.pendingStopRequest?.status === 'declined';

    if (!wasPending || (!isApproved && !isDeclined)) return null;

    const { tripId } = event.params;

    console.log(`📍 Stop ${isApproved ? 'approved' : 'declined'} for trip ${tripId}`);

    try {
      // Get rider's FCM token
      const riderId = after.riderId;
      if (!riderId) return null;

      const userDoc = await db.collection('users').doc(riderId).get();
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken || userData?.pushToken;

      if (!fcmToken) {
        console.log(`No FCM token for rider ${riderId}`);
        return null;
      }

      const stopRequest = after.pendingStopRequest;
      const title = isApproved ? '✅ Stop Approved' : '❌ Stop Declined';
      const body = isApproved
        ? `Your stop at ${stopRequest.placeName || stopRequest.address} has been added.`
        : `Your stop request was declined by the driver.`;

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: 'STOP_DECISION',
          tripId,
          decision: isApproved ? 'approved' : 'declined',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'trip_updates',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
            },
          },
        },
      };

      await messaging.send(message);
      console.log(`📱 Stop decision notification sent to rider`);

      return { success: true };
    } catch (error) {
      console.error('Error sending stop decision notification:', error);
      return { success: false, error };
    }
  }
);

/**
 * Send notification to rider when trip is completed or awaiting tip
 * This is crucial because rider may be on another app
 */
export const onTripCompleted = onDocumentUpdated(
  { document: 'trips/{tripId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return null;

    const { tripId } = event.params;

    // Check if trip just changed to COMPLETED or AWAITING_TIP
    const wasNotComplete = before.status !== 'COMPLETED' && before.status !== 'AWAITING_TIP';
    const isNowComplete = after.status === 'COMPLETED' || after.status === 'AWAITING_TIP';

    if (!wasNotComplete || !isNowComplete) return null;

    console.log(`🏁 Trip ${tripId} completed - notifying rider`);

    try {
      // Get rider's FCM token
      const riderId = after.riderId;
      if (!riderId) return null;

      const userDoc = await db.collection('users').doc(riderId).get();
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken || userData?.pushToken;

      if (!fcmToken) {
        console.log(`No FCM token for rider ${riderId}`);
        return null;
      }

      const finalCost = after.finalCost || after.estimatedCost || 0;
      const driverName = after.driverInfo?.name || 'Your driver';

      const title = '🏁 Trip Completed!';
      const body = after.status === 'AWAITING_TIP'
        ? `${driverName} is waiting. Total: CI$${finalCost.toFixed(2)}. Tap to add a tip and rate.`
        : `Your trip with ${driverName} is complete. Total: CI$${finalCost.toFixed(2)}`;

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: 'TRIP_COMPLETED',
          tripId,
          finalCost: finalCost.toString(),
          status: after.status,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'trip_updates',
            priority: 'max',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`📱 Trip completion notification sent to rider: ${response}`);

      return { success: true };
    } catch (error) {
      console.error('Error sending trip completion notification:', error);
      return { success: false, error };
    }
  }
);

/**
 * Send notification for safety alerts (speed violations, route deviations)
 * Critical for rider safety when they may not be actively watching the app
 */
export const onSafetyAlert = onDocumentCreated(
  { document: 'speedViolations/{violationId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;

    const violationData = snapshot.data();
    const { violationId } = event.params;

    console.log(`⚠️ Speed violation ${violationId} created - notifying rider`);

    try {
      // Get rider's FCM token
      const riderId = violationData.riderId;
      if (!riderId) {
        console.log('No riderId in violation');
        return null;
      }

      const userDoc = await db.collection('users').doc(riderId).get();
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken || userData?.pushToken;

      if (!fcmToken) {
        console.log(`No FCM token for rider ${riderId}`);
        return null;
      }

      const speed = violationData.speed || 0;
      const speedLimit = violationData.speedLimit || 0;

      const title = '⚠️ Speed Alert';
      const body = `Your driver is traveling at ${Math.round(speed)} km/h in a ${speedLimit} km/h zone. Are you okay?`;

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: 'SAFETY_ALERT',
          alertType: 'SPEED_VIOLATION',
          violationId,
          tripId: violationData.tripId || '',
          speed: speed.toString(),
          speedLimit: speedLimit.toString(),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'safety_alerts',
            priority: 'max',
            defaultSound: true,
            defaultVibrateTimings: true,
            icon: 'ic_warning',
            color: '#EF4444',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`📱 Safety alert notification sent to rider: ${response}`);

      return { success: true };
    } catch (error) {
      console.error('Error sending safety alert notification:', error);
      return { success: false, error };
    }
  }
);

/**
 * Send notification to driver when rider cancels during payment
 * This ensures the driver knows they don't need to wait anymore
 */
export const onRiderCancelledDuringPayment = onDocumentUpdated(
  { document: 'trips/{tripId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return null;

    const { tripId } = event.params;

    // Check if trip was cancelled while awaiting payment
    const wasAwaitingPayment = before.status === 'AWAITING_PAYMENT';
    const isNowCancelled = after.status === 'CANCELLED';
    const cancelledByRider = after.cancelledBy === 'RIDER' || after.cancellationReason?.includes('rider');

    if (!wasAwaitingPayment || !isNowCancelled) return null;

    console.log(`❌ Trip ${tripId} cancelled during payment - notifying driver`);

    try {
      // Get driver's FCM token
      const driverId = after.driverId;
      if (!driverId) {
        console.log('No driver assigned to trip');
        return null;
      }

      const driverDoc = await db.collection('drivers').doc(driverId).get();
      const driverData = driverDoc.data();
      const fcmToken = driverData?.fcmToken || driverData?.pushToken;

      if (!fcmToken) {
        console.log(`No FCM token for driver ${driverId}`);
        return null;
      }

      const pickupAddress = after.pickup?.address || 'Unknown';
      const cancellationReason = after.cancellationReason || 'Rider cancelled during payment';

      const title = '❌ Ride Cancelled';
      const body = cancelledByRider
        ? `The rider cancelled before completing payment. Pickup: ${pickupAddress.substring(0, 40)}...`
        : `Trip cancelled: ${cancellationReason.substring(0, 50)}`;

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: 'RIDE_CANCELLED',
          tripId,
          reason: cancellationReason,
          cancelledBy: after.cancelledBy || 'RIDER',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'trip_updates',
            priority: 'max',
            defaultSound: true,
            defaultVibrateTimings: true,
            icon: 'ic_notification',
            color: '#EF4444',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`📱 Cancellation notification sent to driver: ${response}`);

      // Also save the notification to the driver's inbox for persistence
      try {
        const inboxRef = db.collection('drivers').doc(driverId).collection('inbox');
        await inboxRef.add({
          type: 'RIDE_CANCELLED',
          title,
          body,
          tripId,
          pickupAddress,
          cancellationReason,
          cancelledBy: after.cancelledBy || 'RIDER',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`📥 Cancellation saved to driver inbox`);
      } catch (inboxError) {
        console.error('Error saving to inbox:', inboxError);
        // Don't fail the whole function if inbox save fails
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending cancellation notification:', error);
      return { success: false, error };
    }
  }
);

/**
 * Send notification for route deviation alerts
 */
export const onRouteDeviation = onDocumentCreated(
  { document: 'routeDeviations/{deviationId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;

    const deviationData = snapshot.data();
    const { deviationId } = event.params;

    console.log(`🔀 Route deviation ${deviationId} created - notifying rider`);

    try {
      // Get rider's FCM token
      const riderId = deviationData.riderId;
      if (!riderId) {
        console.log('No riderId in deviation');
        return null;
      }

      const userDoc = await db.collection('users').doc(riderId).get();
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken || userData?.pushToken;

      if (!fcmToken) {
        console.log(`No FCM token for rider ${riderId}`);
        return null;
      }

      const title = '🔀 Route Change Detected';
      const body = 'Your driver appears to be taking a different route. Is everything okay?';

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: 'SAFETY_ALERT',
          alertType: 'ROUTE_DEVIATION',
          deviationId,
          tripId: deviationData.tripId || '',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'safety_alerts',
            priority: 'max',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`📱 Route deviation notification sent to rider: ${response}`);

      return { success: true };
    } catch (error) {
      console.error('Error sending route deviation notification:', error);
      return { success: false, error };
    }
  }
);
