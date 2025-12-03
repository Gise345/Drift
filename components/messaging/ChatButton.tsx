import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getUnreadMessageCount } from '@/src/services/messaging.service';

interface ChatButtonProps {
  tripId: string;
  userId: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Floating chat button with unread badge
 */
export function ChatButton({
  tripId,
  userId,
  onPress,
  disabled = false,
  size = 'medium',
}: ChatButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Refresh unread count periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const count = await getUnreadMessageCount(tripId, userId);
      setUnreadCount(count);
    };

    fetchUnreadCount();

    // Refresh every 5 seconds
    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [tripId, userId]);

  const buttonSize = size === 'small' ? 40 : size === 'large' ? 56 : 48;
  const iconSize = size === 'small' ? 20 : size === 'large' ? 28 : 24;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons
        name="chatbubble-ellipses"
        size={iconSize}
        color={disabled ? Colors.gray[400] : Colors.white}
      />

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },

  disabled: {
    backgroundColor: Colors.gray[300],
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default ChatButton;
