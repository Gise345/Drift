/**
 * Drift Sign In Screen
 * Figma: 05_Login.png
 * 
 * Login with phone number and password
 * Enhanced version with full functionality
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { PhoneInput, PasswordInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

export default function SignInScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validate inputs
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Implement Firebase auth
      const fullPhone = `${countryCode}${phone}`;
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock user data
      const mockUser = {
        id: 'user-123',
        email: `${phone}@drift.com`,
        name: 'Drift User',
        phone: fullPhone,
        roles: ['RIDER'],
        hasAcceptedTerms: true,
        rating: 5.0,
        createdAt: new Date(),
      };
      
      setUser(mockUser);
      router.replace('/');
    } catch (error) {
      Alert.alert('Login Failed', 'Please check your credentials and try again');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
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
          <Text style={styles.title}>LOGIN</Text>

          {/* Logo & Illustration */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>
              Drift <Text style={styles.logoAccent}>🚗</Text>
            </Text>
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.illustrationEmoji}>🗺️ 📍 🚗</Text>
            </View>
          </View>

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

          {/* Password Input */}
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <DriftButton
            title="Login"
            onPress={handleLogin}
            variant="black"
            size="large"
            icon={<ArrowRight />}
            loading={loading}
            style={styles.loginButton}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Options */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>📱</Text>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
          </View>

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
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    letterSpacing: 2,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  
  logo: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '800',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  
  logoAccent: {
    color: Colors.primary,
  },

  illustrationPlaceholder: {
    paddingVertical: Spacing['2xl'],
  },
  
  illustrationEmoji: {
    fontSize: 48,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing['2xl'],
    marginTop: -Spacing.sm,
  },
  
  forgotText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.black,
    fontWeight: '500',
  },

  loginButton: {
    marginBottom: Spacing.xl,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[300],
  },

  dividerText: {
    marginHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
    fontWeight: '600',
  },

  socialContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.xl,
  },

  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingVertical: Spacing.md,
    gap: 8,
  },

  socialIcon: {
    fontSize: 20,
  },

  socialText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
    fontWeight: '600',
  },

  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
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
  },
  
  legalText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },
});