import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore, Trip as TripData } from '@/src/stores/trip-store';
import { useUserStore, RecentTravel } from '@/src/stores/user-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { canRateOrTipTrip } from '@/src/services/ride-request.service';

/**
 * My Trips Screen
 * Shows past trip history only (no upcoming trips feature)
 */

interface Trip {
  id: string;
  date: string;
  time: string;
  from: string;
  to: string;
  driver: string;
  driverId?: string;
  cost: string;
  status: 'completed' | 'cancelled';
  rating?: number;
  // Rating/tip window info
  canRate?: boolean;
  canTip?: boolean;
  hasRated?: boolean;
  hasTipped?: boolean;
  remainingTime?: string;
}

// Helper to format date
const formatDate = (date: Date | undefined): string => {
  if (!date) return 'Unknown date';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper to format time
const formatTime = (date: Date | undefined): string => {
  if (!date) return 'Unknown time';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Convert Firebase trip to display format
const convertTrip = (trip: TripData): Trip => {
  // Check rating/tip window status
  const ratingStatus = canRateOrTipTrip({
    completedAt: trip.completedAt,
    ratingDeadline: trip.ratingDeadline,
    driverRating: trip.driverRating,
    tip: trip.tip,
    status: trip.status,
  });

  return {
    id: trip.id,
    date: formatDate(trip.requestedAt || trip.createdAt),
    time: formatTime(trip.requestedAt || trip.createdAt),
    from: trip.pickup?.placeName || trip.pickup?.address || 'Unknown pickup',
    to: trip.destination?.placeName || trip.destination?.address || 'Unknown destination',
    driver: trip.driverInfo?.name || 'Driver',
    driverId: trip.driverInfo?.id || trip.driverId,
    cost: `CI$${(trip.finalCost || trip.estimatedCost || 0).toFixed(2)}`,
    status: trip.status === 'CANCELLED' ? 'cancelled' : 'completed',
    rating: trip.driverRating,
    // Rating/tip window info
    canRate: ratingStatus.canRate,
    canTip: ratingStatus.canTip,
    hasRated: ratingStatus.hasRated,
    hasTipped: ratingStatus.hasTipped,
    remainingTime: ratingStatus.remainingTime,
  };
};

// Convert recent travel to display format
const convertRecentTravel = (travel: RecentTravel): Trip => ({
  id: travel.id,
  date: formatDate(new Date(travel.timestamp)),
  time: formatTime(new Date(travel.timestamp)),
  from: travel.pickup.name || travel.pickup.address,
  to: travel.destination.name || travel.destination.address,
  driver: 'Driver',
  cost: `$${travel.cost.toFixed(2)}`,
  status: 'completed',
});

export default function MyTripsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);

  const { getTripHistory, pastTrips: storePastTrips } = useTripStore();
  const { user, getRecentTravels } = useUserStore();
  const { user: authUser } = useAuthStore();

  useEffect(() => {
    loadTrips();
  }, [user, authUser]);

  const loadTrips = async () => {
    if (!refreshing) {
      setLoading(true);
    }

    try {
      const userId = authUser?.id || user?.id;

      if (userId) {
        // Load from Firebase trip history
        await getTripHistory(userId);

        // Convert completed/cancelled trips only
        const past = storePastTrips
          .filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')
          .map(convertTrip);

        // Also get recent travels from user store
        const recentTravels = getRecentTravels();
        const recentTripsDisplay = recentTravels.map(convertRecentTravel);

        // Merge recent travels with past trips (dedupe by id)
        const mergedPast = [...past];
        recentTripsDisplay.forEach(rt => {
          if (!mergedPast.find(p => p.id === rt.id)) {
            mergedPast.push(rt);
          }
        });

        // Sort by date (most recent first)
        mergedPast.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setPastTrips(mergedPast);
        console.log(`Loaded ${mergedPast.length} past trips`);
      } else {
        console.log('No user ID, showing empty trips');
        setPastTrips([]);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const handleRateTrip = (tripId: string, driverId?: string) => {
    router.push({
      pathname: '/(rider)/rate-driver',
      params: { tripId, driverId: driverId || '' }
    });
  };

  const handleTipTrip = (tripId: string) => {
    router.push({
      pathname: '/(rider)/add-late-tip',
      params: { tripId }
    });
  };

  const renderTripCard = ({ item }: { item: Trip }) => {
    const showPendingActions = item.status === 'completed' && (item.canRate || item.canTip);

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => router.push({
          pathname: '/(rider)/trip-detail',
          params: { tripId: item.id }
        })}
        activeOpacity={0.7}
      >
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.dateText}>{item.date} · {item.time}</Text>
          {item.status === 'completed' && !showPendingActions && (
            <View style={styles.completedBadge}>
              <Text style={styles.badgeText}>Completed</Text>
            </View>
          )}
          {item.status === 'completed' && showPendingActions && (
            <View style={[styles.completedBadge, styles.pendingActionBadge]}>
              <Text style={[styles.badgeText, styles.pendingActionText]}>Action Needed</Text>
            </View>
          )}
          {item.status === 'cancelled' && (
            <View style={[styles.completedBadge, styles.cancelledBadge]}>
              <Text style={[styles.badgeText, styles.cancelledText]}>Cancelled</Text>
            </View>
          )}
        </View>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routeIconsContainer}>
            <View style={styles.greenDot} />
            <View style={styles.dottedLine} />
            <View style={styles.purpleSquare} />
          </View>
          <View style={styles.addressesContainer}>
            <Text style={styles.address} numberOfLines={1}>{item.from}</Text>
            <Text style={styles.address} numberOfLines={1}>{item.to}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.driverInfo}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.driverName}>{item.driver}</Text>
          </View>
          <View style={styles.costContainer}>
            <Text style={styles.costLabel}>Cost:</Text>
            <Text style={styles.costValue}>{item.cost}</Text>
          </View>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{item.rating}.0</Text>
            </View>
          )}
        </View>

        {/* Pending Actions (Rate/Tip) */}
        {showPendingActions && (
          <View style={styles.pendingActionsContainer}>
            {item.remainingTime && (
              <Text style={styles.remainingTimeText}>
                <Ionicons name="time-outline" size={12} color="#F59E0B" /> {item.remainingTime}
              </Text>
            )}
            <View style={styles.actionButtonsRow}>
              {item.canRate && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRateTrip(item.id, item.driverId);
                  }}
                >
                  <Ionicons name="star-outline" size={16} color="#5d1289" />
                  <Text style={styles.actionButtonText}>Rate Driver</Text>
                </TouchableOpacity>
              )}
              {item.canTip && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.tipButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleTipTrip(item.id);
                  }}
                >
                  <Ionicons name="heart-outline" size={16} color="#10B981" />
                  <Text style={[styles.actionButtonText, styles.tipButtonText]}>Add Tip</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#9CA3AF"
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Trips</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d1289" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Your trip history</Text>
      </View>

      {/* Trip List */}
      {pastTrips.length > 0 ? (
        <FlatList
          data={pastTrips}
          renderItem={renderTripCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#5d1289"
              colors={['#5d1289']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>
            Your completed trips will appear here
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.bookButtonText}>Book a Ride</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  completedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
  },
  pendingActionBadge: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  cancelledText: {
    color: '#DC2626',
  },
  pendingActionText: {
    color: '#D97706',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeIconsContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginBottom: 4,
  },
  dottedLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  purpleSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#5d1289',
    marginTop: 4,
  },
  addressesContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  address: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverName: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  costLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#5d1289',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  // Pending actions styles
  pendingActionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  remainingTimeText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5d1289',
  },
  tipButton: {
    backgroundColor: '#D1FAE5',
  },
  tipButtonText: {
    color: '#059669',
  },
});
