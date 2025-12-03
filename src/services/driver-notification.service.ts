/**
 * DRIVER NOTIFICATION SERVICE
 *
 * Handles push notifications for drivers including:
 * - Ride request notifications when app is in background
 * - Actionable notifications to accept/decline from notification
 * - Online status persistence
 */

import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';

// Notification categories
export const DRIVER_NOTIFICATION_CATEGORIES = {
  RIDE_REQUEST: 'RIDE_REQUEST',
} as const;

// Action identifiers
export const DRIVER_NOTIFICATION_ACTIONS = {
  ACCEPT_RIDE: 'ACCEPT_RIDE',
  DECLINE_RIDE: 'DECLINE_RIDE',
  VIEW_RIDE: 'VIEW_RIDE',
} as const;

// Configure notification handler for driver
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // Always show ride request notifications prominently
    if (data?.type === 'ride_request') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

/**
 * Initialize driver notification system
 */
export async function initializeDriverNotifications(): Promise<void> {
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted for driver');
      return;
    }

    // Set up notification categories with actions for iOS
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync(
        DRIVER_NOTIFICATION_CATEGORIES.RIDE_REQUEST,
        [
          {
            identifier: DRIVER_NOTIFICATION_ACTIONS.ACCEPT_RIDE,
            buttonTitle: 'Accept',
            options: { opensAppToForeground: true },
          },
          {
            identifier: DRIVER_NOTIFICATION_ACTIONS.DECLINE_RIDE,
            buttonTitle: 'Decline',
            options: { opensAppToForeground: false, isDestructive: true },
          },
        ]
      );
    }

    // Android notification channel for ride requests
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('ride-requests', {
        name: 'Ride Requests',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor: '#00C853',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Important for drivers to not miss requests
      });
    }

    console.log('Driver notifications initialized');
  } catch (error) {
    console.error('Failed to initialize driver notifications:', error);
  }
}

/**
 * Send a ride request notification to the driver
 */
export async function sendRideRequestNotification(
  requestId: string,
  riderName: string,
  pickupAddress: string,
  destinationAddress: string,
  estimatedEarnings: number,
  distanceFromDriver: number
): Promise<string | null> {
  try {
    // Format distance
    const distanceText = distanceFromDriver < 1000
      ? `${Math.round(distanceFromDriver)}m away`
      : `${(distanceFromDriver / 1000).toFixed(1)}km away`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 New Ride Request!',
        body: `${riderName} needs a ride • CI$${estimatedEarnings.toFixed(2)} • ${distanceText}`,
        subtitle: `From: ${pickupAddress.substring(0, 40)}${pickupAddress.length > 40 ? '...' : ''}`,
        data: {
          type: 'ride_request',
          requestId,
          riderName,
          pickupAddress,
          destinationAddress,
          estimatedEarnings,
          distanceFromDriver,
          timestamp: Date.now(),
        },
        categoryIdentifier: DRIVER_NOTIFICATION_CATEGORIES.RIDE_REQUEST,
        sound: 'default',
        priority: 'max',
        ...(Platform.OS === 'android' && {
          channelId: 'ride-requests',
          color: '#00C853',
        }),
      },
      trigger: null, // Immediate
    });

    console.log('📲 Sent ride request notification:', requestId);
    return notificationId;
  } catch (error) {
    console.error('Failed to send ride request notification:', error);
    return null;
  }
}

/**
 * Dismiss all ride request notifications
 */
export async function dismissRideRequestNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Failed to dismiss notifications:', error);
  }
}

/**
 * Set up notification response listener for driver actions
 */
export function setupDriverNotificationListener(
  onAccept: (requestId: string) => void,
  onDecline: (requestId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data as any;

    console.log('📲 Driver notification response:', actionId, data?.requestId);

    if (data?.type !== 'ride_request') return;

    const requestId = data.requestId;
    if (!requestId) return;

    switch (actionId) {
      case DRIVER_NOTIFICATION_ACTIONS.ACCEPT_RIDE:
        onAccept(requestId);
        break;

      case DRIVER_NOTIFICATION_ACTIONS.DECLINE_RIDE:
        onDecline(requestId);
        break;

      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        // User tapped the notification body - navigate to home to see the request
        router.replace('/(driver)/tabs');
        break;
    }
  });
}

/**
 * Check if app is in background
 */
export function isAppInBackground(): boolean {
  return AppState.currentState !== 'active';
}

/**
 * Add app state listener
 */
export function addAppStateListener(
  callback: (state: AppStateStatus) => void
): { remove: () => void } {
  return AppState.addEventListener('change', callback);
}

export default {
  initializeDriverNotifications,
  sendRideRequestNotification,
  dismissRideRequestNotifications,
  setupDriverNotificationListener,
  isAppInBackground,
  addAppStateListener,
};
