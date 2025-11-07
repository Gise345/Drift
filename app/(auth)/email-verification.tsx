/**
 * Drift Email Verification Screen
 * 
 * Prompts users to verify their email
 * Allows resending verification email
 * Checks verification status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import {
  resendEmailVerification,
  checkEmailVerification,
  signOutUser,
} from '@/src/services/firebase-auth-service';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const email = params.email as string;

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const isVerified = await checkEmailVerification();
      
      if (isVerified) {
        Alert.alert(
          'Email Verified! ✅',
          'Your email has been successfully verified. You can now use all features of Drift.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Please check your email and click the verification link. It may take a few minutes to arrive.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      await resendEmailVerification();
      setResendTimer(60);
      Alert.alert(
        'Email Sent! ✉️',
        'A new verification email has been sent to your inbox.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You can sign in again after verifying your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOutUser();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const formatEmail = (email: string) => {
    if (!email) return '';
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Text style={styles.illustrationEmoji}>📧</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Check your inbox</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Next Steps:</Text>
          
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Open the email from Drift
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              Click the verification link
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              Return here and tap "I've Verified"
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <DriftButton
            title="I've Verified My Email"
            onPress={handleCheckVerification}
            variant="black"
            size="large"
            icon={checking ? undefined : <ArrowRight />}
            loading={checking}
            style={styles.verifyButton}
          />

          {/* Resend Button */}
          {resendTimer > 0 ? (
            <View style={styles.resendTimerContainer}>
              <Text style={styles.resendTimerText}>
                Resend available in {resendTimer}s
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleResendEmail}
              disabled={loading}
              style={styles.resendButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.purple} />
              ) : (
                <Text style={styles.resendButtonText}>
                  📨 Resend Verification Email
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>💡 Didn't receive the email?</Text>
          <Text style={styles.helpText}>
            • Check your spam/junk folder{'\n'}
            • Make sure {formatEmail(email)} is correct{'\n'}
            • Wait a few minutes and check again{'\n'}
            • Contact support if issues persist
          </Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>← Sign Out</Text>
        </TouchableOpacity>
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
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
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
    marginBottom: Spacing.xs,
  },

  email: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.purple,
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },

  illustrationEmoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },

  badge: {
    backgroundColor: Colors.purple + '15',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.purple,
  },

  // Instructions
  instructionsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  instructionsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.purple,
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },

  stepText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
  },

  // Actions
  actionsContainer: {
    gap: Spacing.md,
  },

  verifyButton: {
    marginBottom: Spacing.sm,
  },

  resendTimerContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },

  resendTimerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
  },

  resendButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },

  resendButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.purple,
    fontWeight: '600',
  },

  // Help Card
  helpCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  helpTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Spacing.sm,
  },

  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 20,
  },

  // Sign Out
  signOutButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.md,
  },

  signOutText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    fontWeight: '600',
  },
});