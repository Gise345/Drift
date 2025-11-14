/**
 * Ride Request Modal
 * Shows incoming ride requests to drivers
 * Allows accept/decline with countdown timer
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { DriftButton } from '../ui/DriftButton';
import { RideRequest } from '@/src/stores/driver-store';

const { width, height } = Dimensions.get('window');

interface RideRequestModalProps {
  visible: boolean;
  request: RideRequest | null;
  onAccept: () => void;
  onDecline: () => void;
  autoExpireSeconds?: number;
}

export default function RideRequestModal({
  visible,
  request,
  onAccept,
  onDecline,
  autoExpireSeconds = 30,
}: RideRequestModalProps) {
  const [timeLeft, setTimeLeft] = useState(autoExpireSeconds);

  useEffect(() => {
    if (visible) {
      setTimeLeft(autoExpireSeconds);

      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Auto-decline when time runs out
            Alert.alert('Request Expired', 'You did not respond in time.');
            onDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, autoExpireSeconds]);

  if (!request) return null;

  const formatEarnings = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Progress for timer (as percentage)
  const progress = (timeLeft / autoExpireSeconds) * 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with Timer */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.timerContainer}>
                <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>{timeLeft}s</Text>
                </View>
              </View>

              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>New Ride Request</Text>
                <Text style={styles.headerSubtitle}>
                  {request.riderName} • {request.riderRating}⭐
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Earnings Banner */}
          <View style={styles.earningsBanner}>
            <Text style={styles.earningsLabel}>Estimated Earnings</Text>
            <Text style={styles.earningsAmount}>{formatEarnings(request.estimatedEarnings)}</Text>
          </View>

          {/* Trip Details */}
          <View style={styles.content}>
            {/* Pickup */}
            <View style={styles.locationRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={20} color={Colors.success} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress}>{request.pickup.address}</Text>
              </View>
            </View>

            {/* Destination */}
            <View style={[styles.locationRow, { marginTop: Spacing.md }]}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.error + '20' }]}>
                <Ionicons name="flag" size={20} color={Colors.error} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationAddress}>{request.destination.address}</Text>
              </View>
            </View>

            {/* Trip Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="navigate" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{formatDistance(request.distance)}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{formatDuration(request.estimatedDuration)}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              {request.passengers && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="people" size={24} color={Colors.primary} />
                    <Text style={styles.statValue}>{request.passengers}</Text>
                    <Text style={styles.statLabel}>Passengers</Text>
                  </View>
                </>
              )}
            </View>

            {/* Notes */}
            {request.notes && (
              <View style={styles.notesContainer}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.gray[600]} />
                <Text style={styles.notesText}>{request.notes}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Ionicons name="close-circle" size={24} color={Colors.error} />
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            <DriftButton
              title="Accept"
              onPress={onAccept}
              variant="primary"
              icon="checkmark-circle"
              style={styles.acceptButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },

  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: height * 0.85,
    ...Shadows['2xl'],
  },

  // Header
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },

  timerContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: Colors.white,
    backgroundColor: Colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },

  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white + 'CC',
  },

  // Earnings Banner
  earningsBanner: {
    backgroundColor: Colors.success + '20',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },

  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success,
    marginBottom: 4,
  },

  earningsAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
  },

  // Content
  content: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },

  // Locations
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationInfo: {
    flex: 1,
  },

  locationLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginBottom: 4,
  },

  locationAddress: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    lineHeight: 20,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginTop: Spacing.xs,
  },

  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Spacing.sm,
  },

  // Notes
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.info + '10',
    borderRadius: BorderRadius.md,
  },

  notesText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    lineHeight: 20,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingBottom: Platform.OS === 'ios' ? Spacing['2xl'] : Spacing.xl,
  },

  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
  },

  declineText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error,
  },

  acceptButton: {
    flex: 1,
  },
});
