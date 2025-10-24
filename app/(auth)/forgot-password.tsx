/**
 * Drift Forgot Password Screen
 * Figma: 06_Forgot_Password.png
 * 
 * Password recovery initiation
 * Sends OTP to phone number
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
import { PhoneInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement Firebase phone verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      router.push({
        pathname: '/(auth)/verification',
        params: {
          phone: `${countryCode}${phone}`,
          type: 'forgot-password',
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
          <Text style={styles.title}>FORGOT PASSWORD</Text>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.illustrationEmoji}>🔐</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Enter your phone number and we'll send you a verification code to
            reset your password.
          </Text>

          {/* Phone Number Input */}
          <PhoneInput
            value={phone}
            onChangeText={setPhone}
            countryCode={countryCode}
            onCountryCodePress={handleCountryCodePress}
            placeholder="373 299 3456"
            keyboardType="phone-pad"
            maxLength={15}
          />

          {/* Send Code Button */}
          <DriftButton
            title="Send Code"
            onPress={handleSendCode}
            variant="black"
            size="large"
            icon={<ArrowRight />}
            loading={loading}
            style={styles.sendButton}
          />

          {/* Back to Login Link */}
          <View style={styles.backToLoginContainer}>
            <Text style={styles.backToLoginText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backToLoginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Help Notice */}
          <View style={styles.helpNotice}>
            <Text style={styles.helpText}>
              💡 <Text style={styles.helpBold}>Need Help?</Text>{'\n'}
              If you don't have access to this phone number, please contact our
              support team for assistance.
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
    justifyContent: 'center',
    minHeight: '100%',
  },

  backButton: {
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },

  backIcon: {
    fontSize: 28,
    color: Colors.black,
  },

  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    letterSpacing: 2,
  },

  illustrationContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  illustrationEmoji: {
    fontSize: 80,
  },

  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },

  sendButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },

  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  backToLoginText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  backToLoginLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.purple,
    fontWeight: '700',
  },

  helpNotice: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  helpText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },

  helpBold: {
    fontWeight: '700',
    color: Colors.gray[800],
  },
});