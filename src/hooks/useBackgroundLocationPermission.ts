/**
 * useBackgroundLocationPermission Hook
 *
 * Manages the background location permission flow with Google Play-compliant
 * prominent disclosure modal.
 *
 * Flow:
 * 1. Check if permission already granted
 * 2. Request foreground permission first (if needed)
 * 3. Show prominent disclosure modal
 * 4. If user accepts, request background permission
 * 5. Handle denial gracefully
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import {
  hasBackgroundLocationPermission,
  hasForegroundLocationPermission,
  requestForegroundLocationPermission,
  requestBackgroundLocationPermission,
  BACKGROUND_LOCATION_DENIED_MESSAGE,
} from '@/src/utils/backgroundLocationDisclosure';

interface UseBackgroundLocationPermissionOptions {
  userType: 'rider' | 'driver';
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

interface UseBackgroundLocationPermissionReturn {
  // State
  hasPermission: boolean | null;
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
  const [isChecking, setIsChecking] = useState(false);
  const [showDisclosureModal, setShowDisclosureModal] = useState(false);
  // Track if user has already made a decision this session (to prevent re-showing modal)
  const [hasUserDecided, setHasUserDecided] = useState(false);

  // Check current permission status
  const checkPermission = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const granted = await hasBackgroundLocationPermission();
      setHasPermission(granted);
      // If already granted, mark as user decided (no need to show modal)
      if (granted) {
        setHasUserDecided(true);
      }
      return granted;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Start the permission request flow
  const requestPermission = useCallback(async () => {
    console.log('🔔 requestPermission called - starting disclosure flow');

    // If user has already made a decision this session, don't show modal again
    if (hasUserDecided) {
      console.log('🔔 User already made a decision this session - not showing modal again');
      return;
    }

    // First check if already granted
    const alreadyGranted = await hasBackgroundLocationPermission();
    console.log('🔔 Background permission already granted?', alreadyGranted);
    if (alreadyGranted) {
      setHasPermission(true);
      setHasUserDecided(true);
      onPermissionGranted?.();
      return;
    }

    // IMPORTANT: Show the disclosure modal FIRST, before any system permission requests
    // This ensures the user sees our prominent disclosure before the OS dialog
    console.log('🔔 Showing prominent disclosure modal');
    setShowDisclosureModal(true);
  }, [hasUserDecided, onPermissionGranted, onPermissionDenied]);

  // Handle user accepting the disclosure
  const onDisclosureAccept = useCallback(async () => {
    console.log('✅ User accepted disclosure modal');
    setShowDisclosureModal(false);
    setHasUserDecided(true); // Mark that user has made a decision

    // First, ensure we have foreground permission
    const hasForeground = await hasForegroundLocationPermission();
    console.log('🔔 Has foreground permission?', hasForeground);

    if (!hasForeground) {
      console.log('🔔 Requesting foreground permission first...');
      const foregroundGranted = await requestForegroundLocationPermission();
      if (!foregroundGranted) {
        console.log('❌ Foreground permission denied');
        setHasPermission(false);
        const deniedMessage = BACKGROUND_LOCATION_DENIED_MESSAGE[userType];
        Alert.alert(deniedMessage.title, deniedMessage.message, [{ text: 'OK' }]);
        onPermissionDenied?.();
        return;
      }
    }

    // Now request the actual background system permission
    console.log('🔔 Requesting background location permission...');
    const granted = await requestBackgroundLocationPermission();
    setHasPermission(granted);

    if (granted) {
      console.log('✅ Background location permission granted after disclosure');
      onPermissionGranted?.();
    } else {
      console.log('⚠️ User granted foreground but not background - proceeding with limited functionality');
      // Don't show error alert - user made their choice, app will work with foreground permission
      // Just call the denied callback so the parent knows
      onPermissionDenied?.();
    }
  }, [userType, onPermissionGranted, onPermissionDenied]);

  // Handle user declining the disclosure
  const onDisclosureDecline = useCallback(() => {
    setShowDisclosureModal(false);
    setHasPermission(false);
    setHasUserDecided(true); // Mark that user has made a decision

    console.log('❌ User declined background location disclosure');

    // Show graceful degradation message
    const deniedMessage = BACKGROUND_LOCATION_DENIED_MESSAGE[userType];
    Alert.alert(deniedMessage.title, deniedMessage.message, [{ text: 'OK' }]);

    onPermissionDenied?.();
  }, [userType, onPermissionDenied]);

  return {
    hasPermission,
    isChecking,
    showDisclosureModal,
    checkPermission,
    requestPermission,
    onDisclosureAccept,
    onDisclosureDecline,
  };
}

export default useBackgroundLocationPermission;
