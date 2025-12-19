/**
 * FINDING DRIVER SCREEN
 * Shows search animation while looking for available drivers
 * Implements retry logic (max 3 times) when no driver accepts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useTripStore } from '@/src/stores/trip-store';
import { cancelTrip, resendRideRequest } from '@/src/services/ride-request.service';
import { releasePaymentAuthorization } from '@/src/services/stripe.service';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { firebaseDb } from '@/src/config/firebase';
import { doc, getDoc } from '@react-native-firebase/firestore';

// KYD to USD conversion rate
const KYD_TO_USD_RATE = 1.20;

// Request timeout and retry settings
const REQUEST_TIMEOUT_SECONDS = 60; // 60 seconds to find a driver
const AUTO_RETRY_ATTEMPTS = 3; // Automatic retries before asking user
const MAX_MANUAL_RETRIES = 3; // Additional manual retries user can choose
const TOTAL_MAX_RETRIES = AUTO_RETRY_ATTEMPTS + MAX_MANUAL_RETRIES; // 6 total attempts

export default function FindingDriverScreen() {
  const router = useRouter();
  const {
    vehicleType,
    lockedContribution,
    destination,
    pickupLocation,
    pricing,
    clearBookingFlow,
  } = useCarpoolStore();

  const currentTrip = useTripStore((state) => state.currentTrip);
  const subscribeToTrip = useTripStore((state) => state.subscribeToTrip);

  const [searchStatus, setSearchStatus] = useState<string>('Searching for drivers...');
  const [retryCount, setRetryCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(REQUEST_TIMEOUT_SECONDS);
  const [isRetrying, setIsRetrying] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  // Refs for tracking state
  const hasNavigatedRef = useRef(false);
  const subscribedTripIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Format price
  const formatKYD = (amount: number) => `$${amount.toFixed(2)} KYD`;
  const formatUSD = (amount: number) => `$${(amount * KYD_TO_USD_RATE).toFixed(2)} USD`;

  // Animation effects
  useEffect(() => {
    // Pulse animation for car icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation for the radar sweep
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Wave animations (ripple effect)
    const createWaveAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createWaveAnimation(waveAnim1, 0).start();
    createWaveAnimation(waveAnim2, 667).start();
    createWaveAnimation(waveAnim3, 1334).start();
  }, []);

  // Timer for request timeout
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleRequestTimeout();
          return REQUEST_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [retryCount]);

  // Handle request timeout - retry or show no drivers message
  const handleRequestTimeout = async () => {
    if (hasNavigatedRef.current) return;

    retryCountRef.current += 1;
    setRetryCount(retryCountRef.current);

    if (retryCountRef.current < AUTO_RETRY_ATTEMPTS) {
      // Automatic retry (first 3 attempts)
      setIsRetrying(true);
      setSearchStatus(`Retrying... (Attempt ${retryCountRef.current + 1}/${AUTO_RETRY_ATTEMPTS})`);

      try {
        if (currentTrip?.id) {
          // After first attempt, expand search to island-wide
          const expandSearch = retryCountRef.current >= 1;
          await resendRideRequest(currentTrip.id, expandSearch);
          console.log('🔄 Ride request resent, attempt:', retryCountRef.current + 1, 'expanded:', expandSearch);
        }
      } catch (error) {
        console.error('Failed to resend request:', error);
      }

      setIsRetrying(false);
      setSearchStatus(retryCountRef.current >= 1 ? 'Searching island-wide...' : 'Searching for drivers...');
      setTimeRemaining(REQUEST_TIMEOUT_SECONDS);
    } else if (retryCountRef.current < TOTAL_MAX_RETRIES) {
      // After auto-retries, ask user if they want to keep trying
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const remainingRetries = TOTAL_MAX_RETRIES - retryCountRef.current;
      Alert.alert(
        'No Drivers Found Yet',
        `We haven't found a driver yet. Would you like to keep searching? You have ${remainingRetries} more ${remainingRetries === 1 ? 'attempt' : 'attempts'} available.\n\nWe're now searching island-wide to find you a ride.`,
        [
          {
            text: 'Cancel Trip',
            style: 'destructive',
            onPress: () => handleNoDriversAvailable(),
          },
          {
            text: 'Keep Searching',
            style: 'default',
            onPress: () => handleManualRetry(),
          },
        ]
      );
    } else {
      // Truly max retries reached - NO DRIVERS AVAILABLE
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      Alert.alert(
        'No Drivers Available',
        'We couldn\'t find any drivers at this time. Your payment authorization has been cancelled and funds will be returned shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Use special handler for no drivers - NOT rider cancel
              handleNoDriversAvailable();
            },
          },
        ]
      );
    }
  };

  // Handle manual retry when user chooses to keep searching
  const handleManualRetry = async () => {
    setIsRetrying(true);
    setSearchStatus(`Searching island-wide... (Attempt ${retryCountRef.current + 1})`);

    try {
      if (currentTrip?.id) {
        // Always expand search for manual retries
        await resendRideRequest(currentTrip.id, true);
        console.log('🔄 Manual retry, attempt:', retryCountRef.current + 1);
      }
    } catch (error) {
      console.error('Failed to resend request:', error);
    }

    setIsRetrying(false);
    setSearchStatus('Searching island-wide...');
    setTimeRemaining(REQUEST_TIMEOUT_SECONDS);

    // Restart the timer
    startSearchTimer();
  };

  // Start/restart the search timer
  const startSearchTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleRequestTimeout();
          return REQUEST_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Handle the case when no drivers are available after all retries
   * This is NOT the same as rider cancelling - payment should be released, not refunded
   */
  const handleNoDriversAvailable = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const tripId = currentTrip?.id;
      if (tripId) {
        console.log('🚫 No drivers available - processing cancellation for trip:', tripId);

        // Fetch trip data directly from Firestore to get paymentIntentId
        let paymentIntentId: string | undefined;
        try {
          const tripRef = doc(firebaseDb, 'trips', tripId);
          const tripSnap = await getDoc(tripRef);
          if (tripSnap.exists()) {
            const tripData = tripSnap.data();
            // Get paymentIntentId directly (new format) or parse from paymentMethod (legacy format)
            paymentIntentId = tripData?.paymentIntentId;
            if (!paymentIntentId && tripData?.paymentMethod?.startsWith('stripe:')) {
              paymentIntentId = tripData.paymentMethod.replace('stripe:', '');
            }
            console.log('📄 Trip data fetched, paymentIntentId:', paymentIntentId);
          }
        } catch (fetchError) {
          console.error('⚠️ Failed to fetch trip data:', fetchError);
          // Try using currentTrip as fallback
          paymentIntentId = (currentTrip as any)?.paymentIntentId;
          if (!paymentIntentId && currentTrip?.paymentMethod?.startsWith('stripe:')) {
            paymentIntentId = currentTrip.paymentMethod.replace('stripe:', '');
          }
        }

        // Release the payment authorization
        if (paymentIntentId) {
          console.log('💰 Releasing payment authorization - no drivers found');
          console.log('   PaymentIntent ID:', paymentIntentId);

          try {
            const result = await releasePaymentAuthorization(paymentIntentId, tripId, 'No drivers available');
            console.log('✅ Payment authorization released:', result);
          } catch (paymentError: any) {
            console.error('⚠️ Failed to release payment:', paymentError?.message || paymentError);
            // Continue with cancellation even if payment release fails
          }
        } else {
          console.log('⚠️ No payment intent ID found on trip');
        }

        // Cancel with correct reason - NO_DRIVERS_AVAILABLE, not rider cancelled
        console.log('📝 Cancelling trip with NO_DRIVERS_AVAILABLE reason');
        await cancelTrip(
          tripId,
          'RIDER', // System-initiated on behalf of rider (no drivers available)
          'No drivers available after multiple attempts',
          'NO_DRIVERS_AVAILABLE' // CORRECT reason type
        );
        console.log('✅ Trip cancelled successfully');
      }

      clearBookingFlow();
      router.back();
    } catch (error) {
      console.error('❌ Failed to handle no drivers:', error);
      clearBookingFlow();
      router.back();
    }
  };

  // Subscribe to trip updates
  useEffect(() => {
    if (!currentTrip?.id) {
      console.log('⚠️ No current trip to monitor');
      return;
    }

    if (subscribedTripIdRef.current === currentTrip.id) {
      return;
    }

    console.log('👀 Monitoring trip:', currentTrip.id);
    subscribedTripIdRef.current = currentTrip.id;
    hasNavigatedRef.current = false;

    const unsubscribe = subscribeToTrip(currentTrip.id);

    return () => {
      subscribedTripIdRef.current = null;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentTrip?.id]);

  // Handle trip status changes
  useEffect(() => {
    if (!currentTrip || hasNavigatedRef.current) return;

    const status = currentTrip.status;
    console.log('📍 Trip status:', status);

    if (status === 'ACCEPTED' || status === 'DRIVER_ARRIVING') {
      console.log('🚗 Driver found! Navigating...');
      hasNavigatedRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setSearchStatus('Driver found!');
      router.replace('/(rider)/driver-arriving');
      return;
    }

    if (status === 'CANCELLED') {
      hasNavigatedRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Try to release payment authorization as a safety measure
      // (in case it wasn't released by whatever cancelled the trip)
      const releasePaymentIfNeeded = async () => {
        try {
          const tripId = currentTrip?.id;
          if (!tripId) {
            console.log('⚠️ No trip ID for payment release');
            return;
          }

          console.log('🔍 Fetching trip data for payment release:', tripId);
          const tripRef = doc(firebaseDb, 'trips', tripId);
          const tripSnap = await getDoc(tripRef);

          if (!tripSnap.exists()) {
            console.log('⚠️ Trip document not found');
            return;
          }

          const tripData = tripSnap.data();
          let paymentIntentId = tripData?.paymentIntentId;
          if (!paymentIntentId && tripData?.paymentMethod?.startsWith('stripe:')) {
            paymentIntentId = tripData.paymentMethod.replace('stripe:', '');
          }

          console.log('📋 Trip payment info:', {
            paymentIntentId: paymentIntentId || 'NOT FOUND',
            paymentStatus: tripData?.paymentStatus,
            status: tripData?.status,
          });

          // Try to release payment if we have a payment intent ID
          // Don't check paymentStatus - let the Cloud Function handle the logic
          if (paymentIntentId) {
            console.log('🔄 Attempting to release payment authorization:', paymentIntentId);
            try {
              const result = await releasePaymentAuthorization(paymentIntentId, tripId, 'Trip cancelled');
              console.log('✅ Payment release result:', result);
            } catch (e: any) {
              // Log the full error for debugging
              console.error('❌ Payment release error:', {
                message: e?.message,
                code: e?.code,
                details: e?.details,
              });
            }
          } else {
            console.log('⚠️ No payment intent ID found on trip - cannot release payment');
          }
        } catch (error: any) {
          console.error('❌ Error in releasePaymentIfNeeded:', error?.message || error);
        }
      };

      // Execute payment release (don't await - let it run in background)
      releasePaymentIfNeeded();

      clearBookingFlow();
      Alert.alert(
        'Trip Cancelled',
        'The trip has been cancelled.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [currentTrip?.status]);

  const handleCancel = (silent = false) => {
    const doCancel = async () => {
      try {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        const tripId = currentTrip?.id;
        if (tripId) {
          console.log('🚫 Rider cancelling trip:', tripId);

          // Fetch trip data directly from Firestore to get paymentIntentId
          let paymentIntentId: string | undefined;
          try {
            const tripRef = doc(firebaseDb, 'trips', tripId);
            const tripSnap = await getDoc(tripRef);
            if (tripSnap.exists()) {
              const tripData = tripSnap.data();
              // Get paymentIntentId directly (new format) or parse from paymentMethod (legacy format)
              paymentIntentId = tripData?.paymentIntentId;
              if (!paymentIntentId && tripData?.paymentMethod?.startsWith('stripe:')) {
                paymentIntentId = tripData.paymentMethod.replace('stripe:', '');
              }
              console.log('📄 Trip data fetched, paymentIntentId:', paymentIntentId);
            }
          } catch (fetchError) {
            console.error('⚠️ Failed to fetch trip data:', fetchError);
            paymentIntentId = (currentTrip as any)?.paymentIntentId;
            if (!paymentIntentId && currentTrip?.paymentMethod?.startsWith('stripe:')) {
              paymentIntentId = currentTrip.paymentMethod.replace('stripe:', '');
            }
          }

          // Release payment authorization before cancelling
          if (paymentIntentId) {
            console.log('💰 Releasing payment authorization - rider cancelled');
            console.log('   PaymentIntent ID:', paymentIntentId);

            try {
              const result = await releasePaymentAuthorization(paymentIntentId, tripId, 'Rider cancelled while searching');
              console.log('✅ Payment authorization released:', result);
            } catch (paymentError: any) {
              console.error('⚠️ Failed to release payment:', paymentError?.message || paymentError);
            }
          }

          await cancelTrip(
            tripId,
            'RIDER',
            'Rider cancelled while searching',
            'RIDER_CANCELLED_WHILE_SEARCHING'
          );
          console.log('✅ Trip cancelled successfully');
        }
        clearBookingFlow();
        router.back();
      } catch (error) {
        console.error('❌ Failed to cancel:', error);
        clearBookingFlow();
        router.back();
      }
    };

    if (silent) {
      doCancel();
    } else {
      Alert.alert(
        'Cancel Request',
        'Are you sure you want to cancel this ride request? Your payment authorization will be cancelled and funds returned shortly.',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  // Rotation interpolation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Wave interpolations
  const createWaveStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.5],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    }),
  });

  const getVehicleDisplayName = () => {
    switch (vehicleType) {
      case 'economy': return 'Drift Economy';
      case 'standard': return 'Drift Standard';
      case 'comfort': return 'Drift Comfort';
      case 'xl': return 'Drift XL';
      default: return 'Drift Standard';
    }
  };

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
              onPress={() => handleCancel()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.title}>Finding Your Ride</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Animated Search Visualization */}
            <View style={styles.searchVisual}>
              {/* Ripple Waves */}
              <Animated.View style={[styles.wave, createWaveStyle(waveAnim1)]} />
              <Animated.View style={[styles.wave, createWaveStyle(waveAnim2)]} />
              <Animated.View style={[styles.wave, createWaveStyle(waveAnim3)]} />

              {/* Rotating Radar */}
              <Animated.View style={[styles.radar, { transform: [{ rotate: spin }] }]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.3)']}
                  style={styles.radarSweep}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
              </Animated.View>

              {/* Center Car Icon */}
              <Animated.View
                style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
              >
                <Ionicons name="car-sport" size={48} color={Colors.white} />
              </Animated.View>
            </View>

            {/* Status Text */}
            <Text style={styles.status}>{searchStatus}</Text>

            {/* Retry Counter */}
            {retryCount > 0 && (
              <View style={styles.retryBadge}>
                <Ionicons name="refresh" size={14} color={Colors.warning} />
                <Text style={styles.retryText}>
                  Attempt {retryCount + 1} of {TOTAL_MAX_RETRIES}
                </Text>
              </View>
            )}

            {/* Timer */}
            <View style={styles.timerContainer}>
              <View style={styles.timerBar}>
                <Animated.View
                  style={[
                    styles.timerProgress,
                    { width: `${(timeRemaining / REQUEST_TIMEOUT_SECONDS) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.timerText}>{timeRemaining}s</Text>
            </View>

            {/* Trip Details Card */}
            <View style={styles.detailsCard}>
              {/* Destination */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="location" size={18} color={Colors.primary} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Destination</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {destination?.address || 'Selected location'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Vehicle Type */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="car" size={18} color={Colors.primary} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Vehicle</Text>
                  <Text style={styles.detailValue}>{getVehicleDisplayName()}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Cost */}
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="cash" size={18} color={Colors.primary} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Contribution</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceKYD}>
                      {lockedContribution ? formatKYD(lockedContribution) : '--'}
                    </Text>
                    <Text style={styles.priceUSD}>
                      {lockedContribution ? formatUSD(lockedContribution) : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Zone Info */}
              {pricing && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.zoneInfo}>
                    <Ionicons name="navigate" size={14} color={Colors.gray[500]} />
                    <Text style={styles.zoneText}>{pricing.displayText}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Info Message */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={Colors.white} />
              <Text style={styles.infoText}>
                We're searching for the best available driver for your route.
                {retryCount > 0
                  ? ' Request will be resent to nearby drivers.'
                  : ' This usually takes less than a minute.'}
              </Text>
            </View>
          </View>

          {/* Cancel Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel()}
              disabled={isRetrying}
            >
              <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  searchVisual: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  wave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  radar: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  radarSweep: {
    width: '50%',
    height: '100%',
    position: 'absolute',
    right: 0,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  status: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  retryText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.warning,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '80%',
    marginBottom: Spacing.xl,
  },
  timerBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  timerText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    minWidth: 35,
    textAlign: 'right',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  priceKYD: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.purple,
  },
  priceUSD: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginVertical: Spacing.xs,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  zoneText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: Spacing.lg,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 2,
    borderColor: Colors.error,
    ...Shadows.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error,
  },
});
