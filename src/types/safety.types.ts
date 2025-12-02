/**
 * DRIFT SAFETY SYSTEM - TYPE DEFINITIONS
 * Comprehensive types for the safety monitoring, violation tracking,
 * suspension system, and payment dispute handling.
 */

// =============================================================================
// SPEED MONITORING TYPES
// =============================================================================

export interface SpeedReading {
  timestamp: Date;
  speed: number; // mph
  speedLimit: number; // mph
  location: {
    latitude: number;
    longitude: number;
  };
  isViolation: boolean;
  excessSpeed: number; // how much over the limit
}

export interface SpeedViolation {
  id: string;
  tripId: string;
  driverId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  maxSpeed: number;
  speedLimit: number;
  maxExcessSpeed: number;
  averageExcessSpeed: number;
  location: {
    latitude: number;
    longitude: number;
  };
  severity: 'minor' | 'moderate' | 'severe'; // 5-10mph, 10-20mph, 20+mph
}

export type SpeedAlertLevel = 'normal' | 'warning' | 'danger';

export interface SpeedMonitorState {
  currentSpeed: number;
  currentSpeedLimit: number | null;
  alertLevel: SpeedAlertLevel;
  isViolating: boolean;
  violationStartTime: Date | null;
  consecutiveViolationSeconds: number;
}

// =============================================================================
// ROUTE DEVIATION TYPES
// =============================================================================

export interface RouteDeviation {
  id: string;
  tripId: string;
  timestamp: Date;
  plannedLocation: {
    latitude: number;
    longitude: number;
  };
  actualLocation: {
    latitude: number;
    longitude: number;
  };
  deviationDistance: number; // meters
  duration: number; // seconds since deviation started
  riderResponse: 'okay' | 'sos' | 'no_response' | 'pending';
  responseTimestamp?: Date;
  alertShown: boolean;
  autoAlertSent: boolean;
}

export interface RouteDeviationAlert {
  tripId: string;
  deviation: RouteDeviation;
  countdownSeconds: number;
  isActive: boolean;
}

// =============================================================================
// EARLY COMPLETION TYPES
// =============================================================================

export interface EarlyCompletion {
  id: string;
  tripId: string;
  timestamp: Date;
  destinationLocation: {
    latitude: number;
    longitude: number;
  };
  actualLocation: {
    latitude: number;
    longitude: number;
  };
  distanceFromDestination: number; // meters
  riderResponse: 'okay' | 'sos' | 'no_response' | 'pending';
  responseTimestamp?: Date;
  paymentHeld: boolean;
  resolved: boolean;
}

// =============================================================================
// SAFETY VIOLATION TYPES
// =============================================================================

export type ViolationType =
  | 'speed_excessive'
  | 'route_deviation'
  | 'early_completion'
  | 'rider_report'
  | 'unsafe_driving'
  | 'impaired_driving'
  | 'harassment'
  | 'vehicle_condition'
  | 'other';

