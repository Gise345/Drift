/**
 * EARNINGS & PAYOUTS SCREEN
 * Shows driver earnings and manages payouts
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import firestore from '@react-native-firebase/firestore';

interface DriverEarnings {
  driverId: string;
  driverName: string;
  totalEarnings: number;
  pendingPayout: number;
  lastPayout?: Date;
  lastPayoutAmount?: number;
  totalTrips: number;
  avgTripEarnings: number;
}

interface Payout {
  id: string;
  driverId: string;
  driverName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  method: string;
}

export default function EarningsScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverEarnings[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'earnings' | 'payouts'>('earnings');

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    try {
      if (view === 'earnings') {
        await loadDriverEarnings();
      } else {
        await loadPayouts();
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDriverEarnings = async () => {
    try {
      // Get all approved drivers
      const driversSnapshot = await firestore()
        .collection('drivers')
        .where('registrationStatus', '==', 'approved')
        .get();

      const earningsList: DriverEarnings[] = await Promise.all(
        driversSnapshot.docs.map(async (doc) => {
          const data = doc.data();

          // Get driver's total earnings
          const earningsDoc = await firestore()
            .collection('drivers')
            .doc(doc.id)
            .collection('earnings')
            .doc('summary')
            .get();

          const earningsData = earningsDoc.data();
          const totalEarnings = earningsData?.allTime || 0;

          // Get pending payout amount (not yet paid out)
          const pendingPayout = earningsData?.pendingPayout || 0;

          // Get last payout
          const lastPayoutSnapshot = await firestore()
            .collection('payouts')
            .where('driverId', '==', doc.id)
            .where('status', '==', 'completed')
            .orderBy('completedAt', 'desc')
            .limit(1)
            .get();

          const lastPayout = lastPayoutSnapshot.docs[0]?.data();

          return {
            driverId: doc.id,
            driverName: `${data.firstName} ${data.lastName}`,
            totalEarnings,
            pendingPayout,
            lastPayout: lastPayout?.completedAt?.toDate(),
            lastPayoutAmount: lastPayout?.amount,
            totalTrips: data.totalTrips || 0,
            avgTripEarnings: data.totalTrips > 0 ? totalEarnings / data.totalTrips : 0,
          };
        })
      );

      // Sort by pending payout (highest first)
      earningsList.sort((a, b) => b.pendingPayout - a.pendingPayout);

      setDrivers(earningsList);
    } catch (error) {
      console.error('❌ Error loading driver earnings:', error);
    }
  };

  const loadPayouts = async () => {
    try {
      const payoutsSnapshot = await firestore()
        .collection('payouts')
        .orderBy('requestedAt', 'desc')
        .limit(50)
        .get();

      const payoutsList: Payout[] = payoutsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          driverId: data.driverId,
          driverName: data.driverName,
          amount: data.amount,
          status: data.status,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          method: data.method || 'Bank Transfer',
        };
      });

      setPayouts(payoutsList);
    } catch (error) {
      console.error('❌ Error loading payouts:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleProcessPayout = (driver: DriverEarnings) => {
    if (driver.pendingPayout <= 0) {
      Alert.alert('No Pending Payout', 'This driver has no pending earnings to pay out.');
      return;
    }

    Alert.alert(
      'Process Payout',
      `Process payout of CI$${driver.pendingPayout.toFixed(2)} for ${driver.driverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: async () => {
            try {
              // Create payout record
              await firestore().collection('payouts').add({
                driverId: driver.driverId,
                driverName: driver.driverName,
                amount: driver.pendingPayout,
                status: 'processing',
                requestedAt: new Date(),
                method: 'Bank Transfer',
                createdAt: new Date(),
              });

              // Clear pending payout
              await firestore()
                .collection('drivers')
                .doc(driver.driverId)
                .collection('earnings')
                .doc('summary')
                .update({
                  pendingPayout: 0,
                  lastPayoutAt: new Date(),
                  lastPayoutAmount: driver.pendingPayout,
                });

              Alert.alert('Success', 'Payout has been processed successfully.');
              loadData();
            } catch (error) {
              console.error('❌ Error processing payout:', error);
              Alert.alert('Error', 'Failed to process payout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'processing':
        return Colors.info;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.gray[500];
    }
  };

  const renderDriver = ({ item }: { item: DriverEarnings }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.driverName}</Text>
          <Text style={styles.tripsText}>{item.totalTrips} trips</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.payoutButton,
            item.pendingPayout <= 0 && styles.payoutButtonDisabled,
          ]}
          onPress={() => handleProcessPayout(item)}
          disabled={item.pendingPayout <= 0}
        >
          <Text style={styles.payoutButtonText}>Pay Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.earningsGrid}>
        <View style={styles.earningsItem}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsValue}>CI${item.totalEarnings.toFixed(2)}</Text>
        </View>
        <View style={styles.earningsItem}>
          <Text style={styles.earningsLabel}>Pending Payout</Text>
          <Text style={[styles.earningsValue, { color: Colors.warning }]}>
            CI${item.pendingPayout.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.earningsGrid}>
        <View style={styles.earningsItem}>
          <Text style={styles.earningsLabel}>Avg per Trip</Text>
          <Text style={styles.earningsSecondary}>
            CI${item.avgTripEarnings.toFixed(2)}
          </Text>
        </View>
        {item.lastPayout && (
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Last Payout</Text>
            <Text style={styles.earningsSecondary}>
              CI${item.lastPayoutAmount?.toFixed(2)} • {item.lastPayout.toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPayout = ({ item }: { item: Payout }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.driverName}</Text>
          <Text style={styles.metaText}>
            {item.requestedAt.toLocaleDateString()} • {item.method}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.payoutAmount}>
        <Text style={styles.payoutAmountLabel}>Amount</Text>
        <Text style={styles.payoutAmountValue}>CI${item.amount.toFixed(2)}</Text>
      </View>

      {item.completedAt && (
        <Text style={styles.completedText}>
          Completed on {item.completedAt.toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings & Payouts</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* View Toggle */}
      <View style={styles.toggleBar}>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'earnings' && styles.toggleButtonActive]}
          onPress={() => setView('earnings')}
        >
          <Text style={[styles.toggleText, view === 'earnings' && styles.toggleTextActive]}>
            Driver Earnings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'payouts' && styles.toggleButtonActive]}
          onPress={() => setView('payouts')}
        >
          <Text style={[styles.toggleText, view === 'payouts' && styles.toggleTextActive]}>
            Payout History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={view === 'earnings' ? drivers : payouts}
          renderItem={view === 'earnings' ? renderDriver : renderPayout}
          keyExtractor={(item) => (view === 'earnings' ? (item as DriverEarnings).driverId : (item as Payout).id)}
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
              <Ionicons name="cash-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Data Found</Text>
              <Text style={styles.emptyText}>
                {view === 'earnings'
                  ? 'Driver earnings will appear here'
                  : 'Payout history will appear here'}
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
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  toggleTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  tripsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  payoutButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
  },
  payoutButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  payoutButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  earningsItem: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
  },
  earningsSecondary: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
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
  payoutAmount: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  payoutAmountLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  payoutAmountValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
  },
  completedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
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
