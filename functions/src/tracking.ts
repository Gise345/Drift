/**
 * FIREBASE CLOUD FUNCTIONS - LIVE TRACKING
 * Real-time location sharing for Drift rideshare app
 *
 * Deploy: firebase deploy --only functions
 *
 * Features:
 * - Create shareable tracking links with unique tokens
 * - Update driver location in real-time
 * - Complete tracking sessions when ride ends
 * - Automatic cleanup of expired sessions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Using 'main' database (restored from backup)
const db = getFirestore(admin.app(), 'main');

/**
 * Common options for all callable functions
 * invoker: 'public' allows any caller to invoke the function at the Cloud Run level
 * Authentication is still enforced within the function via request.auth
 */
const callableOptions = {
  region: 'us-east1' as const,
  invoker: 'public' as const,
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Location coordinates for tracking
 */
interface TrackingLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: admin.firestore.Timestamp;
}

/**
 * Vehicle information for display (privacy-conscious)
 */
interface VehicleInfo {
  make: string;
  model: string;
  color: string;
  plateLastFour: string; // Only last 4 characters for privacy
}

/**
 * Tracking session status
 */
type TrackingStatus = 'active' | 'completed' | 'expired';

/**
 * Complete tracking session document structure
 */
interface TrackingSession {
  id: string;
  token: string;
  tripId: string;
  driverId: string;
  driverFirstName: string; // First name only for privacy
  riderId: string;
  riderFirstName: string;
  status: TrackingStatus;
  pickup: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  currentLocation: TrackingLocation | null;
  vehicle: VehicleInfo;
  estimatedArrival: admin.firestore.Timestamp | null;
  tripPhase: 'navigating_to_pickup' | 'at_pickup' | 'in_progress' | 'arriving' | 'completed';
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  shareableUrl: string;
}

/**
 * Request payload for creating a tracking session
 */
interface CreateTrackingRequest {
  tripId: string;
  pickup: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  driverFirstName: string;
  riderFirstName: string;
  vehicle: VehicleInfo;
  initialLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
  };
}

/**
 * Request payload for updating location
 */
interface UpdateLocationRequest {
  sessionId: string;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  };
  tripPhase?: TrackingSession['tripPhase'];
  estimatedMinutes?: number;
}

/**
 * Request payload for completing a session
 */
interface CompleteSessionRequest {
  sessionId: string;
  tripId?: string; // Alternative: complete by tripId
}

// ============================================================================
// Configuration
// ============================================================================

// Base URL for tracking links - replace with your Firebase Hosting URL
const HOSTING_BASE_URL = process.env.TRACKING_BASE_URL || 'https://drift-cayman.web.app';

// Session expires after 4 hours (covers long trips + buffer)
const SESSION_EXPIRY_HOURS = 4;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique, URL-safe token for tracking sessions
 */
