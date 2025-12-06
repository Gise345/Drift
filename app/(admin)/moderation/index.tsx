/**
 * ADMIN MODERATION DASHBOARD
 * Central hub for managing safety violations, strikes, appeals, and emergency alerts
 *
 * UPGRADED TO React Native Firebase v22+ Modular API
 * Using 'main' database (restored from backup) UPGRADED TO v23.5.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from '@react-native-firebase/firestore';
import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

// Initialize Firestore with 'main' database
const app = getApp();
const db = getFirestore(app, 'main');

interface ModerationStats {
  pendingStrikes: number;
  pendingAppeals: number;
  pendingDisputes: number;
  activeEmergencies: number;
  suspendedDrivers: number;
  flaggedDrivers: number;
}

interface RecentItem {
  id: string;
  type: 'strike' | 'appeal' | 'emergency' | 'dispute';
  title: string;
  subtitle: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function ModerationDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<ModerationStats>({
    pendingStrikes: 0,
    pendingAppeals: 0,
    pendingDisputes: 0,
    activeEmergencies: 0,
    suspendedDrivers: 0,
    flaggedDrivers: 0,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load counts in parallel using modular queries
      const strikeQueueQuery = query(
        collection(db, 'strike_queue'),
        where('status', '==', 'pending')
      );
      const appealsQuery = query(
        collection(db, 'appeals'),
        where('status', '==', 'pending')
      );
      const disputesQuery = query(
        collection(db, 'payment_disputes'),
        where('status', '==', 'pending')
      );
      const emergencyQuery = query(
        collection(db, 'emergency_alerts'),
        where('status', '==', 'active')
      );
      const suspensionsQuery = query(
        collection(db, 'suspensions'),
        where('status', '==', 'active')
      );
      const flagsQuery = query(
        collection(db, 'driver_flags'),
        where('status', '==', 'pending')
      );

      const [
        strikeQueueSnapshot,
        appealsSnapshot,
        disputesSnapshot,
        emergencySnapshot,
        suspensionsSnapshot,
        flagsSnapshot,
      ] = await Promise.all([
        getDocs(strikeQueueQuery),
        getDocs(appealsQuery),
        getDocs(disputesQuery),
        getDocs(emergencyQuery),
        getDocs(suspensionsQuery),
        getDocs(flagsQuery),
      ]);

      setStats({
        pendingStrikes: strikeQueueSnapshot.size,
        pendingAppeals: appealsSnapshot.size,
        pendingDisputes: disputesSnapshot.size,
        activeEmergencies: emergencySnapshot.size,
        suspendedDrivers: suspensionsSnapshot.size,
        flaggedDrivers: flagsSnapshot.size,
      });

      // Load recent items for the activity feed
      const recentItemsList: RecentItem[] = [];

      // Get recent strikes
      const recentStrikesQuery = query(
        collection(db, 'strikes'),
        orderBy('issuedAt', 'desc'),
        limit(5)
      );
      const recentStrikes = await getDocs(recentStrikesQuery);

      recentStrikes.docs.forEach(strikeDoc => {
        const data = strikeDoc.data();
        recentItemsList.push({
          id: strikeDoc.id,
          type: 'strike',
          title: `Strike Issued`,
          subtitle: `Driver ${data.driverId?.slice(-6) || 'Unknown'} - ${data.type || 'Violation'}`,
          timestamp: data.issuedAt?.toDate() || new Date(),
          priority: data.strikeNumber === 3 ? 'critical' : data.strikeNumber === 2 ? 'high' : 'medium',
        });
      });

      // Get recent appeals
      const recentAppealsQuery = query(
        collection(db, 'appeals'),
        orderBy('submittedAt', 'desc'),
        limit(5)
      );
      const recentAppeals = await getDocs(recentAppealsQuery);

      recentAppeals.docs.forEach(appealDoc => {
        const data = appealDoc.data();
        recentItemsList.push({
          id: appealDoc.id,
          type: 'appeal',
          title: 'Appeal Submitted',
          subtitle: `Driver ${data.driverId?.slice(-6) || 'Unknown'}`,
          timestamp: data.submittedAt?.toDate() || new Date(),
          priority: data.status === 'pending' ? 'high' : 'low',
        });
      });

      // Get recent emergencies
      const recentEmergenciesQuery = query(
        collection(db, 'emergency_alerts'),
        orderBy('triggeredAt', 'desc'),
        limit(5)
      );
      const recentEmergencies = await getDocs(recentEmergenciesQuery);

      recentEmergencies.docs.forEach(emergencyDoc => {
        const data = emergencyDoc.data();
        recentItemsList.push({
          id: emergencyDoc.id,
          type: 'emergency',
          title: 'Emergency Alert',
          subtitle: `Trip ${data.tripId?.slice(-6) || 'Unknown'}`,
          timestamp: data.triggeredAt?.toDate() || new Date(),
          priority: data.status === 'active' ? 'critical' : 'low',
        });
      });

      // Sort by timestamp
      recentItemsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentItems(recentItemsList.slice(0, 10));

    } catch (error) {
      console.error('Error loading moderation data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return Colors.gray[500];
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'strike': return 'flash';
      case 'appeal': return 'document-text';
      case 'emergency': return 'warning';
      case 'dispute': return 'cash';
      default: return 'information-circle';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading moderation data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moderation Dashboard</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Emergency Alert Banner */}
        {stats.activeEmergencies > 0 && (
          <TouchableOpacity
            style={styles.emergencyBanner}
            onPress={() => router.push('/(admin)/moderation/emergencies')}
          >
            <View style={styles.emergencyIcon}>
              <Ionicons name="warning" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>
                {stats.activeEmergencies} Active Emergency Alert{stats.activeEmergencies > 1 ? 's' : ''}
              </Text>
              <Text style={styles.emergencySubtitle}>Tap to review immediately</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(admin)/moderation/strikes')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="flash" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.pendingStrikes}</Text>
            <Text style={styles.statLabel}>Pending Strikes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(admin)/moderation/appeals')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="document-text" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.pendingAppeals}</Text>
            <Text style={styles.statLabel}>Pending Appeals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(admin)/moderation/disputes')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="cash" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.pendingDisputes}</Text>
            <Text style={styles.statLabel}>Payment Disputes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(admin)/moderation/suspensions')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="ban" size={24} color="#DC2626" />
            </View>
            <Text style={styles.statValue}>{stats.suspendedDrivers}</Text>
            <Text style={styles.statLabel}>Suspended Drivers</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(admin)/moderation/strikes')}
            >
              <Ionicons name="flash-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Review Strikes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(admin)/moderation/appeals')}
            >
              <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Review Appeals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(admin)/moderation/driver-profiles')}
            >
              <Ionicons name="people-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Driver Profiles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(admin)/safety')}
            >
              <Ionicons name="shield-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Safety Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentItems.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.gray[400]} />
              <Text style={styles.emptyText}>No recent activity</Text>
            </View>
          ) : (
            recentItems.map((item) => (
              <TouchableOpacity
                key={`${item.type}-${item.id}`}
                style={styles.activityItem}
                onPress={() => {
                  switch (item.type) {
                    case 'strike':
                      router.push(`/(admin)/moderation/strike/${item.id}`);
                      break;
                    case 'appeal':
                      router.push(`/(admin)/moderation/appeal/${item.id}`);
                      break;
                    case 'emergency':
                      router.push(`/(admin)/moderation/emergency/${item.id}`);
                      break;
                  }
                }}
              >
                <View style={[styles.activityIcon, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                  <Ionicons
                    name={getItemIcon(item.type) as any}
                    size={20}
                    color={getPriorityColor(item.priority)}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.activityTime}>{formatTime(item.timestamp)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.gray[600],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emergencySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[600],
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.gray[500],
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  activitySubtitle: {
    fontSize: 12,
    color: Colors.gray[600],
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.gray[500],
  },
});