export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SafetyViolation {
  id: string;
  tripId: string;
  driverId: string;
  riderId: string;
  type: ViolationType;
  severity: ViolationSeverity;
  description: string;
  evidence: ViolationEvidence[];
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  strikeIssued: boolean;
  strikeId?: string;
  status: 'pending' | 'investigating' | 'confirmed' | 'dismissed';
  resolution?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface ViolationEvidence {
  type: 'speed_log' | 'route_deviation' | 'gps_data' | 'chat_log' | 'photo' | 'video' | 'audio' | 'report';
  url?: string;
  data?: any;
  timestamp: Date;
  description?: string;
}

// =============================================================================
// STRIKE & SUSPENSION TYPES
// =============================================================================

export type StrikeType =
  | 'speed_violation'
  | 'route_deviation'
  | 'early_completion'
  | 'rider_report'
  | 'safety_incident'
  | 'terms_violation';

export type StrikeStatus = 'active' | 'expired' | 'appealed' | 'removed';

export interface Strike {
  id: string;
  driverId: string;
  tripId: string;
  type: StrikeType;
  reason: string;
  severity: ViolationSeverity;
  violationId?: string;
  issuedAt: Date;
  expiresAt: Date; // 90 days from issue
  status: StrikeStatus;
  appealId?: string;
  removedAt?: Date;
  removedReason?: string;
}

export type SuspensionStatus = 'active' | 'suspended_temp' | 'suspended_perm';

export interface Suspension {
  id: string;
  driverId: string;
  type: 'temporary' | 'permanent';
  reason: string;
  strikeIds: string[];
  startedAt: Date;
  expiresAt?: Date; // null for permanent
  status: 'active' | 'lifted' | 'expired';
  acknowledgmentRequired: boolean;
  acknowledgedAt?: Date;
  liftedAt?: Date;
  liftedReason?: string;
}

export interface Appeal {
  id: string;
  driverId: string;
  strikeId?: string;
  suspensionId?: string;
  reason: string;
  evidence: ViolationEvidence[];
  submittedAt: Date;
  status: 'pending' | 'under_review' | 'approved' | 'denied';
  reviewedBy?: string;
  reviewedAt?: Date;
  resolution?: string;
  notes?: string;
}

// =============================================================================
// PAYMENT DISPUTE TYPES
// =============================================================================

export type DisputeReason =
  | 'safety_violation'
  | 'terms_breach'
  | 'fraud'
  | 'route_abuse'
  | 'early_completion'
  | 'overcharge'
  | 'service_not_received'
  | 'sos_triggered'
  | 'other';

export type DisputeStatus = 'pending' | 'under_review' | 'approved' | 'denied' | 'escalated';

export interface PaymentDispute {
  id: string;
  tripId: string;
  riderId: string;
  driverId: string;
  amount: number;
  reason: DisputeReason;
  description: string;
  evidence: ViolationEvidence[];
  status: DisputeStatus;
  autoHold: boolean; // true if SOS was pressed
  escrowId?: string;
  resolution?: string;
  refundAmount?: number;
  strikeIssued: boolean;
  strikeId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface PaymentEscrow {
  id: string;
  tripId: string;
  disputeId: string;
  amount: number;
  status: 'held' | 'released_to_driver' | 'refunded_to_rider' | 'partially_refunded';
  createdAt: Date;
  releasedAt?: Date;
  releaseReason?: string;
}

// =============================================================================
// EMERGENCY ALERT TYPES
// =============================================================================

export type EmergencyAlertType =
  | 'sos_pressed'
  | 'route_deviation_sos'
  | 'early_completion_sos'
  | 'no_response_alert'
  | 'panic_button'
  | 'auto_alert';

export interface EmergencyAlert {
  id: string;
  tripId: string;
  userId: string;
  userType: 'rider' | 'driver';
  type: EmergencyAlertType;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  context: {
    speed?: number;
    speedLimit?: number;
    routeDeviation?: number;
    distanceFromDestination?: number;
    driverInfo?: any;
    riderInfo?: any;
  };
  contactsNotified: string[];
  authoritiesContacted: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

// =============================================================================
// SAFETY RATING TYPES
// =============================================================================

export interface SafetyRating {
  tripId: string;
  driverId: string;
  riderId: string;
  overallSafetyScore: number; // 1-5
  trafficLawsFollowed: number; // 1-5
  feltSafe: number; // 1-5
  speedAppropriate: number; // 1-5
  routeAsExpected: number; // 1-5
  comments?: string;
  timestamp: Date;
}

export interface DriverSafetyProfile {
  driverId: string;
  safetyRating: number; // aggregate
  totalSafetyRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  routeAdherenceScore: number; // % of trips with no deviations
  speedComplianceScore: number; // % of trips with no speed violations
  strikes: Strike[];
  activeStrikes: number;
  suspensionStatus: SuspensionStatus;
  currentSuspension?: Suspension;
  badges: SafetyBadge[];
  lastViolation?: Date;
  safeTripsStreak: number;
}

export type SafetyBadgeType =
  | 'safety_champion' // 5.0 rating, 100+ trips
  | 'trusted_driver' // 4.8+ rating
  | 'route_master' // 99%+ route adherence
  | 'speed_conscious' // 100% speed compliance
  | 'streak_50' // 50 trips no violations
  | 'streak_100'; // 100 trips no violations

export interface SafetyBadge {
  type: SafetyBadgeType;
  earnedAt: Date;
  description: string;
}

// =============================================================================
// TRIP SAFETY DATA
// =============================================================================

export interface TripSafetyData {
  tripId: string;
  speeds: SpeedReading[];
  speedViolations: SpeedViolation[];
  routeDeviations: RouteDeviation[];
  earlyCompletion: EarlyCompletion | null;
  emergencyAlerts: EmergencyAlert[];
  riderReports: SafetyViolation[];
  safetyRating?: SafetyRating;
  overallSafetyScore: number; // calculated
  violationCount: number;
  hasUnresolvedIssues: boolean;
}

// =============================================================================
// SAFETY MONITORING STATE
// =============================================================================

export interface SafetyMonitoringState {
  isMonitoring: boolean;
  tripId: string | null;
  speedMonitor: SpeedMonitorState;
  routeDeviationActive: boolean;
  currentDeviation: RouteDeviation | null;
  showDeviationAlert: boolean;
  showEarlyCompletionAlert: boolean;
  earlyCompletion: EarlyCompletion | null;
  alertCountdown: number;
  emergencyMode: boolean;
}

// =============================================================================
// QUICK SAFETY MESSAGES
// =============================================================================

export type QuickSafetyMessageType =
  | 'slow_down'
  | 'why_different_route'
  | 'feel_unsafe'
  | 'great_driving'
  | 'pull_over'
  | 'end_ride_early';

export interface QuickSafetyMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderType: 'rider' | 'driver';
  messageType: QuickSafetyMessageType;
  message: string;
  timestamp: Date;
  read: boolean;
  acknowledged: boolean;
}

// =============================================================================
// ADMIN MODERATION TYPES
// =============================================================================

export interface ModerationAction {
  id: string;
  moderatorId: string;
  targetUserId: string;
  actionType: 'warning' | 'strike' | 'temp_suspension' | 'perm_suspension' | 'lift_suspension' | 'remove_strike';
  reason: string;
  relatedIds: {
    tripId?: string;
    violationId?: string;
    disputeId?: string;
    appealId?: string;
  };
  timestamp: Date;
  notes?: string;
}

export interface ModerationQueue {
  violations: SafetyViolation[];
  disputes: PaymentDispute[];
  appeals: Appeal[];
  flaggedAccounts: string[];
}

// =============================================================================
// LIVE TRIP SHARING TYPES
// =============================================================================

export interface SharedTripLink {
  id: string;
  tripId: string;
  riderId: string;
  shareToken: string;
  expiresAt: Date;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  createdAt: Date;
  lastViewed?: Date;
  viewCount: number;
}

export interface SharedTripView {
  tripId: string;
  driverName: string;
  driverPhoto?: string;
  driverRating: number;
  driverSafetyRating: number;
  vehicleInfo: string;
  vehiclePlate: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  eta: number; // minutes
  currentSpeed: number;
  speedLimit: number | null;
  routeDeviationDetected: boolean;
  lastUpdated: Date;
}

// =============================================================================
// SERVICE RESPONSE TYPES
// =============================================================================

export interface SafetyServiceResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface SpeedLimitResponse {
  speedLimit: number | null;
  roadName?: string;
  placeId?: string;
  source: 'google_roads' | 'cached' | 'default';
}
