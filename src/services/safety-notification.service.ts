/**
 * DRIFT SAFETY NOTIFICATION SERVICE
 *
 * Handles push notifications for safety alerts during trips with:
 * - Actionable notification responses (Slow Down, I'm OK, End Ride)
 * - Automatic linking to in-app popups
 * - Real-time sync between notifications and app state
 */

import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { firebaseDb } from '../config/firebase';
import { doc, updateDoc, serverTimestamp, onSnapshot, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Helper to check if document exists
 * React Native Firebase can return exists as either a boolean or function depending on version
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

// Notification categories for actionable responses
export const SAFETY_NOTIFICATION_CATEGORIES = {
  SPEED_WARNING_DRIVER: 'SPEED_WARNING_DRIVER',
  SPEED_WARNING_RIDER: 'SPEED_WARNING_RIDER',
  ROUTE_DEVIATION: 'ROUTE_DEVIATION',
  SAFETY_CHECK: 'SAFETY_CHECK',
} as const;

// Action identifiers
export const NOTIFICATION_ACTIONS = {
  // Driver actions
  SLOW_DOWN: 'SLOW_DOWN',
  ACKNOWLEDGE_SPEED: 'ACKNOWLEDGE_SPEED',

  // Rider actions
  IM_OK: 'IM_OK',
  WARN_DRIVER: 'WARN_DRIVER',
  END_RIDE: 'END_RIDE',
  CALL_EMERGENCY: 'CALL_EMERGENCY',
} as const;

// Safety alert types
export type SafetyAlertType =
  | 'driver_speeding'
  | 'rider_speed_warning'
  | 'route_deviation'
  | 'safety_check';

export interface SafetyNotificationData {
  type: SafetyAlertType;
  tripId: string;
  userId: string;
  userType: 'driver' | 'rider';
  currentSpeed?: number;
  speedLimit?: number;
  message?: string;
  timestamp: number;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Initialize safety notification categories with actions
 */
export async function initializeSafetyNotifications(): Promise<void> {
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
      return;
    }

    // Set up notification categories with actions
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync(
        SAFETY_NOTIFICATION_CATEGORIES.SPEED_WARNING_DRIVER,
        [
          {
            identifier: NOTIFICATION_ACTIONS.SLOW_DOWN,
            buttonTitle: 'Slowing Down',
            options: { opensAppToForeground: false },
          },
          {
            identifier: NOTIFICATION_ACTIONS.ACKNOWLEDGE_SPEED,
            buttonTitle: 'I Understand',
            options: { opensAppToForeground: true },
          },
        ]
      );

      await Notifications.setNotificationCategoryAsync(
        SAFETY_NOTIFICATION_CATEGORIES.SPEED_WARNING_RIDER,
        [
          {
            identifier: NOTIFICATION_ACTIONS.IM_OK,
            buttonTitle: "I'm OK",
            options: { opensAppToForeground: false },
          },
          {
            identifier: NOTIFICATION_ACTIONS.WARN_DRIVER,
            buttonTitle: 'Warn Driver',
            options: { opensAppToForeground: true },
          },
          {
            identifier: NOTIFICATION_ACTIONS.END_RIDE,
            buttonTitle: 'End Ride',
            options: { opensAppToForeground: true, isDestructive: true },
          },
        ]
      );

      await Notifications.setNotificationCategoryAsync(
        SAFETY_NOTIFICATION_CATEGORIES.ROUTE_DEVIATION,
        [
          {
            identifier: NOTIFICATION_ACTIONS.IM_OK,
            buttonTitle: "I'm OK",
            options: { opensAppToForeground: false },
          },
          {
            identifier: NOTIFICATION_ACTIONS.CALL_EMERGENCY,
            buttonTitle: 'SOS',
            options: { opensAppToForeground: true, isDestructive: true },
          },
        ]
      );

      await Notifications.setNotificationCategoryAsync(
        SAFETY_NOTIFICATION_CATEGORIES.SAFETY_CHECK,
        [
          {
            identifier: NOTIFICATION_ACTIONS.IM_OK,
            buttonTitle: "I'm OK",
            options: { opensAppToForeground: false },
          },
          {
            identifier: NOTIFICATION_ACTIONS.CALL_EMERGENCY,
            buttonTitle: 'Need Help',
            options: { opensAppToForeground: true, isDestructive: true },
          },
        ]
      );
    }

    // Android notification channel for safety alerts
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('safety-alerts', {
        name: 'Safety Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FF0000',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Bypass Do Not Disturb for safety
      });
    }

    console.log('Safety notifications initialized');
  } catch (error) {
    console.error('Failed to initialize safety notifications:', error);
  }
}

