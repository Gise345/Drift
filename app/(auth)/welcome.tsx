/**
 * Drift Welcome Screen - Professional Edition
 * Figma: 02_Welcome_Screen.png
 * 
 * Modern, professional welcome screen with:
 * - Drift logo display
 * - Smooth animations
 * - Professional design
 * - Clear CTAs
 * - FIXED NAVIGATION
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA', '#FFFFFF']}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('@/assets/images/drift-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              Cayman's Private Carpool Network
            </Text>
          </Animated.View>

          {/* Features Section */}
          <Animated.View
            style={[
              styles.featuresSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <FeatureCard
              emoji="🚗"
              title="Peer-to-Peer"
              description="Connect directly with local drivers"
            />
            <FeatureCard
              emoji="💰"
              title="Cost Sharing"
              description="Split journey costs fairly"
            />
            <FeatureCard
              emoji="🔒"
              title="Safe & Secure"
              description="Verified users and secure payments"
            />
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View
            style={[
              styles.ctaSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push('/(auth)/sign-up')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.purple, '#6B46C1']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                Sign In
              </Text>
            </TouchableOpacity>

            {/* Alternative sign-in options */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.socialButton]}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Legal Notice */}
          <View style={styles.footer}>
            <View style={styles.legalNotice}>
              <Text style={styles.legalIcon}>ℹ️</Text>
              <Text style={styles.legalText}>
                Drift is a peer-to-peer carpool platform.{'\n'}
                Not a taxi or ride-hailing service.
              </Text>
            </View>
            <Text style={styles.footerLinks}>
              <Text style={styles.link}>Terms</Text>
              {' • '}
              <Text style={styles.link}>Privacy</Text>
              {' • '}
              <Text style={styles.link}>Help</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Feature Card Component
function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconContainer}>
        <Text style={styles.featureEmoji}>{emoji}</Text>
      </View>
      <View style={styles.featureContent}>
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

  gradient: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['2xl'],
    justifyContent: 'space-between',
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },

  logo: {
    width: width * 0.6,
    height: 100,
    marginBottom: Spacing.lg,
  },

  tagline: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray[700],
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Features Section
  featuresSection: {
    gap: Spacing.md,
  },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.purple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  featureEmoji: {
    fontSize: 28,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },

  featureDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 18,
  },

  // CTA Section
  ctaSection: {
    gap: Spacing.md,
  },

  button: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },

  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },

  primaryButton: {
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  buttonArrow: {
    color: Colors.white,
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
  },

  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: Colors.gray[800],
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
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

  // Social Button
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },

  socialIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DB4437', // Google red
  },

  socialButtonText: {
    color: Colors.gray[800],
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
  },

  legalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },

  legalIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },

  legalText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 16,
  },

  footerLinks: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },

  link: {
    color: Colors.purple,
    fontWeight: '600',
  },
});