import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';
import { Message } from '@/src/services/messaging.service';

interface ChatBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * Chat bubble component for displaying messages
 * Styled differently for sent vs received messages
 */
export function ChatBubble({ message, isOwnMessage }: ChatBubbleProps) {
  // System messages are styled differently
  if (message.type === 'system' || message.senderType === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownContainer : styles.otherContainer]}>
      {!isOwnMessage && message.senderPhoto && (
        <Image source={{ uri: message.senderPhoto }} style={styles.avatar} />
      )}

      <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}

        <Text style={[styles.messageText, isOwnMessage ? styles.ownText : styles.otherText]}>
          {message.text}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.timestamp, isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>

          {isOwnMessage && (
            <Text style={styles.status}>
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
  },

  ownContainer: {
    justifyContent: 'flex-end',
  },

  otherContainer: {
    justifyContent: 'flex-start',
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
    backgroundColor: Colors.gray[200],
  },

  bubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },

  ownBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.sm,
  },

  otherBubble: {
    backgroundColor: Colors.gray[100],
    borderBottomLeftRadius: BorderRadius.sm,
  },

  senderName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },

  messageText: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
  },

  ownText: {
    color: Colors.white,
  },

  otherText: {
    color: Colors.gray[900],
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },

  timestamp: {
    fontSize: Typography.fontSize.xs,
    marginRight: Spacing.xs,
  },

  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  otherTimestamp: {
    color: Colors.gray[500],
  },

  status: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // System message styles
  systemContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },

  systemText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});

export default ChatBubble;
