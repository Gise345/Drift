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

export default function Approved() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Navigate to driver home with tabs
    router.replace('/(driver)/tabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon with Animation */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to Drift! 🎉</Text>
        <Text style={styles.subtitle}>
          Your application has been approved
        </Text>

        {/* Success Card */}
        <View style={styles.successCard}>
          <View style={styles.successHeader}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
            <Text style={styles.successTitle}>Verified Driver</Text>
          </View>
          <Text style={styles.successText}>
            You're all set to start sharing rides with the Drift community
          </Text>
        </View>

        {/* Driver ID Card */}
        <View style={styles.idCard}>
          <View style={styles.idHeader}>
            <Text style={styles.idLabel}>Driver ID</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idNumber}>DRV-{Math.floor(100000 + Math.random() * 900000)}</Text>
            </View>
          </View>
          <Text style={styles.idSubtext}>
            This is your unique Drift driver identification number
          </Text>
        </View>

        {/* Getting Started Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Getting Started:</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Go Online</Text>
              <Text style={styles.stepText}>
                Toggle your availability to start receiving ride requests
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Accept Requests</Text>
              <Text style={styles.stepText}>
                Review and accept carpool requests from riders nearby
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Rides</Text>
              <Text style={styles.stepText}>
                Navigate to pickup, complete trips, and earn
              </Text>
            </View>
          </View>
        </View>

        {/* Fee Structure Info */}
        <View style={styles.subscriptionCard}>
          <Ionicons name="card-outline" size={24} color={Colors.primary} />
          <View style={styles.subscriptionContent}>
            <Text style={styles.subscriptionTitle}>How You Earn</Text>
            <Text style={styles.subscriptionText}>
              You receive 81% of each rider's contribution. The 19% platform fee covers transaction processing (4%) and platform maintenance (15%).
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Pro Tips:</Text>
          <View style={styles.tipItem}>
            <Ionicons name="star" size={18} color={Colors.primary} />
            <Text style={styles.tipText}>Keep your vehicle clean and maintained</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="star" size={18} color={Colors.primary} />
            <Text style={styles.tipText}>Be friendly and professional with riders</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="star" size={18} color={Colors.primary} />
            <Text style={styles.tipText}>Drive safely and follow all traffic laws</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="star" size={18} color={Colors.primary} />
            <Text style={styles.tipText}>Communicate clearly with riders</Text>
          </View>
        </View>

        {/* CTA Button */}
        <DriftButton
          title="Go to Dashboard"
          onPress={handleGetStarted}
          variant="black"
          icon={<Ionicons name="arrow-forward" size={20} color="white" />}
        />

        {/* Support Link */}
        <Text style={styles.supportText}>
          Need help? Check out the{' '}
          <Text style={styles.supportLink}>Driver Handbook</Text> or{' '}
          <Text style={styles.supportLink}>Contact Support</Text>
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
    backgroundColor: Colors.success + '20',
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
    fontSize: Typography.fontSize.lg,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  successCard: {
    width: '100%',
    backgroundColor: Colors.success + '15',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  successTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  successText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  idCard: {
    width: '100%',
    backgroundColor: Colors.purple + '15',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.purple + '30',
  },
  idHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  idLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  idBadge: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  idNumber: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  idSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
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
    backgroundColor: Colors.primary,
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
  subscriptionCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  subscriptionContent: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  subscriptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  tipsCard: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  tipsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  supportText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  supportLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});