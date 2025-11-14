import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';
import { useAuthStore } from '@/src/stores/auth-store';
import { loadDriverTripHistory } from '@/src/services/driver-profile.service';

type TripStatus = 'completed' | 'cancelled' | 'no-show';

interface Trip {
  id: string;
  riderName: string;
  riderPhoto: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  earnings: number;
  distance: number;
  duration: number;
  rating: number;
  status: TripStatus;
}

export default function TripsScreen() {
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Load trip history from Firebase
  useEffect(() => {
    if (user?.id) {
      loadTrips();
    }
  }, [user?.id]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const tripHistory = await loadDriverTripHistory(user.id, 50);

      // Map Firebase trips to UI format
      const formattedTrips: Trip[] = tripHistory.map((trip: any) => {
        const completedAt = trip.completedAt || trip.cancelledAt;
        const isToday = completedAt && isDateToday(completedAt);
        const isYesterday = completedAt && isDateYesterday(completedAt);

        return {
          id: trip.id,
          riderName: trip.riderInfo?.name || 'Rider',
          riderPhoto: trip.riderInfo?.photoUrl || '👤',
          pickup: trip.pickup?.address || 'Unknown',
          destination: trip.destination?.address || 'Unknown',
          date: isToday ? 'Today' : isYesterday ? 'Yesterday' : formatDate(completedAt),
          time: formatTime(completedAt),
          earnings: trip.driverEarnings || trip.finalCost || 0,
          distance: trip.actualDistance || trip.distance || 0,
          duration: trip.actualDuration || trip.duration || 0,
          rating: trip.driverRating || 0,
          status: trip.status === 'COMPLETED' ? 'completed' : trip.status === 'CANCELLED' ? 'cancelled' : 'no-show',
        };
      });

      setTrips(formattedTrips);
    } catch (error) {
      console.error('❌ Error loading trip history:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isDateYesterday = (date: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  const formatDate = (date: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const filteredTrips = trips.filter((trip) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'completed') return trip.status === 'completed';
    if (selectedTab === 'cancelled') return trip.status !== 'completed';
    return true;
  });

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      case 'no-show':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: TripStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no-show':
        return 'No-Show Fee';
      default:
        return status;
    }
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => router.push({
        pathname: '/(driver)/history/trip-detail',
        params: { tripId: item.id }
      })}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <View style={styles.riderInfo}>
          <Text style={styles.riderPhoto}>{item.riderPhoto}</Text>
          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{item.riderName}</Text>
            <View style={styles.dateRow}>
              <Text style={styles.tripDate}>{item.date}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.tripTime}>{item.time}</Text>
            </View>
          </View>
        </View>
        <View style={styles.earningsContainer}>
          <Text style={styles.earnings}>
            CI${item.earnings.toFixed(2)}
          </Text>
          {item.status === 'completed' && item.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={Colors.warning} />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.routeText} numberOfLines={1}>{item.destination}</Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        {item.status === 'completed' && (
          <View style={styles.tripStats}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={14} color={Colors.textSecondary} />
              <Text style={styles.statText}>{item.distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={14} color={Colors.textSecondary} />
              <Text style={styles.statText}>{item.duration} min</Text>
            </View>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <TouchableOpacity
          onPress={() => router.push('/(driver)/history/filters')}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All Trips
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'cancelled' && styles.tabActive]}
          onPress={() => setSelectedTab('cancelled')}
        >
          <Text style={[styles.tabText, selectedTab === 'cancelled' && styles.tabTextActive]}>
            Issues
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading trip history...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          renderItem={renderTrip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptyText}>
                Your completed trips will appear here
              </Text>
            </View>
          }
        />
      )}
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
  filterButton: {
    padding: Spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
  },
  tripCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Colors.shadow,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderPhoto: {
    fontSize: 40,
    marginRight: Spacing.sm,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  dot: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginHorizontal: 4,
  },
  tripTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earnings: {
    ...Typography.h3,
    color: Colors.success,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.warning}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
    marginLeft: 2,
  },
  routeContainer: {
    marginBottom: Spacing.sm,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  routeText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  tripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  tripStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});