function generateToken(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Calculate expiration timestamp
 */
function getExpirationTime(): admin.firestore.Timestamp {
  const now = new Date();
  now.setHours(now.getHours() + SESSION_EXPIRY_HOURS);
  return admin.firestore.Timestamp.fromDate(now);
}

/**
 * Build the shareable tracking URL
 */
function buildTrackingUrl(token: string): string {
  return `${HOSTING_BASE_URL}/track/${token}`;
}

// ============================================================================
// Cloud Functions
// ============================================================================

/**
 * CREATE TRACKING SESSION
 *
 * Creates a new tracking session with a unique shareable link.
 * Called when a rider wants to share their trip with friends/family.
 *
 * @param request.tripId - The trip ID being tracked
 * @param request.pickup - Pickup location details
 * @param request.dropoff - Dropoff location details
 * @param request.driverFirstName - Driver's first name (privacy)
 * @param request.riderFirstName - Rider's first name
 * @param request.vehicle - Vehicle information
 * @param request.initialLocation - Optional initial driver location
 *
 * @returns { sessionId, token, shareableUrl }
 */
export const createTrackingSession = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as CreateTrackingRequest;
    const userId = request.auth.uid;

    console.log('📍 Creating tracking session for trip:', data.tripId);

    // Validate required fields
    if (!data.tripId) {
      throw new HttpsError('invalid-argument', 'Trip ID is required');
    }
    if (!data.pickup || !data.dropoff) {
      throw new HttpsError('invalid-argument', 'Pickup and dropoff locations are required');
    }
    if (!data.vehicle) {
      throw new HttpsError('invalid-argument', 'Vehicle information is required');
    }

    // Check if session already exists for this trip
    const existingSession = await db
      .collection('trackingSessions')
      .where('tripId', '==', data.tripId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!existingSession.empty) {
      const existing = existingSession.docs[0].data() as TrackingSession;
      console.log('✅ Returning existing tracking session:', existing.id);
      return {
        sessionId: existing.id,
        token: existing.token,
        shareableUrl: existing.shareableUrl,
        isExisting: true,
      };
    }

    // Get trip details to verify ownership and get driver info
    const tripDoc = await db.collection('trips').doc(data.tripId).get();

    if (!tripDoc.exists) {
      throw new HttpsError('not-found', 'Trip not found');
    }

    const tripData = tripDoc.data();

    // Verify user is either the rider or driver for this trip
    const isRider = tripData?.riderId === userId;
    const isDriver = tripData?.driverId === userId;

    if (!isRider && !isDriver) {
      throw new HttpsError('permission-denied', 'You are not authorized to create tracking for this trip');
    }

    // Generate unique token and session ID
    const token = generateToken();
    const sessionId = `track_${data.tripId}_${Date.now()}`;
    const shareableUrl = buildTrackingUrl(token);
    const now = admin.firestore.Timestamp.now();

    // Build initial location if provided
    let currentLocation: TrackingLocation | null = null;
    if (data.initialLocation) {
      currentLocation = {
        latitude: data.initialLocation.latitude,
        longitude: data.initialLocation.longitude,
        heading: data.initialLocation.heading,
        timestamp: now,
      };
    }

    // Create the tracking session document
    const session: TrackingSession = {
      id: sessionId,
      token,
      tripId: data.tripId,
      driverId: tripData?.driverId || '',
      driverFirstName: data.driverFirstName || 'Driver',
      riderId: tripData?.riderId || userId,
      riderFirstName: data.riderFirstName || 'Rider',
      status: 'active',
      pickup: {
        name: data.pickup.name || 'Pickup',
        address: data.pickup.address || '',
        latitude: data.pickup.latitude,
        longitude: data.pickup.longitude,
      },
      dropoff: {
        name: data.dropoff.name || 'Dropoff',
        address: data.dropoff.address || '',
        latitude: data.dropoff.latitude,
        longitude: data.dropoff.longitude,
      },
      currentLocation,
      vehicle: {
        make: data.vehicle.make || '',
        model: data.vehicle.model || '',
        color: data.vehicle.color || '',
        plateLastFour: data.vehicle.plateLastFour || '',
      },
      estimatedArrival: null,
      tripPhase: 'navigating_to_pickup',
      createdAt: now,
      updatedAt: now,
      expiresAt: getExpirationTime(),
      shareableUrl,
    };

    // Save to Firestore
    await db
      .collection('trackingSessions')
      .doc(sessionId)
      .set(session);

    console.log('✅ Created tracking session:', sessionId);
    console.log('📎 Shareable URL:', shareableUrl);

    return {
      sessionId,
      token,
      shareableUrl,
      isExisting: false,
    };
  } catch (error: unknown) {
    console.error('❌ Error creating tracking session:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to create tracking session',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

/**
 * UPDATE TRACKING LOCATION
 *
 * Updates the driver's current location for an active tracking session.
 * Called by the driver app at regular intervals (every 10 seconds).
 *
 * @param request.sessionId - The tracking session ID
 * @param request.location - Current location coordinates
 * @param request.tripPhase - Current phase of the trip
 * @param request.estimatedMinutes - Estimated minutes to arrival
 */
export const updateTrackingLocation = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as UpdateLocationRequest;
    const userId = request.auth.uid;

    // Validate required fields
    if (!data.sessionId) {
      throw new HttpsError('invalid-argument', 'Session ID is required');
    }
    if (!data.location || typeof data.location.latitude !== 'number') {
      throw new HttpsError('invalid-argument', 'Valid location is required');
    }

    // Get the session
    const sessionRef = db.collection('trackingSessions').doc(data.sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new HttpsError('not-found', 'Tracking session not found');
    }

    const session = sessionDoc.data() as TrackingSession;

    // Verify user is the driver
    if (session.driverId !== userId) {
      throw new HttpsError('permission-denied', 'Only the driver can update location');
    }

    // Check if session is still active
    if (session.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Session is no longer active');
    }

    // Check if session has expired
    if (session.expiresAt.toDate() < new Date()) {
      await sessionRef.update({ status: 'expired' });
      throw new HttpsError('failed-precondition', 'Session has expired');
    }

    const now = admin.firestore.Timestamp.now();

    // Build update object
    const updateData: Partial<TrackingSession> = {
      currentLocation: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        heading: data.location.heading,
        speed: data.location.speed,
        timestamp: now,
      },
      updatedAt: now,
    };

    // Update trip phase if provided
    if (data.tripPhase) {
      updateData.tripPhase = data.tripPhase;
    }

    // Update estimated arrival if provided
    if (data.estimatedMinutes !== undefined && data.estimatedMinutes >= 0) {
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() + data.estimatedMinutes);
      updateData.estimatedArrival = admin.firestore.Timestamp.fromDate(arrivalTime);
    }

    // Update the session
    await sessionRef.update(updateData);

    console.log('📍 Updated location for session:', data.sessionId);

    return { success: true, updatedAt: now.toDate().toISOString() };
  } catch (error: unknown) {
    console.error('❌ Error updating tracking location:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to update tracking location',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

/**
 * COMPLETE TRACKING SESSION
 *
 * Marks a tracking session as completed when the ride ends.
 * Called when the trip is completed or cancelled.
 *
 * @param request.sessionId - The tracking session ID (optional if tripId provided)
 * @param request.tripId - The trip ID (alternative to sessionId)
 */
export const completeTrackingSession = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as CompleteSessionRequest;
    const userId = request.auth.uid;

    // Validate input
    if (!data.sessionId && !data.tripId) {
      throw new HttpsError('invalid-argument', 'Session ID or Trip ID is required');
    }

    let sessionRef: FirebaseFirestore.DocumentReference;
    let session: TrackingSession;

    if (data.sessionId) {
      // Find by session ID
      sessionRef = db.collection('trackingSessions').doc(data.sessionId);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        throw new HttpsError('not-found', 'Tracking session not found');
      }

      session = sessionDoc.data() as TrackingSession;
    } else {
      // Find by trip ID
      const sessionsQuery = await db
        .collection('trackingSessions')
        .where('tripId', '==', data.tripId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (sessionsQuery.empty) {
        // No active session found - this is ok, might have already been completed
        console.log('ℹ️ No active session found for trip:', data.tripId);
        return { success: true, message: 'No active session found' };
      }

      const sessionDoc = sessionsQuery.docs[0];
      sessionRef = sessionDoc.ref;
      session = sessionDoc.data() as TrackingSession;
    }

    // Verify user is the rider or driver
    const isRider = session.riderId === userId;
    const isDriver = session.driverId === userId;

    if (!isRider && !isDriver) {
      throw new HttpsError('permission-denied', 'Not authorized to complete this session');
    }

    // Check if already completed
    if (session.status === 'completed') {
      console.log('ℹ️ Session already completed:', session.id);
      return { success: true, message: 'Session already completed' };
    }

    // Update the session
    await sessionRef.update({
      status: 'completed',
      tripPhase: 'completed',
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log('✅ Completed tracking session:', session.id);

    return { success: true, sessionId: session.id };
  } catch (error: unknown) {
    console.error('❌ Error completing tracking session:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to complete tracking session',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

/**
 * GET TRACKING SESSION BY TOKEN
 *
 * Retrieves a tracking session by its public token.
 * This is called by the public tracking page to display trip info.
 * No authentication required - the token serves as the access key.
 *
 * @param request.token - The unique tracking token
 */
export const getTrackingSession = onCall(callableOptions, async (request) => {
  try {
    const { token } = request.data as { token: string };

    if (!token) {
      throw new HttpsError('invalid-argument', 'Token is required');
    }

    console.log('🔍 Looking up tracking session by token');

    // Find session by token
    const sessionsQuery = await db
      .collection('trackingSessions')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (sessionsQuery.empty) {
      throw new HttpsError('not-found', 'Tracking session not found');
    }

    const session = sessionsQuery.docs[0].data() as TrackingSession;

    // Check if expired
    if (session.expiresAt.toDate() < new Date() && session.status === 'active') {
      // Update status to expired
      await sessionsQuery.docs[0].ref.update({ status: 'expired' });
      session.status = 'expired';
    }

    // Return sanitized session data (no internal IDs exposed)
    return {
      status: session.status,
      driverFirstName: session.driverFirstName,
      riderFirstName: session.riderFirstName,
      pickup: session.pickup,
      dropoff: session.dropoff,
      currentLocation: session.currentLocation ? {
        latitude: session.currentLocation.latitude,
        longitude: session.currentLocation.longitude,
        heading: session.currentLocation.heading,
        timestamp: session.currentLocation.timestamp.toDate().toISOString(),
      } : null,
      vehicle: session.vehicle,
      tripPhase: session.tripPhase,
      estimatedArrival: session.estimatedArrival?.toDate().toISOString() || null,
      createdAt: session.createdAt.toDate().toISOString(),
      updatedAt: session.updatedAt.toDate().toISOString(),
    };
  } catch (error: unknown) {
    console.error('❌ Error getting tracking session:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Failed to get tracking session',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

/**
 * CLEANUP EXPIRED SESSIONS
 *
 * Scheduled function that runs daily to clean up expired tracking sessions.
 * Marks expired sessions and deletes very old sessions (7+ days).
 *
 * Schedule: Every day at 3:00 AM UTC
 */
export const cleanupExpiredSessions = onSchedule({
  schedule: '0 3 * * *', // Daily at 3 AM UTC
  timeZone: 'UTC',
  retryCount: 3,
  region: 'us-east1',
}, async () => {
  console.log('🧹 Starting cleanup of expired tracking sessions');

  const now = admin.firestore.Timestamp.now();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // 1. Mark expired active sessions
    const expiredActiveQuery = await db
      .collection('trackingSessions')
      .where('status', '==', 'active')
      .where('expiresAt', '<', now)
      .get();

    let expiredCount = 0;
    const expireBatch = db.batch();

    expiredActiveQuery.docs.forEach((doc) => {
      expireBatch.update(doc.ref, {
        status: 'expired',
        updatedAt: now,
      });
      expiredCount++;
    });

    if (expiredCount > 0) {
      await expireBatch.commit();
      console.log(`✅ Marked ${expiredCount} sessions as expired`);
    }

    // 2. Delete very old sessions (7+ days old)
    const oldSessionsQuery = await db
      .collection('trackingSessions')
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();

    let deletedCount = 0;
    const deleteBatch = db.batch();

    oldSessionsQuery.docs.forEach((doc) => {
      deleteBatch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await deleteBatch.commit();
      console.log(`🗑️ Deleted ${deletedCount} old sessions`);
    }

    console.log(`✅ Cleanup completed successfully - expired: ${expiredCount}, deleted: ${deletedCount}`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
});
