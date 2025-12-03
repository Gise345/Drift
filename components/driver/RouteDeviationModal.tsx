/**
 * RouteDeviationModal
 *
 * "Are you OK?" alert that appears when driver takes a different route
 * Allows driver to confirm they're okay or trigger SOS
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

interface RouteDeviationModalProps {
  visible: boolean;
  deviationDistance: number; // meters
  onOkay: () => void;
  onSOS: () => void;
}

export function RouteDeviationModal({
  visible,
  deviationDistance,
  onOkay,
  onSOS,
}: RouteDeviationModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Gentle vibration to get attention
      Vibration.vibrate([0, 300, 100, 300]);

      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [visible]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} meters`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onOkay}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Pulsing Icon */}
          <Animated.View
            style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
          >
            <Ionicons name="help-circle" size={48} color="#FFFFFF" />
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Are you OK?</Text>

          {/* Message */}
          <Text style={styles.message}>
            We noticed you've taken a different route than planned.
          </Text>

          <View style={styles.deviationInfo}>
            <Ionicons name="navigate-outline" size={20} color="#6B7280" />
            <Text style={styles.deviationText}>
              {formatDistance(deviationDistance)} from original route
            </Text>
          </View>

          {/* Safety Message */}
          <Text style={styles.safetyMessage}>
            Your safety is our priority. Please let us know you're okay, or tap SOS if you need help.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.okayButton} onPress={onOkay}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.okayText}>I'm OK</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sosButton} onPress={onSOS}>
              <Ionicons name="warning" size={24} color="#FFFFFF" />
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </View>

          {/* Auto-dismiss note */}
          <Text style={styles.autoNote}>
            If you don't respond, we'll check in with you again shortly.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  deviationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  deviationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  safetyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  okayButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  okayText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sosButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sosText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  autoNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
