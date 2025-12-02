/**
 * DRIFT ROUTE DEVIATION SERVICE
 * Detects and monitors route deviations, early completions,
 * and manages safety alerts
 */

import {
  RouteDeviation,
  EarlyCompletion,
  EmergencyAlert,
  EmergencyAlertType,
  SafetyServiceResponse,
} from '@/src/types/safety.types';
import firestore from '@react-native-firebase/firestore';

// Configuration
const ROUTE_DEVIATION_THRESHOLD = 804.672; // 0.5 miles in meters
const DEVIATION_DURATION_THRESHOLD = 120; // 2 minutes in seconds
const EARLY_COMPLETION_THRESHOLD = 482.803; // 0.3 miles in meters
const ALERT_RESPONSE_TIMEOUT = 60; // 60 seconds to respond
const CHECK_INTERVAL = 15; // Check every 15 seconds

interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  point1: Coordinate,
  point2: Coordinate
): number {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Find the minimum distance from a point to a route (polyline)
 */
export function getDistanceFromRoute(
  point: Coordinate,
  route: Coordinate[]
): number {
  if (route.length === 0) return 0;
  if (route.length === 1) return calculateDistance(point, route[0]);

  let minDistance = Infinity;

  // Check distance to each segment of the route
  for (let i = 0; i < route.length - 1; i++) {
    const segmentDistance = getDistanceToSegment(point, route[i], route[i + 1]);
    if (segmentDistance < minDistance) {
      minDistance = segmentDistance;
    }
  }

  return minDistance;
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function getDistanceToSegment(
  point: Coordinate,
  segmentStart: Coordinate,
  segmentEnd: Coordinate
): number {
  const dx = segmentEnd.longitude - segmentStart.longitude;
  const dy = segmentEnd.latitude - segmentStart.latitude;

  if (dx === 0 && dy === 0) {
    return calculateDistance(point, segmentStart);
  }

  // Calculate projection of point onto line
  let t =
    ((point.longitude - segmentStart.longitude) * dx +
      (point.latitude - segmentStart.latitude) * dy) /
    (dx * dx + dy * dy);

  // Clamp t to [0, 1] to stay within segment
  t = Math.max(0, Math.min(1, t));

  // Find closest point on segment
  const closestPoint: Coordinate = {
    longitude: segmentStart.longitude + t * dx,
    latitude: segmentStart.latitude + t * dy,
  };

  return calculateDistance(point, closestPoint);
}

/**
 * Find the closest point on the planned route to actual location
 */
export function findClosestRoutePoint(
  actualLocation: Coordinate,
  route: Coordinate[]
): Coordinate | null {
  if (route.length === 0) return null;

  let closestPoint = route[0];
  let minDistance = calculateDistance(actualLocation, route[0]);

  for (const point of route) {
    const distance = calculateDistance(actualLocation, point);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }

  return closestPoint;
}

/**
 * Route Deviation Monitor class
 */
export class RouteDeviationMonitor {
  private tripId: string;
  private plannedRoute: Coordinate[] = [];
  private destination: Coordinate | null = null;
  private currentDeviation: RouteDeviation | null = null;
  private deviations: RouteDeviation[] = [];
  private deviationStartTime: Date | null = null;
  private isDeviating: boolean = false;
  private alertActive: boolean = false;
  private alertCallback: ((deviation: RouteDeviation) => void) | null = null;
  private earlyCompletionCallback: ((completion: EarlyCompletion) => void) | null = null;

  constructor(tripId: string) {
    this.tripId = tripId;
  }

  /**
   * Set the planned route
   */
  setPlannedRoute(route: Coordinate[]): void {
    this.plannedRoute = route;
  }

  /**
   * Set the destination
   */
  setDestination(destination: Coordinate): void {
    this.destination = destination;
  }

  /**
   * Set callback for when deviation alert should be shown
   */
  onDeviationAlert(callback: (deviation: RouteDeviation) => void): void {
    this.alertCallback = callback;
  }

  /**
   * Set callback for early completion alert
   */
  onEarlyCompletionAlert(callback: (completion: EarlyCompletion) => void): void {
    this.earlyCompletionCallback = callback;
  }

  /**
   * Check current location against planned route
   */
  async checkLocation(actualLocation: Coordinate): Promise<{
    isDeviating: boolean;
    deviationDistance: number;
    shouldShowAlert: boolean;
    deviation: RouteDeviation | null;
  }> {
    if (this.plannedRoute.length === 0) {
      return {
        isDeviating: false,
        deviationDistance: 0,
        shouldShowAlert: false,
        deviation: null,
      };
    }

    const deviationDistance = getDistanceFromRoute(actualLocation, this.plannedRoute);
    const wasDeviating = this.isDeviating;
    this.isDeviating = deviationDistance > ROUTE_DEVIATION_THRESHOLD;

    if (this.isDeviating) {
      if (!wasDeviating) {
        // Start of new deviation
        this.deviationStartTime = new Date();
        const plannedPoint = findClosestRoutePoint(actualLocation, this.plannedRoute);

        this.currentDeviation = {
          id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tripId: this.tripId,
          timestamp: new Date(),
          plannedLocation: plannedPoint || actualLocation,
          actualLocation,
          deviationDistance,
          duration: 0,
          riderResponse: 'pending',
          alertShown: false,
          autoAlertSent: false,
        };
      } else if (this.currentDeviation) {
        // Update ongoing deviation
        this.currentDeviation.duration =
          (Date.now() - (this.deviationStartTime?.getTime() || Date.now())) / 1000;
        this.currentDeviation.deviationDistance = deviationDistance;
        this.currentDeviation.actualLocation = actualLocation;

        // Check if we should show alert
        if (
          this.currentDeviation.duration >= DEVIATION_DURATION_THRESHOLD &&
          !this.currentDeviation.alertShown &&
          !this.alertActive
        ) {
          this.currentDeviation.alertShown = true;
          this.alertActive = true;

          // Log to Firestore
          await this.logDeviation(this.currentDeviation);

          // Trigger callback
          if (this.alertCallback) {
            this.alertCallback(this.currentDeviation);
          }

          return {
            isDeviating: true,
            deviationDistance,
            shouldShowAlert: true,
            deviation: this.currentDeviation,
          };
        }
      }
    } else {
      // No longer deviating
      if (wasDeviating && this.currentDeviation) {
        // End of deviation
        this.deviations.push(this.currentDeviation);
      }
      this.deviationStartTime = null;
      this.currentDeviation = null;
    }

    return {
      isDeviating: this.isDeviating,
      deviationDistance,
      shouldShowAlert: false,
      deviation: this.currentDeviation,
    };
  }

  /**
   * Check if trip is being completed early (too far from destination)
   */
  async checkEarlyCompletion(
    actualLocation: Coordinate
  ): Promise<{
    isEarly: boolean;
    distanceFromDestination: number;
    completion: EarlyCompletion | null;
  }> {
    if (!this.destination) {
      return {
        isEarly: false,
        distanceFromDestination: 0,
        completion: null,
      };
    }

    const distanceFromDestination = calculateDistance(actualLocation, this.destination);
    const isEarly = distanceFromDestination > EARLY_COMPLETION_THRESHOLD;

    if (isEarly) {
      const completion: EarlyCompletion = {
        id: `early_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tripId: this.tripId,
        timestamp: new Date(),
        destinationLocation: this.destination,
        actualLocation,
        distanceFromDestination,
        riderResponse: 'pending',
        paymentHeld: true, // Auto-hold payment
        resolved: false,
      };

      // Log to Firestore
      await this.logEarlyCompletion(completion);

      // Trigger callback
      if (this.earlyCompletionCallback) {
        this.earlyCompletionCallback(completion);
      }

      return {
        isEarly: true,
        distanceFromDestination,
        completion,
      };
    }

    return {
      isEarly: false,
      distanceFromDestination,
      completion: null,
    };
  }

  /**
   * Handle rider response to deviation alert
   */
  async handleDeviationResponse(
    deviationId: string,
    response: 'okay' | 'sos'
  ): Promise<SafetyServiceResponse> {
    const deviation = this.currentDeviation?.id === deviationId
      ? this.currentDeviation
      : this.deviations.find((d) => d.id === deviationId);

    if (!deviation) {
      return { success: false, error: 'Deviation not found' };
    }

    deviation.riderResponse = response;
    deviation.responseTimestamp = new Date();
    this.alertActive = false;

    // Update in Firestore
    await this.updateDeviationResponse(deviation);

    if (response === 'sos') {
      // Trigger emergency alert
      await this.triggerEmergencyAlert('route_deviation_sos', deviation.actualLocation);
    }

    return { success: true };
  }

  /**
   * Handle rider response to early completion alert
   */
  async handleEarlyCompletionResponse(
    completionId: string,
    response: 'okay' | 'sos'
  ): Promise<SafetyServiceResponse> {
    try {
      const tripRef = firestore().collection('trips').doc(this.tripId);

      await tripRef.update({
        'safetyData.earlyCompletion.riderResponse': response,
        'safetyData.earlyCompletion.responseTimestamp': firestore.FieldValue.serverTimestamp(),
        'safetyData.earlyCompletion.resolved': true,
        'safetyData.earlyCompletion.paymentHeld': response === 'sos',
      });

      if (response === 'sos') {
        await this.triggerEmergencyAlert('early_completion_sos',
          this.destination || { latitude: 0, longitude: 0 }
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to handle early completion response:', error);
      return { success: false, error: 'Failed to update response' };
    }
  }

  /**
   * Handle timeout (no response from rider)
   */
  async handleNoResponse(type: 'deviation' | 'early_completion'): Promise<void> {
    if (type === 'deviation' && this.currentDeviation) {
      this.currentDeviation.riderResponse = 'no_response';
      this.currentDeviation.autoAlertSent = true;
      await this.updateDeviationResponse(this.currentDeviation);
    }

    // Trigger auto-alert to emergency contacts
    await this.triggerEmergencyAlert(
      'no_response_alert',
      this.currentDeviation?.actualLocation || this.destination || { latitude: 0, longitude: 0 }
    );
  }

  /**
   * Log deviation to Firestore
   */
  private async logDeviation(deviation: RouteDeviation): Promise<void> {
    try {
      const tripRef = firestore().collection('trips').doc(this.tripId);
      await tripRef.update({
        'safetyData.routeDeviations': firestore.FieldValue.arrayUnion(deviation),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('📍 Route deviation logged:', deviation.id);
    } catch (error) {
      console.error('Failed to log route deviation:', error);
    }
  }

  /**
   * Update deviation response in Firestore
   */
  private async updateDeviationResponse(deviation: RouteDeviation): Promise<void> {
    try {
      const tripRef = firestore().collection('trips').doc(this.tripId);
      const tripDoc = await tripRef.get();
      const tripData = tripDoc.data();

      if (tripData?.safetyData?.routeDeviations) {
        const deviations = tripData.safetyData.routeDeviations.map((d: RouteDeviation) =>
          d.id === deviation.id ? deviation : d
        );
        await tripRef.update({
          'safetyData.routeDeviations': deviations,
        });
      }
    } catch (error) {
      console.error('Failed to update deviation response:', error);
    }
  }

  /**
   * Log early completion to Firestore
   */
  private async logEarlyCompletion(completion: EarlyCompletion): Promise<void> {
    try {
      const tripRef = firestore().collection('trips').doc(this.tripId);
      await tripRef.update({
        'safetyData.earlyCompletion': completion,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('⚠️ Early completion logged:', completion.id);
    } catch (error) {
      console.error('Failed to log early completion:', error);
    }
  }

  /**
   * Trigger emergency alert
   */
  private async triggerEmergencyAlert(
    type: EmergencyAlertType,
    location: Coordinate
  ): Promise<void> {
    try {
      const alert: EmergencyAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tripId: this.tripId,
        userId: '', // Will be filled by caller
        userType: 'rider',
        type,
        timestamp: new Date(),
        location,
        context: {
          routeDeviation: this.currentDeviation?.deviationDistance,
        },
        contactsNotified: [],
        authoritiesContacted: type.includes('sos'),
        resolved: false,
      };

      const tripRef = firestore().collection('trips').doc(this.tripId);
      await tripRef.update({
        'safetyData.emergencyAlerts': firestore.FieldValue.arrayUnion(alert),
      });

      console.log('🚨 Emergency alert triggered:', type);
    } catch (error) {
      console.error('Failed to trigger emergency alert:', error);
    }
  }

  /**
   * Get all deviations for this trip
   */
  getDeviations(): RouteDeviation[] {
    return this.deviations;
  }

  /**
   * Check if there are unresolved safety issues
   */
  hasUnresolvedIssues(): boolean {
    return (
      this.deviations.some(
        (d) => d.riderResponse === 'sos' || d.riderResponse === 'no_response'
      ) || this.alertActive
    );
  }

  /**
   * Reset monitor for new trip
   */
  reset(tripId: string): void {
    this.tripId = tripId;
    this.plannedRoute = [];
    this.destination = null;
    this.currentDeviation = null;
    this.deviations = [];
    this.deviationStartTime = null;
    this.isDeviating = false;
    this.alertActive = false;
  }
}

// Export constants for use in UI
export const DEVIATION_CONSTANTS = {
  ROUTE_DEVIATION_THRESHOLD,
  DEVIATION_DURATION_THRESHOLD,
  EARLY_COMPLETION_THRESHOLD,
  ALERT_RESPONSE_TIMEOUT,
  CHECK_INTERVAL,
};

// Singleton instance
let routeDeviationMonitorInstance: RouteDeviationMonitor | null = null;

export function getRouteDeviationMonitor(tripId: string): RouteDeviationMonitor {
  if (!routeDeviationMonitorInstance || routeDeviationMonitorInstance['tripId'] !== tripId) {
    routeDeviationMonitorInstance = new RouteDeviationMonitor(tripId);
  }
  return routeDeviationMonitorInstance;
}

export function resetRouteDeviationMonitor(): void {
  routeDeviationMonitorInstance = null;
}
