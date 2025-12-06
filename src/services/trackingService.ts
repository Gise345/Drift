/**
 * Live Tracking Service
 *
 * Comprehensive service for managing real-time trip tracking in Drift.
 * Handles session creation, location updates, sharing, and cleanup.
 *
 * Features:
 * - Create shareable tracking links
 * - Auto-update location during rides
 * - Share via SMS using expo-sms
 * - Copy link to clipboard
 * - Proper cleanup on session end
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import { firebaseFunctions } from '../config/firebase';
import * as SMS from 'expo-sms';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import type {
  CreateTrackingParams,
  CreateTrackingResponse,
  UpdateLocationParams,
  UpdateLocationResponse,
  CompleteSessionParams,
  CompleteSessionResponse,
  TrackingSession,
  TrackingLocation,
  TripPhase,
  VehicleInfo,
  NamedLocation,
  TripInfo,
} from '../types/tracking';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default update interval for driver location (10 seconds)
 */
const DEFAULT_UPDATE_INTERVAL_MS = 10000;

/**
 * Hosting URL for tracking links (Firebase Hosting production)
 */
const TRACKING_BASE_URL = 'https://drift-global.web.app';

// ============================================================================
// Active Session Management
// ============================================================================

/**
 * Currently active tracking session
 */
let activeSession: TrackingSession | null = null;

/**
 * Interval ID for auto-updates
 */
let updateIntervalId: NodeJS.Timeout | null = null;

/**
 * Get the currently active session
 */
export function getActiveSession(): TrackingSession | null {
  return activeSession;
}

/**
 * Set the active session
 */
export function setActiveSession(session: TrackingSession | null): void {
  activeSession = session;
}

// ============================================================================
// Session Creation
// ============================================================================

/**
 * Create a new tracking session for a trip
 *
 * @param params - Session creation parameters
 * @returns The created session info with shareable URL
 *
 * @example
 * ```typescript
 * const session = await createTrackingSession({
 *   tripId: 'trip_123',
 *   pickup: { name: 'Home', address: '123 Main St', latitude: 19.3, longitude: -81.4 },
 *   dropoff: { name: 'Work', address: '456 Office Blvd', latitude: 19.4, longitude: -81.5 },
 *   driverFirstName: 'John',
 *   riderFirstName: 'Jane',
 *   vehicle: { make: 'Toyota', model: 'Camry', color: 'Silver', plateLastFour: '1234' },
 * });
 * console.log('Share this link:', session.shareableUrl);
 * ```
 */
export async function createTrackingSession(
  params: CreateTrackingParams
): Promise<CreateTrackingResponse | null> {
  try {
    console.log('📍 Creating tracking session for trip:', params.tripId);

    // Call the Cloud Function
    const createSession = firebaseFunctions.httpsCallable('createTrackingSession');
    const result = await createSession(params);
    const data = result.data as CreateTrackingResponse;

    console.log('✅ Tracking session created:', data.sessionId);
    console.log('📎 Shareable URL:', data.shareableUrl);

    // Store the active session locally
    activeSession = {
      id: data.sessionId,
      token: data.token,
      shareableUrl: data.shareableUrl,
      tripId: params.tripId,
      pickup: params.pickup,
      dropoff: params.dropoff,
      driverFirstName: params.driverFirstName,
      riderFirstName: params.riderFirstName,
      vehicle: params.vehicle,
      currentLocation: params.initialLocation ? {
        latitude: params.initialLocation.latitude,
        longitude: params.initialLocation.longitude,
        heading: params.initialLocation.heading,
      } : null,
      status: 'active',
      tripPhase: 'navigating_to_pickup',
      estimatedArrival: null,
      driverId: '',
      riderId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    };

    return data;
  } catch (error) {
    console.error('❌ Error creating tracking session:', error);
    throw error;
  }
}

/**
 * Create tracking session from a Trip object
 * Convenience method that extracts needed info from Trip
 */
export async function createSessionFromTrip(
  trip: TripInfo,
  driverLocation?: { latitude: number; longitude: number; heading?: number }
): Promise<CreateTrackingResponse | null> {
  const vehicle: VehicleInfo = trip.vehicle ? {
    make: trip.vehicle.make || '',
    model: trip.vehicle.model || '',
    color: trip.vehicle.color || '',
    plateLastFour: trip.vehicle.plateLastFour || trip.vehicle.licensePlate?.slice(-4) || '',
  } : {
    make: '',
    model: '',
    color: '',
    plateLastFour: '',
  };

  return createTrackingSession({
    tripId: trip.id,
    pickup: trip.pickup,
    dropoff: trip.dropoff,
    driverFirstName: trip.driverName?.split(' ')[0] || 'Driver',
    riderFirstName: trip.riderName?.split(' ')[0] || 'Rider',
    vehicle,
    initialLocation: driverLocation,
  });
}

// ============================================================================
// Location Updates
// ============================================================================

