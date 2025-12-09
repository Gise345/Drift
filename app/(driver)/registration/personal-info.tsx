import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DriftButton } from '@/components/ui/DriftButton';
import { DriftInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useAuthStore } from '@/src/stores/auth-store';

export default function PersonalInfo() {
  const router = useRouter();
  const { registrationData, updateRegistrationData, setRegistrationStep } = useDriverStore();
  const { user } = useAuthStore();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to legal-consent if no navigation history
      router.replace('/(driver)/registration/legal-consent');
    }
  };

  // Initialize state from saved registration data
  const savedPersonalInfo = registrationData?.personalInfo;

  // Get email from auth store (from signup) - this should not be editable
  const userEmail = user?.email || savedPersonalInfo?.email || '';

  const [firstName, setFirstName] = useState(savedPersonalInfo?.firstName || '');
  const [lastName, setLastName] = useState(savedPersonalInfo?.lastName || '');
  const [phone, setPhone] = useState(savedPersonalInfo?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    savedPersonalInfo?.dateOfBirth ? new Date(savedPersonalInfo.dateOfBirth) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [street, setStreet] = useState(savedPersonalInfo?.address?.street || '');
  const [city, setCity] = useState(savedPersonalInfo?.address?.city || 'George Town');
  const [postalCode, setPostalCode] = useState(savedPersonalInfo?.address?.postalCode || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAge = (date: Date) => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    return age >= 21;
  };

  const validatePhone = (phone: string) => {
    return /^\+?1?[-.]?\(?345\)?[-.]?\d{3}[-.]?\d{4}$/.test(phone);
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    else if (!validatePhone(phone)) newErrors.phone = 'Invalid phone format';
    if (!validateAge(dateOfBirth)) newErrors.dateOfBirth = 'Must be 21 or older';
    if (!street.trim()) newErrors.street = 'Street address is required';
    if (!postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      updateRegistrationData({
        personalInfo: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: userEmail, // Use email from auth store
          phone: phone.trim(),
          dateOfBirth: dateOfBirth.toISOString(),
          gender: savedPersonalInfo?.gender || 'male',
          address: {
            street: street.trim(),
            city: city,
            postalCode: postalCode.trim(),
            country: 'Cayman Islands',
          },
        },
      });
      setRegistrationStep(4); // Moving to step 4 (vehicle-info)
      router.push('/(driver)/registration/vehicle-info');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '14%' }]} />
        </View>
        <Text style={styles.progressText}>Step 2 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>This information will be used to verify your identity</Text>

        {/* First Name */}
        <DriftInput
          label="First Name"
          placeholder="John"
          value={firstName}
          onChangeText={setFirstName}
          error={errors.firstName}
          variant="light"
        />

        {/* Last Name */}
        <DriftInput
          label="Last Name"
          placeholder="Smith"
          value={lastName}
          onChangeText={setLastName}
          error={errors.lastName}
          variant="light"
        />

        {/* Email - Display only (from signup) */}
        <View style={styles.emailContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.emailDisplay}>
            <Text style={styles.emailText}>{userEmail}</Text>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>
          <Text style={styles.emailHelper}>Email from your account</Text>
        </View>

        {/* Phone */}
        <DriftInput
          label="Phone Number"
          placeholder="+1-345-xxx-xxxx"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
          variant="light"
        />

        {/* Date of Birth */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.dateOfBirth && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {dateOfBirth.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.gray[600]} />
          </TouchableOpacity>
          {errors.dateOfBirth && (
            <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
          )}
          <Text style={styles.helperText}>You must be 21 or older to drive</Text>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setDateOfBirth(date);
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Address */}
        <Text style={styles.sectionTitle}>Address</Text>

        <DriftInput
          label="Street Address"
          placeholder="123 Main Street"
          value={street}
          onChangeText={setStreet}
          error={errors.street}
          variant="light"
        />

        <DriftInput
          label="City"
          placeholder="George Town"
          value={city}
          onChangeText={setCity}
          variant="light"
        />

        <DriftInput
          label="Postal Code"
          placeholder="KY1-1234"
          value={postalCode}
          onChangeText={setPostalCode}
          error={errors.postalCode}
          variant="light"
        />

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            This address will be used for verification purposes only and will not be shared with riders.
          </Text>
        </View>

        <DriftButton
          title="Continue"
          onPress={handleContinue}
          variant="black"
          icon={<Ionicons name="arrow-forward" size={20} color="white" />}
        />
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
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.black,
  },
  inputError: {
    borderColor: Colors.primary,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  emailContainer: {
    marginBottom: Spacing.lg,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  emailText: {
    fontSize: Typography.fontSize.base,
    color: Colors.black,
    flex: 1,
  },
  emailHelper: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
});