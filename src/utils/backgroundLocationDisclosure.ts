/**
 * Background Location Disclosure
 *
 * Google Play requires a PROMINENT in-app disclosure BEFORE requesting
 * background location permission. This module provides utilities to show
 * a full-screen modal disclosure before requesting permission.
 *
 * Requirements:
 * 1. Must show a PROMINENT disclosure BEFORE calling requestBackgroundPermissionsAsync()
 * 2. Must explain WHY background location is needed
 * 3. Must explain WHAT data is collected
 * 4. Must explain WHEN collection occurs
 * 5. User must acknowledge before permission is requested
 * 6. Must include keywords: "location", "background", "when the app is closed"
 *
 * IMPORTANT: Use the BackgroundLocationDisclosureModal component for the
 * prominent disclosure, not Alert.alert() which is not prominent enough.
 */

import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Check if background location permission is already granted
 */
export async function hasBackgroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if foreground location permission is granted
 */
export async function hasForegroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Request foreground location permission
 * Call this before showing the background location disclosure modal
 */
export async function requestForegroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Request background location permission
 * IMPORTANT: Only call this AFTER user has accepted the prominent disclosure modal
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    const granted = status === 'granted';
    console.log(`Background location permission ${granted ? 'granted' : 'denied'}`);
    return granted;
  } catch (error) {
    console.error('Error requesting background location:', error);
    return false;
  }
}

/**
 * DEPRECATED: Use BackgroundLocationDisclosureModal component instead
 *
 * This function uses Alert.alert() which is NOT prominent enough for Google Play.
 * Keeping for backwards compatibility but should migrate to the modal.
 *
 * @deprecated Use BackgroundLocationDisclosureModal component instead
 */
export async function requestBackgroundLocationWithDisclosure(
  userType: 'rider' | 'driver'
): Promise<boolean> {
  // First check if we already have background permission
  const { status: existingStatus } = await Location.getBackgroundPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }

  // Check if foreground permission is granted first
  const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    // Need foreground permission first
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }
  }

  const disclosure = BACKGROUND_LOCATION_DISCLOSURE[userType];

  return new Promise((resolve) => {
    Alert.alert(
      disclosure.title,
      disclosure.message,
      [
        {
          text: disclosure.buttonDecline,
          style: 'cancel',
          onPress: () => {
            console.log('User declined background location disclosure');
            // Show graceful degradation message
            const deniedMessage = BACKGROUND_LOCATION_DENIED_MESSAGE[userType];
            Alert.alert(
              deniedMessage.title,
              deniedMessage.message,
              [{ text: 'OK' }]
            );
            resolve(false);
          },
        },
        {
          text: disclosure.buttonAccept,
          onPress: async () => {
            try {
              const { status } = await Location.requestBackgroundPermissionsAsync();
              const granted = status === 'granted';
              console.log(`Background location permission ${granted ? 'granted' : 'denied'}`);

              // Show graceful degradation message if system permission denied
              if (!granted) {
                const deniedMessage = BACKGROUND_LOCATION_DENIED_MESSAGE[userType];
                Alert.alert(
                  deniedMessage.title,
                  deniedMessage.message,
                  [{ text: 'OK' }]
                );
              }

              resolve(granted);
            } catch (error) {
              console.error('Error requesting background location:', error);
              resolve(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  });
}

// Legacy disclosure text - kept for reference
// Use BackgroundLocationDisclosureModal component instead
export const BACKGROUND_LOCATION_DISCLOSURE = {
  rider: {
    title: 'Background Location Access',
    message: `Drift collects your location in the background, even when the app is closed or not in use, to:

• Share your live trip location with trusted contacts for safety
• Allow friends and family to track your trip even when your phone screen is off
• Maintain accurate ETA updates during your ride

Your location is ONLY tracked during active trips and automatically stops when your trip ends. Location data is never sold or shared with advertisers.`,
    buttonAccept: 'Continue',
    buttonDecline: 'Not Now',
  },
  driver: {
    title: 'Background Location Required',
    message: `Drift collects your location in the background, even when the app is closed or not in use, to:

• Provide turn-by-turn navigation during trips
• Update riders with accurate arrival times
• Enable trip tracking even when your phone screen is off
• Record trip routes for safety and earnings records

Your location is ONLY tracked when you're online and during active trips. Tracking automatically stops when you go offline or complete a trip.`,
    buttonAccept: 'Enable Location',
    buttonDecline: 'Not Now',
  },
};

// Message shown when user denies background location permission
export const BACKGROUND_LOCATION_DENIED_MESSAGE = {
  rider: {
    title: 'Limited Safety Features',
    message: `Without background location access, the following features will be limited:

• Trip sharing with trusted contacts may not update when your screen is off
• Your emergency contacts cannot track your trip in real-time

You can enable background location later in your device settings if you change your mind.`,
  },
  driver: {
    title: 'Limited Features Available',
    message: `Without background location access, the following features will be limited:

• Navigation may stop when your screen turns off
• Rider ETA updates may be less accurate
• Trip routes may not be fully recorded

You can enable background location later in your device settings if you change your mind.`,
  },
};

export const PRIVACY_POLICY_LOCATION_TEXT = `
LOCATION DATA COLLECTION

Drift collects location data to enable ridesharing services, including:

1. Foreground Location: When the app is open, we collect your location to show nearby drivers, calculate routes, and provide navigation.

2. Background Location: During active trips only, we collect location data even when the app is in the background or your screen is off. This enables:
   - Real-time trip sharing with your emergency contacts
   - Accurate ETA updates for riders waiting for their driver
   - Turn-by-turn navigation for drivers
   - Trip route recording for safety and dispute resolution

Background location collection automatically stops when:
   - A trip is completed or cancelled
   - A driver goes offline
   - The user logs out of the app

We do not sell location data or share it with advertisers. Location data may be shared with:
   - Contacts you explicitly choose to share your trip with
   - Law enforcement when required by valid legal process
   - Our service providers who help operate the app (under strict confidentiality agreements)

You can disable background location access in your device settings at any time, though this may limit some safety features.
`;
