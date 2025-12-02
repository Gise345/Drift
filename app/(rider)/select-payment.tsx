/**
 * SELECT PAYMENT SCREEN
 * Production implementation with Stripe integration
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
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { StripeCheckout } from '@/components/StripeCheckout';
import { StripeService, StripePaymentMethod } from '@/src/services/stripe.service';
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
  stripe: '#635BFF',
};

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
  const { setSelectedPaymentMethod, estimatedCost, pickupLocation, destination, vehicleType } = useCarpoolStore();
  const { createTrip, setCurrentTrip } = useTripStore();
  const { user } = useAuthStore();

  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stripeMethods, setStripeMethods] = useState<StripePaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const paymentProcessedRef = useRef(false);

  // Load saved Stripe payment methods
  useEffect(() => {
    loadPaymentMethods();
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user) return;

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

  // Production payment methods
  // Google Pay and Apple Pay are available through Stripe Payment Sheet
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
      details: 'Quick and secure via Stripe',
      icon: 'logo-apple',
      connected: true, // Available through Stripe Payment Sheet
    },
    {
      id: 'google-pay',
      type: 'google_pay',
      name: 'Google Pay',
      details: 'Fast checkout via Stripe',
      icon: 'logo-google',
      connected: true, // Available through Stripe Payment Sheet
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
    console.log('Email:', currentUser?.email);

    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        console.log('Token length:', token.length);
      } catch (error) {
        console.error('Failed to get token:', error);
      }
    } else {
      console.error('NO USER LOGGED IN!');
    }

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
    if (method && !method.connected && !selectedPayment.startsWith('card-') && !selectedPayment.startsWith('stripe-')) {
      Alert.alert('Coming Soon', `${method.name} integration coming soon!`);
      return;
    }

    // If any Stripe-based payment is selected (card, Google Pay, Apple Pay), show checkout
    // The Stripe Payment Sheet automatically shows all available payment methods
    if (selectedPayment === 'stripe-new' ||
        selectedPayment === 'apple-pay' ||
        selectedPayment === 'google-pay' ||
        selectedPayment.startsWith('card-')) {
      setShowStripeCheckout(true);
      return;
    }

    // Otherwise, create trip without payment (cash, etc.)
    await createTripRequest();
  };

  const createTripRequest = async (paymentDetails?: {
    paymentIntentId?: string;
    status?: string;
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
        riderName: user.name || 'Rider',
        riderPhoto: user.profilePhoto,
        riderProfileRating: user.rating || 5.0,
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
        distance: (pickupLocation as any).distance || 0,
        duration: (pickupLocation as any).duration || 0,
        estimatedCost: estimatedCost.max || 0,
        paymentMethod: paymentDetails?.paymentMethod || selectedPayment,
        ...(paymentDetails ? {
          paymentMethod: `stripe:${paymentDetails.paymentIntentId}`,
          paymentStatus: paymentDetails.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
        } : {}),
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
                  {selectedPayment === `card-${method.id}` && (
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

        {/* Stripe Checkout Modal */}
        {showStripeCheckout && estimatedCost && (
          <StripeCheckout
            visible={showStripeCheckout}
            amount={estimatedCost.max}
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
  stripeBg: {
    backgroundColor: Colors.stripe,
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
