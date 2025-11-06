import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';

export default function PerformanceStatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const stats = {
    rating: 4.9,
    totalTrips: 487,
    completionRate: 98,
    acceptanceRate: 92,
    cancellationRate: 2,
    averageEarnings: 42.50,
    totalEarnings: 20697.50,
    totalDistance: 3245,
    averageDistance: 8.2,
    onlineHours: 324,
    peakHours: ['3PM-6PM', '7PM-10PM'],
    topRoutes: [
      { from: 'Seven Mile Beach', to: 'Airport', count: 45 },
      { from: 'George Town', to: 'Seven Mile Beach', count: 38 },
      { from: 'Camana Bay', to: 'Hotels', count: 32 },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Performance Stats</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['week', 'month', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period as typeof selectedPeriod)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period && styles.periodTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="star" size={24} color={Colors.warning} />
              <Text style={styles.metricValue}>{stats.rating}</Text>
              <Text style={styles.metricLabel}>Rating</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="car" size={24} color={Colors.primary} />
              <Text style={styles.metricValue}>{stats.totalTrips}</Text>
              <Text style={styles.metricLabel}>Total Trips</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="cash" size={24} color={Colors.success} />
              <Text style={styles.metricValue}>CI${stats.averageEarnings}</Text>
              <Text style={styles.metricLabel}>Avg Earnings</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="time" size={24} color={Colors.error} />
              <Text style={styles.metricValue}>{stats.onlineHours}h</Text>
              <Text style={styles.metricLabel}>Online Time</Text>
            </View>
          </View>
        </View>

        {/* Performance Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Rates</Text>
          <View style={styles.ratesCard}>
            <View style={styles.rateRow}>
              <View style={styles.rateInfo}>
                <Text style={styles.rateLabel}>Completion Rate</Text>
                <Text style={styles.rateDescription}>Trips completed successfully</Text>
              </View>
              <Text style={[styles.rateValue, { color: Colors.success }]}>
                {stats.completionRate}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rateRow}>
              <View style={styles.rateInfo}>
                <Text style={styles.rateLabel}>Acceptance Rate</Text>
                <Text style={styles.rateDescription}>Requests accepted</Text>
              </View>
              <Text style={[styles.rateValue, { color: Colors.primary }]}>
                {stats.acceptanceRate}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rateRow}>
              <View style={styles.rateInfo}>
                <Text style={styles.rateLabel}>Cancellation Rate</Text>
                <Text style={styles.rateDescription}>Trips cancelled</Text>
              </View>
              <Text style={[styles.rateValue, { color: Colors.error }]}>
                {stats.cancellationRate}%
              </Text>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Summary</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsValue}>CI${stats.totalEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Average per Trip</Text>
              <Text style={styles.earningsValue}>CI${stats.averageEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Top Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Routes</Text>
          <View style={styles.routesCard}>
            {stats.topRoutes.map((route, index) => (
              <View key={index}>
                <View style={styles.routeRow}>
                  <View style={styles.routeNumber}>
                    <Text style={styles.routeNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeText}>{route.from} → {route.to}</Text>
                    <Text style={styles.routeCount}>{route.count} trips</Text>
                  </View>
                </View>
                {index < stats.topRoutes.length - 1 && <View style={styles.divider} />}
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    margin: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    ...Colors.shadow,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  periodTextActive: {
    color: Colors.white,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    ...Colors.shadow,
  },
  metricValue: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  ratesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateInfo: {
    flex: 1,
  },
  rateLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  rateDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  rateValue: {
    ...Typography.h2,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  earningsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  earningsLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  earningsValue: {
    ...Typography.h3,
    color: Colors.success,
    fontWeight: '700',
  },
  routesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  routeNumberText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});