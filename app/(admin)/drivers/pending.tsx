/**
 * ADMIN - PENDING DRIVER APPLICATIONS
 * Review and approve/reject driver registrations
 *
 * UPGRADED TO React Native Firebase v22+ Modular API
 * Using 'main' database (restored from backup) UPGRADED TO v23.5.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, getDocs, where, query, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface PendingDriver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
  };
  submittedAt: Date;
  registrationStatus: string;
}

export default function PendingDriverApplications() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh when screen comes into focus (e.g., after reviewing a driver)
  useFocusEffect(
    useCallback(() => {
      loadPendingDrivers();
    }, [])
  );

  const loadPendingDrivers = async () => {
    try {
      // Query by registrationStatus field only
      const driversRef = collection(db, 'drivers');
      const driversQuery = query(driversRef, where('registrationStatus', '==', 'pending'));
      const snapshot = await getDocs(driversQuery);

      const pendingDrivers: PendingDriver[] = snapshot.docs.map((driverDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = driverDoc.data();
        return {
          id: driverDoc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          vehicle: data.vehicle || { make: '', model: '', year: 0, color: '', licensePlate: '' },
          submittedAt: data.submittedAt?.toDate() || data.createdAt?.toDate() || new Date(),
          registrationStatus: data.registrationStatus || 'pending',
        };
      });

      // Sort by submittedAt client-side to avoid needing a composite index
      pendingDrivers.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      console.log(`✅ Loaded ${pendingDrivers.length} pending drivers`);
      setDrivers(pendingDrivers);
    } catch (error) {
      console.error('❌ Error loading pending drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPendingDrivers();
  };

  const handleReviewDriver = (driverId: string) => {
    router.push(`/(admin)/drivers/review/${driverId}` as any);
  };

  const renderDriverCard = ({ item }: { item: PendingDriver }) => {
    const daysAgo = Math.floor(
      (new Date().getTime() - item.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        style={styles.driverCard}
        onPress={() => handleReviewDriver(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.driverHeader}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarText}>
              {item.firstName[0]}{item.lastName[0]}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.driverEmail}>{item.email}</Text>
            <Text style={styles.driverPhone}>{item.phone}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>PENDING</Text>
          </View>
        </View>

        <View style={styles.vehicleInfo}>
          <Ionicons name="car-outline" size={16} color={Colors.gray[600]} />
          <Text style={styles.vehicleText}>
            {item.vehicle.make} {item.vehicle.model} {item.vehicle.year} • {item.vehicle.color}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.timeInfo}>
            <Ionicons name="time-outline" size={14} color={Colors.gray[500]} />
            <Text style={styles.timeText}>
              {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
            </Text>
          </View>
          <View style={styles.reviewButton}>
            <Text style={styles.reviewButtonText}>Review Application</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Pending Applications</Text>
          <Text style={styles.headerSubtitle}>{drivers.length} awaiting review</Text>
        </View>
      </View>

      {/* Driver List */}
      {drivers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color={Colors.gray[400]} />
          <Text style={styles.emptyText}>No pending applications</Text>
          <Text style={styles.emptySubtext}>All driver applications have been reviewed</Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          renderItem={renderDriverCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: Spacing.xs / 2,
  },
  listContent: {
    padding: Spacing.xl,
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
    marginBottom: Spacing.md,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  driverEmail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginBottom: Spacing.xs / 4,
  },
  driverPhone: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  statusBadge: {
    backgroundColor: Colors.warning + '20',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    height: 24,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.warning,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  vehicleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
    marginLeft: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    marginLeft: Spacing.xs,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
    marginRight: Spacing.xs / 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[900],
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
