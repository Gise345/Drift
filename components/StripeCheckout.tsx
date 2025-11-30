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

// Conditionally import useStripe - try to load it and check if it works
let useStripe: any = () => ({ initPaymentSheet: null, presentPaymentSheet: null });
let stripeAvailable = false;

// Always try to load Stripe in non-Expo Go builds
if (!isExpoGo) {
  try {
    const StripeModule = require('@stripe/stripe-react-native');
    if (StripeModule && StripeModule.useStripe) {
      useStripe = StripeModule.useStripe;
      stripeAvailable = true;
      console.log('✅ Stripe native module loaded successfully');
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
}: StripeCheckoutProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'presenting' | 'confirming'>('idle');
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);

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
                onSuccess('simulated_payment_' + Date.now(), 'succeeded', {
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

      // Initialize payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Drift Carpool',
        customerId: paymentData.customerId,
        customerEphemeralKeySecret: paymentData.ephemeralKey,
        paymentIntentClientSecret: paymentData.clientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: '',
        },
        returnURL: 'drift://stripe/callback',
      });

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

      console.log('✅ Payment completed successfully');

      // Get the payment intent ID from the initialization
      // The payment is already confirmed when presentPaymentSheet succeeds
      onSuccess('payment_completed', 'succeeded', {
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

          {/* Accepted Cards */}
          <View style={styles.cardsContainer}>
            <Text style={styles.cardsLabel}>Accepted Payment Methods</Text>
            <View style={styles.cardsRow}>
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
              <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayment}
                activeOpacity={0.8}
              >
                <Ionicons name="card" size={20} color={Colors.white} />
                <Text style={styles.payButtonText}>Pay ${amount.toFixed(2)}</Text>
              </TouchableOpacity>

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
  },
  cardText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[600],
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
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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
