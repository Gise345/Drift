/**
 * Live Tracking Types
 *
 * TypeScript interfaces for the Drift live tracking feature.
 * Used by both the mobile app and tracking page.
 */

// ============================================================================
// Location Types
// ============================================================================

/**
 * Basic location coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Location with optional additional data
 */
export interface TrackingLocation extends Coordinates {
  heading?: number;
  speed?: number;
  timestamp?: Date | string;
}

/**
 * Named location with address
 */
export interface NamedLocation extends Coordinates {
  name: string;
  address: string;
}

// ============================================================================
// Vehicle Types
// ============================================================================

/**
 * Vehicle information for display (privacy-conscious)
 * Only shows last 4 digits of license plate
 */
export interface VehicleInfo {
  make: string;
  model: string;
  color: string;
  plateLastFour: string;
}

/**
 * Full vehicle details (for internal use)
 */
export interface VehicleDetails extends VehicleInfo {
  year?: number;
  licensePlate?: string;
  photoUrl?: string;
}

// ============================================================================
// Session Types
// ============================================================================

/**
 * Tracking session status
 */
export type TrackingStatus = 'active' | 'completed' | 'expired';

/**
 * Current phase of the trip
 */
export type TripPhase =
  | 'navigating_to_pickup'
  | 'at_pickup'
  | 'in_progress'
  | 'arriving'
  | 'completed';

/**
 * Complete tracking session
 */
export interface TrackingSession {
  id: string;
  token: string;
  tripId: string;
  driverId: string;
  driverFirstName: string;
  riderId: string;
  riderFirstName: string;
  status: TrackingStatus;
  pickup: NamedLocation;
  dropoff: NamedLocation;
  currentLocation: TrackingLocation | null;
  vehicle: VehicleInfo;
  estimatedArrival: Date | string | null;
  tripPhase: TripPhase;
  createdAt: Date | string;
  updatedAt: Date | string;
  expiresAt: Date | string;
  shareableUrl: string;
}

/**
 * Public session data (returned by getTrackingSession)
 * Excludes sensitive internal IDs
 */
export interface PublicTrackingSession {
  status: TrackingStatus;
  driverFirstName: string;
  riderFirstName: string;
  pickup: NamedLocation;
  dropoff: NamedLocation;
  currentLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    timestamp: string;
  } | null;
  vehicle: VehicleInfo;
  tripPhase: TripPhase;
  estimatedArrival: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Parameters for creating a tracking session
 */
export interface CreateTrackingParams {
  tripId: string;
  pickup: NamedLocation;
  dropoff: NamedLocation;
  driverFirstName: string;
  riderFirstName: string;
  vehicle: VehicleInfo;
  initialLocation?: Coordinates & { heading?: number };
}

/**
 * Parameters for updating tracking location
 */
export interface UpdateLocationParams {
  sessionId: string;
  location: TrackingLocation;
  tripPhase?: TripPhase;
  estimatedMinutes?: number;
}

/**
 * Parameters for completing a session
 */
export interface CompleteSessionParams {
  sessionId?: string;
  tripId?: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response from createTrackingSession
 */
export interface CreateTrackingResponse {
  sessionId: string;
  token: string;
  shareableUrl: string;
  isExisting: boolean;
}

/**
 * Response from updateTrackingLocation
 */
export interface UpdateLocationResponse {
  success: boolean;
  updatedAt: string;
}

/**
 * Response from completeTrackingSession
 */
export interface CompleteSessionResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
}

// ============================================================================
// Contact Types (for sharing)
// ============================================================================

/**
 * Contact from device contacts
 */
export interface TrackingContact {
  id: string;
  name: string;
  phoneNumber: string;
  photoUri?: string;
  isFavorite?: boolean;
}

/**
 * Share target for tracking link
 */
export interface ShareTarget {
  type: 'sms' | 'clipboard' | 'other';
  recipient?: string;
  recipientName?: string;
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * Tracking state for Zustand store
 */
export interface TrackingState {
  // Current session
  activeSession: TrackingSession | null;
  isCreating: boolean;
  isUpdating: boolean;

  // Sharing
  shareUrl: string | null;
  lastSharedTo: TrackingContact[];

  // Update interval
  updateIntervalId: NodeJS.Timeout | null;

  // Error handling
  error: string | null;
}

/**
 * Tracking actions for Zustand store
 */
export interface TrackingActions {
  createSession: (params: CreateTrackingParams) => Promise<CreateTrackingResponse | null>;
  updateLocation: (location: TrackingLocation, tripPhase?: TripPhase, estimatedMinutes?: number) => Promise<boolean>;
  completeSession: (tripId?: string) => Promise<boolean>;
  startAutoUpdate: (intervalMs?: number) => void;
  stopAutoUpdate: () => void;
  shareViaSMS: (phoneNumber: string, recipientName?: string) => Promise<boolean>;
  copyToClipboard: () => Promise<boolean>;
  reset: () => void;
  setError: (error: string | null) => void;
}

/**
 * Complete tracking store type
 */
export type TrackingStore = TrackingState & TrackingActions;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Trip info for creating tracking session
 * Matches the Trip type from trip-store
 */
export interface TripInfo {
  id: string;
  riderId: string;
  riderName: string;
  driverId?: string;
  driverName?: string;
  pickup: NamedLocation;
  dropoff: NamedLocation;
  vehicle?: VehicleDetails;
}

/**
 * Driver location for updates
 */
export interface DriverLocationUpdate {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy?: number;
}
