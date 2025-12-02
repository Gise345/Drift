/**
 * DRIFT SAFETY ALERT MODAL
 * Full-screen "Are you okay?" popup for route deviations and early completions
 *
 * Features:
 * - Full-screen modal with semi-transparent dark overlay
 * - Cannot be dismissed by tapping outside or back button
 * - Countdown timer visible and updating
 * - Haptic feedback when popup appears
 * - SOS button: prominent red, at least 60% of screen width
 * - "I'm Okay" button: green, slightly smaller, below SOS
 * - Auto-alert if no response within timeout
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafetyStore } from '@/src/stores/safety-store';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SafetyAlertModalProps {
  visible: boolean;
  alertType: 'route_deviation' | 'early_completion';
  countdown: number;
  onOkay: () => void;
  onSOS: () => void;
}

export function SafetyAlertModal({
  visible,
  alertType,
  countdown,
  onOkay,
  onSOS,
}: SafetyAlertModalProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Prevent back button from dismissing
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        return true; // Prevent default behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  // Haptic feedback when modal appears
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Start pulse animation for SOS button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible, pulseAnim]);

  const handleOkay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOkay();
  };

  const handleSOS = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onSOS();
  };

  const getAlertTitle = () => {
    if (alertType === 'route_deviation') {
      return 'Route Changed';
    }
    return 'Trip Ending Early';
  };

  const getAlertMessage = () => {
    if (alertType === 'route_deviation') {
      return "We noticed your driver has deviated from the planned route. Are you okay?";
    }
    return "Your trip is being completed before reaching your destination. Are you okay?";
  };

  const getAlertIcon = () => {
    if (alertType === 'route_deviation') {
      return 'navigate-outline';
    }
    return 'flag-outline';
  };

  // Format countdown
  const formatCountdown = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Prevent closing
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Alert Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={getAlertIcon()} size={48} color="#FFA500" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{getAlertTitle()}</Text>

          {/* Message */}
          <Text style={styles.message}>{getAlertMessage()}</Text>

          {/* Countdown */}
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>Auto-alert in</Text>
            <Text style={styles.countdown}>{formatCountdown(countdown)}</Text>
          </View>

          {/* Warning Text */}
          <Text style={styles.warningText}>
            If you don't respond, we'll alert your emergency contacts.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* SOS Button - Large, Prominent */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.sosButton}
                onPress={handleSOS}
                activeOpacity={0.8}
              >
                <Ionicons name="warning" size={32} color="#FFFFFF" />
                <Text style={styles.sosButtonText}>SOS - I NEED HELP</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* I'm Okay Button */}
            <TouchableOpacity
              style={styles.okayButton}
              onPress={handleOkay}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
              <Text style={styles.okayButtonText}>I'm Okay</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <Text style={styles.infoText}>
            Pressing SOS will call 911 and alert your emergency contacts with your location.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/**
 * SafetyAlertContainer - Wrapper that connects to store
 */
export function SafetyAlertContainer() {
  const {
    showDeviationAlert,
    showEarlyCompletionAlert,
    alertCountdown,
    respondToDeviationAlert,
    respondToEarlyCompletionAlert,
  } = useSafetyStore();

  const visible = showDeviationAlert || showEarlyCompletionAlert;
  const alertType = showDeviationAlert ? 'route_deviation' : 'early_completion';

  const handleOkay = async () => {
    if (showDeviationAlert) {
      await respondToDeviationAlert('okay');
    } else {
      await respondToEarlyCompletionAlert('okay');
    }
  };

  const handleSOS = async () => {
    if (showDeviationAlert) {
      await respondToDeviationAlert('sos');
    } else {
      await respondToEarlyCompletionAlert('sos');
    }
  };

  return (
    <SafetyAlertModal
      visible={visible}
      alertType={alertType}
      countdown={alertCountdown}
      onOkay={handleOkay}
      onSOS={handleSOS}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  countdownLabel: {
    fontSize: 14,
    color: '#999999',
    marginRight: Spacing.sm,
  },
  countdown: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500',
  },
  warningText: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  sosButton: {
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    width: SCREEN_WIDTH * 0.7,
    alignSelf: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  okayButton: {
    backgroundColor: '#10B981',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    width: SCREEN_WIDTH * 0.6,
    alignSelf: 'center',
  },
  okayButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});

export default SafetyAlertModal;
