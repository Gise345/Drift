/**
 * SELECT PAYMENT SCREEN
 * Production implementation with Stripe integration
 * Shows KYD pricing with USD conversion
 *
 * EXPO SDK 52 - Firebase + Stripe
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { StripeCheckout } from '@/components/StripeCheckout';
import { StripeService, StripePaymentMethod } from '@/src/services/stripe.service';
import { firebaseAuth } from '@/src/config/firebase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

// KYD to USD conversion rate (fixed rate for Cayman Islands)
const KYD_TO_USD_RATE = 1.20; // 1 KYD = 1.20 USD approximately

// Check if we're using Stripe test keys (Google Pay/Apple Pay don't work properly with test keys)
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const isStripeTestMode = stripePublishableKey.startsWith('pk_test_');

interface PaymentMethod {
  id: string;
  type: 'stripe' | 'credit_card' | 'apple_pay' | 'google_pay';
  name: string;
  icon: string;
  details?: string;
  isDefault?: boolean;
  connected?: boolean;
}

export default function SelectPaymentScreen() {
  const router = useRouter();
  const {
    setSelectedPaymentMethod,
    lockedContribution,
    pickupLocation,
    destination,
    vehicleType,
    pricing,
    womenOnlyRide,
    route,
  } = useCarpoolStore();
  const { createTrip, setCurrentTrip } = useTripStore();
  const { user } = useAuthStore();

  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stripeMethods, setStripeMethods] = useState<StripePaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const paymentProcessedRef = useRef(false);

  // Format KYD price
  const formatKYD = (amount: number): string => {
    return `$${amount.toFixed(2)} KYD`;
  };

  // Get USD equivalent
  const getUSDAmount = (kydAmount: number): number => {
    return Math.round(kydAmount * KYD_TO_USD_RATE * 100) / 100;
  };

  const formatUSD = (amount: number): string => {
    return `$${amount.toFixed(2)} USD`;
  };

  // Get the locked contribution amount (this is what will be charged)
  const chargeAmountKYD = lockedContribution || 0;
  const chargeAmountUSD = getUSDAmount(chargeAmountKYD);

  // Load saved Stripe payment methods
  // Wait for both user state AND Firebase auth to be ready
  useEffect(() => {
    // Small delay to ensure Firebase Auth state is synchronized
    const timer = setTimeout(() => {
      loadPaymentMethods();
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user) return;

    // Also verify Firebase auth is ready
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      console.log('⏳ Waiting for Firebase auth to be ready...');
      // Firebase auth not ready yet, wait a bit longer
      setTimeout(loadPaymentMethods, 500);
      return;
    }

    try {
      setLoadingMethods(true);
      const methods = await StripeService.getPaymentMethods(user.id);
      setStripeMethods(methods);

      // Auto-select default method
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedPayment(`card-${defaultMethod.id}`);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  // Payment methods - Apple Pay and Google Pay disabled in test mode
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe-new',
      type: 'stripe',
      name: 'Credit / Debit Card',
      details: 'Pay securely with Stripe',
      icon: 'card',
      connected: true,
    },
    {
      id: 'apple-pay',
      type: 'apple_pay',
      name: 'Apple Pay',
      details: isStripeTestMode ? 'Not available in test mode' : 'Quick and secure via Stripe',
      icon: 'logo-apple',
      connected: !isStripeTestMode, // Disabled in test mode
    },
    {
      id: 'google-pay',
      type: 'google_pay',
      name: 'Google Pay',
      details: isStripeTestMode ? 'Not available in test mode' : 'Fast checkout via Stripe',
      icon: 'logo-google',
      connected: !isStripeTestMode, // Disabled in test mode
    },
  ];

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayment(paymentId);
  };

  const handleConfirmPayment = async () => {
    // Debug auth state
    console.log('Checking auth state...');
    const currentUser = firebaseAuth.currentUser;
    console.log('User:', currentUser?.uid);

    if (!selectedPayment) {
      Alert.alert('Select Payment', 'Please select a payment method');
      return;
    }

    if (!user || !pickupLocation || !destination || !lockedContribution) {
      Alert.alert('Error', 'Missing required trip information');
      return;
    }

    // For non-connected methods, show coming soon
    const method = paymentMethods.find(m => m.id === selectedPayment);
    if (method && !method.connected && !selectedPayment.startsWith('card-') && !selectedPayment.startsWith('stripe-')) {
      Alert.alert('Coming Soon', `${method.name} integration coming soon!`);
      return;
    }

    // If any Stripe-based payment is selected, show checkout
    if (selectedPayment === 'stripe-new' ||
        selectedPayment === 'apple-pay' ||
        selectedPayment === 'google-pay' ||
        selectedPayment.startsWith('card-')) {
      setShowStripeCheckout(true);
      return;
    }

    // Otherwise, create trip without payment
    await createTripRequest();
  };

  const createTripRequest = async (paymentDetails?: {
    paymentIntentId?: string;
    status?: string;
    paymentMethod?: string;
  }) => {
    if (!user || !pickupLocation || !destination || !lockedContribution) return;

    setLoading(true);

    try {
      // Save payment method
      setSelectedPaymentMethod(paymentDetails?.paymentMethod || selectedPayment);

      // Create trip in Firebase with status "REQUESTED"
      const tripId = await createTrip({
        riderId: user.id,
        riderName: user.name || 'Rider',
        riderPhoto: user.profilePhoto,
        riderProfileRating: user.rating || 5.0,
        riderGender: user.gender,
        status: 'REQUESTED',
        pickup: {
          address: pickupLocation.address || '',
          coordinates: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
          placeName: (pickupLocation as any)?.placeName || pickupLocation.address || '',
        },
        destination: {
          address: destination.address || '',
          coordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
          placeName: (destination as any)?.placeName || destination.address || '',
        },
        vehicleType: vehicleType || 'standard',
        // Route distance in meters, duration in minutes (converted from seconds)
        distance: route?.distance || 0,
        duration: route?.duration ? Math.ceil(route.duration / 60) : 0,
        // Use locked contribution - this is the exact amount
        estimatedCost: lockedContribution,
        estimatedCostKYD: lockedContribution,
        estimatedCostUSD: chargeAmountUSD,
        paymentMethod: paymentDetails?.paymentMethod || selectedPayment,
        ...(paymentDetails?.paymentIntentId ? {
          paymentMethod: `stripe:${paymentDetails.paymentIntentId}`,
          paymentIntentId: paymentDetails.paymentIntentId, // Store separately for reliability
          // Payment is now AUTHORIZED (held) but not captured yet
          // It will be CAPTURED when driver accepts the ride
          // If no driver found, the authorization will be RELEASED (not charged)
          paymentStatus: paymentDetails.status === 'requires_capture' ? 'AUTHORIZED' :
                        paymentDetails.status === 'succeeded' ? 'CAPTURED' : 'PENDING',
        } : {}),
        // Women-only ride request
        womenOnlyRide: womenOnlyRide || false,
        requestedAt: new Date(),
      });

      console.log('Trip created in Firebase:', tripId);

      // Navigate to finding driver screen
      router.replace('/(rider)/finding-driver');
    } catch (error) {
      console.error('Failed to create trip:', error);
      Alert.alert('Error', 'Failed to request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSuccess = async (paymentIntentId: string, status: string, details: any) => {
    // Prevent double processing
    if (paymentProcessedRef.current || paymentProcessed) {
      console.log('Payment already processed, ignoring duplicate callback');
      return;
    }
    paymentProcessedRef.current = true;
    setPaymentProcessed(true);

    console.log('Stripe payment successful:', { paymentIntentId, status });

    setShowStripeCheckout(false);

    // Create trip with payment details
    await createTripRequest({
      paymentIntentId,
      status,
      paymentMethod: 'stripe',
    });
  };

  const handleStripeCancel = () => {
    console.log('Stripe payment cancelled');
    setShowStripeCheckout(false);
  };

  const handleStripeError = (error: Error) => {
    console.error('Stripe error:', error);
    setShowStripeCheckout(false);
    Alert.alert('Payment Error', error.message || 'Failed to process payment');
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      default:
        return 'card';
    }
  };

  if (loadingMethods) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[Colors.purple, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Payment</Text>

          <View style={styles.headerSpacer} />
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cost Summary Card */}
          <View style={styles.costCard}>
            <View style={styles.costHeader}>
              <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
              <Text style={styles.costTitle}>Payment Summary</Text>
            </View>

            {/* Main Amount in KYD */}
            <View style={styles.mainAmountContainer}>
              <Text style={styles.mainAmountLabel}>Total Contribution</Text>
              <Text style={styles.mainAmount}>{formatKYD(chargeAmountKYD)}</Text>
            </View>

            {/* USD Conversion Notice */}
            <View style={styles.conversionContainer}>
              <View style={styles.conversionRow}>
                <View style={styles.conversionIcon}>
                  <Ionicons name="swap-horizontal" size={16} color={Colors.white} />
                </View>
                <View style={styles.conversionInfo}>
                  <Text style={styles.conversionLabel}>You will be charged in USD</Text>
                  <Text style={styles.conversionAmount}>{formatUSD(chargeAmountUSD)}</Text>
                </View>
              </View>
              <Text style={styles.conversionNote}>
                Rate: 1 KYD = {KYD_TO_USD_RATE.toFixed(2)} USD
              </Text>
            </View>

            {/* Trip Summary */}
            {pricing && (
              <View style={styles.tripSummary}>
                <Text style={styles.tripSummaryText}>{pricing.displayText}</Text>
                <Text style={styles.tripType}>
                  {pricing.isWithinZone ? 'Within-zone' : pricing.isAirportTrip ? 'Airport' : 'Cross-zone'} trip
                </Text>
              </View>
            )}
          </View>

          {/* Saved Cards */}
          {stripeMethods.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Saved Cards</Text>
              {stripeMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentCard,
                    selectedPayment === `card-${method.id}` && styles.paymentCardSelected,
                  ]}
                  onPress={() => handleSelectPayment(`card-${method.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentLeft}>
                    <View style={[styles.iconContainer, styles.stripeBg]}>
                      <Ionicons name={getCardIcon(method.brand)} size={24} color={Colors.white} />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>
                        {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)}
                      </Text>
                      <Text style={styles.paymentDetails}>•••• {method.last4}</Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    selectedPayment === `card-${method.id}` && styles.radioOuterSelected
                  ]}>
                    {selectedPayment === `card-${method.id}` && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Payment Methods */}
          <Text style={styles.sectionTitle}>Payment Methods</Text>

          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentCard,
                selectedPayment === method.id && styles.paymentCardSelected,
                !method.connected && styles.paymentCardDisabled,
              ]}
              onPress={() => method.connected && handleSelectPayment(method.id)}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[
                  styles.iconContainer,
                  method.type === 'stripe' && styles.stripeBg,
                  method.type === 'apple_pay' && styles.appleBg,
                  method.type === 'google_pay' && styles.googleBg,
                ]}>
                  <Ionicons
                    name={method.icon as any}
                    size={24}
                    color={method.type === 'apple_pay' ? Colors.black : Colors.white}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{method.name}</Text>
                  <Text style={styles.paymentDetails}>{method.details}</Text>
                  {!method.connected && (
                    <Text style={styles.comingSoon}>Coming Soon</Text>
                  )}
                </View>
              </View>
              {method.connected && (
                <View style={[
                  styles.radioOuter,
                  selectedPayment === method.id && styles.radioOuterSelected
                ]}>
                  {selectedPayment === method.id && <View style={styles.radioInner} />}
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Currency Notice */}
          <View style={styles.currencyNotice}>
            <Ionicons name="information-circle" size={18} color={Colors.info} />
            <Text style={styles.currencyNoticeText}>
              Stripe does not support KYD currency. Your card will be charged{' '}
              <Text style={styles.currencyBold}>{formatUSD(chargeAmountUSD)}</Text>{' '}
              (equivalent to {formatKYD(chargeAmountKYD)}).
            </Text>
          </View>

          {/* Legal Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              This is a voluntary cost-sharing contribution for a private carpool ride, not a commercial fare.
              By proceeding, you agree to Drift's peer-to-peer terms of service.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Confirm Section */}
        <View style={styles.bottomContainer}>
          <View style={styles.bottomSummary}>
            <View>
              <Text style={styles.bottomLabel}>Total to Pay</Text>
              <Text style={styles.bottomKYD}>{formatKYD(chargeAmountKYD)}</Text>
            </View>
            <View style={styles.bottomRight}>
              <Text style={styles.bottomUSDLabel}>Charged as</Text>
              <Text style={styles.bottomUSD}>{formatUSD(chargeAmountUSD)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedPayment || loading) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmPayment}
            disabled={!selectedPayment || loading}
          >
            <LinearGradient
              colors={(!selectedPayment || loading) ? [Colors.gray[300], Colors.gray[400]] : [Colors.purple, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
                  <Text style={styles.confirmButtonText}>
                    Pay {formatUSD(chargeAmountUSD)}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secureNote}>
            <Ionicons name="lock-closed" size={12} color={Colors.gray[500]} />
            <Text style={styles.secureNoteText}>Secured by Stripe</Text>
          </View>
        </View>

        {/* Stripe Checkout Modal */}
        {showStripeCheckout && lockedContribution && (
          <StripeCheckout
            visible={showStripeCheckout}
            amount={chargeAmountUSD} // Charge in USD
            currency="USD"
            description={`Drift Carpool: ${(pickupLocation as any)?.placeName || pickupLocation?.address || 'Pickup'} to ${(destination as any)?.placeName || destination?.address || 'Destination'}`}
            onSuccess={handleStripeSuccess}
            onCancel={handleStripeCancel}
            onError={handleStripeError}
            preferredMethod={
              selectedPayment === 'apple-pay' ? 'apple_pay' :
              selectedPayment === 'google-pay' ? 'google_pay' : 'card'
            }
            metadata={{
              userId: user?.id,
              pickup: (pickupLocation as any)?.placeName || pickupLocation?.address,
              destination: (destination as any)?.placeName || destination?.address,
              vehicleType,
              amountKYD: chargeAmountKYD,
              amountUSD: chargeAmountUSD,
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backButton: {
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 220,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  costCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  costHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  costTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  mainAmountContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  mainAmountLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  mainAmount: {
    fontSize: Typography.fontSize['4xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.purple,
  },
  conversionContainer: {
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  conversionIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversionInfo: {
    flex: 1,
  },
  conversionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  conversionAmount: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.purple,
  },
  conversionNote: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  tripSummary: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: Spacing.md,
  },
  tripSummaryText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  tripType: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  paymentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
  },
  paymentCardDisabled: {
    opacity: 0.6,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stripeBg: {
    backgroundColor: '#635BFF',
  },
  appleBg: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  googleBg: {
    backgroundColor: '#4285F4',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: 2,
  },
  paymentDetails: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  defaultBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  defaultText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.success,
  },
  comingSoon: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
    fontStyle: 'italic',
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  currencyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  currencyNoticeText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.info,
    lineHeight: 18,
  },
  currencyBold: {
    fontFamily: Typography.fontFamily.bold,
  },
  disclaimer: {
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.purple,
  },
  disclaimerText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  bottomSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  bottomLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  bottomKYD: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.purple,
  },
  bottomRight: {
    alignItems: 'flex-end',
  },
  bottomUSDLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
  bottomUSD: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  confirmButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  secureNoteText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
});
