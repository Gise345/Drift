import { create } from 'zustand';
import {
  Message,
  subscribeToMessages,
  sendMessage as sendMessageService,
  markAllMessagesAsRead,
  getUnreadMessageCount,
  initializeMessaging,
  endMessaging,
} from '../services/messaging.service';

interface MessagingState {
  // State
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  activeTripId: string | null;
  isMessagingEnabled: boolean;

  // Actions
  subscribeToTripMessages: (tripId: string) => () => void;
  sendMessage: (
    tripId: string,
    senderId: string,
    senderName: string,
    senderPhoto: string | undefined,
    senderType: 'rider' | 'driver',
    text: string
  ) => Promise<boolean>;
  markAsRead: (tripId: string, userId: string) => Promise<void>;
  refreshUnreadCount: (tripId: string, userId: string) => Promise<void>;
  initializeChat: (tripId: string, driverName: string) => Promise<boolean>;
  endChat: (tripId: string) => Promise<boolean>;
  clearMessages: () => void;
  setMessagingEnabled: (enabled: boolean) => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  // Initial state
  messages: [],
  unreadCount: 0,
  isLoading: false,
  isSending: false,
  error: null,
  activeTripId: null,
  isMessagingEnabled: false,

  /**
   * Subscribe to messages for a trip
   * Returns unsubscribe function
   */
  subscribeToTripMessages: (tripId: string) => {
    set({ isLoading: true, activeTripId: tripId, error: null });

    const unsubscribe = subscribeToMessages(tripId, (messages) => {
      set({ messages, isLoading: false });
    });

    // Return cleanup function
    return () => {
      unsubscribe();
      set({ messages: [], activeTripId: null });
    };
  },

  /**
   * Send a message in the trip conversation
   */
  sendMessage: async (
    tripId: string,
    senderId: string,
    senderName: string,
    senderPhoto: string | undefined,
    senderType: 'rider' | 'driver',
    text: string
  ): Promise<boolean> => {
    if (!text.trim()) {
      return false;
    }

    set({ isSending: true, error: null });

    try {
      const messageId = await sendMessageService({
        tripId,
        senderId,
        senderName,
        senderPhoto,
        senderType,
        text,
        type: 'text',
      });

      set({ isSending: false });
      return messageId !== null;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      set({
        isSending: false,
        error: 'Failed to send message. Please try again.',
      });
      return false;
    }
  },

  /**
   * Mark all messages as read for current user
   */
  markAsRead: async (tripId: string, userId: string) => {
    try {
      await markAllMessagesAsRead(tripId, userId);
      set({ unreadCount: 0 });
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  },

  /**
   * Refresh unread message count
   */
  refreshUnreadCount: async (tripId: string, userId: string) => {
    try {
      const count = await getUnreadMessageCount(tripId, userId);
      set({ unreadCount: count });
    } catch (error) {
      console.error('❌ Error refreshing unread count:', error);
    }
  },

  /**
   * Initialize chat when driver accepts ride
   */
  initializeChat: async (tripId: string, driverName: string): Promise<boolean> => {
    try {
      const success = await initializeMessaging(tripId, driverName);
      if (success) {
        set({ isMessagingEnabled: true });
      }
      return success;
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
      return false;
    }
  },

  /**
   * End chat when trip starts
   */
  endChat: async (tripId: string): Promise<boolean> => {
    try {
      const success = await endMessaging(tripId);
      if (success) {
        set({ isMessagingEnabled: false });
      }
      return success;
    } catch (error) {
      console.error('❌ Error ending chat:', error);
      return false;
    }
  },

  /**
   * Clear all messages (when leaving chat)
   */
  clearMessages: () => {
    set({
      messages: [],
      unreadCount: 0,
      error: null,
      activeTripId: null,
      isMessagingEnabled: false,
    });
  },

  /**
   * Set messaging enabled state
   */
  setMessagingEnabled: (enabled: boolean) => {
    set({ isMessagingEnabled: enabled });
  },
}));

export default useMessagingStore;
