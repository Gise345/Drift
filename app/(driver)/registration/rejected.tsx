import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function Rejected() {
  const router = useRouter();

  const handleResubmit = () => {
    // Navigate back to review application
    router.push('/(driver)/registration/review-application');
  };

  const handleContactSupport = () => {
    // Navigate to support or open email
    router.push('/(driver)/support/contact');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="close-circle" size={80} color="#ef4444" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Application Not Approved</Text>
        <Text style={styles.subtitle}>
          We're unable to approve your driver application at this time
        </Text>

        {/* Rejection Card */}
        <View style={styles.rejectionCard}>
          <View style={styles.rejectionHeader}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.rejectionTitle}>Common Reasons</Text>
          </View>
          <Text style={styles.rejectionText}>
            Applications may not be approved for various reasons including:
          </Text>
          <View style={styles.reasonsList}>
            <Text style={styles.reasonItem}>• Incomplete or unclear documents</Text>
            <Text style={styles.reasonItem}>• Vehicle doesn't meet requirements</Text>
            <Text style={styles.reasonItem}>• Expired insurance or registration</Text>
            <Text style={styles.reasonItem}>• Information discrepancies</Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What you can do:</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review Your Application</Text>
              <Text style={styles.stepText}>
                Check all information and documents for accuracy and completeness
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Update Documents</Text>
              <Text style={styles.stepText}>
                Replace any expired or unclear documents with current versions
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Resubmit Application</Text>
              <Text style={styles.stepText}>
                Make corrections and submit your application again
              </Text>
            </View>
          </View>
        </View>

        {/* Support Card */}
        <View style={styles.supportCard}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportText}>
              Contact our support team for specific feedback about your application or if you 
              have questions about the rejection.
            </Text>
          </View>
        </View>

        {/* Appeal Info */}
        <View style={styles.appealCard}>
          <Text style={styles.appealTitle}>Right to Appeal</Text>
          <Text style={styles.appealText}>
            If you believe this decision was made in error, you have the right to appeal. 
            Contact support within 14 days with any additional information or documentation.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <DriftButton
            title="Resubmit Application"
            onPress={handleResubmit}
            variant="black"
            icon={<Ionicons name="refresh" size={20} color="white" />}
          />

          <DriftButton
            title="Contact Support"
            onPress={handleContactSupport}
            variant="outline"
            icon={<Ionicons name="mail-outline" size={20} color={Colors.black} />}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          We appreciate your interest in becoming a Drift driver. We encourage you to address 
          any issues and reapply.
        </Text>
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
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#fef2f2",
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: Spacing['2xl'],
    lineHeight: 24,
  },
  rejectionCard: {
    width: '100%',
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  rejectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  rejectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  reasonsList: {
    gap: Spacing.xs,
  },
  reasonItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stepsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  step: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.black,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  supportCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  supportText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  appealCard: {
    width: '100%',
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  appealTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  appealText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  buttonsContainer: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
});