import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

export default function DriverHome() {
  const router = useRouter();
  const {
    driver,
    isOnline,
    toggleOnline,
    earnings,
    stats,
    incomingRequests,
    activeRide,
  } = useDriverStore();

  const [onlineTime, setOnlineTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOnline) {
      interval = setInterval(() => {
        setOnlineTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnline]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.driverName}>{driver?.firstName || 'Driver'}!</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(driver)/profile/view')}
        >
          <Ionicons name="person-circle" size={40} color={Colors.purple} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Online/Offline Toggle */}
        <View style={[styles.statusCard, isOnline ? styles.statusOnline : styles.statusOffline]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, isOnline && styles.statusDotActive]} />
              <Text style={styles.statusText}>
                {isOnline ? 'You\'re Online' : 'You\'re Offline'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: Colors.gray[300], true: Colors.success }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.gray[300]}
            />
          </View>
          
          {isOnline && (
            <View style={styles.onlineInfo}>
              <Ionicons name="time-outline" size={16} color={Colors.gray[600]} />
              <Text style={styles.onlineTime}>Online for {formatTime(onlineTime)}</Text>
            </View>
          )}

          {!isOnline && (
            <Text style={styles.offlineMessage}>
              Go online to start receiving ride requests
            </Text>
          )}
        </View>

        {/* Active Ride (if exists) */}
        {activeRide && (
          <TouchableOpacity
            style={styles.activeRideCard}
            onPress={() => router.push('/(driver)/active-ride/navigate-to-pickup')}
          >
            <View style={styles.activeRideHeader}>
              <Ionicons name="car" size={24} color={Colors.primary} />
              <Text style={styles.activeRideTitle}>Active Ride</Text>
            </View>
            <Text style={styles.activeRideDestination}>
              {activeRide.destination.address}
            </Text>
            <View style={styles.activeRideFooter}>
              <Text style={styles.activeRideStatus}>
                {activeRide.status === 'accepted' ? 'Navigate to pickup' : 'In progress'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[600]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Earnings */}
        <View style={styles.earningsCard}>
          <Text style={styles.sectionTitle}>Today's Earnings</Text>
          <View style={styles.earningsAmount}>
            <Text style={styles.currencySymbol}>CI$</Text>
            <Text style={styles.earningsValue}>{earnings.today.toFixed(2)}</Text>
          </View>
          <View style={styles.earningsStats}>
            <View style={styles.earningsStat}>
              <Text style={styles.statsLabel}>Trips</Text>
              <Text style={styles.statsValue}>{stats.totalTrips}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.statsLabel}>Rating</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={Colors.primary} />
                <Text style={styles.statsValue}>{stats.rating.toFixed(1)}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.statsLabel}>Online</Text>
              <Text style={styles.statsValue}>{stats.onlineHours}h</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => router.push('/(driver)/dashboard/earnings')}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Pending Requests */}
        {incomingRequests.length > 0 && (
          <View style={styles.requestsSection}>
            <View style={styles.requestsHeader}>
              <Text style={styles.sectionTitle}>Incoming Requests</Text>
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsCount}>{incomingRequests.length}</Text>
              </View>
            </View>
            {incomingRequests.slice(0, 2).map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestCard}
                onPress={() => router.push(`/(driver)/requests/request-detail?id=${request.id}`)}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestRider}>{request.riderName}</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color={Colors.primary} />
                      <Text style={styles.requestRating}>{request.riderRating}</Text>
                    </View>
                  </View>
                  <Text style={styles.requestEarnings}>CI${request.estimatedEarnings}</Text>
                </View>
                <View style={styles.requestRoute}>
                  <Ionicons name="location" size={16} color={Colors.success} />
                  <Text style={styles.requestAddress} numberOfLines={1}>
                    {request.pickup.address}
                  </Text>
                </View>
                <View style={styles.requestRoute}>
                  <Ionicons name="location" size={16} color={Colors.error} />
                  <Text style={styles.requestAddress} numberOfLines={1}>
                    {request.destination.address}
                  </Text>
                </View>
                <Text style={styles.requestTimer}>
                  Expires in {Math.ceil((request.expiresAt.getTime() - Date.now()) / 1000)}s
                </Text>
              </TouchableOpacity>
            ))}
            {incomingRequests.length > 2 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/(driver)/requests/incoming')}
              >
                <Text style={styles.viewAllText}>
                  View All Requests ({incomingRequests.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(driver)/dashboard/earnings')}
            >
              <Ionicons name="wallet-outline" size={28} color={Colors.primary} />
              <Text style={styles.actionLabel}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(driver)/history/trips')}
            >
              <Ionicons name="time-outline" size={28} color={Colors.primary} />
              <Text style={styles.actionLabel}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(driver)/profile/documents')}
            >
              <Ionicons name="document-text-outline" size={28} color={Colors.primary} />
              <Text style={styles.actionLabel}>Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(driver)/support/help')}
            >
              <Ionicons name="help-circle-outline" size={28} color={Colors.primary} />
              <Text style={styles.actionLabel}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency SOS */}
        <TouchableOpacity style={styles.sosButton}>
          <Ionicons name="alert-circle" size={24} color={Colors.white} />
          <Text style={styles.sosText}>Emergency SOS</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerLeft: {},
  greeting: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
  },
  driverName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
  },
  profileButton: {},
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  statusCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusOnline: {
    backgroundColor: Colors.success + '20',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  statusOffline: {
    backgroundColor: Colors.gray[50],
    borderWidth: 2,
    borderColor: Colors.gray[300],
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gray[400],
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  onlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  onlineTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  offlineMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.sm,
  },
  activeRideCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  activeRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  activeRideTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  activeRideDestination: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
    marginBottom: Spacing.md,
  },
  activeRideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeRideStatus: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  earningsCard: {
    backgroundColor: Colors.purple + '10',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  earningsAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.gray[600],
    marginRight: Spacing.xs,
  },
  earningsValue: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '700',
    color: Colors.black,
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[300],
    marginBottom: Spacing.md,
  },
  earningsStat: {
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  statsValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.black,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[300],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  viewDetailsText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  requestsSection: {
    marginBottom: Spacing.lg,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  requestsBadge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  requestsCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  requestRider: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  requestRating: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  requestEarnings: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.success,
  },
  requestRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  requestAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    flex: 1,
  },
  requestTimer: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  viewAllButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickActions: {
    marginBottom: Spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sosText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },
});