import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function Referrals() {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = 'DRIFT2024GJ';
  const referralLink = 'https://drift.ky/join/DRIFT2024GJ';
  const earnedFromReferrals = 300;
  const totalReferrals = 3;

  const referralHistory = [
    {
      id: '1',
      name: 'John Smith',
      status: 'active',
      earnings: 100,
      date: new Date(Date.now() - 86400000 * 5),
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      status: 'active',
      earnings: 100,
      date: new Date(Date.now() - 86400000 * 12),
    },
    {
      id: '3',
      name: 'Mike Davis',
      status: 'active',
      earnings: 100,
      date: new Date(Date.now() - 86400000 * 20),
    },
    {
      id: '4',
      name: 'Emma Wilson',
      status: 'pending',
      earnings: 0,
      date: new Date(Date.now() - 86400000 * 2),
    },
  ];

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Drift as a driver and earn CI$100! Use my code: ${referralCode}\n\n${referralLink}`,
        title: 'Join Drift',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer a Driver</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Earnings Summary */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsIcon}>
            <Ionicons name="gift" size={32} color={Colors.success} />
          </View>
          <Text style={styles.earningsLabel}>Total Earned from Referrals</Text>
          <Text style={styles.earningsAmount}>CI${earnedFromReferrals.toFixed(2)}</Text>
          <Text style={styles.earningsSubtext}>{totalReferrals} active referrals</Text>
        </View>

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it Works</Text>
          
          <View style={styles.stepsCard}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share Your Code</Text>
                <Text style={styles.stepDescription}>
                  Invite friends to become Drift drivers
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>They Sign Up</Text>
                <Text style={styles.stepDescription}>
                  Friend uses your code during registration
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Complete 20 Trips</Text>
                <Text style={styles.stepDescription}>
                  Your friend completes 20 trips within 30 days
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>You Both Earn!</Text>
                <Text style={styles.stepDescription}>
                  You get CI$100, they get CI$50 bonus
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Your Referral Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Share this code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{referralCode}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                <Ionicons
                  name={copiedCode ? 'checkmark-circle' : 'copy-outline'}
                  size={20}
                  color={copiedCode ? Colors.success : Colors.primary}
                />
                <Text style={styles.copyText}>{copiedCode ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={Colors.white} />
            <Text style={styles.shareButtonText}>Share Referral Link</Text>
          </TouchableOpacity>
        </View>

        {/* Referral History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral History</Text>
          
          {referralHistory.map((referral) => (
            <View key={referral.id} style={styles.referralCard}>
              <View style={styles.referralIcon}>
                <Ionicons name="person-circle" size={40} color={Colors.primary} />
              </View>
              <View style={styles.referralInfo}>
                <Text style={styles.referralName}>{referral.name}</Text>
                <Text style={styles.referralDate}>
                  {referral.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.referralRight}>
                {referral.status === 'active' ? (
                  <>
                    <Text style={styles.referralEarnings}>
                      +CI${referral.earnings}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  </>
                ) : (
                  <View style={[styles.statusBadge, styles.statusBadgePending]}>
                    <Text style={[styles.statusText, styles.statusTextPending]}>
                      Pending
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <View style={styles.termsCard}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <View style={styles.termsContent}>
              <Text style={styles.termsTitle}>Referral Terms</Text>
              <Text style={styles.termsText}>
                • Your friend must complete 20 trips within 30 days{'\n'}
                • Both accounts must be active and in good standing{'\n'}
                • Referral bonuses are paid after requirements are met{'\n'}
                • Limit 10 referrals per month
              </Text>
            </View>
          </View>
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
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  earningsCard: {
    backgroundColor: Colors.success + '15',
    borderRadius: 20,
    padding: Spacing.xl,
    margin: Spacing.xl,
    alignItems: 'center',
  },
  earningsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  earningsAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  earningsSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  stepsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: Colors.gray[300],
    marginLeft: 15,
    marginVertical: Spacing.sm,
  },
  codeCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  codeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  codeText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  copyText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
  },
  shareButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  referralIcon: {
    marginRight: Spacing.md,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  referralDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  referralRight: {
    alignItems: 'flex-end',
  },
  referralEarnings: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgePending: {
    backgroundColor: Colors.warning + '20',
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.success,
  },
  statusTextPending: {
    color: Colors.warning,
  },
  termsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: Spacing.md,
  },
  termsContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  termsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  termsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    lineHeight: 18,
  },
});