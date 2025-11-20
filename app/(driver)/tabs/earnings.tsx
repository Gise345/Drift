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
import { EarningsService } from '@/src/services/earnings.service';
import { TransactionService } from '@/src/services/transaction.service';
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

  const loadWalletAndTrips = async () => {
    if (!driver?.id) return;

    try {
      // Load wallet balance
      const balance = await TransactionService.getWalletBalance(driver.id);
      setWalletBalance(balance.available);

      // Load recent trips from Firestore
      const firestore = require('@react-native-firebase/firestore').default;
      const tripsSnapshot = await firestore()
        .collection('trips')
        .where('driverId', '==', driver.id)
        .where('status', '==', 'completed')
        .orderBy('completedAt', 'desc')
        .limit(3)
        .get();

      const trips = tripsSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          pickup: data.pickup?.address || 'Unknown',
          destination: data.destination?.address || 'Unknown',
          fare: data.fare || 0,
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
            <TouchableOpacity onPress={() => router.push('/(driver)/dashboard/trips')}>
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