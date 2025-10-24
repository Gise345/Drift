/**
 * Drift Sign Up Screen
 * Figma: 03_Register.png
 * 
 * User registration with phone number
 * Sends OTP for verification
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { DriftInput, PhoneInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return phone.replace(/\D/g, '').length >= 10;
  };

  const handleSignUp = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!phone || !validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement Firebase phone auth
      // Send OTP code
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to verification screen
      router.push({
        pathname: '/(auth)/verification',
        params: {
          phone: `${countryCode}${phone}`,
          type: 'register',
          name: fullName,
          email: email,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryCodePress = () => {
    Alert.alert('Country Code', 'Country picker coming soon');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>REGISTER</Text>

          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>
              Drift <Text style={styles.logoAccent}>🚗</Text>
            </Text>
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.illustrationText}>
                Join Cayman's Carpool Community
              </Text>
            </View>
          </View>

          {/* Form Fields */}
          <DriftInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            autoComplete="name"
            showValidation
            isValid={fullName.trim().length > 2}
          />

          <DriftInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            showValidation
            isValid={validateEmail(email)}
          />

          <PhoneInput
            value={phone}
            onChangeText={setPhone}
            countryCode={countryCode}
            onCountryCodePress={handleCountryCodePress}
            placeholder="373 299 3456"
          />

          {/* Terms Notice */}
          <View style={styles.termsNotice}>
            <Text style={styles.termsText}>
              By registering, you agree to Drift's{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Register Button */}
          <DriftButton
            title="Continue"
            onPress={handleSignUp}
            variant="black"
            size="large"
            icon={<ArrowRight />}
            loading={loading}
            style={styles.registerButton}
          />

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Disclaimer */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              🔒 <Text style={styles.legalBold}>Peer-to-Peer Platform:</Text>{' '}
              Drift connects independent users for private carpooling.
              We're not a rideshare or taxi service.
            </Text>
          </View>
        </ScrollView>
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

  scroll: {
    flex: 1,
  },

  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.sm,
  },

  // Back Button
  backButton: {
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },

  backIcon: {
    fontSize: 28,
    color: Colors.black,
  },

  // Title
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: 2,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  logo: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    color: Colors.black,
    marginBottom: Spacing.md,
  },

  logoAccent: {
    color: Colors.primary,
  },

  illustrationPlaceholder: {
    paddingVertical: Spacing.lg,
  },

  illustrationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },

  // Terms Notice
  termsNotice: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  termsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },

  termsLink: {
    color: Colors.purple,
    fontWeight: '600',
  },

  // Register Button
  registerButton: {
    marginBottom: Spacing.lg,
  },

  // Sign In Link
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },

  signInText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  signInLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.purple,
    fontWeight: '700',
  },

  // Legal Notice
  legalNotice: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  legalText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },

  legalBold: {
    fontWeight: '700',
    color: Colors.gray[800],
  },
});