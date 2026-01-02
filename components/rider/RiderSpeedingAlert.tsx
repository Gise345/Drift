/**
 * RiderSpeedingAlert
 *
 * Full-screen alert that appears for riders when their driver is speeding
 * Allows riders to:
 * - Dismiss if they feel safe
 * - Send a "slow down" message to the driver
 * - End the ride immediately (with refund option)
 * - Call emergency services
 *
 * Features:
 * - Push notification sent when app is in background
 * - Actionable notification responses linked to in-app popup
 * - Real-time sync with driver's app
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
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  sendRiderSpeedAlertNotification,
  sendWarnDriverMessage,
  markSafetyAlertResponded,
} from '@/src/services/safety-notification.service';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RiderSpeedingAlertProps {
  visible: boolean;
  currentSpeed: number;
  speedLimit: number;
  driverName: string;
  tripId: string;
  onDismiss: (responseType?: 'ok' | 'slow_down' | 'end_ride' | 'emergency') => void;
  onEndRide?: () => void;
}

export function RiderSpeedingAlert({
  visible,
  currentSpeed,
  speedLimit,
  driverName,
  tripId,
  onDismiss,
  onEndRide,
}: RiderSpeedingAlertProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const notificationSentRef = useRef(false);
  const [warningMessageSent, setWarningMessageSent] = useState(false);
  const [isEndingRide, setIsEndingRide] = useState(false);

  const { user } = useAuthStore();
  const { updateTrip } = useTripStore();

  const excessSpeed = Math.round(currentSpeed - speedLimit);
  const isRedZone = excessSpeed >= 6; // 6+ mph over limit (Cayman law)

  // Send push notification when alert appears
  useEffect(() => {
    if (visible && tripId && user?.id && !notificationSentRef.current) {
      sendRiderSpeedAlertNotification(
        tripId,
        user.id,
        currentSpeed,
        speedLimit,
        driverName
      );
      notificationSentRef.current = true;
    }

    if (!visible) {
      notificationSentRef.current = false;
      setWarningMessageSent(false);
    }
  }, [visible, tripId, user?.id, currentSpeed, speedLimit, driverName]);

  // Animations
  useEffect(() => {
    if (visible) {
      // Vibrate to get attention
      if (isRedZone) {
        Vibration.vibrate([0, 600, 200, 600, 200, 600]);
      } else {
        Vibration.vibrate([0, 400, 200, 400]);
      }

      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();

      // Pulse animation for warning badge
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, isRedZone]);

  // Handle "I'm OK" response - terminal response, no more alerts for this speeding incident
  const handleImOk = async () => {
    await markSafetyAlertResponded(tripId, 'ok', 'rider');
    onDismiss('ok');
  };

  // Handle "Warn Driver" action - allows re-alerting if driver slows down then speeds up again
  const handleWarnDriver = async () => {
    if (warningMessageSent) return;

    try {
      await sendWarnDriverMessage(tripId, user?.id || '', user?.name?.split(' ')[0] || 'Rider');
      await markSafetyAlertResponded(tripId, 'slow_down', 'rider');
      setWarningMessageSent(true);

      Alert.alert(
        'Message Sent',
        `${driverName} has been notified to slow down for your safety.`,
        [{ text: 'OK', onPress: () => onDismiss('slow_down') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  // Handle "End Ride" action
  const handleEndRide = () => {
    Alert.alert(
      'End Ride for Safety?',
      'Are you sure you want to end this ride? You will be dropped off at the nearest safe location and may be eligible for a partial refund due to unsafe driving.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Ride',
          style: 'destructive',
          onPress: async () => {
            setIsEndingRide(true);
            try {
              // Update trip status to cancelled
              await updateTrip(tripId, {
                status: 'CANCELLED',
              } as any);

              await markSafetyAlertResponded(tripId, 'end_ride', 'rider');

              if (onEndRide) {
                onEndRide();
              }

              Alert.alert(
                'Ride Ended',
                'Your ride has been ended for safety reasons. A refund request has been submitted for review.',
                [{ text: 'OK', onPress: () => onDismiss('end_ride') }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to end ride. Please try again or call emergency services if you feel unsafe.');
            } finally {
              setIsEndingRide(false);
            }
          },
        },
      ]
    );
  };

  // Handle emergency call - terminal response
  const handleEmergency = () => {
    Alert.alert(
      'Call Emergency Services?',
      'This will call 911. Only use this if you feel you are in immediate danger.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: async () => {
            await markSafetyAlertResponded(tripId, 'emergency', 'rider');
            onDismiss('emergency');
            Linking.openURL('tel:911');
          },
        },
      ]
    );
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleImOk}
    >
      <View style={[styles.overlay, isRedZone && styles.redZoneOverlay]}>
        <Animated.View
          style={[
            styles.container,
            isRedZone && styles.redZoneContainer,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Warning Badge */}
          <Animated.View
            style={[
              styles.warningBadge,
              isRedZone && styles.redZoneBadge,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Ionicons
              name={isRedZone ? 'alert' : 'speedometer'}
              size={40}
              color="#FFFFFF"
            />
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>
            {isRedZone ? '🚨 Driver Speeding Dangerously!' : '⚠️ Driver Speeding'}
          </Text>

          {/* Speed Info */}
          <View style={styles.speedInfoContainer}>
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>{driverName} is going</Text>
              <Text style={[styles.speedValue, isRedZone && styles.redZoneSpeedValue]}>
                {Math.round(currentSpeed)} mph
              </Text>
            </View>
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>Speed limit is</Text>
              <Text style={styles.limitValue}>{speedLimit} mph</Text>
            </View>
            <View style={[styles.excessBadge, isRedZone && styles.redZoneExcessBadge]}>
              <Ionicons name="trending-up" size={16} color="#FFFFFF" />
              <Text style={styles.excessText}>{excessSpeed} mph over limit</Text>
            </View>
          </View>

          {/* Safety Message */}
          <View style={[styles.messageBox, isRedZone && styles.redZoneMessageBox]}>
            <Ionicons name="shield-checkmark" size={24} color={isRedZone ? '#FCA5A5' : '#10B981'} />
            <Text style={[styles.messageText, isRedZone && styles.redZoneMessageText]}>
              {isRedZone
                ? 'Your safety is at risk. Please take action below or call emergency services if needed.'
                : 'Your safety matters to us. You can ask the driver to slow down or take other actions.'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {/* Warn Driver Button */}
            <TouchableOpacity
              style={[
                styles.warnButton,
                warningMessageSent && styles.warnButtonSent,
              ]}
              onPress={handleWarnDriver}
              disabled={warningMessageSent}
            >
              <Ionicons
                name={warningMessageSent ? 'checkmark-circle' : 'megaphone'}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.warnButtonText}>
                {warningMessageSent ? 'Driver Notified' : 'Ask Driver to Slow Down'}
              </Text>
            </TouchableOpacity>

            {/* End Ride Button - More prominent in red zone */}
            {isRedZone && (
              <TouchableOpacity
                style={styles.endRideButton}
                onPress={handleEndRide}
                disabled={isEndingRide}
              >
                <Ionicons name="close-circle" size={22} color="#FFFFFF" />
                <Text style={styles.endRideText}>
                  {isEndingRide ? 'Ending Ride...' : 'End Ride & Request Refund'}
                </Text>
              </TouchableOpacity>
            )}

            {/* I'm OK Button */}
            <TouchableOpacity style={styles.okButton} onPress={handleImOk}>
              <Ionicons name="checkmark" size={22} color="#10B981" />
              <Text style={styles.okButtonText}>I'm OK</Text>
            </TouchableOpacity>

            {/* Emergency Button */}
            <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
              <Ionicons name="call" size={18} color="#EF4444" />
              <Text style={styles.emergencyText}>Call 911</Text>
            </TouchableOpacity>
          </View>

          {/* Notification Status */}
          <View style={styles.notificationStatus}>
            <Ionicons name="notifications" size={14} color="#9CA3AF" />
            <Text style={styles.notificationText}>
              This alert was also sent as a notification
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * RiderSpeedingAlertContainer - Connects to safety store
 *
 * Fixed to prevent glitching and duplicate alerts:
 * - Only triggers once per speeding incident
 * - Tracks rider response type
 * - Re-alerts only if driver slowed down then sped up again
 */
export function RiderSpeedingAlertContainer() {
  const { useSafetyStore } = require('@/src/stores/safety-store');
  const {
    speedState,
    isMonitoring,
    tripId,
    showRiderSpeedingAlert,
    riderSpeedingAlertDismissed,
    riderResponseType,
    showRiderSpeedAlert,
    dismissRiderSpeedAlert,
  } = useSafetyStore();
  const { currentTrip } = useTripStore();

  // Track whether we've already triggered an alert for this speeding incident
  const alertTriggeredRef = useRef(false);
  const wasInRedZoneRef = useRef(false);
  const lastAlertTimeRef = useRef(0);

  // Minimum time between alerts (5 minutes) unless driver slowed down
  const ALERT_COOLDOWN = 5 * 60 * 1000;

  // Show alert when speed is in danger zone (6+ mph over - Cayman law)
  useEffect(() => {
    if (!isMonitoring || !currentTrip) return;

    const isRedZone =
      speedState.currentSpeedLimit !== null &&
      speedState.currentSpeed - speedState.currentSpeedLimit >= 6;

    // Track if driver went back under limit (so we can re-alert if they speed again)
    if (!isRedZone && wasInRedZoneRef.current) {
      // Driver slowed down - reset alert trigger for next incident
      alertTriggeredRef.current = false;
      wasInRedZoneRef.current = false;
    }

    // Only show alert if:
    // 1. In red zone
    // 2. Haven't triggered alert for this incident yet
    // 3. Haven't been dismissed (or enough time passed or driver slowed down then sped up)
    // 4. Rider hasn't responded with OK, end_ride, or emergency (those are terminal responses)
    const now = Date.now();
    const timeSinceLastAlert = now - lastAlertTimeRef.current;
    const isTerminalResponse = ['ok', 'end_ride', 'emergency'].includes(riderResponseType || '');

    // If rider clicked "Ask Driver to Slow Down", only re-alert if driver slowed down and sped up again
    const canReAlert =
      !alertTriggeredRef.current &&
      !riderSpeedingAlertDismissed &&
      !isTerminalResponse &&
      (timeSinceLastAlert > ALERT_COOLDOWN || !wasInRedZoneRef.current);

    if (isRedZone && canReAlert) {
      alertTriggeredRef.current = true;
      wasInRedZoneRef.current = true;
      lastAlertTimeRef.current = now;
      showRiderSpeedAlert();
    }
  }, [speedState.currentSpeed, speedState.currentSpeedLimit, isMonitoring, currentTrip, riderSpeedingAlertDismissed, riderResponseType]);

  if (!currentTrip || !tripId) return null;

  return (
    <RiderSpeedingAlert
      visible={showRiderSpeedingAlert}
      currentSpeed={speedState.currentSpeed}
      speedLimit={speedState.currentSpeedLimit || 0}
      driverName={currentTrip.driverInfo?.name || 'Your driver'}
      tripId={tripId}
      onDismiss={dismissRiderSpeedAlert}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  redZoneOverlay: {
    backgroundColor: 'rgba(127, 29, 29, 0.92)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  redZoneContainer: {
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  warningBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  redZoneBadge: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  speedInfoContainer: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speedLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  speedValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F59E0B',
  },
  redZoneSpeedValue: {
    color: '#DC2626',
  },
  limitValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  excessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  redZoneExcessBadge: {
    backgroundColor: '#DC2626',
  },
  excessText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  redZoneMessageBox: {
    backgroundColor: '#FEF2F2',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  redZoneMessageText: {
    color: '#991B1B',
  },
  actionContainer: {
    width: '100%',
    gap: 12,
  },
  warnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  warnButtonSent: {
    backgroundColor: '#10B981',
  },
  warnButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  endRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  endRideText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  okButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#10B981',
    gap: 8,
  },
  okButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  notificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  notificationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default RiderSpeedingAlert;
