/**
 * ADMIN DASHBOARD
 * Main admin screen with navigation to different admin functions
 *
 * ✅ UPGRADED TO React Native Firebase v22+ Modular API
 * ✅ Using 'main' database (restored from backup)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, query, where, getDocs } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingApplications: 0,
    activeDrivers: 0,
    totalRiders: 0,
    pendingIssues: 0,
    deletedUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const driversRef = collection(db, 'drivers');
      const usersRef = collection(db, 'users');
      const tripIssuesRef = collection(db, 'tripIssues');

      // Get pending driver applications (try both field names)
      let pendingQuery = query(driversRef, where('registrationStatus', '==', 'pending'));
      let pendingSnapshot = await getDocs(pendingQuery);

      if (pendingSnapshot.empty) {
        pendingQuery = query(driversRef, where('status', '==', 'pending'));
        pendingSnapshot = await getDocs(pendingQuery);
      }

      // Get active drivers (try both field names)
      let activeQuery = query(driversRef, where('registrationStatus', '==', 'approved'));
      let activeSnapshot = await getDocs(activeQuery);

      if (activeSnapshot.empty) {
        activeQuery = query(driversRef, where('status', '==', 'approved'));
        activeSnapshot = await getDocs(activeQuery);
      }

      // Get total riders
      const ridersQuery = query(usersRef, where('roles', 'array-contains', 'RIDER'));
      const ridersSnapshot = await getDocs(ridersQuery);

      // Get pending trip issues
      let pendingIssuesCount = 0;
      try {
        const issuesQuery = query(tripIssuesRef, where('status', '==', 'pending'));
        const issuesSnapshot = await getDocs(issuesQuery);
        pendingIssuesCount = issuesSnapshot.size;
      } catch (e) {
        // Collection might not exist yet
        console.log('⚠️ tripIssues collection not found or empty');
      }

      // Get deleted users count
      let deletedUsersCount = 0;
      try {
        const deletedQuery = query(usersRef, where('isDeleted', '==', true));
        const deletedSnapshot = await getDocs(deletedQuery);
        deletedUsersCount = deletedSnapshot.size;
      } catch (e) {
        console.log('⚠️ No deleted users found');
      }

      console.log(`✅ Admin stats: ${pendingSnapshot.size} pending, ${activeSnapshot.size} active drivers, ${ridersSnapshot.size} riders, ${deletedUsersCount} deleted`);

      setStats({
        pendingApplications: pendingSnapshot.size,
        activeDrivers: activeSnapshot.size,
        totalRiders: ridersSnapshot.size,
        pendingIssues: pendingIssuesCount,
        deletedUsers: deletedUsersCount,
      });
    } catch (error) {
      console.error('❌ Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      icon: 'people-outline',
      title: 'Driver Applications',
      subtitle: 'Review pending driver registrations',
      route: '/(admin)/drivers/pending',
      color: Colors.primary,
      badge: stats.pendingApplications > 0 ? String(stats.pendingApplications) : undefined,
    },
    {
      icon: 'car-outline',
      title: 'Active Drivers',
      subtitle: 'Manage approved drivers',
      route: '/(admin)/drivers/active',
      color: Colors.success,
      badge: stats.activeDrivers > 0 ? String(stats.activeDrivers) : undefined,
    },
    // COMMENTED OUT FOR GOOGLE REVIEW - Live tracking may cause rejection
    // {
    //   icon: 'location-outline',
    //   title: 'Live Map',
    //   subtitle: 'Track active drivers in real-time',
    //   route: '/(admin)/map',
    //   color: Colors.info,
    // },
    {
      icon: 'receipt-outline',
      title: 'All Trips',
      subtitle: 'View trip history and details',
      route: '/(admin)/trips',
      color: Colors.purple,
    },
    {
      icon: 'cash-outline',
      title: 'Earnings & Payouts',
      subtitle: 'Manage driver payments',
      route: '/(admin)/earnings',
      color: Colors.success,
    },
    {
      icon: 'people',
      title: 'Riders',
      subtitle: 'View all registered riders',
      route: '/(admin)/riders',
      color: Colors.info,
      badge: stats.totalRiders > 0 ? String(stats.totalRiders) : undefined,
    },
    {
      icon: 'stats-chart-outline',
      title: 'Analytics',
      subtitle: 'Platform statistics and insights',
      route: '/(admin)/analytics',
      color: Colors.warning,
    },
    {
      icon: 'flag-outline',
      title: 'Trip Issues',
      subtitle: 'Review rider complaints and issues',
      route: '/(admin)/trip-issues',
      color: Colors.warning,
      badge: stats.pendingIssues > 0 ? String(stats.pendingIssues) : undefined,
    },
    {
      icon: 'speedometer-outline',
      title: 'Speed Violations',
      subtitle: 'Monitor driver speeding & take action',
      route: '/(admin)/speed-violations',
      color: Colors.error,
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Safety & Reports',
      subtitle: 'Incident reports and safety issues',
      route: '/(admin)/safety',
      color: Colors.error,
    },
    {
      icon: 'list-outline',
      title: 'Activity Logs',
      subtitle: 'Real-time app activity monitoring',
      route: '/(admin)/activity-logs',
      color: Colors.info,
    },
    {
      icon: 'trash-outline',
      title: 'Deleted Users',
      subtitle: 'View deleted user accounts (data preserved)',
      route: '/(admin)/deleted-users',
      color: Colors.gray[600],
      badge: stats.deletedUsers > 0 ? String(stats.deletedUsers) : undefined,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Drift Management Console</Text>
        </View>

        {/* Stats Overview */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pendingApplications}</Text>
              <Text style={styles.statLabel}>Pending Apps</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.activeDrivers}</Text>
              <Text style={styles.statLabel}>Active Drivers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalRiders}</Text>
              <Text style={styles.statLabel}>Total Riders</Text>
            </View>
          </View>
        )}

        {/* Admin Sections */}
        <View style={styles.sectionsContainer}>
          {adminSections.map((section, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sectionCard}
              onPress={() => router.push(section.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '20' }]}>
                <Ionicons name={section.icon as any} size={28} color={section.color} />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
              {section.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{section.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['2xl'],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  loadingContainer: {
    padding: Spacing['3xl'],
    alignItems: 'center',
  },
  sectionsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    height: 24,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
