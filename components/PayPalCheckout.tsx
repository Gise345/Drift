/**
 * PAYPAL CHECKOUT COMPONENT
 * Browser-based PayPal checkout modal
 * Opens PayPal in browser, handles deep link callbacks
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState } from 'react';
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
import { createPayPalOrder, openPayPalCheckout, capturePayPalPayment } from '@/src/services/paypal.service';

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
};

interface PayPalCheckoutProps {
  visible: boolean;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
  onSuccess: (orderId: string, captureId: string, details: any) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

export function PayPalCheckout({
  visible,
  amount,
  currency = 'USD',
  description,
  metadata,
  onSuccess,
  onCancel,
  onError,
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'opening' | 'capturing'>('idle');

  const handlePayment = async () => {
    try {
      setLoading(true);
      setStatus('creating');

      // Step 1: Create PayPal order
      console.log('🔵 Creating PayPal order via Cloud Function:', {
        amount,
        currency,
        description,
        metadata,
      });

      const order = await createPayPalOrder(amount, currency, description, metadata);

      console.log('✅ PayPal order created:', {
        orderId: order.orderId,
        approvalUrl: order.approvalUrl,
      });

      setStatus('opening');

      // Step 2: Open browser for PayPal checkout
      console.log('🌐 Opening browser for PayPal checkout...');
      const browserResult = await openPayPalCheckout(order.approvalUrl);
      console.log('✅ PayPal checkout opened');

      if (!browserResult.success) {
        throw new Error(browserResult.error || 'Payment cancelled');
      }

      setStatus('capturing');

      // Step 3: Capture the payment
      console.log('💰 Capturing PayPal payment...');
      const captureResult = await capturePayPalPayment(order.orderId);

      console.log('✅ Payment captured:', captureResult);

      // Step 4: Success callback
      onSuccess(captureResult.orderId, captureResult.captureId, captureResult);
    } catch (error: any) {
      console.error('❌ PayPal checkout error:', error);

      if (error.message?.includes('cancelled')) {
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
        return 'Creating PayPal order...';
      case 'opening':
        return 'Opening PayPal checkout...';
      case 'capturing':
        return 'Processing payment...';
      default:
        return 'Ready to pay with PayPal';
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
            <View style={styles.paypalLogo}>
              <Ionicons name="logo-paypal" size={32} color="#0070BA" />
            </View>
            <Text style={styles.title}>PayPal Checkout</Text>
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
          {loading && (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.statusText}>{getStatusMessage()}</Text>
            </View>
          )}

          {/* Payment Info */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
            <Text style={styles.infoText}>
              Secure payment processed by PayPal. You can pay with your PayPal account, credit/debit card, or other payment methods.
            </Text>
          </View>

          {/* Action Buttons */}
          {!loading && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayment}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-paypal" size={20} color={Colors.white} />
                <Text style={styles.payButtonText}>Pay with PayPal</Text>
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
  paypalLogo: {
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
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.gray[700],
    lineHeight: 18,
    marginLeft: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#0070BA',
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
});