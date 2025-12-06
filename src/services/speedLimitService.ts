/**
 * DRIFT SPEED LIMIT SERVICE
 * Fetches speed limits from Google Roads API and manages speed monitoring
 *
 * Features:
 * - Speed smoothing for accurate readings
 * - Cached speed limits to reduce API calls
 * - Violation tracking and logging
 * - Driver profile violation recording
 */

import {
  SpeedReading,
  SpeedViolation,
  SpeedMonitorState,
  SpeedAlertLevel,
  SpeedLimitResponse,
  SafetyServiceResponse,
} from '@/src/types/safety.types';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp
} from '@react-native-firebase/firestore';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

const GOOGLE_ROADS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Speed violation thresholds
const SPEED_WARNING_THRESHOLD = 3; // mph over limit = yellow warning
const SPEED_DANGER_THRESHOLD = 6; // mph over limit = red danger (triggers popup alert)
const VIOLATION_DURATION_THRESHOLD = 10; // seconds to log as violation
const STRIKES_PER_TRIP_THRESHOLD = 3; // violations per trip that trigger strike

// Speed smoothing configuration
const SPEED_SMOOTHING_WINDOW = 5; // Number of readings to average
const SPEED_UPDATE_INTERVAL = 1000; // 1 second for smoother updates

// Cache for speed limits to reduce API calls
const speedLimitCache: Map<string, { speedLimit: number; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Speed readings buffer for smoothing
let speedReadingsBuffer: number[] = [];

/**
 * Convert m/s to mph
 */
export function metersPerSecondToMph(mps: number): number {
  return mps * 2.237;
}

/**
 * Convert km/h to mph
 */
export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

/**
 * Apply exponential smoothing to speed readings for more stable display
 * Uses a weighted moving average to reduce GPS noise
 */
export function smoothSpeed(newSpeed: number): number {
  // Add new reading to buffer
  speedReadingsBuffer.push(newSpeed);

  // Keep only the last N readings
  if (speedReadingsBuffer.length > SPEED_SMOOTHING_WINDOW) {
    speedReadingsBuffer = speedReadingsBuffer.slice(-SPEED_SMOOTHING_WINDOW);
  }

  // Calculate weighted average (more recent readings have higher weight)
  let totalWeight = 0;
  let weightedSum = 0;

  speedReadingsBuffer.forEach((speed, index) => {
    const weight = index + 1; // Weight increases with recency
    weightedSum += speed * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : newSpeed;
}

/**
 * Reset speed smoothing buffer (call when starting new trip)
 */
export function resetSpeedSmoothing(): void {
  speedReadingsBuffer = [];
}

/**
 * Get a cache key for a location (rounded to ~100m precision)
 */
function getCacheKey(latitude: number, longitude: number): string {
  const latRounded = Math.round(latitude * 1000) / 1000;
  const lngRounded = Math.round(longitude * 1000) / 1000;
  return `${latRounded},${lngRounded}`;
}

/**
 * Fetch speed limit from Google Roads API
 * Uses Snap to Roads to get road information including speed limit
 */
export async function getSpeedLimit(
  latitude: number,
  longitude: number
): Promise<SpeedLimitResponse> {
  const cacheKey = getCacheKey(latitude, longitude);

  // Check cache first
  const cached = speedLimitCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      speedLimit: cached.speedLimit,
      source: 'cached',
    };
  }

  if (!GOOGLE_ROADS_API_KEY) {
    console.warn('Google Roads API key not configured, using default speed limit');
    return {
      speedLimit: 35, // Default urban speed limit
      source: 'default',
    };
  }

  try {
    // Use Google Roads API - Speed Limits endpoint
    const url = `https://roads.googleapis.com/v1/speedLimits?path=${latitude},${longitude}&key=${GOOGLE_ROADS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.warn('Google Roads API error:', data.error.message);
      // Return default based on location type
      return getDefaultSpeedLimit(latitude, longitude);
    }

    if (data.speedLimits && data.speedLimits.length > 0) {
      // Speed limit is returned in km/h, convert to mph
      const speedLimitKmh = data.speedLimits[0].speedLimit;
      const speedLimitMph = Math.round(kmhToMph(speedLimitKmh));

      // Cache the result
      speedLimitCache.set(cacheKey, {
        speedLimit: speedLimitMph,
        timestamp: Date.now(),
      });

      return {
        speedLimit: speedLimitMph,
        roadName: data.snappedPoints?.[0]?.placeId,
        placeId: data.speedLimits[0].placeId,
        source: 'google_roads',
      };
    }

    // No speed limit data available, use default
    return getDefaultSpeedLimit(latitude, longitude);
  } catch (error) {
    console.error('Failed to fetch speed limit:', error);
    return getDefaultSpeedLimit(latitude, longitude);
  }
}

/**
 * Get default speed limit based on location context
 * Uses a simpler heuristic when API data isn't available
 */
async function getDefaultSpeedLimit(
  latitude: number,
  longitude: number
): Promise<SpeedLimitResponse> {
  // Cayman Islands typical speed limits:
  // - Urban areas: 25-30 mph
  // - Main roads: 40 mph
  // - Highways: 50 mph

  // For now, use a conservative default
  // In production, could use reverse geocoding to determine road type
  return {
    speedLimit: 35,
    source: 'default',
  };
}

/**
 * Determine the alert level based on current speed vs limit
 */
export function getSpeedAlertLevel(
  currentSpeed: number,
  speedLimit: number
): SpeedAlertLevel {
  const excess = currentSpeed - speedLimit;

  if (excess <= 0) {
    return 'normal';
  } else if (excess < SPEED_DANGER_THRESHOLD) {
    return 'warning'; // Yellow - 3-6 mph over
  } else {
    return 'danger'; // Red - 6+ mph over
  }
}

/**
 * Check if current speed constitutes a violation
 */
export function isSpeedViolation(currentSpeed: number, speedLimit: number): boolean {
  return currentSpeed > speedLimit + SPEED_DANGER_THRESHOLD;
}

/**
 * Get violation severity based on excess speed
 */
export function getViolationSeverity(
  excessSpeed: number
): 'minor' | 'moderate' | 'severe' {
  if (excessSpeed < 10) return 'minor';
  if (excessSpeed < 20) return 'moderate';
  return 'severe';
}

/**
 * Create a speed reading record
 */
export function createSpeedReading(
  speed: number,
  speedLimit: number,
  latitude: number,
  longitude: number
): SpeedReading {
  const isViolation = isSpeedViolation(speed, speedLimit);

  return {
    timestamp: new Date(),
    speed: Math.round(speed),
    speedLimit,
    location: { latitude, longitude },
    isViolation,
    excessSpeed: isViolation ? Math.round(speed - speedLimit) : 0,
  };
}

/**
 * Process speed readings and create violation if threshold exceeded
 */
export function processSpeedViolation(
  readings: SpeedReading[],
  tripId: string,
  driverId: string
): SpeedViolation | null {
  // Filter to only violation readings
  const violationReadings = readings.filter((r) => r.isViolation);

  if (violationReadings.length === 0) {
    return null;
  }

  // Check if violations span at least VIOLATION_DURATION_THRESHOLD seconds
  const firstReading = violationReadings[0];
  const lastReading = violationReadings[violationReadings.length - 1];
  const duration =
    (lastReading.timestamp.getTime() - firstReading.timestamp.getTime()) / 1000;

  if (duration < VIOLATION_DURATION_THRESHOLD) {
    return null;
  }

  // Calculate violation stats
  const speeds = violationReadings.map((r) => r.speed);
  const maxSpeed = Math.max(...speeds);
  const avgExcessSpeed =
    violationReadings.reduce((sum, r) => sum + r.excessSpeed, 0) /
    violationReadings.length;
  const speedLimit = firstReading.speedLimit;

  return {
    id: `spd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tripId,
    driverId,
    startTime: firstReading.timestamp,
    endTime: lastReading.timestamp,
    duration: Math.round(duration),
    maxSpeed,
    speedLimit,
    maxExcessSpeed: maxSpeed - speedLimit,
    averageExcessSpeed: Math.round(avgExcessSpeed),
    location: lastReading.location,
    severity: getViolationSeverity(maxSpeed - speedLimit),
  };
}

/**
 * Log speed violation to Firestore (trip + driver profile)
 */
export async function logSpeedViolation(
  tripId: string,
  violation: SpeedViolation
): Promise<SafetyServiceResponse> {
  try {
    const tripRef = doc(db, 'trips', tripId);

    // Add to trip's safety data
    await updateDoc(tripRef, {
      'safetyData.speedViolations': arrayUnion(violation),
      updatedAt: serverTimestamp(),
    });

    // Also record in driver's profile
    await recordViolationInDriverProfile(violation);

    console.log('📊 Speed violation logged:', violation.id);
    return { success: true };
  } catch (error) {
    console.error('Failed to log speed violation:', error);
    return {
      success: false,
      error: 'Failed to log speed violation',
    };
  }
}

/**
 * Record speed violation in driver's profile for admin monitoring
 */
export async function recordViolationInDriverProfile(
  violation: SpeedViolation
): Promise<void> {
  try {
    const driverRef = doc(db, 'drivers', violation.driverId);

    // Create violation record for driver profile
    const violationRecord = {
      id: violation.id,
      tripId: violation.tripId,
      timestamp: serverTimestamp(),
      maxSpeed: violation.maxSpeed,
      speedLimit: violation.speedLimit,
      maxExcessSpeed: violation.maxExcessSpeed,
      duration: violation.duration,
      severity: violation.severity,
      location: violation.location,
    };

    // Update driver's speedViolations array and total count
    await updateDoc(driverRef, {
      'safetyData.speedViolations': arrayUnion(violationRecord),
      'safetyData.totalSpeedViolations': increment(1),
      'safetyData.lastViolationAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('📊 Violation recorded in driver profile:', violation.driverId);
  } catch (error) {
    console.error('Failed to record violation in driver profile:', error);
  }
}

/**
 * Log speed reading to trip's safety data
 */
export async function logSpeedReading(
  tripId: string,
  reading: SpeedReading
): Promise<void> {
  try {
    const tripRef = doc(db, 'trips', tripId);

    await updateDoc(tripRef, {
      'safetyData.speeds': arrayUnion(reading),
    });
  } catch (error) {
    console.error('Failed to log speed reading:', error);
  }
}

/**
 * Check if trip has enough violations to warrant a strike
 */
export function shouldIssueStrike(violationCount: number): boolean {
  return violationCount >= STRIKES_PER_TRIP_THRESHOLD;
}

/**
 * Get color for speed display based on alert level
 */
export function getSpeedColor(alertLevel: SpeedAlertLevel): string {
  switch (alertLevel) {
    case 'normal':
      return '#10B981'; // green
    case 'warning':
      return '#F59E0B'; // yellow/orange
    case 'danger':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
}

/**
 * Format speed for display
 */
export function formatSpeed(speed: number): string {
  return `${Math.round(speed)} mph`;
}

/**
 * Format speed limit for display
 */
export function formatSpeedLimit(limit: number | null): string {
  if (limit === null) return 'N/A';
  return `Limit: ${limit} mph`;
}

/**
 * Speed Monitoring class for managing state during a trip
 */
export class SpeedMonitor {
  private tripId: string;
  private driverId: string;
  private readings: SpeedReading[] = [];
  private currentViolationReadings: SpeedReading[] = [];
  private violations: SpeedViolation[] = [];
  private state: SpeedMonitorState = {
    currentSpeed: 0,
    currentSpeedLimit: null,
    alertLevel: 'normal',
    isViolating: false,
    violationStartTime: null,
    consecutiveViolationSeconds: 0,
  };

  constructor(tripId: string, driverId: string) {
    this.tripId = tripId;
    this.driverId = driverId;
  }

  /**
   * Process a new speed update
   */
  async processSpeedUpdate(
    speedMps: number,
    latitude: number,
    longitude: number
  ): Promise<SpeedMonitorState> {
    // Convert speed
    const speedMph = metersPerSecondToMph(speedMps);
    this.state.currentSpeed = speedMph;

    // Get speed limit
    const limitResponse = await getSpeedLimit(latitude, longitude);
    this.state.currentSpeedLimit = limitResponse.speedLimit;

    if (limitResponse.speedLimit === null) {
      this.state.alertLevel = 'normal';
      this.state.isViolating = false;
      return this.state;
    }

    // Create reading
    const reading = createSpeedReading(
      speedMph,
      limitResponse.speedLimit,
      latitude,
      longitude
    );
    this.readings.push(reading);

    // Update state
    this.state.alertLevel = getSpeedAlertLevel(speedMph, limitResponse.speedLimit);
    const wasViolating = this.state.isViolating;
    this.state.isViolating = reading.isViolation;

    if (reading.isViolation) {
      if (!wasViolating) {
        // Start of new violation
        this.state.violationStartTime = new Date();
        this.currentViolationReadings = [reading];
      } else {
        // Continuing violation
        this.currentViolationReadings.push(reading);
        this.state.consecutiveViolationSeconds =
          (Date.now() - (this.state.violationStartTime?.getTime() || Date.now())) / 1000;
      }

      // Check if we should log this violation
      if (this.state.consecutiveViolationSeconds >= VIOLATION_DURATION_THRESHOLD) {
        const violation = processSpeedViolation(
          this.currentViolationReadings,
          this.tripId,
          this.driverId
        );

        if (violation && !this.violations.find((v) => v.id === violation.id)) {
          this.violations.push(violation);
          await logSpeedViolation(this.tripId, violation);
        }
      }
    } else {
      // Reset violation tracking
      this.state.violationStartTime = null;
      this.state.consecutiveViolationSeconds = 0;
      this.currentViolationReadings = [];
    }

    // Log reading periodically (every 10 readings or on violations)
    if (this.readings.length % 10 === 0 || reading.isViolation) {
      await logSpeedReading(this.tripId, reading);
    }

    return this.state;
  }

  /**
   * Get current monitoring state
   */
  getState(): SpeedMonitorState {
    return this.state;
  }

  /**
   * Get all violations recorded during this trip
   */
  getViolations(): SpeedViolation[] {
    return this.violations;
  }

  /**
   * Get violation count
   */
  getViolationCount(): number {
    return this.violations.length;
  }

  /**
   * Check if a strike should be issued
   */
  shouldIssueStrike(): boolean {
    return shouldIssueStrike(this.violations.length);
  }

  /**
   * Reset the monitor for a new trip
   */
  reset(tripId: string, driverId: string): void {
    this.tripId = tripId;
    this.driverId = driverId;
    this.readings = [];
    this.currentViolationReadings = [];
    this.violations = [];
    this.state = {
      currentSpeed: 0,
      currentSpeedLimit: null,
      alertLevel: 'normal',
      isViolating: false,
      violationStartTime: null,
      consecutiveViolationSeconds: 0,
    };
  }
}

// Export a singleton instance for use across the app
let speedMonitorInstance: SpeedMonitor | null = null;

export function getSpeedMonitor(tripId: string, driverId: string): SpeedMonitor {
  if (!speedMonitorInstance || speedMonitorInstance['tripId'] !== tripId) {
    speedMonitorInstance = new SpeedMonitor(tripId, driverId);
  }
  return speedMonitorInstance;
}

export function resetSpeedMonitor(): void {
  speedMonitorInstance = null;
}
