/**
 * ADMIN MESSAGE SERVICE
 * Service for admin to send messages/notifications to drivers
 *
 * Features:
 * - Send messages to all drivers or specific drivers
 * - Pre-defined message templates (carpool nudge, etc.)
 * - Message history tracking
 * - Push notification integration
 */

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from '@react-native-firebase/firestore';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

export type MessageType = 'carpool_nudge' | 'announcement' | 'promotion' | 'urgent' | 'custom';

export interface AdminMessage {
  id: string;
  title: string;
  body: string;
  type: MessageType;
  recipientType: 'all' | 'specific' | 'online';
  recipientIds?: string[]; // If specific drivers selected
  sentBy: string; // Admin user ID
  sentByName: string; // Admin name
  sentAt: Date;
  deliveredCount: number;
  failedCount: number;
}

export interface MessageTemplate {
  id: string;
  title: string;
  body: string;
  type: MessageType;
  icon: string;
}

// Pre-defined message templates
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'carpool_available',
    title: 'Carpool Request Available!',
    body: 'We have riders looking for carpool! Check your app now for available ride requests.',
    type: 'carpool_nudge',
    icon: 'people',
  },
  {
    id: 'high_demand',
    title: 'High Demand Area!',
    body: 'There are many riders looking for rides in your area. Go online now to maximize your earnings!',
    type: 'carpool_nudge',
    icon: 'trending-up',
  },
  {
    id: 'peak_hours',
    title: 'Peak Hours Starting!',
    body: 'Peak hours are starting soon. Get ready for increased ride requests and potential bonuses.',
    type: 'announcement',
    icon: 'time',
  },
  {
    id: 'weather_alert',
    title: 'Weather Advisory',
    body: 'Weather conditions may affect driving. Please drive safely and be prepared for potential delays.',
    type: 'urgent',
    icon: 'rainy',
  },
  {
    id: 'app_update',
    title: 'App Update Available',
    body: 'A new version of the Drift app is available. Please update to get the latest features and improvements.',
    type: 'announcement',
    icon: 'download',
  },
  {
    id: 'bonus_opportunity',
    title: 'Bonus Opportunity!',
    body: 'Complete rides today to earn bonus rewards. Check the app for details!',
    type: 'promotion',
    icon: 'gift',
  },
];

export const AdminMessageService = {
  /**
   * Send a message to drivers
   * This creates entries in the notifications collection and triggers push notifications
   */
  async sendMessage(
    title: string,
    body: string,
    type: MessageType,
    recipientType: 'all' | 'specific' | 'online',
    sentBy: string,
    sentByName: string,
    recipientIds?: string[]
  ): Promise<{ success: boolean; deliveredCount: number; failedCount: number; messageId: string }> {
    try {
      // Get target drivers based on recipient type
      let targetDriverIds: string[] = [];

      if (recipientType === 'specific' && recipientIds && recipientIds.length > 0) {
        targetDriverIds = recipientIds;
      } else {
        // Query drivers collection
        const driversRef = collection(db, 'drivers');
        let driversQuery;

        if (recipientType === 'online') {
          driversQuery = query(driversRef, where('isOnline', '==', true));
        } else {
          // All drivers with approved status
          driversQuery = query(driversRef, where('registrationStatus', '==', 'approved'));
        }

        const driversSnapshot = await getDocs(driversQuery);
        targetDriverIds = driversSnapshot.docs.map(doc => doc.id);
      }

      if (targetDriverIds.length === 0) {
        return { success: false, deliveredCount: 0, failedCount: 0, messageId: '' };
      }

      // Create admin message record first
      const adminMessagesRef = collection(db, 'adminMessages');
      const messageDoc = await addDoc(adminMessagesRef, {
        title,
        body,
        type,
        recipientType,
        recipientIds: recipientType === 'specific' ? recipientIds : null,
        recipientCount: targetDriverIds.length,
        sentBy,
        sentByName,
        sentAt: serverTimestamp(),
        status: 'sending',
      });

      // Create notifications for each driver in batches
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      let batchCount = 0;
      const MAX_BATCH_SIZE = 500;

      for (const driverId of targetDriverIds) {
        const notificationRef = doc(notificationsRef);
        batch.set(notificationRef, {
          driverId,
          type: 'admin',
          title,
          message: body,
          messageType: type,
          read: false,
          adminMessageId: messageDoc.id,
          sentBy,
          sentByName,
          createdAt: serverTimestamp(),
        });

        batchCount++;

        // Commit batch if we hit the limit
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          batchCount = 0;
        }
      }

      // Commit remaining
      if (batchCount > 0) {
        await batch.commit();
      }

      // Update message record with success
      const messageRef = doc(db, 'adminMessages', messageDoc.id);
      await messageRef.update({
        status: 'sent',
        deliveredCount: targetDriverIds.length,
        failedCount: 0,
      });

      return {
        success: true,
        deliveredCount: targetDriverIds.length,
        failedCount: 0,
        messageId: messageDoc.id,
      };
    } catch (error) {
      console.error('Error sending admin message:', error);
      throw error;
    }
  },

  /**
   * Get message history
   */
  async getMessageHistory(maxResults = 50): Promise<AdminMessage[]> {
    try {
      const messagesRef = collection(db, 'adminMessages');
      const q = query(
        messagesRef,
        orderBy('sentAt', 'desc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          body: data.body,
          type: data.type,
          recipientType: data.recipientType,
          recipientIds: data.recipientIds,
          sentBy: data.sentBy,
          sentByName: data.sentByName,
          sentAt: data.sentAt?.toDate() || new Date(),
          deliveredCount: data.deliveredCount || 0,
          failedCount: data.failedCount || 0,
        };
      });
    } catch (error) {
      console.error('Error getting message history:', error);
      return [];
    }
  },

  /**
   * Get all approved drivers for selection
   */
  async getApprovedDrivers(): Promise<Array<{ id: string; name: string; isOnline: boolean }>> {
    try {
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, where('registrationStatus', '==', 'approved'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || data.firstName + ' ' + data.lastName || 'Unknown',
          isOnline: data.isOnline || false,
        };
      });
    } catch (error) {
      console.error('Error getting approved drivers:', error);
      return [];
    }
  },

  /**
   * Get online driver count
   */
  async getOnlineDriverCount(): Promise<number> {
    try {
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, where('isOnline', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting online driver count:', error);
      return 0;
    }
  },

  /**
   * Get total approved driver count
   */
  async getTotalDriverCount(): Promise<number> {
    try {
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, where('registrationStatus', '==', 'approved'));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total driver count:', error);
      return 0;
    }
  },
};
