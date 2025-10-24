/**
 * Drift Reset Password Screen
 * Figma: 08_Reset_Password.png
 * 
 * Create new password after verification
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { PasswordInput, DriftInput } from '@/components/ui/DriftInput'; 
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const phone = params.phone as string;
  const code = params.code as string;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleResetPassword = async () => {
    // Validation
    if (!validatePassword(newPassword)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement Firebase password reset
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Success',
        'Your password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/sign-in'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordValid = validatePassword(newPassword);

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
          <Text style={styles.title}>RESET PASSWORD</Text>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.illustrationEmoji}>🔑</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Create a new password for{'\n'}
            <Text style={styles.phoneNumber}>{phone}</Text>
          </Text>

          {/* New Password Input */}
          <PasswordInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
          />

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: `${Math.min((newPassword.length / 8) * 100, 100)}%`,
                      backgroundColor:
                        newPassword.length >= 8
                          ? Colors.success
                          : newPassword.length >= 6
                          ? Colors.warning
                          : Colors.error,
                    },
                  ]}
                />
              </View>
              <Text style={styles.strengthText}>
                {newPassword.length >= 8
                  ? '✓ Strong password'
                  : newPassword.length >= 6
                  ? '⚠ Medium strength'
                  : '✗ Weak password'}
              </Text>
            </View>
          )}

          {/* Confirm Password Input */}
          <DriftInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry
            showValidation={confirmPassword.length > 0}
            isValid={!!passwordsMatch}
          />

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <RequirementItem
              text="At least 6 characters"
              met={newPassword.length >= 6}
            />
            <RequirementItem
              text="Passwords match"
              met={!!passwordsMatch}
            />
          </View>

          {/* Reset Button */}
          <DriftButton
            title="Reset Password"
            onPress={handleResetPassword}
            variant="black"
            size="large"
            icon={<ArrowRight />}
            loading={loading}
            disabled={!passwordValid || !passwordsMatch}
            style={styles.resetButton}
          />

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityText}>
              🔒 Your password is encrypted and secure. We recommend using a
              unique password that you don't use elsewhere.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Requirement item component
function RequirementItem({ text, met }: { text: string; met: boolean }) {
  return (
    <View style={styles.requirementItem}>
      <Text style={[styles.requirementIcon, met && styles.requirementIconMet]}>
        {met ? '✓' : '○'}
      </Text>
      <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
        {text}
      </Text>
    </View>
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
    marginBottom: Spacing.xl,
  },

  illustrationEmoji: {
    fontSize: 80,
  },

  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },

  phoneNumber: {
    fontWeight: '700',
    color: Colors.black,
  },

  // Password Strength
  strengthContainer: {
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
  },

  strengthBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },

  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },

  strengthText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },

  // Requirements
  requirementsContainer: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  requirementsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Spacing.sm,
  },

  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },

  requirementIcon: {
    fontSize: 16,
    color: Colors.gray[400],
    marginRight: Spacing.sm,
  },

  requirementIconMet: {
    color: Colors.success,
  },

  requirementText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  requirementTextMet: {
    color: Colors.gray[800],
    fontWeight: '500',
  },

  // Reset Button
  resetButton: {
    marginBottom: Spacing.xl,
  },

  // Security Notice
  securityNotice: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  securityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },
});