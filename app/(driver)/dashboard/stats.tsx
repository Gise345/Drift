import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

const { width } = Dimensions.get('window');

type TimeFrame = 'today' | 'week' | 'month' | 'all';

export default function Stats() {
  const router = useRouter();
  const { stats } = useDriverStore();
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFrame>('week');

  // Mock data - replace with real data from store
  const performanceData = {
    acceptanceRate: 92,
    completionRate: 98,
    cancelRate: 2,
    averageRating: 4.8,
    totalTrips: 145,
    totalEarnings: 2450.75,
    onlineHours: 38,
    peakHours: ['6-9 AM', '5-8 PM'],
    topRoutes: [
      { from: 'George Town', to: 'Seven Mile Beach', count: 28 },
      { from: 'West Bay', to: 'George Town', count: 22 },
      { from: 'Camana Bay', to: 'Airport', count: 18 },
    ],
    weeklyData: [
      { day: 'Mon', trips: 18, earnings: 285 },
      { day: 'Tue', trips: 22, earnings: 340 },
      { day: 'Wed', trips: 20, earnings: 310 },
      { day: 'Thu', trips: 25, earnings: 395 },
      { day: 'Fri', trips: 28, earnings: 445 },
      { day: 'Sat', trips: 32, earnings: 520 },
      { day: 'Sun', trips: 0, earnings: 0 },
    ],
  };

  const maxTrips = Math.max(...performanceData.weeklyData.map((d) => d.trips));

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return Colors.success;
    if (rating >= 4.0) return Colors.warning;
    return Colors.error;
  };

  const getPerformanceLevel = () => {
    if (performanceData.acceptanceRate >= 90 && performanceData.averageRating >= 4.7) {
      return { level: 'Excellent', color: Colors.success, icon: 'medal' };
    }
    if (performanceData.acceptanceRate >= 80 && performanceData.averageRating >= 4.5) {
      return { level: 'Great', color: Colors.primary, icon: 'ribbon' };
    }
    return { level: 'Good', color: Colors.warning, icon: 'trophy' };
  };

  const performance = getPerformanceLevel();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Performance Badge */}
        <View style={[styles.performanceCard, { backgroundColor: performance.color + '15' }]}>
          <View style={styles.performanceBadge}>
            <Ionicons name={performance.icon as any} size={32} color={performance.color} />
          </View>
          <Text style={styles.performanceLevel}>{performance.level} Driver</Text>
          <Text style={styles.performanceMessage}>
            Keep up the great work! Maintain your ratings to unlock rewards.
          </Text>
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
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('all')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'all' && styles.periodTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="star" size={20} color={getRatingColor(performanceData.averageRating)} />
              <Text style={styles.metricLabel}>Rating</Text>
            </View>
            <Text style={styles.metricValue}>{performanceData.averageRating.toFixed(1)}</Text>
            <View style={styles.metricStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= performanceData.averageRating ? 'star' : 'star-outline'}
                  size={12}
                  color={star <= performanceData.averageRating ? Colors.primary : Colors.gray[300]}
                />
              ))}
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.metricLabel}>Accept Rate</Text>
            </View>
            <Text style={styles.metricValue}>{performanceData.acceptanceRate}%</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${performanceData.acceptanceRate}%` }]}
              />
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="car" size={20} color={Colors.primary} />
              <Text style={styles.metricLabel}>Completion</Text>
            </View>
            <Text style={styles.metricValue}>{performanceData.completionRate}%</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${performanceData.completionRate}%`, backgroundColor: Colors.success },
                ]}
              />
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="close-circle" size={20} color={Colors.error} />
              <Text style={styles.metricLabel}>Cancel Rate</Text>
            </View>
            <Text style={styles.metricValue}>{performanceData.cancelRate}%</Text>
            <Text style={styles.metricSubtext}>Keep below 5%</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>This Week's Activity</Text>
          <View style={styles.chartContainer}>
            {performanceData.weeklyData.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (day.trips / maxTrips) * 120,
                        backgroundColor: day.trips > 0 ? Colors.primary : Colors.gray[200],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{day.trips > 0 ? day.trips : ''}</Text>
                <Text style={styles.barLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Trips completed</Text>
            </View>
          </View>
        </View>

        {/* Top Routes */}
        <View style={styles.routesSection}>
          <Text style={styles.sectionTitle}>Most Popular Routes</Text>
          {performanceData.topRoutes.map((route, index) => (
            <View key={index} style={styles.routeCard}>
              <View style={styles.routeRank}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>
              <View style={styles.routeInfo}>
                <View style={styles.routeRow}>
                  <Ionicons name="location" size={14} color={Colors.success} />
                  <Text style={styles.routeText}>{route.from}</Text>
                </View>
                <Ionicons name="arrow-down" size={12} color={Colors.gray[400]} />
                <View style={styles.routeRow}>
                  <Ionicons name="location" size={14} color={Colors.error} />
                  <Text style={styles.routeText}>{route.to}</Text>
                </View>
              </View>
              <View style={styles.routeCount}>
                <Text style={styles.countValue}>{route.count}</Text>
                <Text style={styles.countLabel}>trips</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Peak Hours */}
        <View style={styles.peakSection}>
          <Text style={styles.sectionTitle}>Your Peak Hours</Text>
          <View style={styles.peakCard}>
            <Ionicons name="time-outline" size={24} color={Colors.primary} />
            <View style={styles.peakInfo}>
              <Text style={styles.peakTitle}>Most Active</Text>
              <Text style={styles.peakHours}>{performanceData.peakHours.join(' & ')}</Text>
            </View>
          </View>
          <Text style={styles.peakTip}>
            💡 Tip: You earn most during these hours. Consider going online at these times!
          </Text>
        </View>

        {/* Overall Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Overall Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Trips</Text>
              <Text style={styles.summaryValue}>{performanceData.totalTrips}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>CI${performanceData.totalEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Online Hours</Text>
              <Text style={styles.summaryValue}>{performanceData.onlineHours}h</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Average per Trip</Text>
              <Text style={styles.summaryValue}>
                CI${(performanceData.totalEarnings / performanceData.totalTrips).toFixed(2)}
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  performanceCard: {
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  performanceBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  performanceLevel: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  performanceMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    textAlign: 'center',
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
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  periodTextActive: {
    color: Colors.black,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  metricValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  metricStars: {
    flexDirection: 'row',
    gap: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  metricSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  chartSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingVertical: Spacing.lg,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 32,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.xs,
  },
  barLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  routesSection: {
    marginBottom: Spacing.xl,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  routeRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rankNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  routeInfo: {
    flex: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: 2,
  },
  routeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  routeCount: {
    alignItems: 'center',
  },
  countValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.black,
  },
  countLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  peakSection: {
    marginBottom: Spacing.xl,
  },
  peakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  peakInfo: {
    marginLeft: Spacing.md,
  },
  peakTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  peakHours: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  peakTip: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    fontStyle: 'italic',
    lineHeight: 20,
  },
  summarySection: {
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
  },
});