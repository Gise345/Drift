import React, { useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadows } from '@/src/constants/theme';
import { useMessagingStore } from '@/src/stores/messaging-store';
import { ChatBubble } from './ChatBubble';
import { MessageInput } from './MessageInput';
import { Message } from '@/src/services/messaging.service';

interface ChatScreenProps {
  tripId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userType: 'rider' | 'driver';
  otherUserName: string;
  onClose: () => void;
  isEnabled?: boolean;
}

/**
 * Full chat screen component for in-trip messaging
 */
export function ChatScreen({
  tripId,
  userId,
  userName,
  userPhoto,
  userType,
  otherUserName,
  onClose,
  isEnabled = true,
}: ChatScreenProps) {
  const flatListRef = useRef<FlatList<Message>>(null);

  const {
    messages,
    isLoading,
    isSending,
    subscribeToTripMessages,
    sendMessage,
    markAsRead,
    clearMessages,
  } = useMessagingStore();

  // Subscribe to messages on mount
  useEffect(() => {
    const unsubscribe = subscribeToTripMessages(tripId);

    // Mark messages as read when opening chat
    markAsRead(tripId, userId);

    return () => {
      unsubscribe();
      clearMessages();
    };
  }, [tripId, userId]);

  // Mark new messages as read
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead(tripId, userId);
    }
  }, [messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async (text: string) => {
    await sendMessage(tripId, userId, userName, userPhoto, userType, text);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item}
      isOwnMessage={item.senderId === userId}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={Colors.gray[300]} />
      <Text style={styles.emptyTitle}>Start a conversation</Text>
      <Text style={styles.emptySubtitle}>
        Send a message to {otherUserName} about your ride
      </Text>
    </View>
  );

  const renderDisabledState = () => (
    <View style={styles.disabledContainer}>
      <Ionicons name="lock-closed-outline" size={48} color={Colors.gray[400]} />
      <Text style={styles.disabledText}>
        Messaging is not available at this time
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
          <Text style={styles.headerSubtitle}>
            {isEnabled ? 'Chat available until trip starts' : 'Chat ended'}
          </Text>
        </View>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Messages List */}
      {!isEnabled ? (
        renderDisabledState()
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messageList,
              messages.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={isLoading ? null : renderEmptyState}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />

          {/* Input */}
          <MessageInput
            onSend={handleSend}
            isSending={isSending}
            disabled={!isEnabled}
            placeholder={`Message ${otherUserName}...`}
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    ...Shadows.sm,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  headerContent: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },

  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: 2,
  },

  headerPlaceholder: {
    width: 40,
  },

  messageList: {
    paddingVertical: Spacing.base,
  },

  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: Spacing.base,
  },

  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  disabledContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  disabledText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.base,
  },
});

export default ChatScreen;
