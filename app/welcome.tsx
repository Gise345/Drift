/**
 * Drift Welcome Screen
 * Figma: 02_Welcome_Screen.png
 * 
 * Onboarding screen with app introduction
 * Shows branding and CTA buttons
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Drift</Text>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>Cayman's Private Carpool Network</Text>
          </View>
        </View>

        {/* Main Illustration */}
        <View style={styles.illustrationContainer}>
          {/* Placeholder - replace with actual illustration */}
          <View style={styles.illustrationPlaceholder}>
            <Text style={styles.illustrationEmoji}>🗺️</Text>
            <Text style={styles.illustrationEmoji}>👥</Text>
            <Text style={styles.illustrationEmoji}>🚗</Text>
          </View>
        </View>

        {/* Feature highlights */}
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="🚗"
            title="Share Rides"
            description="Connect with drivers heading your way"
          />
          <FeatureItem
            icon="💰"
            title="Split Costs"
            description="Share travel expenses privately"
          />
          <FeatureItem
            icon="🌍"
            title="Go Green"
            description="Reduce carbon footprint together"
          />
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <DriftButton
            title="Get Started"
            onPress={() => router.push('/(auth)/sign-up')}
            variant="black"
            size="large"
            icon={<ArrowRight />}
            style={styles.primaryButton}
          />

          <DriftButton
            title="I Have an Account"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="outline"
            size="large"
            style={styles.secondaryButton}
          />
        </View>

        {/* Legal notice */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
          <Text style={[styles.legalText, { marginTop: 8 }]}>
            🔒 Peer-to-peer platform • Not a taxi service
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Feature item component
function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },

  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },

  taglineContainer: {
    paddingHorizontal: Spacing.lg,
  },

  tagline: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    fontWeight: '500',
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: Spacing['3xl'],
  },

  illustrationPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },

  illustrationEmoji: {
    fontSize: 64,
  },

  // Features
  featuresContainer: {
    marginBottom: Spacing['3xl'],
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  featureIcon: {
    fontSize: 32,
    marginRight: Spacing.lg,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },

  featureDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 20,
  },

  // CTA Buttons
  ctaContainer: {
    marginBottom: Spacing.xl,
  },

  primaryButton: {
    marginBottom: Spacing.md,
  },

  secondaryButton: {
    marginBottom: Spacing.md,
  },

  // Legal
  legalContainer: {
    alignItems: 'center',
  },

  legalText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 18,
  },

  legalLink: {
    color: Colors.purple,
    fontWeight: '600',
  },
});