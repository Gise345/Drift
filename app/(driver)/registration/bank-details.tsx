import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { DriftButton } from '@/components/ui/DriftButton';
import { DriftInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

export default function BankDetails() {
  const router = useRouter();
  const { updateRegistrationData, setRegistrationStep } = useDriverStore();
  
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState('checking');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required';
    if (!bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (accountNumber.length < 8) newErrors.accountNumber = 'Account number must be at least 8 digits';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      updateRegistrationData({
        bankDetails: {
          accountHolderName: accountHolderName.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          routingNumber: routingNumber.trim(),
        },
      });
      setRegistrationStep(11);
      router.push('/(driver)/registration/review-application');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '71%' }]} />
        </View>
        <Text style={styles.progressText}>Step 10 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Bank Account</Text>
        <Text style={styles.subtitle}>
          Add your bank account to receive your earnings
        </Text>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Bank-level security</Text>
            <Text style={styles.securityText}>
              Your banking information is encrypted and stored securely
            </Text>
          </View>
        </View>

        {/* Account Holder Name */}
        <DriftInput
          label="Account Holder Name *"
          placeholder="John Smith"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          error={errors.accountHolderName}
        />

        {/* Bank Name */}
        <DriftInput
          label="Bank Name *"
          placeholder="Cayman National Bank"
          value={bankName}
          onChangeText={setBankName}
          error={errors.bankName}
        />

        {/* Account Number */}
        <DriftInput
          label="Account Number *"
          placeholder="Enter account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
          secureTextEntry
          error={errors.accountNumber}
        />

        {/* Routing Number */}
        <DriftInput
          label="Routing Number (if applicable)"
          placeholder="Optional"
          value={routingNumber}
          onChangeText={setRoutingNumber}
          keyboardType="number-pad"
        />

        {/* Account Type */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={accountType}
              onValueChange={setAccountType}
              style={styles.picker}
            >
              <Picker.Item label="Checking" value="checking" />
              <Picker.Item label="Savings" value="savings" />
            </Picker>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How payments work:</Text>
            <Text style={styles.infoText}>
              • You receive 81% of each rider's cost-sharing contribution{'\n'}
              • 19% platform service fee covers transaction fees (4%) and platform maintenance (15%){'\n'}
              • Payments are processed through PayPal{'\n'}
              • You'll receive detailed earning statements
            </Text>
          </View>
        </View>

        <DriftButton
          title="Continue"
          onPress={handleContinue}
          variant="black"
          icon={<Ionicons name="arrow-forward" size={20} color="white" />}
        />

        {/* Footer Note */}
        <Text style={styles.footerText}>
          By providing your bank details, you authorize Drift to deposit funds into this account.
        </Text>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  securityBadge: {
    flexDirection: 'row',
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.success + '30',
    gap: Spacing.md,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  securityText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  picker: {
    height: 50,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});