/**
 * useRouteDeviation Hook
 *
 * Handles route deviation detection with:
 * - "Are you OK?" alert after sustained deviation
 * - Automatic route recalculation
 * - Safety logging
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RouteDeviationMonitor,
  getRouteDeviationMonitor,
  getDistanceFromRoute,
  DEVIATION_CONSTANTS,
} from '@/src/services/routeDeviationService';
import { RouteDeviation } from '@/src/types/safety.types';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface UseRouteDeviationResult {
  isDeviating: boolean;
  deviationDistance: number; // meters from route
  shouldShowAlert: boolean;
  currentDeviation: RouteDeviation | null;
  setPlannedRoute: (route: Coordinate[]) => void;
  setDestination: (destination: Coordinate) => void;
  checkLocation: (location: Coordinate) => Promise<void>;
  handleAlertResponse: (response: 'okay' | 'sos') => Promise<void>;
  dismissAlert: () => void;
  shouldRecalculateRoute: boolean;
  acknowledgeRouteRecalculation: () => void;
  reset: () => void;
}

// Route recalculation threshold (100 meters)
const RECALC_THRESHOLD = 100;
// Time before showing "Are you OK?" alert (30 seconds for better UX)
const ALERT_DELAY_SECONDS = 30;

export function useRouteDeviation(tripId: string | null): UseRouteDeviationResult {
  const [isDeviating, setIsDeviating] = useState(false);
  const [deviationDistance, setDeviationDistance] = useState(0);
  const [shouldShowAlert, setShouldShowAlert] = useState(false);
  const [currentDeviation, setCurrentDeviation] = useState<RouteDeviation | null>(null);
  const [shouldRecalculateRoute, setShouldRecalculateRoute] = useState(false);

  const monitorRef = useRef<RouteDeviationMonitor | null>(null);
  const plannedRouteRef = useRef<Coordinate[]>([]);
  const deviationStartTimeRef = useRef<number | null>(null);
  const alertDismissedRef = useRef(false);
  const lastRecalcTimeRef = useRef<number>(0);

  // Initialize monitor when trip starts
  useEffect(() => {
    if (tripId) {
      monitorRef.current = getRouteDeviationMonitor(tripId);
      alertDismissedRef.current = false;
      deviationStartTimeRef.current = null;
    }
  }, [tripId]);

  // Set planned route
  const setPlannedRoute = useCallback((route: Coordinate[]) => {
    plannedRouteRef.current = route;
    if (monitorRef.current) {
      monitorRef.current.setPlannedRoute(route);
    }
  }, []);

  // Set destination
  const setDestination = useCallback((destination: Coordinate) => {
    if (monitorRef.current) {
      monitorRef.current.setDestination(destination);
    }
  }, []);

  // Check current location against route
  const checkLocation = useCallback(async (location: Coordinate) => {
    if (!tripId || plannedRouteRef.current.length < 2) {
      return;
    }

    // Calculate distance from route
    const distance = getDistanceFromRoute(location, plannedRouteRef.current);
    setDeviationDistance(distance);

    const now = Date.now();
    const isCurrentlyDeviating = distance > RECALC_THRESHOLD;
    const wasDeviating = isDeviating;

    setIsDeviating(isCurrentlyDeviating);

    if (isCurrentlyDeviating) {
      // Start tracking deviation time
      if (!deviationStartTimeRef.current) {
        deviationStartTimeRef.current = now;
        console.log('📍 Route deviation started:', Math.round(distance), 'm from route');
      }

      const deviationDuration = (now - deviationStartTimeRef.current) / 1000;

      // Trigger route recalculation if significantly off route
      // Cooldown of 10 seconds between recalculations
      if (distance > RECALC_THRESHOLD && now - lastRecalcTimeRef.current > 10000) {
        setShouldRecalculateRoute(true);
        lastRecalcTimeRef.current = now;
      }

      // Show "Are you OK?" alert after sustained deviation
      if (
        deviationDuration >= ALERT_DELAY_SECONDS &&
        !alertDismissedRef.current &&
        !shouldShowAlert
      ) {
        console.log('⚠️ Showing route deviation alert after', deviationDuration, 'seconds');

        // Create deviation record
        const deviation: RouteDeviation = {
          id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tripId,
          timestamp: new Date(),
          plannedLocation: plannedRouteRef.current[0],
          actualLocation: location,
          deviationDistance: distance,
          duration: deviationDuration,
          riderResponse: 'pending',
          alertShown: true,
          autoAlertSent: false,
        };

        setCurrentDeviation(deviation);
        setShouldShowAlert(true);

        // Log to monitor
        if (monitorRef.current) {
          await monitorRef.current.checkLocation(location);
        }
      }
    } else {
      // Back on route
      if (wasDeviating) {
        console.log('✅ Back on route');
        deviationStartTimeRef.current = null;
        alertDismissedRef.current = false;
        setShouldShowAlert(false);
        setCurrentDeviation(null);
      }
    }
  }, [tripId, isDeviating, shouldShowAlert]);

  // Handle alert response
  const handleAlertResponse = useCallback(async (response: 'okay' | 'sos') => {
    if (!currentDeviation || !monitorRef.current) return;

    await monitorRef.current.handleDeviationResponse(currentDeviation.id, response);

    setShouldShowAlert(false);
    alertDismissedRef.current = true;

    // Reset after 2 minutes so alert can show again if they deviate again
    setTimeout(() => {
      alertDismissedRef.current = false;
    }, 120000);
  }, [currentDeviation]);

  // Dismiss alert without SOS
  const dismissAlert = useCallback(() => {
    setShouldShowAlert(false);
    alertDismissedRef.current = true;

    // Reset after 2 minutes
    setTimeout(() => {
      alertDismissedRef.current = false;
    }, 120000);
  }, []);

  // Acknowledge route recalculation (called after new route is fetched)
  const acknowledgeRouteRecalculation = useCallback(() => {
    setShouldRecalculateRoute(false);
  }, []);

  // Reset for new trip
  const reset = useCallback(() => {
    setIsDeviating(false);
    setDeviationDistance(0);
    setShouldShowAlert(false);
    setCurrentDeviation(null);
    setShouldRecalculateRoute(false);
    plannedRouteRef.current = [];
    deviationStartTimeRef.current = null;
    alertDismissedRef.current = false;
    lastRecalcTimeRef.current = 0;
  }, []);

  return {
    isDeviating,
    deviationDistance,
    shouldShowAlert,
    currentDeviation,
    setPlannedRoute,
    setDestination,
    checkLocation,
    handleAlertResponse,
    dismissAlert,
    shouldRecalculateRoute,
    acknowledgeRouteRecalculation,
    reset,
  };
}
