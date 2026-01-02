/**
 * NOTIFICATION SERVICE
 * Firebase integration for driver notifications and preferences
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

export type NotificationType = 'ride' | 'earnings' | 'system' | 'document' | 'promo' | 'admin';

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

/**
 * Helper to check if document exists
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

export const NotificationService = {
  /**
   * Get notifications for a driver
   */
  async getNotifications(driverId: string, maxResults = 50): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
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
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('driverId', '==', driverId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
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
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
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
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('driverId', '==', driverId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);

      snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, {
          read: true,
          readAt: serverTimestamp(),
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
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
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
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('driverId', '==', driverId));
      const snapshot = await getDocs(q);

      snapshot.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
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
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const notifications: Notification[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
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
      const prefsRef = doc(db, 'drivers', driverId, 'settings', 'notifications');
      const prefsDoc = await getDoc(prefsRef);

      if (!documentExists(prefsDoc)) {
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

      const data = prefsDoc.data()!;
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
      const prefsRef = doc(db, 'drivers', preferences.driverId, 'settings', 'notifications');
      await setDoc(prefsRef, {
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
        updatedAt: serverTimestamp(),
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
      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, {
        ...notification,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
};
