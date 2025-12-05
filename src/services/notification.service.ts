/**
 * NOTIFICATION SERVICE
 * Firebase integration for driver notifications and preferences
 *
 * EXPO SDK 52 Compatible
 */

import firestore from '@react-native-firebase/firestore';

export type NotificationType = 'ride' | 'earnings' | 'system' | 'document' | 'promo';

export interface Notification {
  id: string;
  driverId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  action?: string;
  createdAt: Date;
  data?: any;
}

export interface NotificationPreferences {
  driverId: string;
  pushEnabled: boolean;
  rideRequests: boolean;
  rideUpdates: boolean;
  earnings: boolean;
  tips: boolean;
  system: boolean;
  reminders: boolean;
  sound: boolean;
  vibration: boolean;
  inApp: boolean;
  updatedAt: Date;
}

export const NotificationService = {
  /**
   * Get notifications for a driver
   */
  async getNotifications(driverId: string, limit = 50): Promise<Notification[]> {
    try {
      const snapshot = await firestore()
        .collection('notifications')
        .where('driverId', '==', driverId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          driverId: data.driverId,
          type: data.type,
          title: data.title,
          message: data.message,
          read: data.read || false,
          action: data.action,
          createdAt: data.createdAt?.toDate() || new Date(),
          data: data.data,
        };
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(driverId: string): Promise<number> {
    try {
      const snapshot = await firestore()
        .collection('notifications')
        .where('driverId', '==', driverId)
        .where('read', '==', false)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await firestore()
        .collection('notifications')
        .doc(notificationId)
        .update({
          read: true,
          readAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(driverId: string): Promise<void> {
    try {
      const batch = firestore().batch();
      const snapshot = await firestore()
        .collection('notifications')
        .where('driverId', '==', driverId)
        .where('read', '==', false)
        .get();

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await firestore()
        .collection('notifications')
        .doc(notificationId)
        .delete();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Delete all notifications for a driver
   */
  async deleteAllNotifications(driverId: string): Promise<void> {
    try {
      const batch = firestore().batch();
      const snapshot = await firestore()
        .collection('notifications')
        .where('driverId', '==', driverId)
        .get();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  },

  /**
   * Listen to real-time notifications
   */
  subscribeToNotifications(
    driverId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection('notifications')
      .where('driverId', '==', driverId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        snapshot => {
          const notifications: Notification[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              driverId: data.driverId,
              type: data.type,
              title: data.title,
              message: data.message,
              read: data.read || false,
              action: data.action,
              createdAt: data.createdAt?.toDate() || new Date(),
              data: data.data,
            };
          });
          callback(notifications);
        },
        error => {
          console.error('Error subscribing to notifications:', error);
        }
      );

    return unsubscribe;
  },

  /**
   * Get notification preferences
   */
  async getPreferences(driverId: string): Promise<NotificationPreferences | null> {
    try {
      const doc = await firestore()
        .collection('drivers')
        .doc(driverId)
        .collection('settings')
        .doc('notifications')
        .get();

      if (!doc.exists) {
        // Return defaults
        return {
          driverId,
          pushEnabled: true,
          rideRequests: true,
          rideUpdates: true,
          earnings: true,
          tips: true,
          system: true,
          reminders: true,
          sound: true,
          vibration: true,
          inApp: true,
          updatedAt: new Date(),
        };
      }

      const data = doc.data()!;
      return {
        driverId,
        pushEnabled: data.pushEnabled ?? true,
        rideRequests: data.rideRequests ?? true,
        rideUpdates: data.rideUpdates ?? true,
        earnings: data.earnings ?? true,
        tips: data.tips ?? true,
        system: data.system ?? true,
        reminders: data.reminders ?? true,
        sound: data.sound ?? true,
        vibration: data.vibration ?? true,
        inApp: data.inApp ?? true,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  },

  /**
   * Save notification preferences
   */
  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await firestore()
        .collection('drivers')
        .doc(preferences.driverId)
        .collection('settings')
        .doc('notifications')
        .set({
          pushEnabled: preferences.pushEnabled,
          rideRequests: preferences.rideRequests,
          rideUpdates: preferences.rideUpdates,
          earnings: preferences.earnings,
          tips: preferences.tips,
          system: preferences.system,
          reminders: preferences.reminders,
          sound: preferences.sound,
          vibration: preferences.vibration,
          inApp: preferences.inApp,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      throw error;
    }
  },

  /**
   * Create a notification (typically called from backend/cloud functions)
   */
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await firestore()
        .collection('notifications')
        .add({
          ...notification,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
};
