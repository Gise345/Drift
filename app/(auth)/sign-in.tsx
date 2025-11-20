/**
 * Drift Sign In Screen - Production Ready with Google Sign-In
 * Figma: 05_Login.png
 * 
 * Features:
 * - Email/Password login with Firebase
 * - Google Sign-In integration (React Native Firebase)
 * - Password reset flow
 * - Remember me functionality
 * - Biometric authentication (future)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
import { signInWithEmail } from '@/src/services/firebase-auth-service';
import { signInWithGoogle } from '@/src/services/google-auth';

export default function SignInScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      const user = await signInWithEmail(email.trim().toLowerCase(), password);
      
      // Check if email is verified
      if (!user.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email address before signing in. Check your inbox for the verification link.',
          [
            {
              text: 'Resend Email',
              onPress: () => router.push({
                pathname: '/(auth)/email-verification',
                params: { email: user.email },
              }),
            },
            { text: 'OK' },
          ]
        );
        return;
      }

      // Update app state
      setUser(user);

      // Navigate based on user role
      if (user.roles.includes('DRIVER')) {
        router.replace('/(driver)/tabs');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      if (result.success && result.user) {
        // Update app state
        setUser({
          ...result.user,
          photoURL: result.user.photoURL || undefined,
        });

        // Navigate based on user role
        if (result.user.roles.includes('DRIVER')) {
          router.replace('/(driver)/tabs');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Google Sign-In Failed', result.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to Drift</Text>

          {/* Email Input */}
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

          {/* Password Input */}
          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
          />

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <DriftButton
            title="Sign In"
            onPress={handleLogin}
            variant="black"
            size="large"
            icon={<ArrowRight />}
            loading={loading}
            disabled={!validateEmail(email) || password.length < 6 || googleLoading}
            style={styles.loginButton}
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

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Notice */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              By continuing, you agree to Drift's peer-to-peer carpooling terms.
              We're not a taxi service.
            </Text>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              Need help? <Text style={styles.helpLink}>Contact Support</Text>
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
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    marginBottom: Spacing['2xl'],
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: -Spacing.sm,
  },

  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },

  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  rememberMeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },

  forgotText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.purple,
    fontWeight: '600',
  },

  loginButton: {
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

  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  
  signUpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  
  signUpLink: {
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
    marginBottom: Spacing.md,
  },
  
  legalText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },

  helpSection: {
    alignItems: 'center',
  },

  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  helpLink: {
    color: Colors.purple,
    fontWeight: '600',
  },
});