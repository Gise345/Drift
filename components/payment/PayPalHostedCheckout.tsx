/**
 * PAYPAL ADVANCED HOSTED CHECKOUT
 * Opens PayPal's hosted checkout page in device browser
 * Supports: Credit/Debit Cards, PayPal Login, Apple Pay, Google Pay
 * 
 * NO WEBVIEW - Uses expo-web-browser instead
 * EXPO SDK 52 Compatible
 * 
 * Features:
 * ✅ Card payments WITHOUT PayPal account
 * ✅ PayPal button for users who want it  
 * ✅ Apple Pay / Google Pay
 * ✅ Opens in Safari/Chrome (more reliable)
 * ✅ Deep linking back to app
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
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { firebaseFunctions, firebaseAuth } from '@/src/config/firebase';

// Warm up browser for faster experience
WebBrowser.maybeCompleteAuthSession();

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
  paypal: '#0070BA',
};

interface PayPalHostedCheckoutProps {
  visible: boolean;
  amount: number;
  currency?: string;
  description: string;
  onSuccess: (orderId: string, payerId: string, details: any) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
  metadata?: any;
}

export function PayPalHostedCheckout({
  visible,
  amount,
  currency = 'USD',
  description,
  onSuccess,
  onCancel,
  onError,
  metadata,
}: PayPalHostedCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'processing' | 'verifying' | 'complete'>('idle');

  useEffect(() => {
    if (visible && status === 'idle') {
      initiatePayPalCheckout();
    }
  }, [visible]);

  // Handle deep link callback
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleDeepLink = ({ url }: { url: string }) => {
    console.log('🔗 Deep link received:', url);

    if (url.includes('drift://paypal/')) {
      if (url.includes('success')) {
        // Extract order ID from URL
        const urlObj = new URL(url);
        const orderId = urlObj.searchParams.get('token');
        const payerId = urlObj.searchParams.get('PayerID');
        
        if (orderId) {
          verifyPayment(orderId, payerId);
        }
      } else if (url.includes('cancel')) {
        console.log('❌ Payment cancelled via deep link');
        setStatus('idle');
        setLoading(false);
        onCancel();
      }
    }
  };

  const initiatePayPalCheckout = async () => {
    try {
      setStatus('creating');
      setLoading(true);

      const user = firebaseAuth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 Creating PayPal hosted checkout...');

      // Create order via Firebase Cloud Function
      const createHostedCheckout = firebaseFunctions.httpsCallable('createPayPalHostedCheckout');
      const result = await createHostedCheckout({
        amount,
        currency,
        description,
        metadata: metadata || {},
        // Deep link URLs for app return
        returnUrl: Linking.createURL('paypal/success'),
        cancelUrl: Linking.createURL('paypal/cancel'),
      });

      const data = result.data as any;

      if (!data.approvalUrl || !data.orderId) {
        throw new Error('Failed to create PayPal checkout');
      }

      console.log('✅ Checkout created:', data.orderId);
      console.log('🌐 Opening PayPal:', data.approvalUrl);

      setStatus('processing');

      // Open PayPal in device browser
      const browserResult = await WebBrowser.openBrowserAsync(data.approvalUrl, {
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: Colors.purple,
        toolbarColor: Colors.white,
        // iOS specific
        ...(Platform.OS === 'ios' && {
          readerMode: false,
        }),
      });

      console.log('📱 Browser result:', browserResult.type);

      // Handle browser close
      if (browserResult.type === 'cancel') {
        console.log('❌ User closed browser');
        setStatus('idle');
        setLoading(false);
        onCancel();
        return;
      }

      // If user completed payment, deep link will handle it
      // If dismiss happened, we need to check status
      if (browserResult.type === 'dismiss') {
        console.log('⏸️ Browser dismissed, checking payment status...');
        // Wait a bit for deep link, then check status
        setTimeout(() => {
          if (status === 'processing') {
            checkOrderStatus(data.orderId);
          }
        }, 2000);
      }

    } catch (error: any) {
      console.error('❌ PayPal checkout error:', error);
      setStatus('idle');
      setLoading(false);
      onError(error);
      
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to start PayPal checkout',
        [{ text: 'OK', onPress: onCancel }]
      );
    }
  };

  const verifyPayment = async (orderId: string, payerId: string | null) => {
    try {
      setStatus('verifying');
      console.log('🔍 Verifying payment:', orderId);

      // Capture the payment via Cloud Function
      const captureOrder = firebaseFunctions.httpsCallable('capturePayPalOrder');
      const result = await captureOrder({ orderId });

      const data = result.data as any;

      if (data.status === 'COMPLETED') {
        console.log('✅ Payment completed:', data);
        
        setStatus('complete');
        setLoading(false);

        // Success!
        onSuccess(orderId, payerId || data.payer?.payer_id || '', data);
      } else {
        throw new Error(`Payment status: ${data.status}`);
      }
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      setStatus('idle');
      setLoading(false);
      
      onError(error);
      
      Alert.alert(
        'Payment Verification Failed',
        'Unable to verify your payment. Please contact support if you were charged.',
        [{ text: 'OK', onPress: onCancel }]
      );
    }
  };

  const checkOrderStatus = async (orderId: string) => {
    try {
      console.log('🔍 Checking order status:', orderId);

      const getOrderStatus = firebaseFunctions.httpsCallable('getPayPalOrderStatus');
      const result = await getOrderStatus({ orderId });

      const data = result.data as any;

      if (data.status === 'APPROVED') {
        // User approved, now capture
        verifyPayment(orderId, data.payer?.payer_id);
      } else if (data.status === 'COMPLETED') {
        // Already captured
        setStatus('complete');
        setLoading(false);
        onSuccess(orderId, data.payer?.payer_id || '', data);
      } else {
        // Payment not completed
        console.log('⚠️ Payment not completed, status:', data.status);
        setStatus('idle');
        setLoading(false);
        onCancel();
      }
    } catch (error) {
      console.error('Error checking order status:', error);
      setStatus('idle');
      setLoading(false);
      onCancel();
    }
  };

  const handleClose = () => {
    if (loading) {
      Alert.alert(
        'Payment in Progress',
        'Please wait for the payment to complete.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive', 
          onPress: () => {
            setStatus('idle');
            onCancel();
          }
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          <View style={styles.body}>
            {/* PayPal Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.paypalLogo}>
                <Text style={styles.paypalLogoText}>PayPal</Text>
              </View>
            </View>

            {/* Amount Display */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Payment Amount</Text>
              <Text style={styles.amount}>
                {currency} ${amount.toFixed(2)}
              </Text>
              <Text style={styles.description}>{description}</Text>
            </View>

            {/* Status Messages */}
            <View style={styles.statusContainer}>
              <ActivityIndicator 
                size="large" 
                color={Colors.paypal} 
                style={styles.spinner}
              />
              
              {status === 'creating' && (
                <Text style={styles.statusText}>Setting up secure checkout...</Text>
              )}
              
              {status === 'processing' && (
                <>
                  <Text style={styles.statusText}>Complete your payment</Text>
                  <Text style={styles.statusSubtext}>
                    You can pay with card, PayPal, Apple Pay, or Google Pay
                  </Text>
                </>
              )}

              {status === 'verifying' && (
                <Text style={styles.statusText}>Verifying payment...</Text>
              )}
              
              {status === 'complete' && (
                <Text style={styles.statusTextSuccess}>Payment successful! ✓</Text>
              )}
            </View>

            {/* Payment Options Info */}
            <View style={styles.optionsBox}>
              <Text style={styles.optionsTitle}>Available Payment Methods</Text>
              
              <View style={styles.optionRow}>
                <Ionicons name="card-outline" size={24} color={Colors.gray[700]} />
                <Text style={styles.optionText}>Credit or Debit Card</Text>
              </View>

              <View style={styles.optionRow}>
                <Ionicons name="logo-paypal" size={24} color={Colors.paypal} />
                <Text style={styles.optionText}>PayPal Account (optional)</Text>
              </View>

              {Platform.OS === 'ios' && (
                <View style={styles.optionRow}>
                  <Ionicons name="logo-apple" size={24} color={Colors.gray[700]} />
                  <Text style={styles.optionText}>Apple Pay</Text>
                </View>
              )}

              {Platform.OS === 'android' && (
                <View style={styles.optionRow}>
                  <Ionicons name="logo-google" size={24} color={Colors.gray[700]} />
                  <Text style={styles.optionText}>Google Pay</Text>
                </View>
              )}
            </View>

            {/* Security Badge */}
            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.securityText}>
                Secured by PayPal - No account required
              </Text>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.gray[500]} />
              <Text style={styles.infoText}>
                You can enter your card details directly without creating a PayPal account
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  body: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paypalLogo: {
    backgroundColor: Colors.paypal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  paypalLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.paypal,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: 8,
  },
  statusTextSuccess: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'center',
  },
  optionsBox: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  optionText: {
    fontSize: 14,
    color: Colors.gray[700],
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.paypal + '10',
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[600],
    lineHeight: 20,
  },
});