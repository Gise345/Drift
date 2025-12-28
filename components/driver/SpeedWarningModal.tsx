/**
 * SpeedWarningModal
 *
 * Full-screen warning modal that appears when driver exceeds speed limit by 6+ mph
 * Shows a clear warning with the speed, limit, and consequences
 *
 * Features:
 * - Push notification sent when in background
 * - Actionable notification responses linked to in-app popup
 * - Enhanced red-zone warning with persistent display
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  sendDriverSpeedWarningNotification,
  isAppInBackground,
} from '@/src/services/safety-notification.service';

interface SpeedWarningModalProps {
  visible: boolean;
  currentSpeed: number;
  speedLimit: number;
  tripId?: string;
  driverId?: string;
  onDismiss: () => void;
}

const DISMISS_COUNTDOWN_SECONDS = 5;

export function SpeedWarningModal({
  visible,
  currentSpeed,
  speedLimit,
  tripId,
  driverId,
  onDismiss,
}: SpeedWarningModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const notificationSentRef = useRef(false);
  const excessSpeed = currentSpeed - speedLimit;
  const isRedZone = excessSpeed >= 6; // Red zone: 6+ mph over limit (Cayman law)

  // 5-second countdown before dismiss is available
  const [dismissCountdown, setDismissCountdown] = useState(DISMISS_COUNTDOWN_SECONDS);
  const canDismiss = dismissCountdown <= 0;

  // Countdown timer for dismiss button
  useEffect(() => {
    if (visible) {
      // Reset countdown when modal becomes visible
      setDismissCountdown(DISMISS_COUNTDOWN_SECONDS);

      const countdownInterval = setInterval(() => {
        setDismissCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [visible]);

  // Send push notification when visible and app is in background
  useEffect(() => {
    if (visible && tripId && driverId && !notificationSentRef.current) {
      // Send notification regardless of app state for immediate awareness
      sendDriverSpeedWarningNotification(tripId, driverId, currentSpeed, speedLimit);
      notificationSentRef.current = true;
    }

    // Reset notification flag when modal closes
    if (!visible) {
      notificationSentRef.current = false;
    }
  }, [visible, tripId, driverId, currentSpeed, speedLimit]);

  // Pulse and shake animation for the warning icon
  useEffect(() => {
    if (visible) {
      // Vibrate to get attention - more intense for red zone
      if (isRedZone) {
        Vibration.vibrate([0, 800, 200, 800, 200, 800]);
      } else {
        Vibration.vibrate([0, 500, 200, 500]);
      }

      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: isRedZone ? 1.3 : 1.2,
            duration: isRedZone ? 300 : 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: isRedZone ? 300 : 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Add shake animation for red zone
      if (isRedZone) {
        const shake = Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: -10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.delay(500),
          ])
        );
        shake.start();
      }

      return () => {
        pulse.stop();
        shakeAnim.setValue(0);
      };
    }
  }, [visible, isRedZone]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          isRedZone && styles.redZoneOverlay,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <View style={[styles.container, isRedZone && styles.redZoneContainer]}>
          {/* Pulsing Warning Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              isRedZone && styles.redZoneIconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Ionicons
              name={isRedZone ? 'alert' : 'warning'}
              size={isRedZone ? 72 : 64}
              color="#FFFFFF"
            />
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, isRedZone && styles.redZoneTitle]}>
            {isRedZone ? '🚨 DANGER! SLOW DOWN NOW!' : 'SLOW DOWN!'}
          </Text>

          {/* Red Zone Extra Warning */}
          {isRedZone && (
            <View style={styles.dangerBanner}>
              <Ionicons name="skull" size={20} color="#FFFFFF" />
              <Text style={styles.dangerBannerText}>
                CRITICALLY EXCEEDING SPEED LIMIT
              </Text>
              <Ionicons name="skull" size={20} color="#FFFFFF" />
            </View>
          )}

          {/* Speed Display */}
          <View style={styles.speedContainer}>
            <View style={[styles.speedBox, isRedZone && styles.redZoneSpeedBox]}>
              <Text style={styles.speedLabel}>Current</Text>
              <Text style={[styles.speedValue, isRedZone && styles.redZoneSpeedValue]}>
                {Math.round(currentSpeed)}
              </Text>
              <Text style={styles.speedUnit}>MPH</Text>
            </View>
            <View style={styles.limitBox}>
              <Text style={styles.speedLabel}>Limit</Text>
              <Text style={styles.limitValue}>{speedLimit}</Text>
              <Text style={styles.speedUnit}>MPH</Text>
            </View>
          </View>

          {/* Excess Speed */}
          <View style={[styles.excessContainer, isRedZone && styles.redZoneExcessContainer]}>
            <Text style={[styles.excessText, isRedZone && styles.redZoneExcessText]}>
              {Math.round(excessSpeed)} MPH OVER LIMIT
            </Text>
          </View>

          {/* Warning Message */}
          <View style={styles.messageContainer}>
            <Ionicons name="people" size={24} color="#FCA5A5" style={styles.messageIcon} />
            <Text style={styles.messageText}>
              {isRedZone
                ? 'Your rider feels unsafe! This is being reported and may affect your driver status.'
                : 'We have special cargo in the car. Please drive safely for our riders.'}
            </Text>
          </View>

          {/* Consequences Warning */}
          <View style={[styles.consequencesContainer, isRedZone && styles.redZoneConsequences]}>
            <Ionicons name="alert-circle" size={20} color={isRedZone ? '#FFFFFF' : '#FEF3C7'} />
            <Text style={[styles.consequencesText, isRedZone && styles.redZoneConsequencesText]}>
              {isRedZone
                ? 'IMMEDIATE ACTION REQUIRED: This violation is being logged and your rider has been notified. Multiple red-zone violations will result in immediate suspension.'
                : 'Continued speeding violations may result in suspension or permanent ban from the platform.'}
            </Text>
          </View>

          {/* Rider Notification Badge */}
          {isRedZone && (
            <View style={styles.riderNotifiedBadge}>
              <Ionicons name="notifications" size={16} color="#FFFFFF" />
              <Text style={styles.riderNotifiedText}>Rider has been notified</Text>
            </View>
          )}

          {/* Dismiss Button with Countdown */}
          <TouchableOpacity
            style={[
              styles.dismissButton,
              isRedZone && styles.redZoneDismissButton,
              !canDismiss && styles.dismissButtonDisabled,
            ]}
            onPress={canDismiss ? onDismiss : undefined}
            disabled={!canDismiss}
            activeOpacity={canDismiss ? 0.7 : 1}
          >
            <Ionicons
              name="speedometer"
              size={20}
              color={!canDismiss ? '#9CA3AF' : (isRedZone ? '#FFFFFF' : '#DC2626')}
            />
            <Text style={[
              styles.dismissText,
              isRedZone && styles.redZoneDismissText,
              !canDismiss && styles.dismissTextDisabled,
            ]}>
              {!canDismiss
                ? `Wait ${dismissCountdown}s to dismiss...`
                : (isRedZone ? 'I Will Slow Down Immediately' : 'I Understand - Slowing Down')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  dismissButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowOpacity: 0.1,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  dismissTextDisabled: {
    color: '#9CA3AF',
  },

  // Red Zone Styles (10+ mph over limit)
  redZoneOverlay: {
    backgroundColor: 'rgba(127, 29, 29, 0.98)', // Darker, more intense red
  },
  redZoneContainer: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  redZoneIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#7F1D1D',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  redZoneTitle: {
    fontSize: 32,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  dangerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  dangerBannerText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF0000',
    letterSpacing: 2,
  },
  redZoneSpeedBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 3,
    borderColor: '#FF0000',
  },
  redZoneSpeedValue: {
    fontSize: 56,
    color: '#FF6B6B',
  },
  redZoneExcessContainer: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  redZoneExcessText: {
    fontSize: 20,
    color: '#FF0000',
  },
  redZoneConsequences: {
    backgroundColor: '#7F1D1D',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  redZoneConsequencesText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  riderNotifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  riderNotifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  redZoneDismissButton: {
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  redZoneDismissText: {
    color: '#FFFFFF',
  },
});
