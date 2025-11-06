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

export default function PendingApproval() {
  const router = useRouter();

  const handleGoHome = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={60} color={Colors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.subtitle}>
          Thank you for applying to be a Drift driver
        </Text>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="hourglass-outline" size={24} color={Colors.warning} />
            <Text style={styles.statusTitle}>Under Review</Text>
          </View>
          <Text style={styles.statusText}>
            Your application is being reviewed by our team. This usually takes 24-48 hours.
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>What happens next:</Text>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.timelineDotActive]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Application Submitted</Text>
              <Text style={styles.timelineTime}>Just now</Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Document Verification</Text>
              <Text style={styles.timelineTime}>Within 24 hours</Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Background Check</Text>
              <Text style={styles.timelineTime}>1-2 business days</Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Final Approval</Text>
              <Text style={styles.timelineTime}>Within 48 hours</Text>
            </View>
          </View>
        </View>

        {/* Notification Info */}
        <View style={styles.notificationCard}>
          <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>We'll notify you</Text>
            <Text style={styles.notificationText}>
              You'll receive an email and push notification once your application is approved.
            </Text>
          </View>
        </View>

        {/* What to prepare */}
        <View style={styles.prepareCard}>
          <Text style={styles.prepareTitle}>While you wait:</Text>
          <View style={styles.prepareItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.prepareText}>
              Make sure your vehicle is clean and ready
            </Text>
          </View>
          <View style={styles.prepareItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.prepareText}>
              Review the Driver Handbook (link sent via email)
            </Text>
          </View>
          <View style={styles.prepareItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.prepareText}>
              Check that your insurance is up to date
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <DriftButton
          title="Return to Home"
          onPress={handleGoHome}
          variant="black"
        />

        {/* Footer */}
        <Text style={styles.footerText}>
          Questions? Contact us at{' '}
          <Text style={styles.footerLink}>support@driftcayman.com</Text>
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
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing['2xl'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '20',
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
  statusCard: {
    width: '100%',
    backgroundColor: Colors.warning + '15',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statusTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  timelineCard: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.white,
    marginTop: 2,
  },
  timelineDotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.gray[300],
    marginLeft: 9,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.xs,
  },
  timelineLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  timelineTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  notificationCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  notificationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  prepareCard: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  prepareTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  prepareItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  prepareText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});