import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { subscribeToUnreadCount } from '@/src/services/messaging.service';

interface ChatButtonProps {
  tripId: string;
  userId: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Floating chat button with real-time unread badge
 */
export function ChatButton({
  tripId,
  userId,
  onPress,
  disabled = false,
  size = 'medium',
}: ChatButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Subscribe to real-time unread count
  useEffect(() => {
    if (!tripId || !userId) return;

    const unsubscribe = subscribeToUnreadCount(tripId, userId, (count) => {
      // Animate when new messages arrive
      if (count > unreadCount && count > 0) {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [tripId, userId]);

  const buttonSize = size === 'small' ? 40 : size === 'large' ? 56 : 48;
  const iconSize = size === 'small' ? 20 : size === 'large' ? 28 : 24;

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          disabled && styles.disabled,
          unreadCount > 0 && styles.hasUnread,
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
    </Animated.View>
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

  hasUnread: {
    backgroundColor: Colors.purple,
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
    borderWidth: 2,
    borderColor: Colors.white,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default ChatButton;