/**
 * Send a speed warning notification to the driver
 */
export async function sendDriverSpeedWarningNotification(
  tripId: string,
  driverId: string,
  currentSpeed: number,
  speedLimit: number
): Promise<string | null> {
  try {
    const excessSpeed = Math.round(currentSpeed - speedLimit);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ SLOW DOWN!',
        body: `You're going ${Math.round(currentSpeed)} mph in a ${speedLimit} mph zone. ${excessSpeed} mph over limit!`,
        data: {
          type: 'driver_speeding',
          tripId,
          userId: driverId,
          userType: 'driver',
          currentSpeed,
          speedLimit,
          timestamp: Date.now(),
        } as SafetyNotificationData,
        categoryIdentifier: SAFETY_NOTIFICATION_CATEGORIES.SPEED_WARNING_DRIVER,
        sound: 'default',
        priority: 'max',
        ...(Platform.OS === 'android' && {
          channelId: 'safety-alerts',
          color: '#DC2626',
        }),
      },
      trigger: null, // Immediate
    });

    // Store notification state in Firebase for sync
    await updateTripSafetyAlert(tripId, {
      type: 'speed_warning',
      targetUser: 'driver',
      notificationId,
      currentSpeed,
      speedLimit,
      sentAt: Date.now(),
      responded: false,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to send driver speed warning notification:', error);
    return null;
  }
}

/**
 * Send a speed alert notification to the rider (passenger)
 */
export async function sendRiderSpeedAlertNotification(
  tripId: string,
  riderId: string,
  currentSpeed: number,
  speedLimit: number,
  driverName: string
): Promise<string | null> {
  try {
    const excessSpeed = Math.round(currentSpeed - speedLimit);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Driver Speeding',
        body: `${driverName} is going ${Math.round(currentSpeed)} mph (${excessSpeed} over limit). Tap to take action for your safety.`,
        data: {
          type: 'rider_speed_warning',
          tripId,
          userId: riderId,
          userType: 'rider',
          currentSpeed,
          speedLimit,
          timestamp: Date.now(),
        } as SafetyNotificationData,
        categoryIdentifier: SAFETY_NOTIFICATION_CATEGORIES.SPEED_WARNING_RIDER,
        sound: 'default',
        priority: 'max',
        ...(Platform.OS === 'android' && {
          channelId: 'safety-alerts',
          color: '#DC2626',
        }),
      },
      trigger: null,
    });

    // Store notification state in Firebase for sync
    await updateTripSafetyAlert(tripId, {
      type: 'speed_warning',
      targetUser: 'rider',
      notificationId,
      currentSpeed,
      speedLimit,
      sentAt: Date.now(),
      responded: false,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to send rider speed alert notification:', error);
    return null;
  }
}

/**
 * Send a route deviation notification
 */
export async function sendRouteDeviationNotification(
  tripId: string,
  userId: string,
  userType: 'driver' | 'rider',
  deviationDistance: number
): Promise<string | null> {
  try {
    const title = userType === 'rider'
      ? '📍 Route Changed'
      : '📍 Route Deviation Detected';

    const body = userType === 'rider'
      ? `Your driver has taken a different route (${Math.round(deviationDistance)}m from planned route). Are you okay?`
      : 'You have deviated from the planned route. Please confirm with your rider.';

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'route_deviation',
          tripId,
          userId,
          userType,
          timestamp: Date.now(),
        } as SafetyNotificationData,
        categoryIdentifier: SAFETY_NOTIFICATION_CATEGORIES.ROUTE_DEVIATION,
        sound: 'default',
        priority: 'max',
        ...(Platform.OS === 'android' && {
          channelId: 'safety-alerts',
          color: '#FFA500',
        }),
      },
      trigger: null,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to send route deviation notification:', error);
    return null;
  }
}

