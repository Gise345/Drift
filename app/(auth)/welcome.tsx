/**
 * WELCOME SCREEN - Updated
 * Removed "Continue with Google" button
 * Google Sign-In now only in sign-up and sign-in screens
 * 
 * EXPO SDK 52 Compatible
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/sign-up');
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.gradient}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="car-sport" size={60} color={Colors.white} />
          </View>
          <Text style={styles.logoText}>Drift</Text>
          <Text style={styles.tagline}>Cayman Private Carpool Network</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('@/assets/welcome-illustration.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.white} />
            <Text style={styles.featureText}>Safe & Verified</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="cash" size={24} color={Colors.white} />
            <Text style={styles.featureText}>Cost Sharing</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="people" size={24} color={Colors.white} />
            <Text style={styles.featureText}>Local Community</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <DriftButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="secondary"
            icon="arrow-forward"
            style={styles.primaryButton}
          />

          <DriftButton
            title="Sign In"
            onPress={handleSignIn}
            variant="outline"
            style={styles.secondaryButton}
          />

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  
  gradient: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  
  logoText: {
    fontSize: Typography.fontSize['4xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginTop: Spacing.md,
  },
  
  tagline: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  
  illustration: {
    width: width * 0.8,
    height: height * 0.3,
  },
  
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  
  feature: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  featureText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    textAlign: 'center',
  },
  
  ctaContainer: {
    marginBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  
  primaryButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  
  secondaryButton: {
    borderColor: Colors.white,
    borderWidth: 2,
  },
  
  termsText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  
  termsLink: {
    fontFamily: Typography.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
});