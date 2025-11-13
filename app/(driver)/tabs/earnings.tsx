/**
 * DRIVER EARNINGS SCREEN
 * Display earnings overview and analytics
 * 
 * Features:
 * - Today's earnings
 * - Weekly summary
 * - Monthly overview
 * - Earnings breakdown
 * - Trip statistics
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '@/src/stores/driver-store';
import { EarningsService } from '@/src/services/earnings.service';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

const { width } = Dimensions.get('window');

type PeriodTab = 'today' | 'week' | 'month';

interface EarningsStat {
  amount: number;
  trips: number;
  hours: number;
  avgPerTrip: number;
}

export default function DriverEarningsScreen() {
  const router = useRouter();
  const { driver, todayEarnings, todayTrips } = useDriverStore();

  const [activePeriod, setActivePeriod] = useState<PeriodTab>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<EarningsStat>({
    amount: 0,
    trips: 0,
    hours: 0,
    avgPerTrip: 0,
  });

  useEffect(() => {
    loadEarnings();
  }, [activePeriod]);

  const loadEarnings = async () => {
    try {
      setLoading(true);

      if (driver?.id) {
        let data;
        
        switch (activePeriod) {
          case 'today':
            data = await EarningsService.getTodayEarnings(driver.id);
            break;
          case 'week':
            data = await EarningsService.getWeeklyEarnings(driver.id);
            break;
          case 'month':
            data = await EarningsService.getMonthlyEarnings(driver.id);
            break;
        }

        if (data) {
          setStats({
            amount: data.amount,
            trips: data.trips,
            hours: data.hours || 0,
            avgPerTrip: data.trips > 0 ? data.amount / data.trips : 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const getPeriodLabel = () => {
    switch (activePeriod) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/(driver)/wallet/history')}
        >
          <Ionicons name="time-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['today', 'week', 'month'] as PeriodTab[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodTab,
                activePeriod === period && styles.periodTabActive,
              ]}
              onPress={() => setActivePeriod(period)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  activePeriod === period && styles.periodTabTextActive,
                ]}
              >
                {period === 'today' ? 'Today' : period === 'week' ? 'Week' : 'Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Earnings Card */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.earningsCard}
        >
          <Text style={styles.earningsLabel}>{getPeriodLabel()}'s Earnings</Text>
          <Text style={styles.earningsAmount}>${stats.amount.toFixed(2)}</Text>

          <View style={styles.earningsStats}>
            <View style={styles.earningStat}>
              <Ionicons name="car-sport" size={20} color={Colors.white} />
              <Text style={styles.earningStatValue}>{stats.trips}</Text>
              <Text style={styles.earningStatLabel}>Trips</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.earningStat}>
              <Ionicons name="time" size={20} color={Colors.white} />
              <Text style={styles.earningStatValue}>{stats.hours.toFixed(1)}</Text>
              <Text style={styles.earningStatLabel}>Hours</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.earningStat}>
              <Ionicons name="trending-up" size={20} color={Colors.white} />
              <Text style={styles.earningStatValue}>${stats.avgPerTrip.toFixed(2)}</Text>
              <Text style={styles.earningStatLabel}>Avg/Trip</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(driver)/wallet/balance')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Wallet</Text>
            <Text style={styles.actionSubtitle}>$0.00</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(driver)/wallet/payout')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="card-outline" size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionTitle}>Payout</Text>
            <Text style={styles.actionSubtitle}>Request</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="cash-outline" size={20} color={Colors.success} />
                <Text style={styles.breakdownLabel}>Trip Earnings</Text>
              </View>
              <Text style={styles.breakdownAmount}>${(stats.amount * 0.85).toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="gift-outline" size={20} color={Colors.info} />
                <Text style={styles.breakdownLabel}>Tips</Text>
              </View>
              <Text style={styles.breakdownAmount}>${(stats.amount * 0.10).toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="star-outline" size={20} color={Colors.warning} />
                <Text style={styles.breakdownLabel}>Bonuses</Text>
              </View>
              <Text style={styles.breakdownAmount}>${(stats.amount * 0.05).toFixed(2)}</Text>
            </View>

            <View style={[styles.breakdownItem, styles.breakdownTotal]}>
              <Text style={styles.breakdownTotalLabel}>Total Earnings</Text>
              <Text style={styles.breakdownTotalAmount}>${stats.amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>

          <View style={styles.metricsCard}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>4.9</Text>
              <Text style={styles.metricLabel}>Rating</Text>
              <View style={styles.metricStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={12}
                    color={Colors.warning}
                  />
                ))}
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>95%</Text>
              <Text style={styles.metricLabel}>Accept Rate</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>98%</Text>
              <Text style={styles.metricLabel}>Complete Rate</Text>
            </View>
          </View>
        </View>

        {/* Recent Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <TouchableOpacity onPress={() => router.push('/(driver)/trips/completed')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tripsCard}>
            {[1, 2, 3].map((trip) => (
              <View key={trip} style={styles.tripItem}>
                <View style={styles.tripIcon}>
                  <Ionicons name="location" size={20} color={Colors.primary} />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripRoute}>George Town → Seven Mile Beach</Text>
                  <Text style={styles.tripTime}>2 hours ago</Text>
                </View>
                <Text style={styles.tripEarning}>$12.50</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },

  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    flex: 1,
  },

  historyButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    margin: Spacing.base,
    padding: 4,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },

  periodTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },

  periodTabActive: {
    backgroundColor: Colors.primary,
  },

  periodTabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
  },

  periodTabTextActive: {
    color: Colors.white,
  },

  // Main Earnings Card
  earningsCard: {
    margin: Spacing.base,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
  },

  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    opacity: 0.9,
  },

  earningsAmount: {
    fontSize: 48,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },

  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },

  earningStat: {
    alignItems: 'center',
    gap: Spacing.xs,
  },

  earningStatValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  earningStatLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
    opacity: 0.9,
  },

  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    gap: Spacing.md,
  },

  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },

  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: 4,
  },

  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },

  // Sections
  section: {
    margin: Spacing.base,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },

  seeAllText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
  },

  // Breakdown Card
  breakdownCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.sm,
  },

  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },

  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  breakdownLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
  },

  breakdownAmount: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },

  breakdownTotal: {
    borderBottomWidth: 0,
    paddingTop: Spacing.lg,
    borderTopWidth: 2,
    borderTopColor: Colors.gray[200],
  },

  breakdownTotalLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },

  breakdownTotalAmount: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },

  // Metrics Card
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    justifyContent: 'space-around',
    ...Shadows.sm,
  },

  metricItem: {
    alignItems: 'center',
  },

  metricValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: 4,
  },

  metricLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },

  metricStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },

  // Recent Trips
  tripsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },

  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },

  tripIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  tripInfo: {
    flex: 1,
  },

  tripRoute: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: 2,
  },

  tripTime: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },

  tripEarning: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
  },
});