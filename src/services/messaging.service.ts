/**
 * Messaging Service
 * Handles in-app messaging between riders and drivers during active trips
 * Messages are only available after driver accepts ride and before trip starts
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import { firebaseDb } from '../config/firebase';
import firestore, {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  FirebaseFirestoreTypes,
  writeBatch,
} from '@react-native-firebase/firestore';

// Message types
export type MessageType = 'text' | 'location' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  senderType: 'rider' | 'driver' | 'system';
  text: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: FirebaseFirestoreTypes.Timestamp | null;
  readAt?: FirebaseFirestoreTypes.Timestamp | null;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
}

export interface SendMessageParams {
  tripId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  senderType: 'rider' | 'driver';
  text: string;
  type?: MessageType;
}

/**
 * Subscribe to messages for a specific trip
 * Returns unsubscribe function
 */
export function subscribeToMessages(
  tripId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(firebaseDb, 'trips', tripId, 'messages');

  const q = query(
    messagesRef,
    orderBy('timestamp', 'asc'),
    limit(100) // Limit to last 100 messages
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        messages.push({
          id: docSnapshot.id,
          tripId: tripId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhoto: data.senderPhoto,
          senderType: data.senderType,
          text: data.text,
          type: data.type || 'text',
          status: data.status || 'sent',
          timestamp: data.timestamp,
          readAt: data.readAt,
          createdAt: data.createdAt,
        });
      });

      callback(messages);
    },
    (error) => {
      console.error('❌ Error subscribing to messages:', error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Send a message in a trip conversation
 */
export async function sendMessage(params: SendMessageParams): Promise<string | null> {
  try {
    const { tripId, senderId, senderName, senderPhoto, senderType, text, type = 'text' } = params;

    if (!text.trim()) {
      console.warn('⚠️ Cannot send empty message');
      return null;
    }

    const messagesRef = collection(firebaseDb, 'trips', tripId, 'messages');

    const messageData = {
      senderId,
      senderName,
      senderPhoto: senderPhoto || null,
      senderType,
      text: text.trim(),
      type,
      status: 'sent' as MessageStatus,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(messagesRef, messageData);

    console.log('✅ Message sent:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return null;
  }
}

/**
 * Send a system message (e.g., "Driver is arriving", "Trip started")
 */
export async function sendSystemMessage(
  tripId: string,
  text: string
): Promise<string | null> {
  try {
    const messagesRef = collection(firebaseDb, 'trips', tripId, 'messages');

    const messageData = {
      senderId: 'system',
      senderName: 'System',
      senderType: 'system',
      text,
      type: 'system' as MessageType,
      status: 'sent' as MessageStatus,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(messagesRef, messageData);

    console.log('✅ System message sent:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending system message:', error);
    return null;
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(
  tripId: string,
  messageId: string
): Promise<boolean> {
  try {
    const messageRef = doc(firebaseDb, 'trips', tripId, 'messages', messageId);

    await updateDoc(messageRef, {
      status: 'read',
      readAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    return false;
  }
}

/**
 * Mark all unread messages as read for a user
 */
export async function markAllMessagesAsRead(
  tripId: string,
  userId: string
): Promise<boolean> {
  try {
    const messagesRef = collection(firebaseDb, 'trips', tripId, 'messages');

    // Get all unread messages not sent by this user
    const q = query(
      messagesRef,
      where('senderId', '!=', userId),
      where('status', '!=', 'read')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return true;
    }

    const batch = writeBatch(firebaseDb);

    snapshot.forEach((docSnapshot) => {
      const messageRef = doc(firebaseDb, 'trips', tripId, 'messages', docSnapshot.id);
      batch.update(messageRef, {
        status: 'read',
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(`✅ Marked ${snapshot.size} messages as read`);
    return true;
  } catch (error) {
    console.error('❌ Error marking all messages as read:', error);
    return false;
  }
}

/**
 * Get unread message count for a user in a trip
 */
export async function getUnreadMessageCount(
  tripId: string,
  userId: string
): Promise<number> {
  try {
    const messagesRef = collection(firebaseDb, 'trips', tripId, 'messages');

    // Get messages not sent by this user that are not read
    const q = query(
      messagesRef,
      where('senderId', '!=', userId),
      where('status', 'in', ['sent', 'delivered'])
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return 0;
  }
}

/**
 * Get message history for a trip
 */
export async function getMessageHistory(
  tripId: string,
  messageLimit: number = 50
): Promise<Message[]> {
  try {
    const messagesRef = collection(firebaseDb, 'trips', tripId, 'messages');

    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(messageLimit)
    );

    const snapshot = await getDocs(q);
    const messages: Message[] = [];

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      messages.push({
        id: docSnapshot.id,
        tripId: tripId,
        senderId: data.senderId,
        senderName: data.senderName,
        senderPhoto: data.senderPhoto,
        senderType: data.senderType,
        text: data.text,
        type: data.type || 'text',
        status: data.status || 'sent',
        timestamp: data.timestamp,
        readAt: data.readAt,
        createdAt: data.createdAt,
      });
    });

    // Return in chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('❌ Error getting message history:', error);
    return [];
  }
}

/**
 * Check if messaging is enabled for a trip
 * Messaging is only available when:
 * - Trip status is DRIVER_ARRIVING or DRIVER_ARRIVED
 * - Trip is not cancelled
 * - Trip has not started yet (IN_PROGRESS)
 */
export async function isMessagingEnabled(tripId: string): Promise<boolean> {
  try {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return false;
    }

    const tripData = tripDoc.data();
    const allowedStatuses = ['DRIVER_ARRIVING', 'DRIVER_ARRIVED'];

    return allowedStatuses.includes(tripData?.status);
  } catch (error) {
    console.error('❌ Error checking messaging status:', error);
    return false;
  }
}

/**
 * End messaging for a trip (called when trip starts)
 * Sends a system message indicating chat has ended
 */
export async function endMessaging(tripId: string): Promise<boolean> {
  try {
    await sendSystemMessage(
      tripId,
      'Chat ended - Trip has started. Have a safe journey!'
    );

    console.log('✅ Messaging ended for trip:', tripId);
    return true;
  } catch (error) {
    console.error('❌ Error ending messaging:', error);
    return false;
  }
}

/**
 * Initialize messaging for a trip (called when driver accepts)
 * Sends a welcome system message
 */
export async function initializeMessaging(
  tripId: string,
  driverName: string
): Promise<boolean> {
  try {
    await sendSystemMessage(
      tripId,
      `${driverName} has accepted your ride. You can now chat with your driver.`
    );

    console.log('✅ Messaging initialized for trip:', tripId);
    return true;
  } catch (error) {
    console.error('❌ Error initializing messaging:', error);
    return false;
  }
}

/**
 * Send a push notification for a new message via Cloud Function
 */
export async function sendMessageNotification(
  tripId: string,
  recipientId: string,
  recipientType: 'rider' | 'driver',
  senderName: string,
  messageText: string
): Promise<boolean> {
  try {
    const functions = require('@react-native-firebase/functions').default;

    // Call Cloud Function to send push notification
    const sendNotification = functions().httpsCallable('sendMessageNotification');

    await sendNotification({
      tripId,
      recipientId,
      recipientType,
      title: `New message from ${senderName}`,
      body: messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText,
      data: {
        type: 'CHAT_MESSAGE',
        tripId,
        senderName,
      },
    });

    console.log('📱 Push notification sent for message');
    return true;
  } catch (error) {
    console.error('❌ Failed to send message notification:', error);
    // Don't throw - notification failure shouldn't break the chat
    return false;
  }
}

/**
 * Subscribe to unread message count (real-time)
 * Returns unsubscribe function
 */
export function subscribeToUnreadCount(
  tripId: string,
  userId: string,
  callback: (count: number) => void
): () => void {
  const messagesRef = collection(firebaseDb, 'trips', tripId, 'messages');

  // Note: Firestore doesn't support != and 'in' in the same query,
  // so we fetch all messages and filter client-side
  const q = query(
    messagesRef,
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      let unreadCount = 0;

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Count messages not from this user that are unread
        if (data.senderId !== userId && data.status !== 'read') {
          unreadCount++;
        }
      });

      callback(unreadCount);
    },
    (error) => {
      console.error('❌ Error subscribing to unread count:', error);
      callback(0);
    }
  );

  return unsubscribe;
}

export default {
  subscribeToMessages,
  sendMessage,
  sendSystemMessage,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadMessageCount,
  getMessageHistory,
  isMessagingEnabled,
  endMessaging,
  initializeMessaging,
  sendMessageNotification,
  subscribeToUnreadCount,
};
