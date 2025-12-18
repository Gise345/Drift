/**
 * STRIPE CHECKOUT COMPONENT
 * Native Stripe Payment Sheet integration
 * Uses @stripe/stripe-react-native for secure card payments
 *
 * EXPO SDK 52 Compatible
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { createStripePaymentIntent, confirmStripePayment } from '@/src/services/stripe.service';

// Check if we're in Expo Go (where native Stripe won't work)
// In EAS dev builds, appOwnership is 'standalone' or undefined
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import Stripe hooks
let useStripe: any = () => ({ initPaymentSheet: null, presentPaymentSheet: null });
let usePlatformPay: any = () => ({
  isPlatformPaySupported: false,
  confirmPlatformPayPayment: null,
  createPlatformPayPaymentMethod: null,
});
let stripeAvailable = false;
let PlatformPayButton: any = null;

// Always try to load Stripe in non-Expo Go builds
if (!isExpoGo) {
  try {
    const StripeModule = require('@stripe/stripe-react-native');
    if (StripeModule && StripeModule.useStripe) {
      useStripe = StripeModule.useStripe;
      stripeAvailable = true;
      console.log('✅ Stripe native module loaded successfully');

      // Load usePlatformPay hook for Google Pay and Apple Pay
      if (StripeModule.usePlatformPay) {
        usePlatformPay = StripeModule.usePlatformPay;
        console.log('✅ usePlatformPay hook loaded');
      }
      if (StripeModule.PlatformPayButton) {
        PlatformPayButton = StripeModule.PlatformPayButton;
        console.log('✅ PlatformPayButton loaded');
      }
    }
  } catch (e) {
    console.log('Stripe native module not available:', e);
  }
}

console.log('📱 App ownership:', Constants.appOwnership, '| Stripe available:', stripeAvailable);

// DEBUG: Remove after testing
const STRIPE_DEBUG_INFO = `App: ${Constants.appOwnership || 'dev-build'} | Stripe: ${stripeAvailable ? 'YES' : 'NO'} | isExpoGo: ${isExpoGo}`;

const Colors = {
  primary: '#D4E700',
  purple: '#5d1289ff',
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#10B981',
  error: '#EF4444',
  stripe: '#635BFF',
};

interface StripeCheckoutProps {
  visible: boolean;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
  onSuccess: (paymentIntentId: string, status: string, details: any) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
  /** Preferred payment method - 'apple_pay', 'google_pay', or 'card' (default) */
  preferredMethod?: 'apple_pay' | 'google_pay' | 'card';
}

