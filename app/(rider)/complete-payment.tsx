/**
 * COMPLETE PAYMENT SCREEN
 * Shown after driver accepts ride request
 * Rider must complete payment for trip to proceed
 *
 * 5-minute timeout - trip auto-cancels if rider doesn't pay in time
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { StripeCheckout } from '@/components/StripeCheckout';
import { cancelTrip } from '@/src/services/ride-request.service';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { firebaseDb } from '@/src/config/firebase';
import { doc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';

// KYD to GBP conversion rate
const KYD_TO_GBP_RATE = 0.873;

// Payment timeout in seconds (2 minutes)
const PAYMENT_TIMEOUT_SECONDS = 120;
const WARNING_THRESHOLD_SECONDS = 60; // Show warning at 1 minute remaining

export default function CompletePaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lockedContribution, clearBookingFlow } = useCarpoolStore();
  const { currentTrip, subscribeToTrip } = useTripStore();
  const { user } = useAuthStore();

  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(PAYMENT_TIMEOUT_SECONDS);

  const paymentProcessedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);

  // Calculate charge amounts
  const chargeAmountKYD = lockedContribution || currentTrip?.estimatedCost || 0;
  const chargeAmountGBP = Math.round(chargeAmountKYD * KYD_TO_GBP_RATE * 100) / 100;

  // Subscribe to trip updates
  useEffect(() => {
    if (currentTrip?.id) {
      const unsubscribe = subscribeToTrip(currentTrip.id);
      return () => unsubscribe();
    }
  }, [currentTrip?.id]);

  // Handle trip status changes
  useEffect(() => {
    if (!currentTrip || hasNavigatedRef.current) return;

    // If payment completed successfully, navigate to driver-arriving
    if (currentTrip.status === 'DRIVER_ARRIVING') {
      hasNavigatedRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      router.replace('/(rider)/driver-arriving');
      return;
    }

    // If trip was cancelled
    if (currentTrip.status === 'CANCELLED') {
      hasNavigatedRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      clearBookingFlow();
      Alert.alert('Trip Cancelled', 'The trip has been cancelled.', [
        { text: 'OK', onPress: () => router.replace('/(rider)') }
      ]);
    }
  }, [currentTrip?.status]);

  // Payment timeout timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto-cancel
          handlePaymentTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle payment timeout - auto cancel trip
  const handlePaymentTimeout = async () => {
    if (hasNavigatedRef.current || paymentProcessedRef.current) return;
    hasNavigatedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      if (currentTrip?.id) {
        await cancelTrip(
          currentTrip.id,
          'RIDER',
          'Payment timeout - rider did not complete payment within 2 minutes',
          'PAYMENT_TIMEOUT'
        );
      }
    } catch (error) {
      console.error('Failed to cancel trip on timeout:', error);
    }

    clearBookingFlow();
    Alert.alert(
      'Payment Timeout',
      'You did not complete payment in time. The trip has been cancelled.',
      [{ text: 'OK', onPress: () => router.replace('/(rider)') }]
    );
  };

  // Prevent back navigation during payment
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Cancel Payment?',
        'Your driver is waiting. Are you sure you want to cancel?',
        [
          { text: 'No, Continue', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancelTrip }
        ]
      );
      return true;
    });
    return () => backHandler.remove();
  }, [currentTrip?.id]);

  const handlePayNow = () => {
    setShowStripeCheckout(true);
  };

  const handleStripeSuccess = async (paymentIntentId: string, status: string, details: any) => {
    if (paymentProcessedRef.current || paymentProcessed) return;
    paymentProcessedRef.current = true;
    setPaymentProcessed(true);

    try {
      setLoading(true);

      // Update trip with payment info and change status to DRIVER_ARRIVING
      if (currentTrip?.id) {
        const tripRef = doc(firebaseDb, 'trips', currentTrip.id);
        await updateDoc(tripRef, {
          paymentIntentId,
          paymentStatus: 'CAPTURED',
          paymentCapturedAt: serverTimestamp(),
          status: 'DRIVER_ARRIVING',
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Payment completed, trip status -> DRIVER_ARRIVING');
      }

      setShowStripeCheckout(false);
      // Navigation happens via useEffect when status changes
    } catch (error) {
      console.error('Failed to update trip after payment:', error);
      paymentProcessedRef.current = false;
      setPaymentProcessed(false);
      Alert.alert('Error', 'Payment succeeded but failed to update trip. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCancel = () => {
    setShowStripeCheckout(false);
    // Don't cancel the trip - just close modal
  };

  const handleStripeError = (error: Error) => {
    setShowStripeCheckout(false);
    Alert.alert('Payment Error', error.message || 'Failed to process payment. Please try again.');
  };

  const handleCancelTrip = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      if (currentTrip?.id) {
        await cancelTrip(
          currentTrip.id,
          'RIDER',
          'Rider cancelled during payment',
          'RIDER_CANCELLED_DURING_PAYMENT'
        );
      }
      clearBookingFlow();
      router.replace('/(rider)');
    } catch (error) {
      console.error('Failed to cancel trip:', error);
      clearBookingFlow();
      router.replace('/(rider)');
    }
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get driver info
  const driver = currentTrip?.driverInfo;
  const isWarning = timeRemaining <= WARNING_THRESHOLD_SECONDS;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[Colors.purple, Colors.primaryDark, Colors.primary]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                Alert.alert(
                  'Cancel Payment?',
                  'Your driver is waiting. Are you sure you want to cancel?',
                  [
                    { text: 'No, Continue', style: 'cancel' },
                    { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancelTrip }
                  ]
                );
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.title}>Complete Payment</Text>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Driver Found Card */}
            <View style={styles.driverCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              </View>
              <Text style={styles.driverFoundText}>Driver Found!</Text>

              {driver && (
                <View style={styles.driverInfo}>
                  {driver.photo ? (
                    <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
                  ) : (
                    <View style={styles.driverPhotoPlaceholder}>
                      <Ionicons name="person" size={32} color={Colors.gray[400]} />
                    </View>
                  )}
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <View style={styles.vehicleInfoRow}>
                    <Text style={styles.vehicleInfo}>
                      {driver.vehicle?.color} {driver.vehicle?.make} {driver.vehicle?.model}
                    </Text>
                  </View>
                  <View style={styles.plateContainer}>
                    <Text style={styles.plateNumber}>{driver.vehicle?.plate}</Text>
                  </View>
                  {driver.rating && (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color={Colors.warning} />
                      <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Payment Required Card */}
            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Ionicons name="card" size={28} color={Colors.purple} />
                <Text style={styles.paymentTitle}>Payment Required</Text>
              </View>
              <Text style={styles.paymentDescription}>
                Complete your payment so your driver can start heading to you.
              </Text>

              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Trip Cost</Text>
                <Text style={styles.amountKYD}>${chargeAmountKYD.toFixed(2)} KYD</Text>
                <Text style={styles.amountGBP}>≈ £{chargeAmountGBP.toFixed(2)} GBP</Text>
              </View>
            </View>

            {/* Timer Warning */}
            <View style={[styles.timerCard, isWarning && styles.timerCardWarning]}>
              <Ionicons
                name="time-outline"
                size={20}
                color={isWarning ? Colors.error : Colors.warning}
              />
              <View style={styles.timerContent}>
                <Text style={[styles.timerText, isWarning && styles.timerTextWarning]}>
                  {isWarning
                    ? 'Hurry! Time is running out!'
                    : 'Your driver is waiting. Please complete payment.'
                  }
                </Text>
                <Text style={[styles.timerCountdown, isWarning && styles.timerCountdownWarning]}>
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(timeRemaining / PAYMENT_TIMEOUT_SECONDS) * 100}%` },
                    isWarning && styles.progressFillWarning
                  ]}
                />
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayNow}
              disabled={loading || paymentProcessed}
            >
              <LinearGradient
                colors={[Colors.purple, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={22} color={Colors.white} />
                    <Text style={styles.payButtonText}>Pay £{chargeAmountGBP.toFixed(2)}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Alert.alert(
                  'Cancel Trip?',
                  'Your driver is waiting. Are you sure you want to cancel?',
                  [
                    { text: 'No, Continue', style: 'cancel' },
                    { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancelTrip }
                  ]
                );
              }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Stripe Checkout */}
      {showStripeCheckout && (
        <StripeCheckout
          visible={showStripeCheckout}
          amount={chargeAmountGBP}
          currency="GBP"
          description="Drift Carpool Trip"
          onSuccess={handleStripeSuccess}
          onCancel={handleStripeCancel}
          onError={handleStripeError}
          preferredMethod="card"
          isVerification={false}
          metadata={{
            userId: user?.id,
            tripId: currentTrip?.id,
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.purple,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  driverCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  successIcon: {
    marginBottom: Spacing.md,
  },
  driverFoundText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
    marginBottom: Spacing.md,
  },
  driverInfo: {
    alignItems: 'center',
  },
  driverPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: Spacing.sm,
  },
  driverPhotoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  driverName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  vehicleInfoRow: {
    marginBottom: Spacing.xs,
  },
  vehicleInfo: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  plateContainer: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  plateNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  paymentTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  paymentDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  amountContainer: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  amountLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
    marginBottom: Spacing.xs,
  },
  amountKYD: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.purple,
  },
  amountGBP: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    marginTop: 2,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timerCardWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  timerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  timerTextWarning: {
    color: Colors.white,
  },
  timerCountdown: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  timerCountdownWarning: {
    color: Colors.error,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  progressFillWarning: {
    backgroundColor: Colors.error,
  },
  bottomContainer: {
    padding: Spacing.lg,
  },
  payButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  payButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.8)',
  },
});
