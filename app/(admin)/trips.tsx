/**
 * ALL TRIPS SCREEN
 * Shows all trips (completed, cancelled, in-progress)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import firestore from '@react-native-firebase/firestore';

interface Trip {
  id: string;
  riderName: string;
  driverName: string;
  pickup: string;
  destination: string;
  status: string;
  finalCost: number;
  distance: number;
  completedAt?: Date;
  createdAt: Date;
}

export default function AllTripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadTrips();
  }, [filter]);

  const loadTrips = async () => {
    try {
      let query = firestore().collection('trips').orderBy('createdAt', 'desc').limit(100);

      if (filter === 'completed') {
        query = query.where('status', '==', 'COMPLETED');
      } else if (filter === 'cancelled') {
        query = query.where('status', '==', 'CANCELLED');
      }

      const snapshot = await query.get();

      // Get all unique rider and driver IDs
      const riderIds = new Set<string>();
      const driverIds = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.riderId) riderIds.add(data.riderId);
        if (data.driverId) driverIds.add(data.driverId);
      });

      // Fetch rider names from users collection
      const riderNames: Record<string, string> = {};
      for (const riderId of riderIds) {
        try {
          const userDoc = await firestore().collection('users').doc(riderId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            riderNames[riderId] = userData?.name || userData?.displayName || 'Unknown Rider';
          }
        } catch (e) {
          console.log('Error fetching rider:', riderId);
        }
      }

      // Fetch driver names from drivers collection
      const driverNames: Record<string, string> = {};
      for (const driverId of driverIds) {
        try {
          const driverDoc = await firestore().collection('drivers').doc(driverId).get();
          if (driverDoc.exists) {
            const driverData = driverDoc.data();
            driverNames[driverId] = `${driverData?.firstName || ''} ${driverData?.lastName || ''}`.trim() || 'Unknown Driver';
          }
        } catch (e) {
          console.log('Error fetching driver:', driverId);
        }
      }

      const tripsList: Trip[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          riderName: data.riderInfo?.name || riderNames[data.riderId] || 'Unknown Rider',
          driverName: data.driverInfo?.name || driverNames[data.driverId] || 'Unknown Driver',
          pickup: data.pickup?.address || 'Unknown',
          destination: data.destination?.address || 'Unknown',
          status: data.status,
          finalCost: data.finalCost || data.fare?.total || 0,
          distance: data.distance || data.route?.distance || 0,
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      setTrips(tripsList);
    } catch (error) {
      console.error('❌ Error loading trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return Colors.success;
      case 'CANCELLED':
        return Colors.error;
      case 'IN_PROGRESS':
        return Colors.info;
      default:
        return Colors.gray[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'REQUESTED':
        return 'Requested';
      default:
        return status;
    }
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => router.push({ pathname: '/(admin)/trip-detail', params: { tripId: item.id } })}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripId}>Trip #{item.id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.tripCost}>CI${item.finalCost.toFixed(2)}</Text>
      </View>

      <View style={styles.participantsRow}>
        <View style={styles.participant}>
          <Ionicons name="person-outline" size={14} color={Colors.gray[600]} />
          <Text style={styles.participantText}>Rider: {item.riderName}</Text>
        </View>
        <View style={styles.participant}>
          <Ionicons name="car-outline" size={14} color={Colors.gray[600]} />
          <Text style={styles.participantText}>Driver: {item.driverName}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.routeText} numberOfLines={1}>{item.destination}</Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={Colors.gray[500]} />
          <Text style={styles.metaText}>{item.distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={Colors.gray[500]} />
          <Text style={styles.metaText}>
            {item.completedAt ? item.completedAt.toLocaleDateString() : item.createdAt.toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Trips</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'cancelled' && styles.filterButtonActive]}
          onPress={() => setFilter('cancelled')}
        >
          <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trips List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTrip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Trips Found</Text>
              <Text style={styles.emptyText}>
                Completed trips will appear here
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
    color: Colors.text,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.lg,
  },
  tripCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tripId: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  tripCost: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
  },
  participantsRow: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  participantText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  routeContainer: {
    marginBottom: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.gray[300],
    marginLeft: 3,
    marginVertical: 2,
  },
  tripFooter: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },
});