export function StripeCheckout({
  visible,
  amount,
  currency = 'USD',
  description,
  metadata,
  onSuccess,
  onCancel,
  onError,
  preferredMethod = 'card',
}: StripeCheckoutProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'presenting' | 'confirming'>('idle');
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);
  const [platformPayAvailable, setPlatformPayAvailable] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Check if platform pay (Google Pay / Apple Pay) is supported on this device
  useEffect(() => {
    const checkPlatformPay = async () => {
      if (stripeAvailable && isPlatformPaySupported) {
        try {
          const supported = await isPlatformPaySupported();
          setPlatformPayAvailable(supported);
          console.log('🔵 Platform Pay (Google Pay / Apple Pay) supported:', supported);
        } catch (e) {
          console.log('Platform Pay check failed:', e);
          setPlatformPayAvailable(false);
        }
      }
    };
    checkPlatformPay();
  }, [isPlatformPaySupported]);

  // Initialize payment sheet when modal becomes visible
  useEffect(() => {
    if (visible) {
      if (isExpoGo || !stripeAvailable) {
        // Show message that Stripe doesn't work in Expo Go
        Alert.alert(
          'Development Mode',
          `Stripe payments are not available.\n\nDebug: ${STRIPE_DEBUG_INFO}\n\nFor now, we'll simulate a successful payment.`,
          [
            { text: 'Cancel', onPress: onCancel, style: 'cancel' },
            {
              text: 'Simulate Payment',
              onPress: () => {
                // Simulate authorization (not capture) to match real flow
                onSuccess('simulated_payment_' + Date.now(), 'requires_capture', {
                  amount,
                  currency,
                  simulated: true,
                });
              }
            },
          ]
        );
        return;
      }
      initializePaymentSheet();
    } else {
      setPaymentSheetReady(false);
      setStatus('idle');
    }
  }, [visible]);

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);
      setStatus('creating');

      console.log('🔵 Creating Stripe payment intent:', {
        amount,
        currency,
        description,
        metadata,
      });

      // Create payment intent
      const paymentData = await createStripePaymentIntent(
        amount,
        currency,
        description,
        metadata
      );

      console.log('✅ Payment intent created:', {
        paymentIntentId: paymentData.paymentIntentId,
        customerId: paymentData.customerId,
      });

      // Save payment intent ID for later use in onSuccess
      setPaymentIntentId(paymentData.paymentIntentId);

      // Save client secret for platform pay
      setClientSecret(paymentData.clientSecret);

      // Check if we're using test/sandbox Stripe keys
      const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
      const isTestMode = stripePublishableKey.startsWith('pk_test_');

      console.log('🔵 Initializing payment sheet...');
      console.log('🔵 Test mode:', isTestMode, '| Preferred method:', preferredMethod);

      // Initialize payment sheet
      // Note: Google Pay and Apple Pay are disabled in test mode as they require
      // additional setup and may cause "Not Found" errors with sandbox credentials
      const paymentSheetConfig: any = {
        merchantDisplayName: 'Drift Carpool',
        customerId: paymentData.customerId,
        customerEphemeralKeySecret: paymentData.ephemeralKey,
        paymentIntentClientSecret: paymentData.clientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: '',
        },
        returnURL: 'drift://stripe/callback',
        // Style customization
        appearance: {
          colors: {
            primary: '#5d1289',
          },
        },
      };

      // Enable Apple Pay and Google Pay
      // In test mode, use testEnv: true for Google Pay
      paymentSheetConfig.applePay = {
        merchantCountryCode: 'US',
      };
      paymentSheetConfig.googlePay = {
        merchantCountryCode: 'US',
        currencyCode: currency.toUpperCase(),
        // Use test environment when using Stripe test keys
        testEnv: isTestMode,
      };
      console.log('🔵 Apple Pay and Google Pay enabled | Test mode:', isTestMode);

      const { error } = await initPaymentSheet(paymentSheetConfig);

      console.log('🔵 Payment sheet init result:', { error: error?.message || 'none' });

      if (error) {
        console.error('❌ Payment sheet init error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Payment sheet initialized');
      setPaymentSheetReady(true);
    } catch (error: any) {
      console.error('❌ Failed to initialize payment sheet:', error);
      onError(error);
    } finally {
      setLoading(false);
      setStatus('idle');
    }
  };

  const handlePayment = async () => {
    if (!paymentSheetReady) {
      Alert.alert('Please wait', 'Payment is still initializing...');
      return;
    }

    try {
      setLoading(true);
      setStatus('presenting');

      console.log('🌐 Presenting Stripe payment sheet...');

      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          console.log('❌ Payment cancelled by user');
          onCancel();
          return;
        }
        throw new Error(error.message);
      }

      setStatus('confirming');

      console.log('✅ Payment authorized successfully (requires capture)');

      // Payment is now AUTHORIZED but not captured (using capture_method: 'manual')
      // The actual capture happens when driver accepts the ride
      // Return the actual paymentIntentId and 'requires_capture' status
      onSuccess(paymentIntentId || 'unknown', 'requires_capture', {
        amount,
        currency,
      });
    } catch (error: any) {
      console.error('❌ Stripe payment error:', error);

      if (error.message?.includes('canceled') || error.message?.includes('cancelled')) {
        onCancel();
      } else {
        onError(error);
      }
    } finally {
      setLoading(false);
      setStatus('idle');
    }
  };

  // Handle Google Pay / Apple Pay directly using Platform Pay
  const handlePlatformPay = async () => {
    if (!clientSecret) {
      Alert.alert('Please wait', 'Payment is still initializing...');
      return;
    }

    if (!confirmPlatformPayPayment) {
      // Fallback to payment sheet if platform pay isn't available
      handlePayment();
      return;
    }

    try {
      setLoading(true);
      setStatus('presenting');

      console.log('🌐 Presenting Platform Pay (Google Pay / Apple Pay)...');

      // Check if we're using Stripe test keys
      const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
      const isTestMode = stripeKey.startsWith('pk_test_');

      const { error } = await confirmPlatformPayPayment(clientSecret, {
        googlePay: {
          testEnv: isTestMode, // Use test environment when using Stripe test keys
          merchantName: 'Drift Carpool',
          merchantCountryCode: 'US',
          currencyCode: currency.toUpperCase(),
          billingAddressConfig: {
            isRequired: false,
          },
        },
        applePay: {
          cartItems: [
            {
              label: description || 'Drift Carpool Ride',
              amount: amount.toFixed(2),
              paymentType: 'Immediate',
            },
          ],
          merchantCountryCode: 'US',
          currencyCode: currency.toUpperCase(),
        },
      });

      if (error) {
        if (error.code === 'Canceled') {
          console.log('❌ Platform Pay cancelled by user');
          onCancel();
          return;
        }
        throw new Error(error.message);
      }

      setStatus('confirming');
      console.log('✅ Platform Pay authorized successfully (requires capture)');

      // Payment is now AUTHORIZED but not captured (using capture_method: 'manual')
      onSuccess(paymentIntentId || 'unknown', 'requires_capture', {
        amount,
        currency,
        method: preferredMethod,
      });
    } catch (error: any) {
      console.error('❌ Platform Pay error:', error);

      if (error.message?.includes('canceled') || error.message?.includes('cancelled')) {
        onCancel();
      } else {
        // Check for specific Google Pay merchant errors
        const isGooglePayMerchantError =
          error.message?.includes('OR_BIBED') ||
          error.message?.includes('merchant') ||
          error.message?.includes('not supported') ||
          error.code === 'Failed';

        const errorTitle = isGooglePayMerchantError
          ? 'Google Pay Not Available'
          : 'Payment Method Unavailable';

        const errorMessage = isGooglePayMerchantError
          ? 'Google Pay is temporarily unavailable for this merchant. Please use a credit or debit card instead.'
          : `${preferredMethod === 'google_pay' ? 'Google Pay' : 'Apple Pay'} is not available. Would you like to pay with a card instead?`;

        // If platform pay fails, offer to use card payment
        Alert.alert(
          errorTitle,
          errorMessage,
          [
            { text: 'Cancel', onPress: onCancel, style: 'cancel' },
            { text: 'Pay with Card', onPress: handlePayment },
          ]
        );
      }
    } finally {
      setLoading(false);
      setStatus('idle');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'creating':
        return 'Preparing payment...';
      case 'presenting':
        return 'Processing payment...';
      case 'confirming':
        return 'Confirming payment...';
      default:
        return paymentSheetReady ? 'Ready to pay' : 'Initializing...';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.stripeLogo}>
              <Ionicons name="card" size={32} color={Colors.stripe} />
            </View>
            <Text style={styles.title}>Secure Payment</Text>
            {!loading && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onCancel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.gray[600]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Amount Display */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amount}>
              {currency} ${amount.toFixed(2)}
            </Text>
            {description && (
              <Text style={styles.description}>{description}</Text>
            )}
          </View>

          {/* Status Message */}
          {(loading || !paymentSheetReady) && (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color={Colors.stripe} />
              <Text style={styles.statusText}>{getStatusMessage()}</Text>
            </View>
          )}

          {/* Payment Info */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
            <Text style={styles.infoText}>
              Secure payment processed by Stripe. Your card details are encrypted and never stored on our servers.
            </Text>
          </View>

          {/* Accepted Payment Methods */}
          <View style={styles.cardsContainer}>
            <Text style={styles.cardsLabel}>Accepted Payment Methods</Text>
            <View style={styles.cardsRow}>
              <View style={[styles.cardBadge, styles.walletBadge]}>
                <Ionicons name="logo-apple" size={14} color={Colors.black} />
                <Text style={styles.cardText}>Pay</Text>
              </View>
              <View style={[styles.cardBadge, styles.googleBadge]}>
                <Ionicons name="logo-google" size={14} color={Colors.white} />
                <Text style={[styles.cardText, styles.googleText]}>Pay</Text>
              </View>
            </View>
            <View style={[styles.cardsRow, { marginTop: 8 }]}>
              <View style={styles.cardBadge}>
                <Text style={styles.cardText}>Visa</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.cardText}>Mastercard</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.cardText}>Amex</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.cardText}>Discover</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {!loading && paymentSheetReady && (
            <View style={styles.buttonContainer}>
              {/* Show Google Pay button if selected and supported */}
              {preferredMethod === 'google_pay' && platformPayAvailable && (
                <TouchableOpacity
                  style={[styles.payButton, styles.googlePayButton]}
                  onPress={handlePlatformPay}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={20} color={Colors.white} />
                  <Text style={styles.payButtonText}>Pay with Google Pay</Text>
                </TouchableOpacity>
              )}

              {/* Show Apple Pay button if selected and supported */}
              {preferredMethod === 'apple_pay' && platformPayAvailable && (
                <TouchableOpacity
                  style={[styles.payButton, styles.applePayButton]}
                  onPress={handlePlatformPay}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-apple" size={20} color={Colors.white} />
                  <Text style={styles.payButtonText}>Pay with Apple Pay</Text>
                </TouchableOpacity>
              )}

              {/* Show card payment button */}
              {(preferredMethod === 'card' || !platformPayAvailable) && (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={handlePayment}
                  activeOpacity={0.8}
                >
                  <Ionicons name="card" size={20} color={Colors.white} />
                  <Text style={styles.payButtonText}>Pay ${amount.toFixed(2)}</Text>
                </TouchableOpacity>
              )}

              {/* Alternative: Show "Or pay with card" when using platform pay */}
              {(preferredMethod === 'google_pay' || preferredMethod === 'apple_pay') && platformPayAvailable && (
                <TouchableOpacity
                  style={styles.alternativeButton}
                  onPress={handlePayment}
                  activeOpacity={0.7}
                >
                  <Ionicons name="card-outline" size={18} color={Colors.gray[600]} />
                  <Text style={styles.alternativeButtonText}>Or pay with card</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            This is a cost-sharing contribution for a private carpool ride.
          </Text>

          {/* Powered by Stripe */}
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Text style={styles.stripeText}>Stripe</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stripeLogo: {
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountContainer: {
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.black,
  },
  description: {
    fontSize: 13,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statusText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.success + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.gray[700],
    lineHeight: 18,
    marginLeft: 8,
  },
  cardsContainer: {
    marginBottom: 20,
  },
  cardsLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: 8,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cardBadge: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletBadge: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  googleBadge: {
    backgroundColor: '#4285F4',
  },
  cardText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  googleText: {
    color: Colors.white,
  },
  buttonContainer: {
    gap: 12,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: Colors.stripe,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googlePayButton: {
    backgroundColor: '#4285F4',
  },
  applePayButton: {
    backgroundColor: Colors.black,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  alternativeButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gray[100],
  },
  alternativeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
  poweredBy: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  poweredByText: {
    fontSize: 11,
    color: Colors.gray[400],
  },
  stripeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.stripe,
  },
});
