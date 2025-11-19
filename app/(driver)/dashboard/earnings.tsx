import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

type TimeFrame = 'today' | 'week' | 'month';

export default function EarningsDashboard() {
  const router = useRouter();
  const { earnings, stats, balance } = useDriverStore();
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFrame>('today');

  const getEarningsForPeriod = () => {
    switch (selectedPeriod) {
      case 'today':
        return earnings.today;
      case 'week':
        return earnings.thisWeek;
      case 'month':
        return earnings.thisMonth;
    }
  };

  const currentEarnings = getEarningsForPeriod();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity onPress={() => router.push('/(driver)/dashboard/wallet')}>
          <Ionicons name="wallet-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <View style={styles.balanceAmount}>
            <Text style={styles.currencySymbol}>CI$</Text>
            <Text style={styles.balanceValue}>{balance.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.cashoutButton}
            onPress={() => router.push('/(driver)/dashboard/wallet')}
          >
            <Text style={styles.cashoutText}>Cash Out</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'today' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text
              style={[styles.periodText, selectedPeriod === 'today' && styles.periodTextActive]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}
            >
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={styles.summaryValue}>CI${currentEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee (18% for banking & maintenance)</Text>
            <Text style={styles.summaryFee}>-CI${(currentEarnings * 0.18).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Net Earnings</Text>
            <Text style={styles.totalValue}>CI${(currentEarnings * 0.82).toFixed(2)}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="car-outline" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.totalTrips}</Text>
            <Text style={styles.statLabel}>Trips Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="star" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.onlineHours}h</Text>
            <Text style={styles.statLabel}>Hours Online</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>
              {stats.acceptanceRate}%
            </Text>
            <Text style={styles.statLabel}>Accept Rate</Text>
          </View>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="cash-outline" size={20} color={Colors.success} />
                <Text style={styles.breakdownLabel}>Ride Earnings</Text>
              </View>
              <Text style={styles.breakdownValue}>CI${(currentEarnings * 0.85).toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="heart-outline" size={20} color={Colors.primary} />
                <Text style={styles.breakdownLabel}>Tips</Text>
              </View>
              <Text style={styles.breakdownValue}>CI${(currentEarnings * 0.10).toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="gift-outline" size={20} color={Colors.warning} />
                <Text style={styles.breakdownLabel}>Bonuses</Text>
              </View>
              <Text style={styles.breakdownValue}>CI${(currentEarnings * 0.05).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* All Time Stats */}
        <View style={styles.allTimeCard}>
          <Text style={styles.allTimeTitle}>All Time Earnings</Text>
          <Text style={styles.allTimeValue}>CI${earnings.allTime.toFixed(2)}</Text>
          <Text style={styles.allTimeSubtext}>
            Since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  balanceCard: {
    backgroundColor: Colors.purple,
    borderRadius: 20,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white + 'CC',
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.white,
    marginRight: Spacing.xs,
  },
  balanceValue: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '700',
    color: Colors.white,
  },
  cashoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  cashoutText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.purple,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  periodTextActive: {
    color: Colors.black,
  },
  summaryCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  summaryFee: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.error,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[300],
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  totalValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.success,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  breakdownSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  breakdownCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  breakdownValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  allTimeCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  allTimeTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  allTimeValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  allTimeSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
});