/**
 * Complete Ride Screen - Driver
 * Shows trip summary and waits for rider to add tip
 *
 * Flow:
 * 1. Driver clicks "Complete Trip" on navigate-to-destination
 * 2. Trip status changes to AWAITING_TIP
 * 3. Rider sees add-tip screen
 * 4. When rider tips or skips, trip status changes to COMPLETED
 * 5. Driver sees final earnings and can finish
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { completeTrip, finalizeTrip } from '@/src/services/ride-request.service';
import { firebaseDb } from '@/src/config/firebase';
import { doc, onSnapshot } from '@react-native-firebase/firestore';

export default function CompleteRide() {
  const router = useRouter();
  const { activeRide, completeRide: completeRideInStore, setActiveRide } = useDriverStore();
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);
  const [waitingForTip, setWaitingForTip] = useState(false);
  const [tipReceived, setTipReceived] = useState<number | null>(null);
  const [tripFinalized, setTripFinalized] = useState(false);
  const hasCompletedRef = useRef(false);

  // Subscribe to trip updates to detect when rider adds tip
  useEffect(() => {
    if (!activeRide?.id || !waitingForTip) return;

    console.log('🔔 Subscribing to trip updates for tip:', activeRide.id);

    const tripRef = doc(firebaseDb, 'trips', activeRide.id);
    const unsubscribe = onSnapshot(tripRef, (docSnapshot) => {
      if (docSnapshot.exists) {
        const data = docSnapshot.data();
        console.log('📍 Trip update:', data?.status, 'Tip:', data?.tip);

        // Check if trip was completed (rider added tip or skipped)
        if (data?.status === 'COMPLETED') {
          setTipReceived(data?.tip || 0);
          setTripFinalized(true);
          setWaitingForTip(false);
        }
      }
    });

    return () => unsubscribe();
  }, [activeRide?.id, waitingForTip]);

  if (!activeRide) {
    router.replace('/(driver)/tabs');
    return null;
  }

  const baseFare = activeRide.estimatedEarnings || 0;
  const additional = parseFloat(additionalCharges) || 0;
  const totalEarnings = baseFare + additional + (tipReceived || 0);
  const actualDistance = activeRide.distance || 0;
  const actualDuration = activeRide.estimatedDuration || 0;

  const handleComplete = async () => {
    if (completing || hasCompletedRef.current) return;

    try {
      setCompleting(true);
      hasCompletedRef.current = true;

      const finalCost = baseFare + additional;

      // Complete trip in Firebase - sets status to AWAITING_TIP
      await completeTrip(
        activeRide.id,
        finalCost,
        actualDistance,
        actualDuration
      );

      // Show waiting for tip state
      setWaitingForTip(true);
      setCompleting(false);

      console.log('✅ Trip marked as AWAITING_TIP, waiting for rider response...');
    } catch (error) {
      console.error('Failed to complete ride:', error);
      Alert.alert('Error', 'Failed to complete ride. Please try again.');
      setCompleting(false);
      hasCompletedRef.current = false;
    }
  };

  const handleFinish = async () => {
    try {
      setCompleting(true);

      // If not yet finalized, finalize now
      if (!tripFinalized) {
        await finalizeTrip(activeRide.id);
      }

      // Update local state
      await completeRideInStore(totalEarnings, tipReceived || 0);

      // Clear active ride
      setActiveRide(null);

      // Navigate to home
      router.replace('/(driver)/tabs');
    } catch (error) {
      console.error('Failed to finish trip:', error);
      // Still navigate away
      setActiveRide(null);
      router.replace('/(driver)/tabs');
    }
  };

  // Waiting for tip screen
  if (waitingForTip && !tripFinalized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waitingContainer}>
          <View style={styles.waitingIconContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.waitingTitle}>Waiting for Rider</Text>
          <Text style={styles.waitingSubtitle}>
            {activeRide.riderName || 'The rider'} is reviewing the trip
          </Text>
          <Text style={styles.waitingHint}>
            They may add a tip for great service
          </Text>

          <View style={styles.earningsPreview}>
            <Text style={styles.previewLabel}>Trip Earnings</Text>
            <Text style={styles.previewAmount}>CI${(baseFare + additional).toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.skipWaitButton}
            onPress={handleFinish}
          >
            <Text style={styles.skipWaitText}>Finish Without Waiting</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Trip completed - show final earnings
  if (tripFinalized) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={100} color={Colors.success} />
          </View>

          <Text style={styles.title}>Trip Completed!</Text>
          <Text style={styles.subtitle}>Great job completing this ride</Text>

          {/* Earnings Card */}
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsAmount}>CI${totalEarnings.toFixed(2)}</Text>
            <View style={styles.earningsBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Trip Fare</Text>
                <Text style={styles.breakdownValue}>CI${(baseFare + additional).toFixed(2)}</Text>
              </View>
              {tipReceived !== null && tipReceived > 0 && (
                <View style={styles.breakdownRow}>
                  <View style={styles.tipLabelContainer}>
                    <Ionicons name="heart" size={14} color={Colors.success} />
                    <Text style={[styles.breakdownLabel, styles.tipLabel]}>Tip</Text>
                  </View>
                  <Text style={[styles.breakdownValue, styles.tipValue]}>CI${tipReceived.toFixed(2)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Trip Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="navigate" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{(actualDistance / 1000).toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{Math.round(actualDuration)} min</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
          </View>

          {/* Rate Rider */}
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => router.push('/(driver)/active-ride/rate-rider')}
          >
            <Ionicons name="star" size={20} color={Colors.white} />
            <Text style={styles.rateText}>Rate {activeRide.riderName || 'Rider'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Initial complete ride screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="flag-outline" size={80} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Arrived at Destination</Text>
        <Text style={styles.subtitle}>Review the trip details before completing</Text>

        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Trip Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rider</Text>
            <Text style={styles.summaryValue}>{activeRide.riderName || 'Rider'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Fare</Text>
            <Text style={styles.summaryValue}>CI${baseFare.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>
              {(actualDistance / 1000).toFixed(1)} km
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{Math.round(actualDuration)} min</Text>
          </View>
        </View>

        {/* Additional Charges */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Additional Charges (Optional)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>CI$</Text>
            <TextInput
              style={styles.input}
              value={additionalCharges}
              onChangeText={setAdditionalCharges}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.gray[400]}
            />
          </View>
          <Text style={styles.inputHint}>For tolls, extra stops, or waiting time</Text>
        </View>

        {/* Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Trip Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes about this trip..."
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.gray[400]}
          />
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Trip Earnings</Text>
          <Text style={styles.totalValue}>CI${(baseFare + additional).toFixed(2)}</Text>
          <Text style={styles.totalHint}>+ potential tip from rider</Text>
        </View>

        <TouchableOpacity
          style={[styles.completeButton, completing && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.completeText}>Complete Trip</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  successIcon: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.lg },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: { fontSize: Typography.fontSize.sm, color: Colors.gray[600] },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  inputSection: { marginBottom: Spacing.lg },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    paddingHorizontal: Spacing.lg,
  },
  currencyPrefix: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray[600],
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.black,
  },
  inputHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  totalCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  totalValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.primary,
  },
  totalHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
  },
  completeButtonDisabled: {
    backgroundColor: Colors.gray[400],
    opacity: 0.6,
  },
  completeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },

  // Waiting for tip styles
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  waitingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  waitingTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  waitingSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  waitingHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
    marginBottom: Spacing.xl,
  },
  earningsPreview: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  previewLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  previewAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.primary,
  },
  skipWaitButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  skipWaitText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray[600],
  },

  // Final earnings styles
  earningsCard: {
    backgroundColor: Colors.success + '15',
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  earningsAmount: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '700',
    color: Colors.success,
    marginBottom: Spacing.lg,
  },
  earningsBreakdown: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[300],
    paddingTop: Spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  breakdownValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  tipLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipLabel: {
    color: Colors.success,
    fontWeight: '600',
  },
  tipValue: {
    color: Colors.success,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginTop: 4,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  rateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  finishButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
});
