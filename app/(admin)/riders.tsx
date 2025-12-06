/**
 * RIDERS SCREEN
 * Shows all registered riders with details
 *
 * ✅ UPGRADED TO React Native Firebase v22+ Modular API
 * ✅ Using 'main' database (restored from backup)
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  totalTrips: number;
  rating: number;
  createdAt: Date;
  lastTripAt?: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export default function RidersScreen() {
  const router = useRouter();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadRiders();
  }, [filter]);

  const loadRiders = async () => {
    try {
      const usersRef = collection(db, 'users');
      const tripsRef = collection(db, 'trips');

      const ridersQuery = query(
        usersRef,
        where('roles', 'array-contains', 'RIDER'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(ridersQuery);

      const ridersList: Rider[] = await Promise.all(
        snapshot.docs.map(async (userDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = userDoc.data();

          // Get rider's trip count
          const tripsQuery = query(
            tripsRef,
            where('riderId', '==', userDoc.id),
            where('status', '==', 'COMPLETED')
          );
          const tripsSnapshot = await getDocs(tripsQuery);

          const totalTrips = tripsSnapshot.size;

          // Get last trip date
          const lastTrip = tripsSnapshot.docs[0];
          const lastTripAt = lastTrip?.data()?.completedAt?.toDate();

          return {
            id: userDoc.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            phone: data.phone || '',
            profilePhoto: data.profilePhoto,
            totalTrips,
            rating: data.rating || 5.0,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastTripAt,
            status: totalTrips > 0 ? 'active' : 'inactive',
          };
        })
      );

      // Apply filter
      let filteredRiders = ridersList;
      if (filter === 'active') {
        filteredRiders = ridersList.filter((r) => r.totalTrips > 0);
      } else if (filter === 'inactive') {
        filteredRiders = ridersList.filter((r) => r.totalTrips === 0);
      }

      setRiders(filteredRiders);
    } catch (error) {
      console.error('❌ Error loading riders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRiders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'inactive':
        return Colors.gray[500];
      case 'suspended':
        return Colors.error;
      default:
        return Colors.gray[500];
    }
  };

  const renderRider = ({ item }: { item: Rider }) => (
    <TouchableOpacity style={styles.riderCard}>
      <View style={styles.riderHeader}>
        {item.profilePhoto ? (
          <Image source={{ uri: item.profilePhoto }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.profilePhotoPlaceholder}>
            <Text style={styles.profilePhotoText}>
              {item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
        )}
        <View style={styles.riderInfo}>
          <Text style={styles.riderName}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.tripsText}>• {item.totalTrips} trips</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.riderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color={Colors.gray[600]} />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color={Colors.gray[600]} />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
      </View>

      <View style={styles.riderFooter}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.gray[500]} />
          <Text style={styles.metaText}>
            Joined {item.createdAt.toLocaleDateString()}
          </Text>
        </View>
        {item.lastTripAt && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.gray[500]} />
            <Text style={styles.metaText}>
              Last trip {item.lastTripAt.toLocaleDateString()}
            </Text>
          </View>
        )}
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
        <Text style={styles.headerTitle}>Riders</Text>
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
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'inactive' && styles.filterButtonActive]}
          onPress={() => setFilter('inactive')}
        >
          <Text style={[styles.filterText, filter === 'inactive' && styles.filterTextActive]}>
            Inactive
          </Text>
        </TouchableOpacity>
      </View>

      {/* Riders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading riders...</Text>
        </View>
      ) : (
        <FlatList
          data={riders}
          renderItem={renderRider}
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
              <Ionicons name="people-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Riders Found</Text>
              <Text style={styles.emptyText}>
                Registered riders will appear here
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
  riderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  profilePhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profilePhotoText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text,
  },
  tripsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
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
  riderDetails: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  riderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
