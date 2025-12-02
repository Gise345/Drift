import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';
import { useDriverStore } from '@/src/stores/driver-store';
import { loadRegistrationProgress } from '@/src/services/driver-registration.service';

/**
 * DRIVER WELCOME SCREEN
 *
 * Introduction to the Drift driver program
 * Highlights benefits and requirements
 * Entry point for driver registration
 *
 * UPDATED: Loads saved registration progress and redirects if in progress
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
  'Age 21 or older',
];

export default function DriverWelcome() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { loadSavedRegistrationProgress, setRegistrationStep } = useDriverStore();
  const [isCheckingProgress, setIsCheckingProgress] = useState(true);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [savedStep, setSavedStep] = useState(1);

  // Step route mapping
  const stepRoutes: { [key: number]: string } = {
    1: '/(driver)/registration/welcome',
    2: '/(driver)/registration/legal-consent',
    3: '/(driver)/registration/personal-info',
    4: '/(driver)/registration/vehicle-info',
    5: '/(driver)/registration/vehicle-photos',
    6: '/(driver)/registration/drivers-license',
    7: '/(driver)/registration/insurance',
    8: '/(driver)/registration/registration-cert',
    9: '/(driver)/registration/inspection',
    10: '/(driver)/registration/bank-details',
    11: '/(driver)/registration/review-application',
  };

  useEffect(() => {
    checkSavedProgress();
  }, [user?.id]);

  const checkSavedProgress = async () => {
    if (!user?.id) {
      setIsCheckingProgress(false);
      return;
    }

    try {
      const progress = await loadRegistrationProgress(user.id);
      if (progress && progress.currentStep > 1) {
        // User has saved progress beyond step 1
        setHasSavedProgress(true);
        setSavedStep(progress.currentStep);
        // Load progress into store
        await loadSavedRegistrationProgress(user.id);
      }
    } catch (error) {
      console.error('Error checking saved progress:', error);
    } finally {
      setIsCheckingProgress(false);
    }
  };

  const handleGetStarted = () => {
    setRegistrationStep(2); // Start at step 2 (legal consent)
    router.push('/(driver)/registration/legal-consent');
  };

  const handleContinueProgress = () => {
    const route = stepRoutes[savedStep] || '/(driver)/registration/legal-consent';
    router.push(route);
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading while checking progress
  if (isCheckingProgress) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking registration progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('@/assets/images/NeonPalms.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo and Sign Out */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            <Image
              source={require('@/assets/images/drift-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.driverBadge}>DRIVER</Text>
          </View>

          {/* Cayman Map */}
          <View style={styles.mapWrapper}>
            <Image
              source={require('@/assets/images/cayman-map.png')}
              style={styles.mapImage}
              resizeMode="contain"
            />
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
              color="rgba(255,255,255,0.7)"
              style={styles.infoIcon}
            />
            <Text style={styles.legalText}>
              Drift is a peer-to-peer carpool network. Drivers are independent individuals
              voluntarily sharing rides. This is not a taxi or for-hire service.
            </Text>
          </View>

          {/* CTA Buttons */}
          <View style={styles.ctaContainer}>
            {hasSavedProgress ? (
              <>
                <DriftButton
                  title={`Continue Registration (Step ${savedStep}/12)`}
                  onPress={handleContinueProgress}
                  variant="black"
                  icon={<Ionicons name="arrow-forward" size={20} color="white" />}
                />
                <DriftButton
                  title="Start Over"
                  onPress={handleGetStarted}
                  variant="outline"
                />
              </>
            ) : (
              <>
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
              </>
            )}
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
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginBottom: Spacing.md,
    gap: 6,
  },
  signOutText: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  logo: {
    width: 280,
    height: 100,
    marginBottom: Spacing.sm,
  },
  driverBadge: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapWrapper: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  mapImage: {
    width: 320,
    height: 130,
    opacity: 0.9,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.lg,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  benefitDescription: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  requirementsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
    marginLeft: Spacing.md,
  },
  legalNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: 'rgba(255,255,255,0.8)',
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
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
