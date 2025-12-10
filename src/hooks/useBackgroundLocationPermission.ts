/**
 * useBackgroundLocationPermission Hook
 *
 * Manages the background location permission flow with Google Play-compliant
 * prominent disclosure modal.
 *
 * Google Play Compliance:
 * - Shows a prominent in-app disclosure BEFORE requesting background location
 * - Explains why, what, and when location data is collected
 * - User must explicitly acknowledge before system permission dialog appears
 *
 * Flow:
 * 1. On app open, check if background permission is already granted ("Always Allow")
 *    → If granted, no modal needed
 * 2. Check if user has foreground permission ("While using app")
 *    → If granted, user made their choice, don't show modal
 * 3. If NO location permission at all (denied or "Ask every time")
 *    → Show disclosure modal before requesting permission
 * 4. User can change permission in device settings anytime
 */

import { useState, useCallback, useEffect } from 'react';
import {
  hasBackgroundLocationPermission,
  hasForegroundLocationPermission,
  requestForegroundLocationPermission,
  requestBackgroundLocationPermission,
} from '@/src/utils/backgroundLocationDisclosure';


interface UseBackgroundLocationPermissionOptions {
  userType: 'rider' | 'driver';
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

interface UseBackgroundLocationPermissionReturn {
  // State
  hasPermission: boolean | null; // Background permission ("Always Allow")
  hasForegroundPermission: boolean | null; // Foreground permission ("While using app")
  isChecking: boolean;
  showDisclosureModal: boolean;

  // Actions
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<void>;
  onDisclosureAccept: () => Promise<void>;
  onDisclosureDecline: () => void;
}

export function useBackgroundLocationPermission({
  userType,
  onPermissionGranted,
  onPermissionDenied,
}: UseBackgroundLocationPermissionOptions): UseBackgroundLocationPermissionReturn {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasForegroundPermission, setHasForegroundPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showDisclosureModal, setShowDisclosureModal] = useState(false);

  // Check permission on app open
  // Google Play compliance: Show disclosure BEFORE requesting background location
  // Once user has seen disclosure and made a choice, don't show it again
  // UNLESS they revoke permission in settings - then we need to re-show
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if background permission is already granted ("Always Allow")
        const backgroundGranted = await hasBackgroundLocationPermission();
        setHasPermission(backgroundGranted);

        if (backgroundGranted) {
          // Permission already granted ("Always Allow"), no need to show modal
          setHasForegroundPermission(true); // Background implies foreground
          setIsChecking(false);
          return;
        }

        // Check if user has at least foreground permission ("While using app")
        // If they have foreground but not background, they made a conscious choice
        const foregroundGranted = await hasForegroundLocationPermission();
        setHasForegroundPermission(foregroundGranted);

        if (foregroundGranted) {
          // User has "While using app" - they made their choice, don't nag
          setIsChecking(false);
          return;
        }

        // No foreground permission means either:
        // 1. First time user (never granted)
        // 2. User revoked permission to "Don't Allow" or "Ask every time"
        // In both cases, we need to show the disclosure before requesting again
        setShowDisclosureModal(true);

        setIsChecking(false);
      } catch (error) {
        console.error('Error initializing permission check:', error);
        setHasPermission(false);
        setIsChecking(false);
      }
    };

    initialize();
  }, []);

  // Check current permission status (can be called manually)
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await hasBackgroundLocationPermission();
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }, []);

  // Start the permission request flow (manual trigger)
  const requestPermission = useCallback(async () => {
    // Check if already granted
    const alreadyGranted = await hasBackgroundLocationPermission();
    if (alreadyGranted) {
      setHasPermission(true);
      onPermissionGranted?.();
      return;
    }

    // Show the disclosure modal
    setShowDisclosureModal(true);
  }, [onPermissionGranted]);

  // Handle user accepting the disclosure
  const onDisclosureAccept = useCallback(async () => {
    setShowDisclosureModal(false);

    // First, ensure we have foreground permission
    const hasForeground = await hasForegroundLocationPermission();

    if (!hasForeground) {
      const foregroundGranted = await requestForegroundLocationPermission();
      if (!foregroundGranted) {
        setHasPermission(false);
        setHasForegroundPermission(false);
        onPermissionDenied?.();
        return;
      }
      // Foreground permission was just granted
      setHasForegroundPermission(true);
    }

    // Now request the actual background system permission
    const granted = await requestBackgroundLocationPermission();
    setHasPermission(granted);

    if (granted) {
      setHasForegroundPermission(true); // Background implies foreground
      onPermissionGranted?.();
    } else {
      // User chose "While using app" - still has foreground permission
      // Call onPermissionGranted since they can still use the app with foreground location
      onPermissionGranted?.();
    }
  }, [userType, onPermissionGranted, onPermissionDenied]);

  // Handle user declining the disclosure
  const onDisclosureDecline = useCallback(() => {
    setShowDisclosureModal(false);
    setHasPermission(false);

    // Don't show an alert - just let them continue with the app
    // Modal will show again next time if they still have no location permission
    onPermissionDenied?.();
  }, [onPermissionDenied]);

  return {
    hasPermission,
    hasForegroundPermission,
    isChecking,
    showDisclosureModal,
    checkPermission,
    requestPermission,
    onDisclosureAccept,
    onDisclosureDecline,
  };
}

export default useBackgroundLocationPermission;
