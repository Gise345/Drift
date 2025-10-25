/**
 * Drift Welcome Screen
 * Figma: 02_Welcome_Screen.png
 * 
 * Landing page for new users
 * Shows Get Started and Sign In options
 * Includes DEV BYPASS for quick testing
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  // DEV BYPASS - Remove in production!
  const handleDevBypass = () => {
    const mockUser = {
      id: 'dev-user-' + Date.now(),
      email: 'dev@drift.com',
      name: 'Dev User',
      phone: '+1-345-555-0100',
      roles: ['RIDER', 'DRIVER'],
      hasAcceptedTerms: true,
      rating: 5.0,
      createdAt: new Date(),
      verified: true,
    };
    
    setUser(mockUser);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Logo & Branding */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            Drift <Text style={styles.logoEmoji}>🚗</Text>
          </Text>
          <Text style={styles.tagline}>
            Cayman's Private Carpool Network
          </Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Text style={styles.illustrationEmoji}>🗺️ 🚗 💨</Text>
          <Text style={styles.illustrationText}>
            Connect with local drivers{'\n'}
            Share rides, split costs{'\n'}
            Build community
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          {/* DEV BYPASS BUTTON - Remove in production! */}
          <TouchableOpacity
            style={[styles.button, styles.devButton]}
            onPress={handleDevBypass}
            activeOpacity={0.8}
          >
            <Text style={styles.devButtonText}>🔧 DEV BYPASS</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legal Notice */}
        <View style={styles.legalNotice}>
          <Text style={styles.legalText}>
            🔒 Peer-to-peer platform. Not a taxi or rideshare service.
          </Text>
        </View>
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
    paddingTop: Spacing['3xl'],
  },

  logo: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '800',
    color: Colors.black,
    marginBottom: Spacing.md,
  },

  logoEmoji: {
    color: Colors.primary,
  },

  tagline: {
    fontSize: Typography.fontSize.lg,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },

  illustrationEmoji: {
    fontSize: 64,
    marginBottom: Spacing.xl,
  },

  illustrationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 28,
  },

  // Buttons
  buttonContainer: {
    gap: Spacing.md,
  },

  button: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // DEV BYPASS BUTTON - Remove in production!
  devButton: {
    backgroundColor: '#FF6B00',
    borderWidth: 2,
    borderColor: '#FF4500',
  },

  devButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
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

  primaryButton: {
    backgroundColor: Colors.black,
  },

  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },

  secondaryButton: {
    backgroundColor: 'transparent',
  },

  secondaryButtonText: {
    color: Colors.purple,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },

  // Legal
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