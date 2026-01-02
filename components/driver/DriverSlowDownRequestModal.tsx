/**
 * DriverSlowDownRequestModal
 *
 * Shows a modal to the driver when rider requests them to slow down.
 * Driver must acknowledge to dismiss.
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
import { doc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { firebaseDb } from '@/src/config/firebase';

interface DriverSlowDownRequestModalProps {
  visible: boolean;
  riderName: string;
  tripId: string;
  currentSpeed: number;
  speedLimit: number;
  onAcknowledge: () => void;
}

export function DriverSlowDownRequestModal({
  visible,
  riderName,
  tripId,
  currentSpeed,
  speedLimit,
  onAcknowledge,
}: DriverSlowDownRequestModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Vibrate pattern
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);

      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Shake animation for header
      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.delay(2000),
        ])
      );
      shake.start();

      return () => {
        pulse.stop();
        shake.stop();
      };
    }
  }, [visible]);

  const handleAcknowledge = async () => {
    try {
      // Update Firestore to mark as acknowledged
      const tripRef = doc(firebaseDb, 'trips', tripId);
      await updateDoc(tripRef, {
        'safetyMessage.acknowledged': true,
        'safetyMessage.acknowledgedAt': Date.now(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to acknowledge slow down request:', error);
    }

    onAcknowledge();
  };

  const excessSpeed = Math.round(currentSpeed - speedLimit);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleAcknowledge}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Warning Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] },
            ]}
          >
            <Ionicons name="alert-circle" size={60} color="#FFFFFF" />
          </Animated.View>

          {/* Header */}
          <Animated.Text
            style={[styles.header, { transform: [{ translateX: shakeAnim }] }]}
          >
            RIDER SAFETY REQUEST
          </Animated.Text>

          {/* Message */}
          <View style={styles.messageBox}>
            <Ionicons name="person-circle" size={40} color="#3B82F6" />
            <View style={styles.messageContent}>
              <Text style={styles.riderName}>{riderName}</Text>
              <Text style={styles.requestText}>
                has asked you to slow down for their safety
              </Text>
            </View>
          </View>

          {/* Speed Info */}
          <View style={styles.speedInfo}>
            <View style={styles.speedItem}>
              <Text style={styles.speedLabel}>Your Speed</Text>
              <Text style={styles.speedValue}>{Math.round(currentSpeed)} mph</Text>
            </View>
            <View style={styles.speedDivider} />
            <View style={styles.speedItem}>
              <Text style={styles.speedLabel}>Speed Limit</Text>
              <Text style={styles.limitValue}>{speedLimit} mph</Text>
            </View>
          </View>

          {excessSpeed > 0 && (
            <View style={styles.excessBadge}>
              <Ionicons name="trending-up" size={16} color="#FFFFFF" />
              <Text style={styles.excessText}>{excessSpeed} mph over limit</Text>
            </View>
          )}

          {/* Warning */}
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text style={styles.warningText}>
              Speed violations are recorded and may result in account suspension.
              Your safety rating affects your earning potential.
            </Text>
          </View>

          {/* Acknowledge Button */}
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={handleAcknowledge}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.acknowledgeText}>
              I Will Slow Down
            </Text>
          </TouchableOpacity>

          {/* Note */}
          <Text style={styles.noteText}>
            This request has been logged for safety monitoring
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DC2626',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 1,
    marginBottom: 20,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    width: '100%',
  },
  messageContent: {
    flex: 1,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  requestText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  speedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '100%',
  },
  speedItem: {
    flex: 1,
    alignItems: 'center',
  },
  speedDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#D1D5DB',
  },
  speedLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  speedValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#DC2626',
  },
  limitValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  excessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  excessText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 10,
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acknowledgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noteText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default DriverSlowDownRequestModal;
