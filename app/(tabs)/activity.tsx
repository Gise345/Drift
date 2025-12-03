import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore, Trip as TripData } from '@/src/stores/trip-store';
import { useUserStore, RecentTravel } from '@/src/stores/user-store';
import { useAuthStore } from '@/src/stores/auth-store';

/**
 * Activity Tab Screen
 * Shows past trip history grouped by month (most recent first)
 */

interface Trip {
  id: string;
  date: string;
  time: string;
  timestamp: Date; // For sorting
  from: string;
  to: string;
  driver: string;
  cost: string;
  status: 'completed' | 'cancelled';
  rating?: number;
}

interface TripSection {
  title: string;
  data: Trip[];
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

// Helper to get month-year string for grouping
const getMonthYear = (date: Date | undefined): string => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

// Convert Firebase trip to display format
const convertTrip = (trip: TripData): Trip => {
  const tripDate = trip.requestedAt || trip.createdAt;
  return {
    id: trip.id,
    date: formatDate(tripDate),
    time: formatTime(tripDate),
    timestamp: tripDate ? new Date(tripDate) : new Date(0),
    from: trip.pickup?.placeName || trip.pickup?.address || 'Unknown pickup',
    to: trip.destination?.placeName || trip.destination?.address || 'Unknown destination',
    driver: trip.driverInfo?.name || 'Driver',
    cost: `$${(trip.finalCost || trip.estimatedCost || 0).toFixed(2)}`,
    status: trip.status === 'CANCELLED' ? 'cancelled' : 'completed',
    rating: trip.driverRating,
  };
};

// Convert recent travel to display format
const convertRecentTravel = (travel: RecentTravel): Trip => {
  const travelDate = new Date(travel.timestamp);
  return {
    id: travel.id,
    date: formatDate(travelDate),
    time: formatTime(travelDate),
    timestamp: travelDate,
    from: travel.pickup.name || travel.pickup.address,
    to: travel.destination.name || travel.destination.address,
    driver: 'Driver',
    cost: `$${travel.cost.toFixed(2)}`,
    status: 'completed',
  };
};

// Group trips by month
const groupTripsByMonth = (trips: Trip[]): TripSection[] => {
  // Sort trips by timestamp (most recent first)
  const sortedTrips = [...trips].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Group by month-year
  const grouped: { [key: string]: Trip[] } = {};

  sortedTrips.forEach(trip => {
    const monthYear = getMonthYear(trip.timestamp);
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(trip);
  });

  // Convert to sections array (already sorted since we sorted trips first)
  const sections: TripSection[] = Object.entries(grouped).map(([title, data]) => ({
    title,
    data,
  }));

  return sections;
};

export default function ActivityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);

  const { getTripHistory, pastTrips: storePastTrips } = useTripStore();
  const { user, getRecentTravels } = useUserStore();
  const { user: authUser } = useAuthStore();

  // Group trips by month using useMemo for performance
  const tripSections = useMemo(() => groupTripsByMonth(pastTrips), [pastTrips]);

  // Fetch trips when user changes
  useEffect(() => {
    const userId = authUser?.id || user?.id;
    if (userId) {
      setLoading(true);
      getTripHistory(userId).finally(() => setLoading(false));
    }
  }, [authUser?.id, user?.id]);

  // Update local state when store trips change
  useEffect(() => {
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

    setPastTrips(mergedPast);
    console.log(`Loaded ${mergedPast.length} past trips from store`);
    setRefreshing(false);
  }, [storePastTrips]);

  const onRefresh = () => {
    const userId = authUser?.id || user?.id;
    if (userId) {
      setRefreshing(true);
      getTripHistory(userId);
    }
  };

  const renderSectionHeader = ({ section }: { section: TripSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} trip{section.data.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  const renderTripCard = ({ item }: { item: Trip }) => (
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
        {item.status === 'completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.badgeText}>Completed</Text>
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

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9CA3AF"
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity</Text>
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
        <Text style={styles.headerTitle}>Activity</Text>
        <Text style={styles.headerSubtitle}>Your trip history</Text>
      </View>

      {/* Trip List */}
      {tripSections.length > 0 ? (
        <SectionList
          sections={tripSections}
          renderItem={renderTripCard}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  cancelledText: {
    color: '#DC2626',
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
});
