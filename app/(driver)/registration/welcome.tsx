import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

/**
 * DRIVER WELCOME SCREEN
 * 
 * Introduction to the Drift driver program
 * Highlights benefits and requirements
 * Entry point for driver registration
 */

interface Benefit {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: 'cash-outline',
    title: 'Earn on Your Schedule',
    description: 'Go online when you want. No minimum hours required.',
  },
  {
    icon: 'calendar-outline',
    title: 'Flexible Hours',
    description: 'Drive full-time, part-time, or just on weekends.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Safety First',
    description: 'Built-in safety features and 24/7 support.',
  },
  {
    icon: 'people-outline',
    title: 'Join the Community',
    description: 'Be part of Cayman\'s private carpool network.',
  },
];

const requirements: string[] = [
  'Valid driver\'s license',
  'Vehicle insurance',
  'Vehicle registration',
  'Clean background check',
  'Age 21 or older',
];

export default function DriverWelcome() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(driver)/registration/legal-consent');
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Drift</Text>
          <Text style={styles.driverBadge}>DRIVER</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>
            Drive with Drift
          </Text>
          <Text style={styles.subtitle}>
            Connect with your community and earn by sharing rides across the Cayman Islands
          </Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Ionicons
            name="car-sport-outline"
            size={120}
            color={Colors.primary}
          />
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Drive with Drift?</Text>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Ionicons
                  name={benefit.icon}
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>
                  {benefit.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.requirementsCard}>
            {requirements.map((requirement, index) => (
              <View key={index} style={styles.requirementRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.requirementText}>{requirement}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legal Notice */}
        <View style={styles.legalNotice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={Colors.gray[600]}
            style={styles.infoIcon}
          />
          <Text style={styles.legalText}>
            Drift is a peer-to-peer carpool network. Drivers are independent individuals
            voluntarily sharing rides. This is not a taxi or for-hire service.
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <DriftButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="black"
            icon={<Ionicons name="arrow-forward" size={20} color="white" />}
          />

          <DriftButton
            title="Already a driver? Sign In"
            onPress={handleSignIn}
            variant="outline"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to Drift's{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.purple,
    marginBottom: Spacing.xs,
  },
  driverBadge: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: Spacing['2xl'],
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  benefitDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  requirementsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  requirementText: {
    fontSize: Typography.fontSize.base,
    color: Colors.black,
    marginLeft: Spacing.md,
  },
  legalNotice: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  legalText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  ctaContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
});