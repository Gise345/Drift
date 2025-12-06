/**
 * ANALYTICS SCREEN
 * Shows platform statistics and insights
 *
 * ✅ UPGRADED TO React Native Firebase v22+ Modular API
 * ✅ Using 'main' database (restored from backup)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, query, where, getDocs, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface PlatformStats {
  totalRiders: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingDrivers: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  avgTripCost: number;
  avgRating: number;
}

interface TimeStats {
  today: { trips: number; revenue: number };
  yesterday: { trips: number; revenue: number };
  thisWeek: { trips: number; revenue: number };
  lastWeek: { trips: number; revenue: number };
  thisMonth: { trips: number; revenue: number };
  lastMonth: { trips: number; revenue: number };
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      await Promise.all([loadPlatformStats(), loadTimeStats()]);
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPlatformStats = async () => {
    try {
      // Get total riders
      const usersRef = collection(db, 'users');
      const ridersQuery = query(usersRef, where('roles', 'array-contains', 'RIDER'));
      const ridersSnapshot = await getDocs(ridersQuery);

      // Get total drivers
      const driversRef = collection(db, 'drivers');
      const driversSnapshot = await getDocs(driversRef);

      // Get active drivers (approved)
      const activeDriversQuery = query(driversRef, where('registrationStatus', '==', 'approved'));
      const activeDriversSnapshot = await getDocs(activeDriversQuery);

      // Get pending drivers
      const pendingDriversQuery = query(driversRef, where('registrationStatus', '==', 'pending'));
      const pendingDriversSnapshot = await getDocs(pendingDriversQuery);

      // Get all trips
      const tripsRef = collection(db, 'trips');
      const tripsSnapshot = await getDocs(tripsRef);

      // Calculate trip stats
      let completedTrips = 0;
      let cancelledTrips = 0;
      let totalRevenue = 0;
      let totalRating = 0;
      let ratingCount = 0;

      tripsSnapshot.docs.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = doc.data();
        if (data.status === 'COMPLETED') {
          completedTrips++;
          totalRevenue += data.finalCost || 0;
          if (data.rating) {
            totalRating += data.rating;
            ratingCount++;
          }
        } else if (data.status === 'CANCELLED') {
          cancelledTrips++;
        }
      });

      const platformStats: PlatformStats = {
        totalRiders: ridersSnapshot.size,
        totalDrivers: driversSnapshot.size,
        activeDrivers: activeDriversSnapshot.size,
        pendingDrivers: pendingDriversSnapshot.size,
        totalTrips: tripsSnapshot.size,
        completedTrips,
        cancelledTrips,
        totalRevenue,
        avgTripCost: completedTrips > 0 ? totalRevenue / completedTrips : 0,
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      };

      setStats(platformStats);
    } catch (error) {
      console.error('❌ Error loading platform stats:', error);
    }
  };

  const loadTimeStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const thisWeekStart = new Date(todayStart);
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get completed trips
      const tripsRef = collection(db, 'trips');
      const completedTripsQuery = query(tripsRef, where('status', '==', 'COMPLETED'));
      const tripsSnapshot = await getDocs(completedTripsQuery);

      const calculateStats = (startDate: Date, endDate: Date = now) => {
        let trips = 0;
        let revenue = 0;

        tripsSnapshot.docs.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = doc.data();
          const completedAt = data.completedAt?.toDate();
          if (completedAt && completedAt >= startDate && completedAt < endDate) {
            trips++;
            revenue += data.finalCost || 0;
          }
        });

        return { trips, revenue };
      };

      const timeStats: TimeStats = {
        today: calculateStats(todayStart),
        yesterday: calculateStats(yesterdayStart, todayStart),
        thisWeek: calculateStats(thisWeekStart),
        lastWeek: calculateStats(lastWeekStart, thisWeekStart),
        thisMonth: calculateStats(thisMonthStart),
        lastMonth: calculateStats(lastMonthStart, thisMonthStart),
      };

      setTimeStats(timeStats);
    } catch (error) {
      console.error('❌ Error loading time stats:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const getCurrentPeriodStats = () => {
    if (!timeStats) return { trips: 0, revenue: 0 };
    switch (timePeriod) {
      case 'today':
        return timeStats.today;
      case 'week':
        return timeStats.thisWeek;
      case 'month':
        return timeStats.thisMonth;
      default:
        return { trips: 0, revenue: 0 };
    }
  };

  const getPreviousPeriodStats = () => {
    if (!timeStats) return { trips: 0, revenue: 0 };
    switch (timePeriod) {
      case 'today':
        return timeStats.yesterday;
      case 'week':
        return timeStats.lastWeek;
      case 'month':
        return timeStats.lastMonth;
      default:
        return { trips: 0, revenue: 0 };
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const currentStats = getCurrentPeriodStats();
  const previousStats = getPreviousPeriodStats();
  const tripsChange = calculateChange(currentStats.trips, previousStats.trips);
  const revenueChange = calculateChange(currentStats.revenue, previousStats.revenue);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, timePeriod === 'today' && styles.periodButtonActive]}
            onPress={() => setTimePeriod('today')}
          >
            <Text style={[styles.periodText, timePeriod === 'today' && styles.periodTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, timePeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setTimePeriod('week')}
          >
            <Text style={[styles.periodText, timePeriod === 'week' && styles.periodTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, timePeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setTimePeriod('month')}
          >
            <Text style={[styles.periodText, timePeriod === 'month' && styles.periodTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="car-outline" size={24} color={Colors.primary} />
              <View
                style={[
                  styles.changeIndicator,
                  { backgroundColor: tripsChange >= 0 ? Colors.success + '20' : Colors.error + '20' },
                ]}
              >
                <Ionicons
                  name={tripsChange >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={tripsChange >= 0 ? Colors.success : Colors.error}
                />
                <Text
                  style={[
                    styles.changeText,
                    { color: tripsChange >= 0 ? Colors.success : Colors.error },
                  ]}
                >
                  {Math.abs(tripsChange).toFixed(1)}%
                </Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{currentStats.trips}</Text>
            <Text style={styles.metricLabel}>Trips</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="cash-outline" size={24} color={Colors.success} />
              <View
                style={[
                  styles.changeIndicator,
                  { backgroundColor: revenueChange >= 0 ? Colors.success + '20' : Colors.error + '20' },
                ]}
              >
                <Ionicons
                  name={revenueChange >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={revenueChange >= 0 ? Colors.success : Colors.error}
                />
                <Text
                  style={[
                    styles.changeText,
                    { color: revenueChange >= 0 ? Colors.success : Colors.error },
                  ]}
                >
                  {Math.abs(revenueChange).toFixed(1)}%
                </Text>
              </View>
            </View>
            <Text style={styles.metricValue}>CI${currentStats.revenue.toFixed(0)}</Text>
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>
        </View>

        {/* Platform Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: Colors.info + '20' }]}>
                <Ionicons name="people" size={28} color={Colors.info} />
              </View>
              <Text style={styles.overviewValue}>{stats?.totalRiders || 0}</Text>
              <Text style={styles.overviewLabel}>Total Riders</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="car-sport" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.overviewValue}>{stats?.activeDrivers || 0}</Text>
              <Text style={styles.overviewLabel}>Active Drivers</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: Colors.warning + '20' }]}>
                <Ionicons name="time" size={28} color={Colors.warning} />
              </View>
              <Text style={styles.overviewValue}>{stats?.pendingDrivers || 0}</Text>
              <Text style={styles.overviewLabel}>Pending Apps</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
              </View>
              <Text style={styles.overviewValue}>{stats?.completedTrips || 0}</Text>
              <Text style={styles.overviewLabel}>Completed Trips</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Statistics</Text>

          <View style={styles.statsList}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <Text style={styles.statValue}>CI${stats?.totalRevenue.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average Trip Cost</Text>
              <Text style={styles.statValue}>CI${stats?.avgTripCost.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Platform Rating</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={20} color={Colors.warning} />
                <Text style={styles.statValue}>{stats?.avgRating.toFixed(1) || '0.0'}</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Cancellation Rate</Text>
              <Text style={styles.statValue}>
                {stats?.totalTrips
                  ? ((stats.cancelledTrips / stats.totalTrips) * 100).toFixed(1)
                  : '0.0'}
                %
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
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  periodTextActive: {
    color: Colors.white,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  changeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  metricValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  overviewIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  overviewValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  statsList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  statLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.md,
  },
});
