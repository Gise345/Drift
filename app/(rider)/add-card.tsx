import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

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

// Check if running in Expo Go (Stripe native modules not available)
// In EAS dev builds, appOwnership is 'standalone' or undefined
const isExpoGo = Constants.appOwnership === 'expo';

// Only import Stripe components in development builds
let CardField: any = null;
let useConfirmSetupIntent: any = null;
let stripeAvailable = false;

// Always try to load Stripe in non-Expo Go builds
if (!isExpoGo) {
  try {
    const StripeModule = require('@stripe/stripe-react-native');
    if (StripeModule && StripeModule.CardField) {
      CardField = StripeModule.CardField;
      useConfirmSetupIntent = StripeModule.useConfirmSetupIntent;
      stripeAvailable = true;
      console.log('✅ Stripe CardField loaded successfully');
    }
  } catch (e) {
    console.log('Stripe native module not available:', e);
  }
}

console.log('📱 Add Card - App ownership:', Constants.appOwnership, '| Stripe available:', stripeAvailable);

// Expo Go version of the screen
function ExpoGoAddCardScreen() {
  const router = useRouter();
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAddCard = async () => {
    Alert.alert(
      'Development Mode',
      'Stripe CardField is not available in Expo Go. Please use a development build to test card saving.\n\nSimulating success...',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Add Card</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Expo Go Notice */}
          <View style={styles.expoGoNotice}>
            <Text style={styles.expoGoIcon}>⚠️</Text>
            <Text style={styles.expoGoTitle}>Development Mode</Text>
            <Text style={styles.expoGoText}>
              Stripe CardField requires a development build. In Expo Go, card entry is simulated.
            </Text>
            <Text style={styles.expoGoText}>
              To test real card functionality, run:{'\n'}
              <Text style={styles.codeText}>npx expo prebuild && npx expo run:android</Text>
            </Text>
          </View>

          {/* Simulated Card Preview */}
          <View style={styles.cardPreview}>
            <View style={styles.card}>
              <Text style={styles.cardType}>VISA</Text>
              <Text style={styles.cardNumberPreview}>•••• •••• •••• 4242</Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>TEST USER</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>12/25</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Set as Default */}
          <View style={styles.form}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setSetAsDefault(!setAsDefault)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, setAsDefault && styles.checkboxChecked]}>
                {setAsDefault && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Set as default payment method
              </Text>
            </TouchableOpacity>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>
                Your card information is encrypted and secure. We use Stripe for payment processing.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Add Card Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddCard}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.addButtonText}>Simulate Add Card</Text>
                <Text style={styles.addButtonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Development build version with real Stripe
function StripeAddCardScreen() {
  const router = useRouter();
  const { confirmSetupIntent } = useConfirmSetupIntent();

  const [cardDetails, setCardDetails] = useState<any>(null);
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleAddCard = async () => {
    if (!cardComplete) {
      Alert.alert('Invalid Card', 'Please enter valid card details');
      return;
    }

    setLoading(true);

    try {
      // Dynamic import for dev builds only
      const { createStripeSetupIntent, confirmStripeSetupIntent } = require('@/src/services/stripe.service');

      // Step 1: Create setup intent on backend
      const setupData = await createStripeSetupIntent();

      // Step 2: Confirm the setup intent with card details
      const { setupIntent, error } = await confirmSetupIntent(setupData.clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('Setup intent confirmation error:', error);
        Alert.alert('Error', error.message || 'Failed to save card');
        return;
      }

      if (setupIntent?.status === 'Succeeded') {
        // Step 3: Confirm on backend and optionally set as default
        await confirmStripeSetupIntent(setupData.setupIntentId, setAsDefault);

        Alert.alert('Success', 'Card added successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', `Card setup status: ${setupIntent?.status}`);
      }
    } catch (error: any) {
      console.error('Add card error:', error);
      Alert.alert('Error', error.message || 'Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Add Card</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card Preview */}
          <View style={styles.cardPreview}>
            <View style={styles.card}>
              <Text style={styles.cardType}>
                {cardDetails?.brand ? cardDetails.brand.toUpperCase() : 'CARD'}
              </Text>
              <Text style={styles.cardNumberPreview}>
                •••• •••• •••• {cardDetails?.last4 || '••••'}
              </Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>VALID</Text>
                  <Text style={styles.cardValue}>
                    {cardDetails?.expiryMonth && cardDetails?.expiryYear
                      ? `${String(cardDetails.expiryMonth).padStart(2, '0')}/${String(cardDetails.expiryYear).slice(-2)}`
                      : 'MM/YY'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>STATUS</Text>
                  <Text style={[styles.cardValue, cardComplete ? styles.statusValid : styles.statusInvalid]}>
                    {cardComplete ? 'VALID' : 'INCOMPLETE'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stripe CardField */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Details</Text>
              {CardField && (
                <CardField
                  postalCodeEnabled={false}
                  placeholders={{
                    number: '4242 4242 4242 4242',
                  }}
                  cardStyle={{
                    backgroundColor: Colors.white,
                    textColor: Colors.black,
                    borderColor: Colors.gray[300],
                    borderWidth: 1,
                    borderRadius: 12,
                    fontSize: 16,
                    placeholderColor: Colors.gray[400],
                  }}
                  style={styles.cardField}
                  onCardChange={(details: any) => {
                    setCardDetails(details);
                    setCardComplete(details.complete);
                  }}
                />
              )}
              <Text style={styles.cardHint}>
                Enter your card number, expiry date, and CVC
              </Text>
            </View>

            {/* Set as Default */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setSetAsDefault(!setAsDefault)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, setAsDefault && styles.checkboxChecked]}>
                {setAsDefault && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Set as default payment method
              </Text>
            </TouchableOpacity>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>
                Your card information is encrypted and secure. Card data is handled directly by Stripe and never touches our servers.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Add Card Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.addButton,
              (loading || !cardComplete) && styles.addButtonDisabled
            ]}
            onPress={handleAddCard}
            disabled={loading || !cardComplete}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.addButtonText}>Add Card</Text>
                <Text style={styles.addButtonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Export the correct component based on environment
export default function AddCardScreen() {
  // Always show Expo Go version if in Expo Go or if Stripe modules failed to load
  if (isExpoGo || !stripeAvailable || !CardField || !useConfirmSetupIntent) {
    return <ExpoGoAddCardScreen />;
  }

  return <StripeAddCardScreen />;
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
  expoGoNotice: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    alignItems: 'center',
  },
  expoGoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  expoGoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  expoGoText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    backgroundColor: '#FDE68A',
    padding: 4,
  },
  cardPreview: {
    padding: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    aspectRatio: 1.586,
    backgroundColor: Colors.purple,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardType: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  cardNumberPreview: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.7,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  statusValid: {
    color: Colors.primary,
  },
  statusInvalid: {
    color: '#FFA500',
  },
  form: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  cardHint: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[700],
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
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
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  addButton: {
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
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
  addButtonArrow: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
});
