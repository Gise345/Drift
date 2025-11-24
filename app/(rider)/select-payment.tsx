/**
 * SELECT PAYMENT SCREEN
 * Production implementation with real PayPal integration
 * 
 * EXPO SDK 52 - Firebase + PayPal
 */

import React, { useState, useEffect } from 'react';
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
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { PayPalCheckout } from '@/components/PayPalCheckout';
import { PayPalService, PayPalPaymentMethod } from '@/src/services/paypal.service';
import { firebaseAuth } from '@/src/config/firebase';

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

interface PaymentMethod {
  id: string;
  type: 'paypal' | 'credit_card' | 'apple_pay' | 'google_pay';
  name: string;
  icon: string;
  details?: string;
  isDefault?: boolean;
  connected?: boolean;
}

export default function SelectPaymentScreen() {
  const router = useRouter();
  const { setSelectedPaymentMethod, estimatedCost, pickupLocation, destination, vehicleType } = useCarpoolStore();
  const { createTrip, setCurrentTrip } = useTripStore();
  const { user } = useAuthStore();

  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paypalMethods, setPaypalMethods] = useState<PayPalPaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [showPayPalCheckout, setShowPayPalCheckout] = useState(false);

  // Load saved PayPal payment methods
  useEffect(() => {
    loadPaymentMethods();
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user) return;

    try {
      setLoadingMethods(true);
      const methods = await PayPalService.getPaymentMethods(user.id);
      setPaypalMethods(methods);

      // Auto-select default method
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedPayment(`paypal-${defaultMethod.id}`);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  // Production payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'paypal-new',
      type: 'paypal',
      name: 'PayPal',
      details: 'Pay with your PayPal account',
      icon: 'logo-paypal',
      connected: true,
    },
    {
      id: 'apple-pay',
      type: 'apple_pay',
      name: 'Apple Pay',
      details: 'Quick and secure',
      icon: 'logo-apple',
      connected: false,
    },
    {
      id: 'google-pay',
      type: 'google_pay',
      name: 'Google Pay',
      details: 'Fast checkout',
      icon: 'logo-google',
      connected: false,
    },
  ];

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayment(paymentId);
  };

  const handleConfirmPayment = async () => {

      // ADD THIS DEBUG CODE
  console.log('🔍 Checking auth state...');
  const user = firebaseAuth.currentUser;
  console.log('🔍 User:', user?.uid);
  console.log('🔍 Email:', user?.email);
  
  if (user) {
    try {
      const token = await user.getIdToken();
      console.log('🔍 Token length:', token.length);
      console.log('🔍 Token preview:', token.substring(0, 50) + '...');
    } catch (error) {
      console.error('🔍 Failed to get token:', error);
    }
  } else {
    console.error('🔍 NO USER LOGGED IN!');
  }
  // END DEBUG CODE

    if (!selectedPayment) {
      Alert.alert('Select Payment', 'Please select a payment method');
      return;
    }

    if (!user || !pickupLocation || !destination || !estimatedCost) {
      Alert.alert('Error', 'Missing required trip information');
      return;
    }

    // For non-connected methods, show coming soon
    const method = paymentMethods.find(m => m.id === selectedPayment);
    if (method && !method.connected && !selectedPayment.startsWith('paypal-')) {
      Alert.alert('Coming Soon', `${method.name} integration coming soon!`);
      return;
    }

    // If PayPal is selected, show checkout
    if (selectedPayment === 'paypal-new' || selectedPayment.startsWith('paypal-')) {
      setShowPayPalCheckout(true);
      return;
    }

    // Otherwise, create trip without payment (cash, etc.)
    await createTripRequest();
  };

  const createTripRequest = async (paymentDetails?: {
    orderId?: string;
    payerId?: string;
    paymentMethod?: string;
  }) => {
    if (!user || !pickupLocation || !destination || !estimatedCost) return;

    setLoading(true);

    try {
      // Save payment method
      setSelectedPaymentMethod(paymentDetails?.paymentMethod || selectedPayment);

      // Create trip in Firebase with status "REQUESTED"
      const tripId = await createTrip({
        riderId: user.id,
        status: 'REQUESTED',
        pickup: {
          address: pickupLocation.address || '',
          coordinates: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
          placeName: (pickupLocation as any).placeName || pickupLocation.address || '',
        },
        destination: {
          address: destination.address || '',
          coordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
          placeName: (destination as any).placeName || destination.address || '',
        },
        vehicleType: vehicleType || 'standard',
        distance: (pickupLocation as any).distance || 0,
        duration: (pickupLocation as any).duration || 0,
        estimatedCost: estimatedCost.max || 0,
        paymentMethod: paymentDetails?.paymentMethod || selectedPayment,
        ...(paymentDetails ? {
          paymentDetails: {
            paypalOrderId: paymentDetails.orderId,
            paypalPayerId: paymentDetails.payerId,
          }
        } : {}),
        requestedAt: new Date(),
      });

      console.log('✅ Trip created in Firebase:', tripId);

      // Navigate to finding driver screen
      router.push('/rider/finding-driver');
    } catch (error) {
      console.error('❌ Failed to create trip:', error);
      Alert.alert('Error', 'Failed to request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalSuccess = async (orderId: string, payerId: string, details: any) => {
    console.log('✅ PayPal payment successful:', { orderId, payerId });

    setShowPayPalCheckout(false);

    // Save PayPal account if new
    if (user && details.payer?.email_address) {
      try {
        await PayPalService.addPaymentMethod(
          user.id,
          details.payer.email_address,
          paypalMethods.length === 0 // Set as default if first method
        );
        await loadPaymentMethods();
      } catch (error) {
        console.error('Error saving PayPal method:', error);
      }
    }

    // Create trip with payment details
    await createTripRequest({
      orderId,
      payerId,
      paymentMethod: 'paypal',
    });
  };

  const handlePayPalCancel = () => {
    console.log('❌ PayPal payment cancelled');
    setShowPayPalCheckout(false);
  };

  const handlePayPalError = (error: Error) => {
    console.error('❌ PayPal error:', error);
    setShowPayPalCheckout(false);
    Alert.alert('Payment Error', error.message || 'Failed to process payment');
  };

  if (loadingMethods) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>

          <Text style={styles.title}>Select Payment</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cost Summary */}
          <View style={styles.costCard}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Estimated Cost</Text>
              <Text style={styles.costValue}>
                CI${estimatedCost?.max?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <Text style={styles.costNote}>
              Final amount may vary based on actual distance
            </Text>
          </View>

          {/* Saved PayPal Methods */}
          {paypalMethods.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Saved PayPal Accounts</Text>
              {paypalMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentCard,
                    selectedPayment === `paypal-${method.id}` && styles.paymentCardSelected,
                  ]}
                  onPress={() => handleSelectPayment(`paypal-${method.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentLeft}>
                    <View style={[styles.iconContainer, styles.paypalBg]}>
                      <Ionicons name="logo-paypal" size={24} color={Colors.white} />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>PayPal</Text>
                      <Text style={styles.paymentDetails}>{method.email}</Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {selectedPayment === `paypal-${method.id}` && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  )}
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
                  method.type === 'paypal' && styles.paypalBg,
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
              {selectedPayment === method.id && method.connected && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              )}
            </TouchableOpacity>
          ))}

          {/* Legal Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.gray[600]} />
            <Text style={styles.disclaimerText}>
              This is a voluntary cost-sharing contribution for a private carpool ride, not a commercial fare. By proceeding, you agree to Drift's peer-to-peer terms of service.
            </Text>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedPayment || loading) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmPayment}
            disabled={!selectedPayment || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>
                  Confirm Payment Method
                </Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

       {/* PayPal Hosted Checkout Modal - Opens in Browser */}
        {showPayPalCheckout && estimatedCost && (
          <PayPalCheckout
            visible={showPayPalCheckout}
            amount={estimatedCost.max}
            currency="USD"
            description={`Drift Carpool: ${(pickupLocation as any)?.placeName || pickupLocation?.address || 'Pickup'} to ${(destination as any)?.placeName || destination?.address || 'Destination'}`}
            onSuccess={(orderId, captureId) => {
              handlePayPalSuccess(orderId, captureId, {});
            }}
            onCancel={handlePayPalCancel}
            onError={handlePayPalError}
            metadata={{
              userId: user?.id,
              pickup: (pickupLocation as any)?.placeName || pickupLocation?.address,
              destination: (destination as any)?.placeName || destination?.address,
              vehicleType,
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
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.gray[600],
  },
  costCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  costValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
  },
  costNote: {
    fontSize: 12,
    color: Colors.gray[500],
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
    marginTop: 8,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
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
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paypalBg: {
    backgroundColor: '#0070BA',
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  paymentDetails: {
    fontSize: 13,
    color: Colors.gray[600],
  },
  defaultBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  comingSoon: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[500],
    fontStyle: 'italic',
    marginTop: 2,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.gray[600],
    lineHeight: 16,
    marginLeft: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: Colors.black,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});