/**
 * Update the driver's location for the active tracking session
 *
 * @param location - Current driver location
 * @param tripPhase - Optional trip phase update
 * @param estimatedMinutes - Optional ETA in minutes
 * @returns Success status
 */
export async function updateLocation(
  location: TrackingLocation,
  tripPhase?: TripPhase,
  estimatedMinutes?: number
): Promise<boolean> {
  try {
    if (!activeSession) {
      console.log('⚠️ No active tracking session to update');
      return false;
    }

    const params: UpdateLocationParams = {
      sessionId: activeSession.id,
      location,
      tripPhase,
      estimatedMinutes,
    };

    const updateTracking = firebaseFunctions.httpsCallable('updateTrackingLocation');
    const result = await updateTracking(params);
    const data = result.data as UpdateLocationResponse;

    if (data.success) {
      // Update local session state
      activeSession.currentLocation = location;
      activeSession.updatedAt = new Date(data.updatedAt);
      if (tripPhase) {
        activeSession.tripPhase = tripPhase;
      }
      console.log('📍 Location updated at:', data.updatedAt);
    }

    return data.success;
  } catch (error) {
    console.error('❌ Error updating tracking location:', error);
    return false;
  }
}

/**
 * Update location using device's current position
 * Convenience method that gets location and sends update
 */
export async function updateLocationFromDevice(
  tripPhase?: TripPhase,
  estimatedMinutes?: number
): Promise<boolean> {
  try {
    // Get current location from device
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('⚠️ Location permission not granted');
      return false;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return updateLocation(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: new Date(location.timestamp),
      },
      tripPhase,
      estimatedMinutes
    );
  } catch (error) {
    console.error('❌ Error getting device location:', error);
    return false;
  }
}

// ============================================================================
// Auto-Update Management
// ============================================================================

/**
 * Start automatic location updates for the active session
 *
 * @param intervalMs - Update interval in milliseconds (default 10 seconds)
 * @param getTripPhase - Optional callback to get current trip phase
 * @param getEstimatedMinutes - Optional callback to get current ETA
 */
export function startAutoUpdate(
  intervalMs: number = DEFAULT_UPDATE_INTERVAL_MS,
  getTripPhase?: () => TripPhase,
  getEstimatedMinutes?: () => number
): void {
  // Clear any existing interval
  stopAutoUpdate();

  if (!activeSession) {
    console.log('⚠️ No active session, cannot start auto-update');
    return;
  }

  console.log('🔄 Starting auto-update with interval:', intervalMs, 'ms');

  updateIntervalId = setInterval(async () => {
    if (!activeSession || activeSession.status !== 'active') {
      stopAutoUpdate();
      return;
    }

    const tripPhase = getTripPhase?.();
    const estimatedMinutes = getEstimatedMinutes?.();

    await updateLocationFromDevice(tripPhase, estimatedMinutes);
  }, intervalMs);

  // Do an immediate update
  updateLocationFromDevice(getTripPhase?.(), getEstimatedMinutes?.());
}

/**
 * Stop automatic location updates
 */
export function stopAutoUpdate(): void {
  if (updateIntervalId) {
    console.log('⏹️ Stopping auto-update');
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
}

/**
 * Check if auto-update is running
 */
export function isAutoUpdateRunning(): boolean {
  return updateIntervalId !== null;
}

// ============================================================================
// Session Completion
// ============================================================================

/**
 * Complete a tracking session
 *
 * @param sessionId - Session ID (optional if tripId provided)
 * @param tripId - Trip ID (alternative to sessionId)
 * @returns Success status
 */
export async function completeSession(
  sessionId?: string,
  tripId?: string
): Promise<boolean> {
  try {
    // Stop auto-updates
    stopAutoUpdate();

    // Use active session if no IDs provided
    const params: CompleteSessionParams = {
      sessionId: sessionId || activeSession?.id,
      tripId: tripId || activeSession?.tripId,
    };

    if (!params.sessionId && !params.tripId) {
      console.log('⚠️ No session or trip ID to complete');
      return false;
    }

    console.log('🏁 Completing tracking session');

    const completeTracking = firebaseFunctions.httpsCallable('completeTrackingSession');
    const result = await completeTracking(params);
    const data = result.data as CompleteSessionResponse;

    if (data.success) {
      console.log('✅ Tracking session completed:', data.sessionId || params.sessionId);
      activeSession = null;
    }

    return data.success;
  } catch (error) {
    console.error('❌ Error completing tracking session:', error);
    return false;
  }
}

/**
 * Complete tracking session by trip ID
 * Convenience method for when trip ends
 */
export async function completeSessionByTrip(tripId: string): Promise<boolean> {
  return completeSession(undefined, tripId);
}

// ============================================================================
// Sharing Functions
// ============================================================================

/**
 * Share the tracking link via SMS
 *
 * @param phoneNumber - Recipient phone number
 * @param recipientName - Optional recipient name for personalized message
 * @returns Success status
 */
export async function shareTrackingViaSMS(
  phoneNumber: string,
  recipientName?: string
): Promise<boolean> {
  try {
    if (!activeSession?.shareableUrl) {
      console.log('⚠️ No active session or URL to share');
      return false;
    }

    // Check if SMS is available
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      console.log('⚠️ SMS is not available on this device');
      return false;
    }

    // Build the message
    const greeting = recipientName ? `Hi ${recipientName}!` : 'Hi!';
    const message = `${greeting} 🚗

I'm sharing my Drift ride with you so you can track my journey in real-time.

${activeSession.riderFirstName} is riding with ${activeSession.driverFirstName}.

📍 From: ${activeSession.pickup.name}
📍 To: ${activeSession.dropoff.name}

Track my ride here:
${activeSession.shareableUrl}

- Sent from Drift`;

    // Send SMS
    const { result } = await SMS.sendSMSAsync([phoneNumber], message);

    console.log('📱 SMS result:', result);

    return result === 'sent' || result === 'unknown'; // 'unknown' on Android means it was queued
  } catch (error) {
    console.error('❌ Error sharing via SMS:', error);
    return false;
  }
}

