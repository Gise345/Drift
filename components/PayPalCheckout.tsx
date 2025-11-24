/**
 * PAYPAL CHECKOUT - CORRECT IMPLEMENTATION
 * Following PayPal Android SDK Documentation
 * 
 * Opens checkout in BROWSER (not WebView)
 * Uses server-side order creation via Cloud Functions
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PayPalService } from '@/src/services/paypal.service';

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
  warning: '#F59E0B',
};

interface PayPalCheckoutProps {
  visible: boolean;
  amount: number;
  currency?: string;
  description: string;
  onSuccess: (orderId: string, captureId: string) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
  metadata?: any;
}

export function PayPalCheckout({
  visible,
  amount,
  currency = 'USD',
  description,
  onSuccess,
  onCancel,
  onError,
  metadata,
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'creating' | 'waiting' | 'capturing'>('idle');

  // Listen for deep link return from PayPal
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      console.log('📱 Deep link received:', event.url);

      // Check if this is a PayPal return URL
      if (event.url.includes('drift://paypal')) {
        try {
          // Parse URL parameters
          const url = new URL(event.url);
          const token = url.searchParams.get('token'); // PayPal order ID
          const PayerID = url.searchParams.get('PayerID');

          console.log('🔍 PayPal callback:', { token, PayerID });

          if (token && PayerID) {
            // User approved payment
            await handlePaymentApproval(token);
          } else if (event.url.includes('cancel')) {
            // User cancelled
            handlePaymentCancel();
          } else {
            throw new Error('Invalid PayPal callback URL');
          }
        } catch (error: any) {
          console.error('❌ Error handling PayPal callback:', error);
          onError(error);
        }
      }
    };

    // Subscribe to URL events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [currentOrderId]);

  /**
   * STEP 1: Create order and open browser checkout
   */
  const startPayment = async () => {
    try {
      setLoading(true);
      setStage('creating');

      console.log('💳 Starting PayPal payment flow...');

      // Create order via Cloud Function (server-side)
      const { orderId, approvalUrl } = await PayPalService.createOrder({
        amount,
        currency,
        description,
        metadata,
      });

      setCurrentOrderId(orderId);
      setStage('waiting');

      console.log('🌐 Opening browser for PayPal checkout...');

      // Open PayPal checkout in browser
      await PayPalService.openCheckout(approvalUrl);

      setLoading(false);

      // Modal stays open while waiting for user to complete in browser
    } catch (error: any) {
      console.error('❌ Payment start failed:', error);
      setLoading(false);
      setStage('idle');
      
      // Show user-friendly error
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to start PayPal checkout. Please try again.',
        [{ text: 'OK', onPress: () => onError(error) }]
      );
    }
  };

  /**
   * STEP 2: Handle payment approval from browser
   */
  const handlePaymentApproval = async (orderId: string) => {
    try {
      setStage('capturing');
      setLoading(true);

      console.log('✅ User approved payment, capturing order:', orderId);

      // Capture payment via Cloud Function
      await PayPalService.captureOrder(orderId);

      console.log('💰 Payment captured successfully');

      // Get capture details from Firestore
      const status = await PayPalService.getOrderStatus(orderId);

      if (status === 'COMPLETED') {
        setLoading(false);
        setStage('idle');
        onSuccess(orderId, orderId); // In real app, get actual captureId
      } else {
        throw new Error(`Payment capture failed with status: ${status}`);
      }
    } catch (error: any) {
      console.error('❌ Payment capture failed:', error);
      setLoading(false);
      setStage('idle');
      onError(error);
    }
  };

  /**
   * Handle payment cancellation
   */
  const handlePaymentCancel = () => {
    console.log('❌ User cancelled payment');
    setLoading(false);
    setStage('idle');
    setCurrentOrderId(null);
    onCancel();
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (stage === 'waiting') {
      Alert.alert(
        'Payment In Progress',
        'A PayPal checkout is already open in your browser. Please complete or cancel it first.',
        [{ text: 'OK' }]
      );
    } else if (stage === 'capturing') {
      Alert.alert(
        'Processing Payment',
        'Please wait while we confirm your payment...',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Cancel Payment',
        'Are you sure you want to cancel this payment?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive', 
            onPress: () => {
              setCurrentOrderId(null);
              onCancel();
            }
          },
        ]
      );
    }
  };

  // Auto-start payment when modal opens
  useEffect(() => {
    if (visible && stage === 'idle') {
      startPayment();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={loading}
          >
            <Ionicons 
              name="close" 
              size={28} 
              color={loading ? Colors.gray[400] : Colors.gray[700]} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PayPal Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🚗</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Drift Carpool Payment</Text>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>{currency}</Text>
            <Text style={styles.amount}>${amount.toFixed(2)}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Status */}
          <View style={styles.statusContainer}>
            {loading && <ActivityIndicator size="large" color={Colors.purple} />}
            
            <Text style={styles.statusText}>
              {stage === 'creating' && 'Creating secure payment...'}
              {stage === 'waiting' && 'Complete payment in browser'}
              {stage === 'capturing' && 'Confirming payment...'}
              {stage === 'idle' && 'Ready to pay'}
            </Text>

            {stage === 'waiting' && (
              <View style={styles.instructionBox}>
                <Ionicons name="information-circle" size={20} color={Colors.warning} />
                <Text style={styles.instructionText}>
                  PayPal checkout has opened in your browser. Complete the payment and return here.
                </Text>
              </View>
            )}
          </View>

          {/* Retry Button */}
          {!loading && stage === 'waiting' && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={startPayment}
            >
              <Ionicons name="refresh" size={20} color={Colors.white} />
              <Text style={styles.retryButtonText}>Reopen PayPal</Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          {!loading && stage !== 'capturing' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handlePaymentCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel Payment</Text>
            </TouchableOpacity>
          )}

          {/* Secure Badge */}
          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={16} color={Colors.success} />
            <Text style={styles.secureText}>Secure payment powered by PayPal</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray[600],
    marginRight: 8,
  },
  amount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.purple,
  },
  description: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 32,
  },
  statusContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[700],
    textAlign: 'center',
    marginTop: 12,
  },
  instructionBox: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.purple,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[600],
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  secureText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
});