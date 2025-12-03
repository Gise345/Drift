/**
 * SpeedWarningModal
 *
 * Full-screen warning modal that appears when driver exceeds speed limit by 6+ mph
 * Shows a clear warning with the speed, limit, and consequences
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SpeedWarningModalProps {
  visible: boolean;
  currentSpeed: number;
  speedLimit: number;
  onDismiss: () => void;
}

export function SpeedWarningModal({
  visible,
  currentSpeed,
  speedLimit,
  onDismiss,
}: SpeedWarningModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const excessSpeed = currentSpeed - speedLimit;

  // Pulse animation for the warning icon
  useEffect(() => {
    if (visible) {
      // Vibrate to get attention
      Vibration.vibrate([0, 500, 200, 500]);

      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Pulsing Warning Icon */}
          <Animated.View
            style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
          >
            <Ionicons name="warning" size={64} color="#FFFFFF" />
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>SLOW DOWN!</Text>

          {/* Speed Display */}
          <View style={styles.speedContainer}>
            <View style={styles.speedBox}>
              <Text style={styles.speedLabel}>Current</Text>
              <Text style={styles.speedValue}>{Math.round(currentSpeed)}</Text>
              <Text style={styles.speedUnit}>MPH</Text>
            </View>
            <View style={styles.limitBox}>
              <Text style={styles.speedLabel}>Limit</Text>
              <Text style={styles.limitValue}>{speedLimit}</Text>
              <Text style={styles.speedUnit}>MPH</Text>
            </View>
          </View>

          {/* Excess Speed */}
          <View style={styles.excessContainer}>
            <Text style={styles.excessText}>
              {Math.round(excessSpeed)} MPH OVER LIMIT
            </Text>
          </View>

          {/* Warning Message */}
          <View style={styles.messageContainer}>
            <Ionicons name="people" size={24} color="#FCA5A5" style={styles.messageIcon} />
            <Text style={styles.messageText}>
              We have special cargo in the car. Please drive safely for our riders.
            </Text>
          </View>

          {/* Consequences Warning */}
          <View style={styles.consequencesContainer}>
            <Ionicons name="alert-circle" size={20} color="#FEF3C7" />
            <Text style={styles.consequencesText}>
              Continued speeding violations may result in suspension or permanent ban from the platform.
            </Text>
          </View>

          {/* Dismiss Button */}
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>I Understand - Slowing Down</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(220, 38, 38, 0.95)', // Red overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  speedContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  speedBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
  },
  limitBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
  },
  speedLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  speedValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  limitValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#10B981', // Green for limit
  },
  speedUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  excessContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  excessText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FEF3C7',
    letterSpacing: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    maxWidth: '100%',
  },
  messageIcon: {
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  consequencesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    maxWidth: '100%',
    gap: 10,
  },
  consequencesText: {
    flex: 1,
    fontSize: 14,
    color: '#FEF3C7',
    lineHeight: 20,
  },
  dismissButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
});