/**
 * Copy the tracking link to clipboard
 *
 * @returns Success status
 */
export async function copyTrackingLink(): Promise<boolean> {
  try {
    if (!activeSession?.shareableUrl) {
      console.log('⚠️ No active session or URL to copy');
      return false;
    }

    await Clipboard.setStringAsync(activeSession.shareableUrl);
    console.log('📋 Tracking link copied to clipboard');
    return true;
  } catch (error) {
    console.error('❌ Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Get a formatted share message for manual sharing
 */
export function getShareMessage(): string | null {
  if (!activeSession?.shareableUrl) {
    return null;
  }

  return `Track my Drift ride: ${activeSession.shareableUrl}`;
}

/**
 * Get the shareable URL for the active session
 */
export function getShareableUrl(): string | null {
  return activeSession?.shareableUrl || null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build a tracking URL from a token/session ID
 */
export function buildTrackingUrl(token: string): string {
  return `${TRACKING_BASE_URL}/track?session=${token}`;
}

/**
 * Extract privacy-safe vehicle info from full vehicle details
 */
export function getPrivacySafeVehicleInfo(
  vehicle: {
    make?: string;
    model?: string;
    color?: string;
    licensePlate?: string;
    plateLastFour?: string;
  }
): VehicleInfo {
  return {
    make: vehicle.make || '',
    model: vehicle.model || '',
    color: vehicle.color || '',
    plateLastFour: vehicle.plateLastFour || vehicle.licensePlate?.slice(-4) || '',
  };
}

/**
 * Get first name from full name (for privacy)
 */
export function getFirstName(fullName: string): string {
  return fullName?.split(' ')[0] || '';
}

/**
 * Format ETA for display
 */
export function formatETA(estimatedArrival: Date | string | null): string {
  if (!estimatedArrival) {
    return 'Calculating...';
  }

  const arrival = typeof estimatedArrival === 'string'
    ? new Date(estimatedArrival)
    : estimatedArrival;

  const now = new Date();
  const diffMs = arrival.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 0) {
    return 'Arriving now';
  } else if (diffMinutes === 1) {
    return '1 minute';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Get trip phase display text
 */
export function getTripPhaseText(phase: TripPhase): string {
  switch (phase) {
    case 'navigating_to_pickup':
      return 'Heading to pickup';
    case 'at_pickup':
      return 'At pickup location';
    case 'in_progress':
      return 'Trip in progress';
    case 'arriving':
      return 'Almost there';
    case 'completed':
      return 'Trip completed';
    default:
      return 'Unknown';
  }
}

/**
 * Check if tracking session is still valid
 */
export function isSessionValid(): boolean {
  if (!activeSession) {
    return false;
  }

  if (activeSession.status !== 'active') {
    return false;
  }

  const expiresAt = typeof activeSession.expiresAt === 'string'
    ? new Date(activeSession.expiresAt)
    : activeSession.expiresAt;

  return expiresAt > new Date();
}

/**
 * Reset all tracking state
 */
export function resetTracking(): void {
  stopAutoUpdate();
  activeSession = null;
  console.log('🔄 Tracking state reset');
}

// ============================================================================
// Export Default Service Object
// ============================================================================

const trackingService = {
  // Session management
  createSession: createTrackingSession,
  createSessionFromTrip,
  completeSession,
  completeSessionByTrip,
  getActiveSession,
  setActiveSession,
  isSessionValid,
  resetTracking,

  // Location updates
  updateLocation,
  updateLocationFromDevice,
  startAutoUpdate,
  stopAutoUpdate,
  isAutoUpdateRunning,

  // Sharing
  shareViaSMS: shareTrackingViaSMS,
  copyLink: copyTrackingLink,
  getShareMessage,
  getShareableUrl,
  buildTrackingUrl,

  // Utilities
  getPrivacySafeVehicleInfo,
  getFirstName,
  formatETA,
  getTripPhaseText,
};

export default trackingService;
