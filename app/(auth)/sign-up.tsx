import React, { useState, useEffect } from 'react';
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
  ImageBackground,
  Image,
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
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Reset loading states when component mounts or re-mounts
  // This ensures the form is always usable even if a previous error left state in a bad place
  useEffect(() => {
    setLoading(false);
    setGoogleLoading(false);
  }, []);

  const validateEmail = (value: string) =>
    !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePassword = (value: string) => value.length >= 6;

  const handleSignUp = async () => {
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
      Alert.alert(
        'Error',
        'Please accept the Terms of Service and Privacy Policy to continue'
      );
      return;
    }

    if (!selectedGender) {
      Alert.alert('Error', 'Please select your gender to continue');
      return;
    }

    setLoading(true);

    try {
      const registrationData: RegistrationData = {
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        role: selectedRole,
        gender: selectedGender!,
      };

      const { user, needsVerification } = await registerWithEmail(registrationData);

      setUser(user);

      Alert.alert(
        'Registration Successful! 🎉',
        needsVerification
          ? 'A verification email has been sent to your inbox (check your spam folder if you don\'t see it). Please verify your email to continue.'
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
      Alert.alert(
        'Error',
        'Please accept the Terms of Service and Privacy Policy to continue'
      );
      return;
    }

    if (!selectedGender) {
      Alert.alert('Error', 'Please select your gender to continue');
      return;
    }

    // Prevent double-tap
    if (googleLoading || loading) {
      return;
    }

    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle(selectedRole, selectedGender);
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
      // Handle cancellation silently
      const errorMessage = error?.message || 'An error occurred';
      if (
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled') ||
        error?.code === '12501' ||
        error?.code === 'SIGN_IN_CANCELLED'
      ) {
        // User cancelled - don't show error
        console.log('Google sign-in cancelled by user');
      } else {
        Alert.alert('Google Sign-In Failed', errorMessage);
      }
    } finally {
      // ALWAYS reset loading state, no matter what happens
      setGoogleLoading(false);
    }
  };

  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;

  const isFormValid =
    fullName.trim().length > 2 &&
    validateEmail(email) &&
    validatePassword(password) &&
    !!passwordsMatch &&
    acceptedTerms &&
    selectedGender !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('@/assets/images/NeonPalms.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <Image
          source={require('@/assets/cayman-flag-faded.png')}
          style={styles.flag}
        />
        <View style={styles.overlay} />

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
            {/* Back */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require('@/assets/drift-logo-purple.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Create Your Drift Account</Text>
              <Text style={styles.subtitle}>
                Join Cayman&apos;s carpool movement as a rider or driver.
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
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
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleEmoji}>🚗</Text>
                    <Text
                      style={[
                        styles.roleButtonText,
                        selectedRole === 'RIDER' && styles.roleButtonTextActive,
                      ]}
                    >
                      Rider
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      selectedRole === 'DRIVER' && styles.roleButtonActive,
                    ]}
                    onPress={() => setSelectedRole('DRIVER')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleEmoji}>👤</Text>
                    <Text
                      style={[
                        styles.roleButtonText,
                        selectedRole === 'DRIVER' && styles.roleButtonTextActive,
                      ]}
                    >
                      Driver
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fields */}
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

              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${Math.min(
                            (password.length / 8) * 100,
                            100
                          )}%`,
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

              {/* Gender Selection */}
              <View style={styles.genderSection}>
                <Text style={styles.genderTitle}>Gender</Text>
                <Text style={styles.genderSubtitle}>
                  Required for safety features like women-only rides
                </Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      selectedGender === 'female' && styles.genderOptionSelected,
                    ]}
                    onPress={() => setSelectedGender('female')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.genderRadio,
                        selectedGender === 'female' && styles.genderRadioSelected,
                      ]}
                    >
                      {selectedGender === 'female' && (
                        <View style={styles.genderRadioInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.genderLabel,
                        selectedGender === 'female' && styles.genderLabelSelected,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      selectedGender === 'male' && styles.genderOptionSelected,
                    ]}
                    onPress={() => setSelectedGender('male')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.genderRadio,
                        selectedGender === 'male' && styles.genderRadioSelected,
                      ]}
                    >
                      {selectedGender === 'male' && (
                        <View style={styles.genderRadioInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.genderLabel,
                        selectedGender === 'male' && styles.genderLabelSelected,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  activeOpacity={0.8}
                  style={styles.checkboxTouchable}
                >
                  <View
                    style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}
                  >
                    {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to Drift&apos;s{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => router.push('/(rider)/terms')}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => router.push('/(rider)/privacy')}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>

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

              {/* Google */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color={Colors.gray[100]} />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legalNotice}>
              <Text style={styles.legalText}>
                🔒 <Text style={styles.legalBold}>Peer-to-Peer Platform:</Text> Drift
                connects independent users for private carpooling. Drift is not a
                rideshare or taxi service.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  flag: {
    position: 'absolute',
    left: -40,
    top: 60,
    width: 220,
    height: 220,
    opacity: 0.16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  backButton: {
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backIcon: {
    fontSize: 26,
    color: Colors.white,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 320,
    height: 110,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(10,10,20,0.9)',
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  roleSection: {
    marginBottom: Spacing.lg,
  },
  roleLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray[100],
    marginBottom: Spacing.sm,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  roleButtonActive: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purple + '30',
  },
  roleEmoji: {
    fontSize: 20,
  },
  roleButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[100],
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: Colors.white,
  },
  strengthContainer: {
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  strengthBar: {
    height: 4,
    backgroundColor: Colors.gray[800],
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
    color: Colors.gray[100],
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  checkboxTouchable: {
    padding: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.gray[500],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: Colors.gray[100],
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.purple[400] || Colors.purple,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
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
    color: Colors.gray[50],
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signInText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[100],
  },
  signInLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.purple[400] || Colors.purple,
    fontWeight: '700',
  },
  legalNotice: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  legalText: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalBold: {
    fontWeight: '700',
    color: Colors.gray[50],
  },
  // Gender Selection Styles
  genderSection: {
    marginBottom: Spacing.lg,
  },
  genderTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray[100],
    marginBottom: Spacing.xs,
  },
  genderSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.md,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
    gap: 10,
  },
  genderOptionSelected: {
    backgroundColor: Colors.purple + '30',
    borderColor: Colors.purple,
  },
  genderRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderRadioSelected: {
    borderColor: Colors.purple,
  },
  genderRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.purple,
  },
  genderLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    color: Colors.gray[100],
  },
  genderLabelSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});
