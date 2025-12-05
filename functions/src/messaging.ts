/**
 * Messaging Cloud Functions
 * Handles push notifications for in-app messaging between riders and drivers
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

interface SendMessageNotificationData {
  tripId: string;
  recipientId: string;
  recipientType: 'rider' | 'driver';
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification when a new message is sent
 * Called from the mobile app after sending a message
 */
export const sendMessageNotification = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to send notifications'
    );
  }

  const { tripId, recipientId, recipientType, title, body, data: notificationData } =
    request.data as SendMessageNotificationData;

  // Validate required fields
  if (!tripId || !recipientId || !title || !body) {
    throw new HttpsError(
      'invalid-argument',
      'Missing required fields: tripId, recipientId, title, body'
    );
  }

  try {
    // Get recipient's FCM token
    let fcmToken: string | null = null;

    if (recipientType === 'rider') {
      // Get token from users collection
      const userDoc = await db.collection('users').doc(recipientId).get();
      const userData = userDoc.data();
      fcmToken = userData?.fcmToken || userData?.pushToken;
    } else {
      // Get token from drivers collection
      const driverDoc = await db.collection('drivers').doc(recipientId).get();
      const driverData = driverDoc.data();
      fcmToken = driverData?.fcmToken || driverData?.pushToken;
    }

    if (!fcmToken) {
      console.log(`No FCM token found for ${recipientType} ${recipientId}`);
      return { success: false, reason: 'no_fcm_token' };
    }

    // Build notification message
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        type: 'CHAT_MESSAGE',
        tripId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...notificationData,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'messages',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Send the notification
    const response = await messaging.send(message);
    console.log(`Message notification sent successfully: ${response}`);

    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message notification:', error);
    throw new HttpsError(
      'internal',
      'Failed to send notification'
    );
  }
});

/**
 * Firestore trigger: Send notification when a new message is added to a trip
 * This is an alternative to calling sendMessageNotification from the app
 */
export const onNewMessage = onDocumentCreated(
  'trips/{tripId}/messages/{messageId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data in snapshot');
      return null;
    }

    const { tripId } = event.params;
    const messageData = snapshot.data();

    // Don't send notification for system messages
    if (messageData.senderType === 'system') {
      return null;
    }

    const senderName = messageData.senderName;
    const senderType = messageData.senderType as 'rider' | 'driver';
    const messageText = messageData.text;

    try {
      // Get the trip to find the recipient
      const tripDoc = await db.collection('trips').doc(tripId).get();
      const tripData = tripDoc.data();

      if (!tripData) {
        console.log(`Trip ${tripId} not found`);
        return null;
      }

      // Determine recipient based on sender
      let recipientId: string;
      let recipientType: 'rider' | 'driver';
      let fcmToken: string | null = null;

      if (senderType === 'rider') {
        // Message from rider, notify driver
        recipientId = tripData.driverId;
        recipientType = 'driver';
        const driverDoc = await db.collection('drivers').doc(recipientId).get();
        const driverData = driverDoc.data();
        fcmToken = driverData?.fcmToken || driverData?.pushToken;
      } else {
        // Message from driver, notify rider
        recipientId = tripData.riderId;
        recipientType = 'rider';
        const userDoc = await db.collection('users').doc(recipientId).get();
        const userData = userDoc.data();
        fcmToken = userData?.fcmToken || userData?.pushToken;
      }

      if (!fcmToken) {
        console.log(`No FCM token for ${recipientType} ${recipientId}`);
        return null;
      }

      // Build notification
      const title = `New message from ${senderName}`;
      const body = messageText.length > 100
        ? messageText.substring(0, 97) + '...'
        : messageText;

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: 'CHAT_MESSAGE',
          tripId,
          senderName,
          senderType,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'messages',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`Auto-notification sent for message: ${response}`);

      return { success: true };
    } catch (error) {
      console.error('Error in onNewMessage trigger:', error);
      return { success: false, error };
    }
  }
);
