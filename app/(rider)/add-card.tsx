import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

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

export default function AddCardScreen() {
  const router = useRouter();
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [loading, setLoading] = useState(false);

  // Format card number (add spaces every 4 digits)
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text.replace(/\s/g, ''));
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    setExpiryDate(formatted);
  };

  const handleCvvChange = (text: string) => {
    // Only allow numbers, max 4 digits
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned.slice(0, 4));
  };

  const validateForm = (): boolean => {
    if (cardNumber.replace(/\s/g, '').length < 13) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return false;
    }
    if (cardHolder.trim().length < 3) {
      Alert.alert('Invalid Name', 'Please enter card holder name');
      return false;
    }
    if (expiryDate.length !== 5) {
      Alert.alert('Invalid Expiry', 'Please enter expiry date (MM/YY)');
      return false;
    }
    if (cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter CVV (3-4 digits)');
      return false;
    }
    return true;
  };

  const handleAddCard = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate API call to add card (integrate with PayPal)
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert('Success', 'Card added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add card. Please try again.');
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
              <Text style={styles.cardType}>💳 VISA</Text>
              <Text style={styles.cardNumberPreview}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>
                    {cardHolder || 'FULL NAME'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>
                    {expiryDate || 'MM/YY'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={Colors.gray[400]}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            {/* Card Holder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Holder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={Colors.gray[400]}
                value={cardHolder}
                onChangeText={setCardHolder}
                autoCapitalize="words"
              />
            </View>

            {/* Expiry & CVV Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={Colors.gray[400]}
                  value={expiryDate}
                  onChangeText={handleExpiryChange}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={Colors.gray[400]}
                  value={cvv}
                  onChangeText={handleCvvChange}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
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
                Your card information is encrypted and secure. We use PayPal for payment processing.
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
  cardPreview: {
    padding: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    aspectRatio: 1.586, // Standard credit card ratio
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
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.black,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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