/**
 * Admin Messages Cloud Functions
 * Handles push notifications for admin-to-driver communications
 *
 * Features:
 * - Send push notifications when admin messages are created
 * - Support for sending to all/online/specific drivers
 * - Batch notification delivery
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Using 'main' database
const db = getFirestore(admin.app(), 'main');
const messaging = admin.messaging();

/**
 * Get icon emoji based on message type
 */
function getMessageIcon(type: string): string {
  switch (type) {
    case 'carpool_nudge':
      return '\uD83D\uDE97'; // Car emoji
    case 'announcement':
      return '\uD83D\uDCE2'; // Megaphone
    case 'promotion':
      return '\uD83C\uDF81'; // Gift
    case 'urgent':
      return '\u26A0\uFE0F'; // Warning
    default:
      return '\uD83D\uDCEC'; // Mailbox
  }
}

/**
 * Firestore trigger: Send push notifications when an admin message is created
 * Triggered when a new document is added to adminMessages collection
 */
export const onAdminMessageCreated = onDocumentCreated(
  { document: 'adminMessages/{messageId}', region: 'us-east1', database: 'main' },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data in snapshot');
      return null;
    }

    const messageData = snapshot.data();
    const { messageId } = event.params;

    console.log(`\uD83D\uDCE8 Processing admin message ${messageId}`);

    // Skip if already processed
    if (messageData.pushNotificationsSent) {
      console.log('Push notifications already sent for this message');
      return null;
    }

    try {
      // Determine which drivers to notify
      let targetDriverIds: string[] = [];
      const recipientType = messageData.recipientType;

      if (recipientType === 'specific' && messageData.recipientIds) {
        targetDriverIds = messageData.recipientIds;
      } else {
        // Query drivers based on recipient type
        let driversQuery;
        const driversRef = db.collection('drivers');

        if (recipientType === 'online') {
          driversQuery = driversRef.where('isOnline', '==', true);
        } else {
          // All approved drivers
          driversQuery = driversRef.where('registrationStatus', '==', 'approved');
        }

        const driversSnapshot = await driversQuery.get();
        targetDriverIds = driversSnapshot.docs.map(doc => doc.id);
      }

      if (targetDriverIds.length === 0) {
        console.log('No target drivers found');
        await snapshot.ref.update({
          pushNotificationsSent: true,
          pushSuccessCount: 0,
          pushFailureCount: 0,
        });
        return null;
      }

      console.log(`Sending push notifications to ${targetDriverIds.length} drivers`);

      // Collect FCM tokens
      const tokens: string[] = [];
      const driverTokenMap: { [key: string]: string } = {};

      for (const driverId of targetDriverIds) {
        try {
          const driverDoc = await db.collection('drivers').doc(driverId).get();
          const driverData = driverDoc.data();
          const fcmToken = driverData?.fcmToken || driverData?.pushToken;

          if (fcmToken) {
            tokens.push(fcmToken);
            driverTokenMap[fcmToken] = driverId;
          }
        } catch (err) {
          console.log(`Could not get token for driver ${driverId}`);
        }
      }

      if (tokens.length === 0) {
        console.log('No FCM tokens found for target drivers');
        await snapshot.ref.update({
          pushNotificationsSent: true,
          pushSuccessCount: 0,
          pushFailureCount: targetDriverIds.length,
        });
        return null;
      }

      // Build notification message
      const icon = getMessageIcon(messageData.type);
      const title = `${icon} ${messageData.title}`;
      const body = messageData.body;

      // Send notifications in batches of 500 (FCM limit)
      const BATCH_SIZE = 500;
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batchTokens = tokens.slice(i, i + BATCH_SIZE);

        const message: admin.messaging.MulticastMessage = {
          tokens: batchTokens,
          notification: {
            title,
            body,
          },
          data: {
            type: 'ADMIN_MESSAGE',
            messageId,
            messageType: messageData.type || 'custom',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          android: {
            priority: 'high',
            notification: {
              channelId: messageData.type === 'urgent' ? 'urgent_messages' : 'admin_messages',
              priority: messageData.type === 'urgent' ? 'max' : 'high',
              defaultSound: true,
              defaultVibrateTimings: true,
              icon: 'ic_notification',
              color: '#5d1289',
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
                'content-available': 1,
              },
            },
            headers: {
              'apns-priority': messageData.type === 'urgent' ? '10' : '5',
            },
          },
        };

        try {
          const response = await messaging.sendEachForMulticast(message);
          successCount += response.successCount;
          failureCount += response.failureCount;

          // Log failures for debugging
          if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const failedToken = batchTokens[idx];
                const driverId = driverTokenMap[failedToken];
                console.log(`Failed to send to driver ${driverId}:`, resp.error?.message);

                // If token is invalid, we could clean it up
                if (resp.error?.code === 'messaging/invalid-registration-token' ||
                    resp.error?.code === 'messaging/registration-token-not-registered') {
                  // Optionally remove invalid token from driver document
                  db.collection('drivers').doc(driverId).update({
                    fcmToken: admin.firestore.FieldValue.delete(),
                    pushToken: admin.firestore.FieldValue.delete(),
                  }).catch(e => console.log('Could not clean up invalid token:', e));
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error sending batch ${i / BATCH_SIZE}:`, error);
          failureCount += batchTokens.length;
        }
      }

      console.log(`\uD83D\uDCF1 Admin message push notifications: ${successCount} success, ${failureCount} failed`);

      // Update message document with results
      await snapshot.ref.update({
        pushNotificationsSent: true,
        pushSuccessCount: successCount,
        pushFailureCount: failureCount,
        pushSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, successCount, failureCount };
    } catch (error) {
      console.error('Error processing admin message:', error);

      // Mark as attempted to avoid retry loops
      await snapshot.ref.update({
        pushNotificationsSent: true,
        pushError: (error as Error).message,
      });

      return { success: false, error };
    }
  }
);
