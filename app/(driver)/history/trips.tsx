import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';

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

// Mock data
const mockTrips: Trip[] = [
  {
    id: '1',
    riderName: 'Sarah Johnson',
    riderPhoto: '👩‍💼',
    pickup: 'Grand Cayman Marriott',
    destination: 'Owen Roberts Airport',
    date: 'Today',
    time: '2:30 PM',
    earnings: 45.00,
    distance: 12.5,
    duration: 25,
    rating: 5,
    status: 'completed',
  },
  {
    id: '2',
    riderName: 'Michael Chen',
    riderPhoto: '👨‍💻',
    pickup: 'Camana Bay',
    destination: 'Seven Mile Beach',
    date: 'Today',
    time: '11:45 AM',
    earnings: 28.50,
    distance: 8.2,
    duration: 18,
    rating: 5,
    status: 'completed',
  },
  {
    id: '3',
    riderName: 'Emma Wilson',
    riderPhoto: '👩',
    pickup: 'Ritz-Carlton',
    destination: 'George Town',
    date: 'Yesterday',
    time: '6:15 PM',
    earnings: 32.00,
    distance: 9.8,
    duration: 22,
    rating: 4,
    status: 'completed',
  },
  {
    id: '4',
    riderName: 'James Miller',
    riderPhoto: '👨‍🦱',
    pickup: 'Kimpton Seafire',
    destination: 'Bodden Town',
    date: 'Yesterday',
    time: '3:20 PM',
    earnings: 0,
    distance: 0,
    duration: 0,
    rating: 0,
    status: 'cancelled',
  },
  {
    id: '5',
    riderName: 'Lisa Anderson',
    riderPhoto: '👱‍♀️',
    pickup: 'Caribbean Club',
    destination: 'Camana Bay',
    date: 'Nov 3',
    time: '8:45 AM',
    earnings: 5.00,
    distance: 0,
    duration: 0,
    rating: 0,
    status: 'no-show',
  },
];

export default function TripsScreen() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState(mockTrips);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
});