/**
 * Send a general safety check notification
 */
export async function sendSafetyCheckNotification(
  tripId: string,
  userId: string,
  userType: 'driver' | 'rider',
  message: string
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛡️ Safety Check',
        body: message,
        data: {
          type: 'safety_check',
          tripId,
          userId,
          userType,
          message,
          timestamp: Date.now(),
        } as SafetyNotificationData,
        categoryIdentifier: SAFETY_NOTIFICATION_CATEGORIES.SAFETY_CHECK,
        sound: 'default',
        priority: 'max',
        ...(Platform.OS === 'android' && {
          channelId: 'safety-alerts',
          color: '#3B82F6',
        }),
      },
      trigger: null,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to send safety check notification:', error);
    return null;
  }
}

/**
 * Update trip with safety alert data in Firebase
 */
async function updateTripSafetyAlert(
  tripId: string,
  alertData: {
    type: string;
    targetUser: string;
    notificationId: string | null;
    currentSpeed?: number;
    speedLimit?: number;
    sentAt: number;
    responded: boolean;
  }
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    await updateDoc(tripRef, {
      activeSafetyAlert: alertData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update trip safety alert:', error);
  }
}

/**
 * Mark a safety alert as responded
 */
export async function markSafetyAlertResponded(
  tripId: string,
  response: string,
  responderType: 'driver' | 'rider'
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    await updateDoc(tripRef, {
      'activeSafetyAlert.responded': true,
      'activeSafetyAlert.response': response,
      'activeSafetyAlert.respondedAt': Date.now(),
      'activeSafetyAlert.responderType': responderType,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to mark safety alert responded:', error);
  }
}

/**
 * Clear active safety alert
 */
export async function clearSafetyAlert(tripId: string): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    await updateDoc(tripRef, {
      activeSafetyAlert: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to clear safety alert:', error);
  }
}

/**
 * Send a "warn driver" message from rider
 */
export async function sendWarnDriverMessage(
  tripId: string,
  riderId: string,
  riderName: string
): Promise<void> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    await updateDoc(tripRef, {
      safetyMessage: {
        type: 'slow_down_request',
        from: 'rider',
        fromId: riderId,
        fromName: riderName,
        message: 'Please slow down for my safety',
        sentAt: Date.now(),
        acknowledged: false,
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to send warn driver message:', error);
  }
}

/**
 * Subscribe to safety alerts for a trip
 */
export function subscribeToSafetyAlerts(
  tripId: string,
  callback: (alert: any) => void
): () => void {
  const tripRef = doc(firebaseDb, 'trips', tripId);

  const unsubscribe = onSnapshot(tripRef, (snapshot) => {
    if (documentExists(snapshot)) {
      const data = snapshot.data();
      if (data?.activeSafetyAlert) {
        callback(data.activeSafetyAlert);
      }
      if (data?.safetyMessage && !data.safetyMessage.acknowledged) {
        callback({ type: 'safety_message', ...data.safetyMessage });
      }
    }
  });

  return unsubscribe;
}

/**
 * Handle notification response (when user taps action button)
 */
export function setupNotificationResponseListener(
  onResponse: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(onResponse);
}

/**
 * Dismiss all safety notifications
 */
export async function dismissAllSafetyNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Failed to dismiss notifications:', error);
  }
}

/**
 * Check if app is in background
 */
export function isAppInBackground(): boolean {
  return AppState.currentState !== 'active';
}

/**
 * Add app state listener for foreground/background transitions
 */
export function addAppStateListener(
  callback: (state: AppStateStatus) => void
): { remove: () => void } {
  const subscription = AppState.addEventListener('change', callback);
  return subscription;
}

export default {
  initializeSafetyNotifications,
  sendDriverSpeedWarningNotification,
  sendRiderSpeedAlertNotification,
  sendRouteDeviationNotification,
  sendSafetyCheckNotification,
  markSafetyAlertResponded,
  clearSafetyAlert,
  sendWarnDriverMessage,
  subscribeToSafetyAlerts,
  setupNotificationResponseListener,
  dismissAllSafetyNotifications,
  isAppInBackground,
  addAppStateListener,
};
