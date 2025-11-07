/**
 * Drift Sign Up Screen - Production Ready
 * Figma: 03_Register.png
 * 
 * Features:
 * - Email/Password registration with Firebase
 * - Google Sign-In integration
 * - Email verification flow
 * - Role selection (Rider/Driver)
 * - Real-time validation
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { DriftInput, PasswordInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  registerWithEmail,
  signInWithGoogle,
  RegistrationData,
  UserRole,
} from '@/src/services/firebase-auth-service';

export default function SignUpScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('RIDER');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
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

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }

    setLoading(true);

    try {
      const registrationData: RegistrationData = {
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        role: selectedRole,
      };

      const { user, needsVerification } = await registerWithEmail(registrationData);

      // Update app state
      setUser(user);

      // Show success message
      Alert.alert(
        'Registration Successful! 🎉',
        needsVerification
          ? 'A verification email has been sent to your inbox. Please verify your email to continue.'
          : 'Welcome to Drift!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (needsVerification) {
                router.push({
                  pathname: '/(auth)/email-verification',
                  params: { email: user.email },
                });
              } else {
                // Navigate to role selection or home
                if (selectedRole === 'DRIVER') {
                  router.replace('/(driver)/registration/legal-consent');
                } else {
                  router.replace('/(tabs)');
                }
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }

    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle(selectedRole);
      setUser(user);

      Alert.alert('Welcome! 🎉', 'Successfully signed in with Google', [
        {
          text: 'OK',
          onPress: () => {
            if (selectedRole === 'DRIVER') {
              router.replace('/(driver)/registration/legal-consent');
            } else {
              router.replace('/(tabs)');
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isFormValid =
    fullName.trim().length > 2 &&
    validateEmail(email) &&
    validatePassword(password) &&
    passwordsMatch &&
    acceptedTerms;

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
          <Text style={styles.title}>Create Account</Text>

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>I want to:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === 'RIDER' && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole('RIDER')}
                activeOpacity={0.7}
              >
                <Text style={styles.roleEmoji}>🚗</Text>
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === 'RIDER' && styles.roleButtonTextActive,
                  ]}
                >
                  Find Rides
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === 'DRIVER' && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole('DRIVER')}
                activeOpacity={0.7}
              >
                <Text style={styles.roleEmoji}>👤</Text>
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === 'DRIVER' && styles.roleButtonTextActive,
                  ]}
                >
                  Share Rides
                </Text>
              </TouchableOpacity>
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

          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password (min 6 characters)"
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: `${Math.min((password.length / 8) * 100, 100)}%`,
                      backgroundColor:
                        password.length >= 8
                          ? Colors.success
                          : password.length >= 6
                          ? Colors.warning
                          : Colors.error,
                    },
                  ]}
                />
              </View>
              <Text style={styles.strengthText}>
                {password.length >= 8
                  ? '✓ Strong password'
                  : password.length >= 6
                  ? '⚠ Medium strength'
                  : '✗ Weak password'}
              </Text>
            </View>
          )}

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            showValidation={confirmPassword.length > 0}
            isValid={!!passwordsMatch}
          />

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to Drift's{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <DriftButton
            title="Create Account"
            onPress={handleSignUp}
            variant="black"
            size="large"
            icon={<ArrowRight />}
            loading={loading}
            disabled={!isFormValid || loading}
            style={styles.signUpButton}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.gray[600]} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

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
              🔒 <Text style={styles.legalBold}>Peer-to-Peer Platform:</Text> Drift
              connects independent users for private carpooling. We're not a rideshare
              or taxi service.
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
    marginBottom: Spacing['2xl'],
  },

  // Role Selection
  roleSection: {
    marginBottom: Spacing.xl,
  },

  roleLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Spacing.md,
  },

  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingVertical: Spacing.md,
    gap: 8,
  },

  roleButtonActive: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purple + '10',
  },

  roleEmoji: {
    fontSize: 20,
  },

  roleButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
    fontWeight: '600',
  },

  roleButtonTextActive: {
    color: Colors.purple,
  },

  // Password Strength
  strengthContainer: {
    marginBottom: Spacing.md,
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

  // Terms Checkbox
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  checkboxActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },

  checkmark: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  termsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 20,
  },

  termsLink: {
    color: Colors.purple,
    fontWeight: '600',
  },

  signUpButton: {
    marginBottom: Spacing.lg,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[300],
  },

  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    fontWeight: '600',
  },

  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },

  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.error,
  },

  googleButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
    fontWeight: '600',
  },

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