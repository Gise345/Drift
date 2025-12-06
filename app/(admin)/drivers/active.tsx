/**
 * ACTIVE DRIVERS SCREEN
 * Shows all approved/active drivers with management options
 *
 * UPGRADED TO React Native Firebase v22+ Modular API
 * Using 'main' database (restored from backup) UPGRADED TO v23.5.0
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
import { getFirestore, collection, getDocs, where, query, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface ActiveDriver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rating: number;
  totalTrips: number;
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  status: string;
  profilePhotoUrl?: string;
}

export default function ActiveDriversScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      // Try querying by registrationStatus first (primary field)
      const driversRef = collection(db, 'drivers');
      let driversQuery = query(driversRef, where('registrationStatus', '==', 'approved'));
      let snapshot = await getDocs(driversQuery);

      // If no results, try querying by status field (fallback for older documents)
      if (snapshot.empty) {
        console.log('🔄 No drivers found with registrationStatus, trying status field...');
        driversQuery = query(driversRef, where('status', '==', 'approved'));
        snapshot = await getDocs(driversQuery);
      }

      const driversList: ActiveDriver[] = snapshot.docs.map((driverDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = driverDoc.data();
        return {
          id: driverDoc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          rating: data.rating || 5.0,
          totalTrips: data.totalTrips || 0,
          vehicle: {
            make: data.vehicle?.make || '',
            model: data.vehicle?.model || '',
            year: data.vehicle?.year || 0,
            licensePlate: data.vehicle?.licensePlate || '',
          },
          status: data.registrationStatus || data.status || 'active',
          profilePhotoUrl: data.profilePhotoUrl,
        };
      });

      // Sort by createdAt client-side to avoid needing a composite index
      driversList.sort((a, b) => {
        const docA = snapshot.docs.find(d => d.id === a.id);
        const docB = snapshot.docs.find(d => d.id === b.id);
        const dateA = docA?.data()?.createdAt?.toDate?.() || new Date(0);
        const dateB = docB?.data()?.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(`✅ Loaded ${driversList.length} active drivers`);
      setDrivers(driversList);
    } catch (error) {
      console.error('❌ Error loading active drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDrivers();
  };

  const renderDriver = ({ item }: { item: ActiveDriver }) => (
    <TouchableOpacity
      style={styles.driverCard}
      onPress={() => router.push({
        pathname: '/(admin)/drivers/review/[driverId]',
        params: { driverId: item.id }
      })}
    >
      <View style={styles.driverHeader}>
        {item.profilePhotoUrl ? (
          <Image source={{ uri: item.profilePhotoUrl }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.profilePhotoPlaceholder}>
            <Text style={styles.profilePhotoText}>
              {item.firstName[0]}{item.lastName[0]}
            </Text>
          </View>
        )}
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.firstName} {item.lastName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.tripsText}>• {item.totalTrips} trips</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${Colors.success}15` }]}>
          <Text style={[styles.statusText, { color: Colors.success }]}>Active</Text>
        </View>
      </View>

      <View style={styles.driverDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color={Colors.gray[600]} />
          <Text style={styles.detailText}>
            {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color={Colors.gray[600]} />
          <Text style={styles.detailText}>{item.vehicle.licensePlate}</Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <View style={styles.contactItem}>
          <Ionicons name="mail-outline" size={14} color={Colors.gray[500]} />
          <Text style={styles.contactText}>{item.email}</Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="call-outline" size={14} color={Colors.gray[500]} />
          <Text style={styles.contactText}>{item.phone}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Drivers</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{drivers.length} Active Drivers</Text>
      </View>

      {/* Drivers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading drivers...</Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          renderItem={renderDriver}
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
              <Ionicons name="car-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Active Drivers</Text>
              <Text style={styles.emptyText}>
                Approved drivers will appear here
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
    backgroundColor: Colors.white,
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
    color: Colors.black,
  },
  statsBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  statsText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  listContent: {
    padding: Spacing.lg,
  },
  driverCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  driverHeader: {
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profilePhotoText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
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
    color: Colors.black,
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
  driverDetails: {
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
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    marginTop: Spacing.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  contactText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  viewDetailsText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
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
    color: Colors.black,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },
});
