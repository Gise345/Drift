/**
 * DRIVER NOTIFICATION SERVICE
 *
 * Handles push notifications for drivers including:
 * - Ride request notifications when app is in background
 * - Chat message notifications during active trips
 * - Actionable notifications to accept/decline from notification
 * - Online status persistence
 * - Saving notifications to inbox
 */

import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import { NotificationService } from './notification.service';

// Notification categories
export const DRIVER_NOTIFICATION_CATEGORIES = {
  RIDE_REQUEST: 'RIDE_REQUEST',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
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

    // Show chat message notifications
    if (data?.type === 'CHAT_MESSAGE') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
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

    // Android notification channels
    if (Platform.OS === 'android') {
      // Channel for ride requests (highest priority)
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

      // Channel for chat messages
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        description: 'Chat messages from riders during active trips',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5d1289',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      });
    }

    console.log('Driver notifications initialized');
  } catch (error) {
    console.error('Failed to initialize driver notifications:', error);
  }
}

/**
 * Register for push notifications and save token to Firebase
 * This must be called for drivers to receive ride request notifications when app is closed
 * Uses Firebase Cloud Messaging (FCM) token for Cloud Functions compatibility
 */
export async function registerPushToken(driverId: string): Promise<string | null> {
  try {
    // Request permissions first
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return null;
    }

    // Get the FCM token using Firebase Messaging
    // This is required for Cloud Functions to send notifications
    const messaging = require('@react-native-firebase/messaging').default;

    // Request permission for iOS
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('FCM permission not granted on iOS');
        return null;
      }
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();

    if (!fcmToken) {
      console.warn('Failed to get FCM token');
      return null;
    }

    console.log('📱 Got FCM token:', fcmToken.substring(0, 20) + '...');

    // Save to Firebase
    const { saveDriverPushToken } = require('./driver-profile.service');
    await saveDriverPushToken(driverId, fcmToken);

    // Set up token refresh listener
    messaging().onTokenRefresh(async (newToken: string) => {
      console.log('📱 FCM token refreshed, saving new token...');
      await saveDriverPushToken(driverId, newToken);
    });

    return fcmToken;
  } catch (error) {
    console.error('Failed to register push token:', error);
    return null;
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

/**
 * Save a notification to the driver's inbox in Firebase
 */
export async function saveNotificationToInbox(
  driverId: string,
  title: string,
  message: string,
  type: 'ride' | 'earnings' | 'system' | 'document' | 'promo',
  data?: any
): Promise<void> {
  try {
    await NotificationService.createNotification({
      driverId,
      type,
      title,
      message,
      read: false,
      data,
    });
    console.log('📥 Notification saved to inbox');
  } catch (error) {
    console.error('Failed to save notification to inbox:', error);
  }
}

/**
 * Set up listener for incoming push notifications (foreground)
 * Saves notifications to inbox and handles navigation
 */
export function setupPushNotificationListener(
  driverId: string,
  onMessageReceived?: (tripId: string, senderName: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(async (notification) => {
    const data = notification.request.content.data as any;
    const title = notification.request.content.title || '';
    const body = notification.request.content.body || '';

    console.log('📲 Push notification received:', data?.type);

    // Handle chat message notifications
    if (data?.type === 'CHAT_MESSAGE') {
      // Save to inbox as a ride notification (message related to trip)
      await saveNotificationToInbox(
        driverId,
        title,
        body,
        'ride',
        {
          tripId: data.tripId,
          senderName: data.senderName,
          messageType: 'chat',
        }
      );

      // Notify the app about the new message
      if (onMessageReceived && data.tripId && data.senderName) {
        onMessageReceived(data.tripId, data.senderName);
      }
    }

    // Handle ride request notifications
    if (data?.type === 'ride_request') {
      await saveNotificationToInbox(
        driverId,
        title,
        body,
        'ride',
        {
          requestId: data.requestId,
          riderName: data.riderName,
          messageType: 'ride_request',
        }
      );
    }

    // Handle earnings notifications
    if (data?.type === 'earnings' || data?.type === 'payout') {
      await saveNotificationToInbox(
        driverId,
        title,
        body,
        'earnings',
        data
      );
    }

    // Handle system notifications
    if (data?.type === 'system' || data?.type === 'announcement') {
      await saveNotificationToInbox(
        driverId,
        title,
        body,
        'system',
        data
      );
    }
  });
}

/**
 * Set up listener for notification taps/responses (including chat messages)
 */
export function setupNotificationResponseListener(
  onRideAccept: (requestId: string) => void,
  onRideDecline: (requestId: string) => void,
  onMessageTap?: (tripId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data as any;

    console.log('📲 Notification response:', actionId, data?.type);

    // Handle chat message tap - navigate to chat
    if (data?.type === 'CHAT_MESSAGE') {
      if (data.tripId && onMessageTap) {
        onMessageTap(data.tripId);
      } else {
        // Default: navigate to active ride screen
        router.push('/(driver)/active-ride/navigate-to-pickup');
      }
      return;
    }

    // Handle ride request actions
    if (data?.type === 'ride_request') {
      const requestId = data.requestId;
      if (!requestId) return;

      switch (actionId) {
        case DRIVER_NOTIFICATION_ACTIONS.ACCEPT_RIDE:
          onRideAccept(requestId);
          break;

        case DRIVER_NOTIFICATION_ACTIONS.DECLINE_RIDE:
          onRideDecline(requestId);
          break;

        case Notifications.DEFAULT_ACTION_IDENTIFIER:
          // User tapped the notification body - navigate to home
          router.replace('/(driver)/tabs');
          break;
      }
    }
  });
}

/**
 * Send a local chat message notification (for foreground display)
 */
export async function sendChatMessageNotification(
  senderName: string,
  messageText: string,
  tripId: string
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💬 ${senderName}`,
        body: messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText,
        data: {
          type: 'CHAT_MESSAGE',
          tripId,
          senderName,
          timestamp: Date.now(),
        },
        categoryIdentifier: DRIVER_NOTIFICATION_CATEGORIES.CHAT_MESSAGE,
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: 'messages',
          color: '#5d1289',
        }),
      },
      trigger: null, // Immediate
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to send chat notification:', error);
    return null;
  }
}

export default {
  initializeDriverNotifications,
  registerPushToken,
  sendRideRequestNotification,
  dismissRideRequestNotifications,
  setupDriverNotificationListener,
  setupPushNotificationListener,
  setupNotificationResponseListener,
  saveNotificationToInbox,
  sendChatMessageNotification,
  isAppInBackground,
  addAppStateListener,
};
