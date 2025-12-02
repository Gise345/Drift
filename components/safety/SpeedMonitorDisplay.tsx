/**
 * DRIFT SPEED MONITOR DISPLAY
 * Real-time speed monitoring UI component
 *
 * Features:
 * - Current speed display
 * - Speed limit display
 * - Color-coded alerts (green/yellow/red)
 * - Violation warning animations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafetyStore } from '@/src/stores/safety-store';
import { SpeedAlertLevel } from '@/src/types/safety.types';
import { BorderRadius, Spacing } from '@/src/constants/theme';

interface SpeedMonitorDisplayProps {
  style?: object;
  compact?: boolean;
}

export function SpeedMonitorDisplay({ style, compact = false }: SpeedMonitorDisplayProps) {
  const { speedState, isMonitoring } = useSafetyStore();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation when violating
  React.useEffect(() => {
    if (speedState.isViolating) {
      Animated.loop(
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
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [speedState.isViolating, pulseAnim]);

  if (!isMonitoring) return null;

  const getAlertColor = (level: SpeedAlertLevel): string => {
    switch (level) {
      case 'normal':
        return '#10B981'; // Green
      case 'warning':
        return '#F59E0B'; // Yellow/Orange
      case 'danger':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getAlertBackground = (level: SpeedAlertLevel): string => {
    switch (level) {
      case 'normal':
        return 'rgba(16, 185, 129, 0.1)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)';
      case 'danger':
        return 'rgba(239, 68, 68, 0.2)';
      default:
        return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const alertColor = getAlertColor(speedState.alertLevel);
  const bgColor = getAlertBackground(speedState.alertLevel);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: bgColor }, style]}>
        <Ionicons name="speedometer" size={16} color={alertColor} />
        <Text style={[styles.compactSpeed, { color: alertColor }]}>
          {Math.round(speedState.currentSpeed)} mph
        </Text>
        {speedState.currentSpeedLimit && (
          <Text style={styles.compactLimit}>
            / {speedState.currentSpeedLimit}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor: alertColor },
        speedState.isViolating && { transform: [{ scale: pulseAnim }] },
        style,
      ]}
    >
      <View style={styles.speedSection}>
        <Ionicons name="speedometer" size={24} color={alertColor} />
        <View style={styles.speedNumbers}>
          <Text style={[styles.currentSpeed, { color: alertColor }]}>
            {Math.round(speedState.currentSpeed)}
          </Text>
          <Text style={styles.speedUnit}>mph</Text>
        </View>
      </View>

      {speedState.currentSpeedLimit && (
        <View style={styles.limitSection}>
          <View style={[styles.limitBadge, { borderColor: alertColor }]}>
            <Text style={styles.limitValue}>
              {speedState.currentSpeedLimit}
            </Text>
            <Text style={styles.limitLabel}>LIMIT</Text>
          </View>
        </View>
      )}

      {speedState.isViolating && (
        <View style={styles.warningSection}>
          <Ionicons name="warning" size={20} color="#EF4444" />
          <Text style={styles.warningText}>Exceeding Speed Limit</Text>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Speed Monitor Badge - Small indicator for map overlay
 */
export function SpeedMonitorBadge({ style }: { style?: object }) {
  const { speedState, isMonitoring } = useSafetyStore();

  if (!isMonitoring) return null;

  const getAlertColor = (level: SpeedAlertLevel): string => {
    switch (level) {
      case 'normal':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'danger':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getAlertColor(speedState.alertLevel) }, style]}>
      <Text style={styles.badgeText}>
        {Math.round(speedState.currentSpeed)}
      </Text>
    </View>
  );
}

/**
 * Speed Limit Sign - Road sign style display
 */
export function SpeedLimitSign({
  speedLimit,
  style,
}: {
  speedLimit: number | null;
  style?: object;
}) {
  if (!speedLimit) return null;

  return (
    <View style={[styles.signContainer, style]}>
      <View style={styles.sign}>
        <Text style={styles.signLabel}>SPEED</Text>
        <Text style={styles.signLabel}>LIMIT</Text>
        <Text style={styles.signValue}>{speedLimit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.md,
  },
  speedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  speedNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentSpeed: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  speedUnit: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  limitSection: {
    marginLeft: 'auto',
  },
  limitBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  limitLabel: {
    fontSize: 8,
    color: '#666666',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    bottom: -24,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  compactSpeed: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  compactLimit: {
    fontSize: 12,
    color: '#999999',
  },

  // Badge styles
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Sign styles
  signContainer: {
    alignItems: 'center',
  },
  sign: {
    width: 50,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  signLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
  },
  signValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default SpeedMonitorDisplay;
