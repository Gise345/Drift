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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '@/src/stores/driver-store';
import { EarningsService, EarningsBreakdown } from '@/src/services/earnings.service';
import { TransactionService } from '@/src/services/transaction.service';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

const { width } = Dimensions.get('window');

type PeriodTab = 'today' | 'week' | 'month' | 'lastMonth' | '3months' | '6months' | '2025' | '2026';

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
  const [breakdown, setBreakdown] = useState<EarningsBreakdown>({
    grossFare: 0,
    driverShare: 0,
    platformFee: 0,
    tips: 0,
    totalDriverEarnings: 0,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);

  useEffect(() => {
    loadEarnings();
    loadWalletAndTrips();
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
          case 'lastMonth':
            data = await EarningsService.getLastMonthEarnings(driver.id);
            break;
          case '3months':
            data = await EarningsService.getThreeMonthsEarnings(driver.id);
            break;
          case '6months':
            data = await EarningsService.getSixMonthsEarnings(driver.id);
            break;
          case '2025':
            data = await EarningsService.getYearEarnings(driver.id, 2025);
            break;
          case '2026':
            data = await EarningsService.getYearEarnings(driver.id, 2026);
            break;
        }

        if (data) {
          setStats({
            amount: data.amount,
            trips: data.trips,
            hours: data.hours || 0,
            avgPerTrip: data.trips > 0 ? data.amount / data.trips : 0,
          });
          if (data.breakdown) {
            setBreakdown(data.breakdown);
          }
        }
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletAndTrips = async () => {
    if (!driver?.id) return;

    try {
      // Load wallet balance
      const balance = await TransactionService.getWalletBalance(driver.id);
      setWalletBalance(balance.available);

      // Load recent trips from Firestore using modular API
      const tripsRef = collection(db, 'trips');
      const tripsQuery = query(
        tripsRef,
        where('driverId', '==', driver.id),
        where('status', '==', 'COMPLETED'),
        orderBy('completedAt', 'desc'),
        limit(3)
      );
      const tripsSnapshot = await getDocs(tripsQuery);

      const trips = tripsSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        // Use finalCost or estimatedCost - driver gets 80% of fare + 100% of tips
        const tripFare = data.finalCost || data.estimatedCost || 0;
        const tip = data.tip || 0;
        const driverShare = tripFare * 0.80; // Driver gets 80% of trip fare
        return {
          id: doc.id,
          pickup: data.pickup?.address || 'Unknown',
          destination: data.destination?.address || 'Unknown',
          fare: driverShare + tip, // Driver earnings = 80% of fare + 100% of tips
          completedAt: data.completedAt?.toDate() || new Date(),
        };
      });

      setRecentTrips(trips);
    } catch (error) {
      console.error('Error loading wallet and trips:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadEarnings(), loadWalletAndTrips()]);
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
      case 'lastMonth':
        return 'Last Month';
      case '3months':
        return 'Last 3 Months';
      case '6months':
        return 'Last 6 Months';
      case '2025':
        return '2025';
      case '2026':
        return '2026';
      default:
        return '';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.gray[600] }}>
            Loading earnings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        {/* Period Selector - Scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodScrollView}
          contentContainerStyle={styles.periodScrollContent}
        >
          {([
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
            { key: 'lastMonth', label: 'Last Month' },
            { key: '3months', label: '3 Months' },
            { key: '6months', label: '6 Months' },
            { key: '2025', label: '2025' },
            { key: '2026', label: '2026' },
          ] as { key: PeriodTab; label: string }[]).map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodTab,
                activePeriod === period.key && styles.periodTabActive,
              ]}
              onPress={() => setActivePeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  activePeriod === period.key && styles.periodTabTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
            onPress={() => router.push('/(driver)/dashboard/wallet')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Wallet</Text>
            <Text style={styles.actionSubtitle}>CI${walletBalance.toFixed(2)}</Text>
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
            {/* Gross fare from riders */}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="people-outline" size={20} color={Colors.gray[500]} />
                <Text style={styles.breakdownLabel}>Rider Contributions</Text>
              </View>
              <Text style={styles.breakdownAmount}>CI${breakdown.grossFare.toFixed(2)}</Text>
            </View>

            {/* Platform fee deduction */}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="remove-circle-outline" size={20} color={Colors.error} />
                <Text style={styles.breakdownLabel}>Platform Fee (20%)</Text>
              </View>
              <Text style={[styles.breakdownAmount, { color: Colors.error }]}>-CI${breakdown.platformFee.toFixed(2)}</Text>
            </View>

            {/* Driver's share of fares */}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="cash-outline" size={20} color={Colors.success} />
                <Text style={styles.breakdownLabel}>Trip Earnings (80%)</Text>
              </View>
              <Text style={styles.breakdownAmount}>CI${breakdown.driverShare.toFixed(2)}</Text>
            </View>

            {/* Tips (100% to driver) */}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Ionicons name="heart-outline" size={20} color={Colors.primary} />
                <Text style={styles.breakdownLabel}>Tips (100% yours)</Text>
              </View>
              <Text style={[styles.breakdownAmount, { color: Colors.success }]}>+CI${breakdown.tips.toFixed(2)}</Text>
            </View>

            {/* Total driver earnings */}
            <View style={[styles.breakdownItem, styles.breakdownTotal]}>
              <Text style={styles.breakdownTotalLabel}>Your Total Earnings</Text>
              <Text style={styles.breakdownTotalAmount}>CI${breakdown.totalDriverEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>

          <View style={styles.metricsCard}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{driver?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.metricLabel}>Rating</Text>
              <View style={styles.metricStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.floor(driver?.rating || 5) ? 'star' : 'star-outline'}
                    size={12}
                    color={Colors.warning}
                  />
                ))}
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {driver?.totalTrips ? driver.totalTrips : '0'}
              </Text>
              <Text style={styles.metricLabel}>Total Trips</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                CI${stats.avgPerTrip.toFixed(2)}
              </Text>
              <Text style={styles.metricLabel}>Avg/Trip</Text>
            </View>
          </View>
        </View>

        {/* Recent Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <TouchableOpacity onPress={() => router.push('/(driver)/history/trips')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tripsCard}>
            {recentTrips.length > 0 ? (
              recentTrips.map((trip) => {
                const timeAgo = getTimeAgo(trip.completedAt);
                return (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.tripItem}
                    onPress={() => router.push(`/(driver)/history/trip-detail?id=${trip.id}`)}
                  >
                    <View style={styles.tripIcon}>
                      <Ionicons name="location" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.tripInfo}>
                      <Text style={styles.tripRoute} numberOfLines={1}>
                        {trip.pickup} → {trip.destination}
                      </Text>
                      <Text style={styles.tripTime}>{timeAgo}</Text>
                    </View>
                    <Text style={styles.tripEarning}>CI${trip.fare.toFixed(2)}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                <Text style={{ color: Colors.gray[600], fontSize: Typography.fontSize.sm }}>
                  No recent trips
                </Text>
              </View>
            )}
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

  // Period Selector - Scrollable
  periodScrollView: {
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
  },

  periodScrollContent: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },

  periodTab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    minWidth: 70,
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