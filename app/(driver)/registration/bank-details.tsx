import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DriftButton } from '@/components/ui/DriftButton';
import { DriftInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

const WISE_WEBSITE = 'https://wise.com';
const WISE_IOS_APP = 'https://apps.apple.com/app/wise-ex-transferwise/id612261027';
const WISE_ANDROID_APP = 'https://play.google.com/store/apps/details?id=com.transferwise.android';

export default function BankDetails() {
  const router = useRouter();
  const { registrationData, updateRegistrationData, setRegistrationStep } = useDriverStore();

  // Initialize from saved data
  const savedBankDetails = registrationData?.bankDetails;

  const [wiseEmail, setWiseEmail] = useState(savedBankDetails?.accountHolderName || '');
  const [hasWiseAccount, setHasWiseAccount] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenWise = () => {
    Linking.openURL(WISE_WEBSITE);
  };

  const handleOpenAppStore = () => {
    const url = Platform.OS === 'ios' ? WISE_IOS_APP : WISE_ANDROID_APP;
    Linking.openURL(url);
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!wiseEmail.trim()) {
      newErrors.wiseEmail = 'Wise email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wiseEmail)) {
      newErrors.wiseEmail = 'Please enter a valid email';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      updateRegistrationData({
        bankDetails: {
          accountHolderName: wiseEmail.trim(),
          bankName: 'Wise',
          accountNumber: '',
          routingNumber: '',
        },
      });
      setRegistrationStep(11); // Moving to step 11 (review-application)
      router.push('/(driver)/registration/review-application');
    }
  };

  const handleSkip = () => {
    updateRegistrationData({
      bankDetails: {
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        routingNumber: '',
      },
    });
    setRegistrationStep(11); // Moving to step 11 (review-application)
    router.push('/(driver)/registration/review-application');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(driver)/registration/inspection');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '82%' }]} />
        </View>
        <Text style={styles.progressText}>Step 10 of 11</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Get Paid with Wise</Text>
        <Text style={styles.subtitle}>
          We use Wise (formerly TransferWise) to send your earnings quickly and securely.
        </Text>

        {/* Why Wise Card */}
        <View style={styles.wiseCard}>
          <View style={styles.wiseHeader}>
            <View style={styles.wiseLogo}>
              <Text style={styles.wiseLogoText}>wise</Text>
            </View>
            <Text style={styles.wiseTagline}>Fast, low-cost payments</Text>
          </View>
          <View style={styles.wiseBenefits}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Receive payments in USD or KYD</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Low transfer fees</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Withdraw to any local bank</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Free Wise debit card available</Text>
            </View>
          </View>
        </View>

        {/* Important Notice */}
        <View style={styles.importantCard}>
          <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
          <View style={styles.importantContent}>
            <Text style={styles.importantTitle}>This is how you'll get paid</Text>
            <Text style={styles.importantText}>
              All driver earnings are sent to your Wise account. You can then transfer to your local bank or use the Wise card directly.
            </Text>
          </View>
        </View>

        {/* Registration Steps */}
        {!hasWiseAccount && (
          <View style={styles.stepsSection}>
            <Text style={styles.stepsTitle}>Don't have a Wise account?</Text>
            <Text style={styles.stepsSubtitle}>It only takes about 5 minutes to set up:</Text>

            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>Download the Wise app or visit wise.com</Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>Create a personal account with your email</Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>Verify your identity (photo ID required)</Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>Come back and enter your Wise email below</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.linkButton} onPress={handleOpenWise}>
                <Ionicons name="globe-outline" size={20} color={Colors.primary} />
                <Text style={styles.linkButtonText}>Open wise.com</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton} onPress={handleOpenAppStore}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} />
                <Text style={styles.linkButtonText}>Get the App</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.haveAccountButton}
              onPress={() => setHasWiseAccount(true)}
            >
              <Text style={styles.haveAccountText}>I already have a Wise account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Email Input - Show when they have account */}
        {hasWiseAccount && (
          <View style={styles.emailSection}>
            <Text style={styles.emailLabel}>Enter your Wise account email</Text>
            <DriftInput
              label="Wise Email Address"
              placeholder="your.email@example.com"
              value={wiseEmail}
              onChangeText={setWiseEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.wiseEmail}
            />

            <View style={styles.emailNote}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.gray[500]} />
              <Text style={styles.emailNoteText}>
                This must match the email on your Wise account
              </Text>
            </View>

            <DriftButton
              title="Continue"
              onPress={handleContinue}
              variant="black"
              icon={<Ionicons name="arrow-forward" size={20} color="white" />}
            />

            <TouchableOpacity
              style={styles.backToStepsButton}
              onPress={() => setHasWiseAccount(false)}
            >
              <Text style={styles.backToStepsText}>I need to create a Wise account first</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skip Option */}
        <View style={styles.skipSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Add bank details later</Text>
          </TouchableOpacity>

          <Text style={styles.skipWarning}>
            Note: You won't be able to receive earnings until you add your Wise account details.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  wiseCard: {
    backgroundColor: '#9FE870',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  wiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  wiseLogo: {
    backgroundColor: '#000',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  wiseLogoText: {
    color: '#9FE870',
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  wiseTagline: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: '#000',
  },
  wiseBenefits: {
    gap: Spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    fontSize: Typography.fontSize.sm,
    color: '#000',
    fontWeight: '500',
  },
  importantCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: Spacing.md,
  },
  importantContent: {
    flex: 1,
  },
  importantTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  importantText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  stepsSection: {
    marginBottom: Spacing.xl,
  },
  stepsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  stepsSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.lg,
  },
  stepsList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepText: {
    fontSize: Typography.fontSize.base,
    color: Colors.black,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  linkButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  haveAccountButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  haveAccountText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  emailSection: {
    marginBottom: Spacing.xl,
  },
  emailLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  emailNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  emailNoteText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  backToStepsButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  backToStepsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textDecorationLine: 'underline',
  },
  skipSection: {
    marginTop: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[200],
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    color: Colors.gray[600],
  },
  skipWarning: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
    textAlign: 'center',
    lineHeight: 18,
  },
});
