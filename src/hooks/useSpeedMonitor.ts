/**
 * useSpeedMonitor Hook
 *
 * Provides real-time speed monitoring with:
 * - Smooth speed updates
 * - Color-coded alerts
 * - Speeding popup trigger
 * - Violation recording
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSpeedLimit,
  getSpeedAlertLevel,
  getSpeedColor,
  metersPerSecondToMph,
  smoothSpeed,
  resetSpeedSmoothing,
  isSpeedViolation,
  createSpeedReading,
  processSpeedViolation,
  logSpeedViolation,
  SpeedMonitor,
  getSpeedMonitor,
} from '@/src/services/speedLimitService';
import { SpeedAlertLevel, SpeedReading } from '@/src/types/safety.types';

interface SpeedMonitorResult {
  currentSpeed: number; // Smoothed speed in mph
  speedLimit: number | null;
  alertLevel: SpeedAlertLevel;
  speedColor: string;
  isOverLimit: boolean;
  excessSpeed: number; // How many mph over the limit
  shouldShowWarning: boolean; // True when 6+ mph over limit
  violationCount: number;
  updateSpeed: (speedMps: number, latitude: number, longitude: number) => Promise<void>;
  dismissWarning: () => void;
  reset: () => void;
}

const DANGER_THRESHOLD = 6; // mph over limit to trigger popup
const WARNING_DISMISS_DELAY = 5000; // Auto-dismiss warning after 5 seconds if back under limit

export function useSpeedMonitor(
  tripId: string | null,
  driverId: string | null
): SpeedMonitorResult {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedLimit, setSpeedLimit] = useState<number | null>(null);
  const [alertLevel, setAlertLevel] = useState<SpeedAlertLevel>('normal');
  const [shouldShowWarning, setShouldShowWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  const speedMonitorRef = useRef<SpeedMonitor | null>(null);
  const warningDismissedRef = useRef(false);
  const lastOverLimitTimeRef = useRef<number | null>(null);
  const violationReadingsRef = useRef<SpeedReading[]>([]);

  // Initialize speed monitor when trip starts
  useEffect(() => {
    if (tripId && driverId) {
      speedMonitorRef.current = getSpeedMonitor(tripId, driverId);
      resetSpeedSmoothing();
      warningDismissedRef.current = false;
      violationReadingsRef.current = [];
    }

    return () => {
      resetSpeedSmoothing();
    };
  }, [tripId, driverId]);

  // Update speed with smoothing and limit checking
  const updateSpeed = useCallback(
    async (speedMps: number, latitude: number, longitude: number) => {
      if (!tripId || !driverId) return;

      // Convert and smooth the speed
      const rawSpeedMph = metersPerSecondToMph(speedMps);
      const smoothedSpeed = smoothSpeed(rawSpeedMph);
      setCurrentSpeed(Math.round(smoothedSpeed));

      // Fetch speed limit (cached)
      const limitResponse = await getSpeedLimit(latitude, longitude);
      const limit = limitResponse.speedLimit;
      setSpeedLimit(limit);

      if (limit === null) {
        setAlertLevel('normal');
        return;
      }

      // Determine alert level
      const level = getSpeedAlertLevel(smoothedSpeed, limit);
      setAlertLevel(level);

      // Check if over danger threshold (6+ mph over)
      const excess = smoothedSpeed - limit;
      const isOverDangerThreshold = excess >= DANGER_THRESHOLD;

      if (isOverDangerThreshold) {
        lastOverLimitTimeRef.current = Date.now();

        // Show warning if not already dismissed
        if (!warningDismissedRef.current) {
          setShouldShowWarning(true);
        }

        // Track violation readings
        const reading = createSpeedReading(smoothedSpeed, limit, latitude, longitude);
        violationReadingsRef.current.push(reading);

        // Check if we have a sustained violation to log
        if (violationReadingsRef.current.length >= 10) {
          const violation = processSpeedViolation(
            violationReadingsRef.current,
            tripId,
            driverId
          );

          if (violation) {
            await logSpeedViolation(tripId, violation);
            setViolationCount((prev) => prev + 1);
            violationReadingsRef.current = []; // Reset after logging
          }
        }
      } else {
        // Back under limit
        violationReadingsRef.current = [];

        // Auto-dismiss warning if back under limit for a while
        if (lastOverLimitTimeRef.current) {
          const timeSinceOver = Date.now() - lastOverLimitTimeRef.current;
          if (timeSinceOver > WARNING_DISMISS_DELAY) {
            setShouldShowWarning(false);
            warningDismissedRef.current = false; // Reset so warning can show again
            lastOverLimitTimeRef.current = null;
          }
        }
      }

      // Update the speed monitor for detailed tracking
      if (speedMonitorRef.current) {
        await speedMonitorRef.current.processSpeedUpdate(speedMps, latitude, longitude);
      }
    },
    [tripId, driverId]
  );

  // Manual dismiss warning (user acknowledged)
  const dismissWarning = useCallback(() => {
    setShouldShowWarning(false);
    warningDismissedRef.current = true;

    // Reset after 30 seconds so warning can show again if they speed again
    setTimeout(() => {
      warningDismissedRef.current = false;
    }, 30000);
  }, []);

  // Reset for new trip
  const reset = useCallback(() => {
    setCurrentSpeed(0);
    setSpeedLimit(null);
    setAlertLevel('normal');
    setShouldShowWarning(false);
    setViolationCount(0);
    resetSpeedSmoothing();
    warningDismissedRef.current = false;
    lastOverLimitTimeRef.current = null;
    violationReadingsRef.current = [];
  }, []);

  // Calculate derived values
  const isOverLimit = speedLimit !== null && currentSpeed > speedLimit;
  const excessSpeed = speedLimit !== null ? Math.max(0, currentSpeed - speedLimit) : 0;
  const speedColor = getSpeedColor(alertLevel);

  return {
    currentSpeed,
    speedLimit,
    alertLevel,
    speedColor,
    isOverLimit,
    excessSpeed,
    shouldShowWarning,
    violationCount,
    updateSpeed,
    dismissWarning,
    reset,
  };
}
