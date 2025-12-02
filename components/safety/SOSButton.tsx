/**
 * DRIFT SOS BUTTON
 * Always-visible emergency button for trips
 *
 * Features:
 * - Red emergency button always visible during trips
 * - Long press (2 seconds) to activate to prevent accidental triggers
 * - Visual feedback during press
 * - Haptic feedback
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafetyStore } from '@/src/stores/safety-store';
import { BorderRadius, Spacing } from '@/src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SOSButtonProps {
  tripId: string;
  driverId: string;
  riderId: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  driverInfo?: {
    name?: string;
    phone?: string;
    vehicle?: string;
    plate?: string;
  };
  onSOSTriggered?: () => void;
  style?: object;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const LONG_PRESS_DURATION = 2000; // 2 seconds

export function SOSButton({
  tripId,
  driverId,
  riderId,
  currentLocation,
  driverInfo,
  onSOSTriggered,
  style,
  size = 'medium',
  showLabel = true,
}: SOSButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { triggerEmergencySOS } = useSafetyStore();

  const buttonSize = {
    small: 48,
    medium: 60,
    large: 80,
  }[size];

  const iconSize = {
    small: 24,
    medium: 32,
    large: 40,
  }[size];

  const handlePressIn = () => {
    setIsPressed(true);
    setProgress(0);

    // Start haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate progress
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: LONG_PRESS_DURATION,
      useNativeDriver: false,
    }).start();

    // Update progress state
    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / LONG_PRESS_DURATION, 1);
      setProgress(newProgress);

      // Haptic pulses during press
      if (elapsed % 500 < 50) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 50);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    setProgress(0);

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    progressAnim.setValue(0);
  };

  const handleLongPress = async () => {
    // Clean up
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // Heavy haptic for SOS
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Trigger SOS
    await triggerEmergencySOS();

    if (onSOSTriggered) {
      onSOSTriggered();
    }

    setIsPressed(false);
    setProgress(0);
    progressAnim.setValue(0);
  };

  // Calculate progress ring
  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
          isPressed && styles.buttonPressed,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={LONG_PRESS_DURATION}
        activeOpacity={1}
      >
        {/* Progress ring */}
        {isPressed && (
          <Animated.View
            style={[
              styles.progressRing,
              {
                width: buttonSize + 8,
                height: buttonSize + 8,
                borderRadius: (buttonSize + 8) / 2,
                transform: [{ rotate: progressInterpolate }],
              },
            ]}
          />
        )}

        {/* Button content */}
        <Ionicons name="warning" size={iconSize} color="#FFFFFF" />
      </TouchableOpacity>

      {showLabel && (
        <Text style={styles.label}>
          {isPressed ? `Hold ${Math.ceil((1 - progress) * 2)}s` : 'SOS'}
        </Text>
      )}

      {isPressed && (
        <Text style={styles.holdText}>Keep holding...</Text>
      )}
    </View>
  );
}

/**
 * Compact SOS button for header/toolbar
 */
export function SOSButtonCompact({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: object;
}) {
  return (
    <TouchableOpacity
      style={[styles.compactButton, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="warning" size={20} color="#FFFFFF" />
      <Text style={styles.compactLabel}>SOS</Text>
    </TouchableOpacity>
  );
}

/**
 * Floating SOS button for bottom of screen
 */
export function SOSButtonFloating({
  tripId,
  driverId,
  riderId,
  currentLocation,
  driverInfo,
}: Omit<SOSButtonProps, 'style' | 'size' | 'showLabel'>) {
  return (
    <View style={styles.floatingContainer}>
      <SOSButton
        tripId={tripId}
        driverId={driverId}
        riderId={riderId}
        currentLocation={currentLocation}
        driverInfo={driverInfo}
        size="large"
        showLabel={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  buttonPressed: {
    backgroundColor: '#B91C1C',
    transform: [{ scale: 0.95 }],
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
  label: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  holdText: {
    color: '#999999',
    fontSize: 10,
    marginTop: 2,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  compactLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
});

export default SOSButton;
