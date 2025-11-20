import React, { useState } from 'react';
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
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';

// DEV MODE: Set to true to bypass payment for testing
const DEV_BYPASS_PAYMENT = true;

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
  type: 'card' | 'cash' | 'wallet';
  name: string;
  icon: string;
  details?: string;
  isDefault?: boolean;
}

export default function SelectPaymentScreen() {
  const router = useRouter();
  const { setSelectedPaymentMethod, estimatedCost, pickupLocation, destination, vehicleType, pricing, lockedContribution } = useCarpoolStore();
  const { createTrip, setCurrentTrip } = useTripStore();
  const { user } = useAuthStore();

  const [selectedPayment, setSelectedPayment] = useState<string>('card');
  const [loading, setLoading] = useState(false);

  // Production payment methods - Only real payment options
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      name: 'Credit/Debit Card',
      details: 'Visa, Mastercard, Amex',
      icon: '💳',
      isDefault: true,
    },
    {
      id: 'paypal',
      type: 'wallet',
      name: 'PayPal',
      details: 'Secure payment with PayPal',
      icon: '💰',
    },
    {
      id: 'apple-pay',
      type: 'wallet',
      name: 'Apple Pay',
      details: 'Quick and secure',
      icon: '',
    },
    {
      id: 'google-pay',
      type: 'wallet',
      name: 'Google Pay',
      details: 'Fast checkout',
      icon: 'G',
    },
  ];

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayment(paymentId);
  };

  const handleAddCard = () => {
    router.push('/(rider)/add-card');
  };

  const handleConfirmPayment = async () => {
    console.log('💳 Payment Confirmation Started');
    console.log('  DEV_BYPASS_PAYMENT:', DEV_BYPASS_PAYMENT);
    console.log('  selectedPayment:', selectedPayment);
    console.log('  user:', user?.id);
    console.log('  pickupLocation:', pickupLocation?.address);
    console.log('  destination:', destination?.address);
    console.log('  estimatedCost:', estimatedCost);

    // DEV MODE: Skip payment validation if bypass is enabled
    if (!DEV_BYPASS_PAYMENT && !selectedPayment) {
      console.log('❌ No payment selected');
      Alert.alert('Select Payment', 'Please select a payment method');
      return;
    }

    if (!user || !pickupLocation || !destination || !pricing || !lockedContribution) {
      console.log('❌ Missing required trip information');
      console.log('  user:', !!user);
      console.log('  pickupLocation:', !!pickupLocation);
      console.log('  destination:', !!destination);
      console.log('  pricing:', !!pricing);
      console.log('  lockedContribution:', lockedContribution);
      Alert.alert('Error', 'Missing required trip information. Please go back and recalculate pricing.');
      return;
    }

    setLoading(true);

    try {
      // Save payment method (use 'dev-bypass' if no payment selected in dev mode)
      const paymentMethodToUse = selectedPayment || 'dev-bypass';
      setSelectedPaymentMethod(paymentMethodToUse);

      console.log('💳 Payment method:', paymentMethodToUse);

      // DEV MODE: Show bypass notification
      if (DEV_BYPASS_PAYMENT && !selectedPayment) {
        console.log('🔧 DEV MODE: Bypassing payment selection');
      }

      // Create trip in Firebase with status "REQUESTED"
      console.log('📝 Creating trip in Firebase...');

      const tripData = {
        riderId: user.id,
        status: 'REQUESTED' as const,
        pickup: {
          address: pickupLocation.address || '',
          coordinates: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
          ...(pickupLocation.placeName && { placeName: pickupLocation.placeName }),
        },
        destination: {
          address: destination.address || '',
          coordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
          ...((destination as any).placeName && { placeName: (destination as any).placeName }),
        },
        vehicleType: vehicleType || 'standard',
        distance: pickupLocation.distance || 0,
        duration: pickupLocation.duration || 0,
        estimatedCost: lockedContribution, // Use locked contribution amount
        lockedContribution: lockedContribution, // Store locked contribution
        pricing: pricing, // Store full pricing data for reference
        paymentMethod: paymentMethodToUse,
        requestedAt: new Date(),
      };

      console.log('📝 Trip data:', JSON.stringify(tripData, null, 2));

      const tripId = await createTrip(tripData);

      console.log('✅ Trip created in Firebase:', tripId);

      // Navigate to finding driver screen
      console.log('🚗 Navigating to finding-driver screen...');
      router.push('/(rider)/finding-driver');
    } catch (error) {
      console.error('❌ Failed to create trip:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Error',
        `Failed to request ride. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Select Payment</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Zone-Based Pricing Display */}
          {pricing && lockedContribution && (
            <View style={styles.costCard}>
              <Text style={styles.costLabel}>Locked Contribution Amount</Text>
              <Text style={styles.costAmount}>
                CI${lockedContribution.toFixed(2)}
              </Text>
              <Text style={styles.costNote}>
                {pricing.displayText} • {pricing.isWithinZone ? 'Within-zone flat rate' : pricing.isAirportTrip ? 'Airport fixed rate' : 'Cross-zone trip'}
              </Text>
              <Text style={styles.costNote}>
                Amount locked at request time and cannot change
              </Text>
            </View>
          )}

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentCard,
                  selectedPayment === method.id && styles.paymentCardSelected,
                ]}
                onPress={() => handleSelectPayment(method.id)}
                activeOpacity={0.7}
              >
                <View style={styles.paymentIcon}>
                  <Text style={styles.paymentIconText}>{method.icon}</Text>
                </View>
                
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{method.name}</Text>
                  {method.details && (
                    <Text style={styles.paymentDetails}>{method.details}</Text>
                  )}
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                
                {selectedPayment === method.id && (
                  <View style={styles.selectedCheck}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Add New Card */}
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={handleAddCard}
            >
              <View style={styles.addCardIcon}>
                <Text style={styles.addCardIconText}>+</Text>
              </View>
              <Text style={styles.addCardText}>Add New Card</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Notice */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              💡 <Text style={styles.legalBold}>Peer-to-Peer Cost Sharing:</Text>
              {' '}Payments are optional contributions for shared expenses. Drift facilitates coordination only.
            </Text>
          </View>

          {/* DEV MODE Indicator */}
          {DEV_BYPASS_PAYMENT && (
            <View style={styles.devModeNotice}>
              <Text style={styles.devModeText}>
                🔧 DEV MODE: Payment validation is bypassed for testing
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!DEV_BYPASS_PAYMENT && !selectedPayment || loading) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmPayment}
            disabled={!DEV_BYPASS_PAYMENT && !selectedPayment || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Request Carpool</Text>
                <Text style={styles.confirmButtonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  backIcon: {
    fontSize: 24,
    color: Colors.black,
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
    paddingBottom: 120,
  },
  costCard: {
    backgroundColor: Colors.purple,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
  },
  costAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  costNote: {
    fontSize: 12,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.gray[50],
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIconText: {
    fontSize: 24,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  paymentDetails: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  defaultBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  selectedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 18,
    color: Colors.black,
    fontWeight: '700',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addCardIconText: {
    fontSize: 28,
    color: Colors.gray[600],
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  legalNotice: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.purple,
  },
  legalText: {
    fontSize: 12,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  legalBold: {
    fontWeight: '700',
    color: Colors.purple,
  },
  devModeNotice: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  devModeText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '600',
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
  confirmButtonArrow: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
});