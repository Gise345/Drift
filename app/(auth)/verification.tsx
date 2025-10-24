/**
 * Drift Verification Code Screen
 * Figma: 04_Verification_Code.png & 07_Verification_Code.png
 * 
 * OTP verification screen for phone number
 * Used for both registration and password reset
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

const CODE_LENGTH = 4;

export default function VerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setUser } = useAuthStore();
  
  const phone = params.phone as string;
  const type = params.type as 'register' | 'forgot-password';
  const name = params.name as string;
  const email = params.email as string;

  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<TextInput[]>([]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every(digit => digit !== '') && !loading) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const verificationCode = fullCode || code.join('');

    if (verificationCode.length !== CODE_LENGTH) {
      Alert.alert('Error', 'Please enter the complete verification code');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement Firebase phone verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (type === 'register') {
        // Create user account
        const mockUser = {
          id: 'user-' + Date.now(),
          email: email,
          name: name,
          phone: phone,
          roles: ['RIDER'],
          hasAcceptedTerms: true,
          rating: 5.0,
          createdAt: new Date(),
        };

        setUser(mockUser);
        Alert.alert('Success', 'Account created successfully!');
        router.replace('/(tabs)');
      } else {
        // Password reset flow
        router.push({
          pathname: '/(auth)/reset-password',
          params: { phone, code: verificationCode },
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setResendTimer(60);
    
    try {
      // TODO: Resend OTP code
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Verification code sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>VERIFICATION CODE</Text>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.illustrationEmoji}>📱</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            We've sent a verification code to
          </Text>
          <Text style={styles.phoneNumber}>{phone}</Text>

          {/* Code Inputs */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                ]}
                value={digit}
                onChangeText={value => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            {resendTimer > 0 ? (
              <Text style={styles.resendTimer}>
                Resend code in {resendTimer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendCode}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Button */}
          <DriftButton
            title="Verify"
            onPress={() => handleVerify()}
            variant="black"
            size="large"
            icon={<ArrowRight />}
            loading={loading}
            disabled={code.some(digit => !digit)}
            style={styles.verifyButton}
          />

          {/* Help Text */}
          <Text style={styles.helpText}>
            Didn't receive the code? Check your phone number or try resending.
          </Text>
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

  content: {
    flex: 1,
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
    marginBottom: Spacing['2xl'],
    letterSpacing: 2,
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  illustrationEmoji: {
    fontSize: 80,
  },

  // Description
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  phoneNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },

  // Code Inputs
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: Spacing.xl,
  },

  codeInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.black,
    backgroundColor: Colors.white,
  },

  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.gray[50],
  },

  // Resend
  resendContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  resendTimer: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
  },

  resendLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.purple,
    fontWeight: '700',
  },

  // Verify Button
  verifyButton: {
    marginBottom: Spacing.lg,
  },

  // Help Text
  helpText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 18,
  },
});