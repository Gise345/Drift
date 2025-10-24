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
  const { setSelectedPaymentMethod, estimatedCost } = useCarpoolStore();
  
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Mock payment methods (replace with real data from API/AsyncStorage)
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card1',
      type: 'card',
      name: 'Visa',
      details: '•••• 4242',
      icon: '💳',
      isDefault: true,
    },
    {
      id: 'cash',
      type: 'cash',
      name: 'Cash',
      details: 'Pay driver directly',
      icon: '💵',
    },
  ];

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayment(paymentId);
  };

  const handleAddCard = () => {
    router.push('/(rider)/add-card');
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) {
      Alert.alert('Select Payment', 'Please select a payment method');
      return;
    }

    setLoading(true);

    try {
      // Save payment method
      setSelectedPaymentMethod(selectedPayment);

      // Simulate finding drivers
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to finding driver screen
      router.push('/(rider)/finding-driver');
    } catch (error) {
      Alert.alert('Error', 'Failed to process. Please try again.');
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
          {/* Estimated Cost */}
          {estimatedCost && (
            <View style={styles.costCard}>
              <Text style={styles.costLabel}>Estimated Cost Share</Text>
              <Text style={styles.costAmount}>
                ${estimatedCost.min}-{estimatedCost.max} {estimatedCost.currency}
              </Text>
              <Text style={styles.costNote}>
                Final amount may vary based on actual route
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
    backgroundColor: Colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  costAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  costNote: {
    fontSize: 12,
    color: Colors.gray[600],
    textAlign: 'center',
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