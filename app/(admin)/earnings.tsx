/**
 * EARNINGS & PAYOUTS SCREEN
 * Shows driver earnings and manages payouts via Wise
 *
 * ✅ UPGRADED TO React Native Firebase v22+ Modular API
 * ✅ Using 'main' database (restored from backup)
 * ✅ Integrated with Wise for mass payouts
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
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit, serverTimestamp, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { WiseService, WiseBalance, BatchPayoutItem } from '@/src/services/wise.service';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

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

  // Wise integration state
  const [wiseBalances, setWiseBalances] = useState<WiseBalance[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [batchResults, setBatchResults] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadWiseBalance();
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
      // Get all drivers and filter for approved/active ones
      // This supports both registrationStatus='approved' and status='active'
      const driversRef = collection(db, 'drivers');
      const driversSnapshot = await getDocs(driversRef);

      // Filter to only approved/active drivers
      const approvedDriverDocs = driversSnapshot.docs.filter((driverDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = driverDoc.data();
        return data.registrationStatus === 'approved' ||
               data.status === 'active' ||
               data.status === 'approved';
      });

      const earningsList: DriverEarnings[] = await Promise.all(
        approvedDriverDocs.map(async (driverDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = driverDoc.data();

          // Get driver's total earnings
          const earningsDocRef = doc(db, 'drivers', driverDoc.id, 'earnings', 'summary');
          const earningsDocSnap = await getDoc(earningsDocRef);

          const earningsData = earningsDocSnap.data();
          const totalEarnings = earningsData?.allTime || 0;

          // Get pending payout amount (not yet paid out)
          const pendingPayout = earningsData?.pendingPayout || 0;

          // Get last payout
          const payoutsRef = collection(db, 'payouts');
          const lastPayoutQuery = query(
            payoutsRef,
            where('driverId', '==', driverDoc.id),
            where('status', '==', 'completed'),
            orderBy('completedAt', 'desc'),
            limit(1)
          );
          const lastPayoutSnapshot = await getDocs(lastPayoutQuery);

          const lastPayout = lastPayoutSnapshot.docs[0]?.data();

          return {
            driverId: driverDoc.id,
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
      const payoutsRef = collection(db, 'payouts');
      const payoutsQuery = query(
        payoutsRef,
        orderBy('requestedAt', 'desc'),
        limit(50)
      );
      const payoutsSnapshot = await getDocs(payoutsQuery);

      const payoutsList: Payout[] = payoutsSnapshot.docs.map((payoutDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = payoutDoc.data();
        return {
          id: payoutDoc.id,
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
    loadWiseBalance();
  };

  const loadWiseBalance = async () => {
    try {
      const result = await WiseService.getBalance();
      if (result.success) {
        setWiseBalances(result.balances);
      }
    } catch (error) {
      console.error('Error loading Wise balance:', error);
    }
  };

  const toggleDriverSelection = (driverId: string) => {
    setSelectedDrivers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(driverId)) {
        newSet.delete(driverId);
      } else {
        newSet.add(driverId);
      }
      return newSet;
    });
  };

  const selectAllDrivers = () => {
    const driversWithPayout = drivers.filter(d => d.pendingPayout > 0);
    setSelectedDrivers(new Set(driversWithPayout.map(d => d.driverId)));
  };

  const clearSelection = () => {
    setSelectedDrivers(new Set());
  };

  const getSelectedTotal = () => {
    return drivers
      .filter(d => selectedDrivers.has(d.driverId))
      .reduce((sum, d) => sum + d.pendingPayout, 0);
  };

  const handleProcessPayout = (driver: DriverEarnings) => {
    if (driver.pendingPayout <= 0) {
      Alert.alert('No Pending Payout', 'This driver has no pending earnings to pay out.');
      return;
    }

    Alert.alert(
      'Process Wise Payout',
      `Send CI$${driver.pendingPayout.toFixed(2)} to ${driver.driverName} via Wise?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: async () => {
            try {
              setProcessingPayout(true);

              // Process via Wise API
              const result = await WiseService.processPayout(
                driver.driverId,
                driver.pendingPayout,
                `Drift Payout - ${driver.driverName}`
              );

              if (result.success) {
                Alert.alert(
                  'Payout Sent',
                  `Successfully sent $${result.sourceAmount.toFixed(2)} USD\n` +
                  `Driver will receive £${result.targetAmount.toFixed(2)} GBP\n` +
                  `Exchange rate: ${result.exchangeRate.toFixed(4)}\n` +
                  `Fee: $${result.fee.toFixed(2)}`
                );
                loadData();
                loadWiseBalance();
              }
            } catch (error: any) {
              console.error('Error processing payout:', error);
              Alert.alert('Error', error.message || 'Failed to process payout. Please try again.');
            } finally {
              setProcessingPayout(false);
            }
          },
        },
      ]
    );
  };

  const handleBatchPayout = async () => {
    if (selectedDrivers.size === 0) {
      Alert.alert('No Selection', 'Please select drivers to pay out.');
      return;
    }

    const payouts: BatchPayoutItem[] = drivers
      .filter(d => selectedDrivers.has(d.driverId) && d.pendingPayout > 0)
      .map(d => ({
        driverId: d.driverId,
        amount: d.pendingPayout,
      }));

    if (payouts.length === 0) {
      Alert.alert('No Payouts', 'Selected drivers have no pending payouts.');
      return;
    }

    setShowBatchModal(true);
  };

  const confirmBatchPayout = async () => {
    try {
      setProcessingPayout(true);
      setBatchResults(null);

      const payouts: BatchPayoutItem[] = drivers
        .filter(d => selectedDrivers.has(d.driverId) && d.pendingPayout > 0)
        .map(d => ({
          driverId: d.driverId,
          amount: d.pendingPayout,
        }));

      const result = await WiseService.processBatchPayouts(payouts);
      setBatchResults(result);

      if (result.failedCount === 0) {
        Alert.alert('Success', `All ${result.successCount} payouts processed successfully!`);
      } else if (result.successCount === 0) {
        Alert.alert('Failed', `All ${result.failedCount} payouts failed. Check results for details.`);
      } else {
        Alert.alert(
          'Partial Success',
          `${result.successCount} succeeded, ${result.failedCount} failed. Check results for details.`
        );
      }

      loadData();
      loadWiseBalance();
      clearSelection();
    } catch (error: any) {
      console.error('Error processing batch payouts:', error);
      Alert.alert('Error', error.message || 'Failed to process batch payouts.');
    } finally {
      setProcessingPayout(false);
    }
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

  const renderDriver = ({ item }: { item: DriverEarnings }) => {
    const isSelected = selectedDrivers.has(item.driverId);

    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleDriverSelection(item.driverId)}
            disabled={item.pendingPayout <= 0}
          >
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
              item.pendingPayout <= 0 && styles.checkboxDisabled,
            ]}>
              {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
            </View>
          </TouchableOpacity>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.driverName}</Text>
            <Text style={styles.tripsText}>{item.totalTrips} trips</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.payoutButton,
              item.pendingPayout <= 0 && styles.payoutButtonDisabled,
              processingPayout && styles.payoutButtonDisabled,
            ]}
            onPress={() => handleProcessPayout(item)}
            disabled={item.pendingPayout <= 0 || processingPayout}
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
  };

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

      {/* Wise Balance */}
      {wiseBalances.length > 0 && (
        <View style={styles.wiseBalanceBar}>
          <View style={styles.wiseLogo}>
            <Text style={styles.wiseLogoText}>Wise</Text>
          </View>
          <View style={styles.wiseBalances}>
            {wiseBalances.map((balance, index) => (
              <View key={index} style={styles.wiseBalanceItem}>
                <Text style={styles.wiseBalanceAmount}>
                  {balance.currency === 'USD' ? '$' : balance.currency === 'GBP' ? '£' : ''}
                  {balance.amount.toFixed(2)}
                </Text>
                <Text style={styles.wiseBalanceCurrency}>{balance.currency}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

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

      {/* Selection Bar (when drivers are selected) */}
      {view === 'earnings' && selectedDrivers.size > 0 && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>{selectedDrivers.size} selected</Text>
            <Text style={styles.selectionTotal}>CI${getSelectedTotal().toFixed(2)}</Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.selectionButton} onPress={clearSelection}>
              <Text style={styles.selectionButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionButton, styles.batchPayButton]}
              onPress={handleBatchPayout}
              disabled={processingPayout}
            >
              {processingPayout ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.batchPayButtonText}>Batch Payout</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Select All Button */}
      {view === 'earnings' && drivers.filter(d => d.pendingPayout > 0).length > 0 && selectedDrivers.size === 0 && (
        <TouchableOpacity style={styles.selectAllButton} onPress={selectAllDrivers}>
          <Ionicons name="checkbox-outline" size={18} color={Colors.primary} />
          <Text style={styles.selectAllText}>Select All with Pending Payouts</Text>
        </TouchableOpacity>
      )}

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

      {/* Batch Payout Modal */}
      <Modal
        visible={showBatchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !processingPayout && setShowBatchModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => !processingPayout && setShowBatchModal(false)}
              disabled={processingPayout}
            >
              <Text style={[styles.modalCancel, processingPayout && { color: Colors.gray[400] }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Batch Payout</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.batchSummary}>
              <View style={styles.wiseLogo}>
                <Text style={styles.wiseLogoText}>Wise</Text>
              </View>
              <Text style={styles.batchTitle}>Mass Payout via Wise</Text>
              <Text style={styles.batchDescription}>
                Send payouts to {selectedDrivers.size} drivers instantly via Wise.
                Each driver will receive funds in GBP to their registered Wise account.
              </Text>
            </View>

            <View style={styles.batchDetails}>
              <View style={styles.batchDetailRow}>
                <Text style={styles.batchDetailLabel}>Total Drivers</Text>
                <Text style={styles.batchDetailValue}>{selectedDrivers.size}</Text>
              </View>
              <View style={styles.batchDetailRow}>
                <Text style={styles.batchDetailLabel}>Total Amount (USD)</Text>
                <Text style={styles.batchDetailValue}>
                  ${getSelectedTotal().toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.batchDriversList}>
              <Text style={styles.batchDriversTitle}>Selected Drivers</Text>
              {drivers
                .filter(d => selectedDrivers.has(d.driverId))
                .map(driver => (
                  <View key={driver.driverId} style={styles.batchDriverItem}>
                    <Text style={styles.batchDriverName}>{driver.driverName}</Text>
                    <Text style={styles.batchDriverAmount}>
                      CI${driver.pendingPayout.toFixed(2)}
                    </Text>
                  </View>
                ))}
            </View>

            {batchResults && (
              <View style={styles.batchResults}>
                <Text style={styles.batchResultsTitle}>Results</Text>
                <View style={styles.batchResultsSummary}>
                  <View style={[styles.resultBadge, { backgroundColor: Colors.success + '20' }]}>
                    <Text style={[styles.resultBadgeText, { color: Colors.success }]}>
                      {batchResults.successCount} Succeeded
                    </Text>
                  </View>
                  {batchResults.failedCount > 0 && (
                    <View style={[styles.resultBadge, { backgroundColor: Colors.error + '20' }]}>
                      <Text style={[styles.resultBadgeText, { color: Colors.error }]}>
                        {batchResults.failedCount} Failed
                      </Text>
                    </View>
                  )}
                </View>
                {batchResults.results
                  .filter((r: any) => !r.success)
                  .map((r: any, i: number) => (
                    <View key={i} style={styles.failedItem}>
                      <Ionicons name="alert-circle" size={16} color={Colors.error} />
                      <Text style={styles.failedItemText}>
                        {drivers.find(d => d.driverId === r.driverId)?.driverName}: {r.error}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            <View style={styles.batchWarning}>
              <Ionicons name="information-circle" size={20} color={Colors.warning} />
              <Text style={styles.batchWarningText}>
                Payouts are processed immediately and cannot be reversed. Make sure all
                driver Wise accounts are verified before proceeding.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {!batchResults ? (
              <TouchableOpacity
                style={[styles.confirmButton, processingPayout && styles.confirmButtonDisabled]}
                onPress={confirmBatchPayout}
                disabled={processingPayout}
              >
                {processingPayout ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="small" color={Colors.white} />
                    <Text style={styles.confirmButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Confirm Payout (${getSelectedTotal().toFixed(2)})
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setShowBatchModal(false);
                  setBatchResults(null);
                }}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  // Wise Balance Bar
  wiseBalanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  wiseLogo: {
    backgroundColor: '#9FE870',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  wiseLogoText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: '#163300',
  },
  wiseBalances: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.lg,
  },
  wiseBalanceItem: {
    alignItems: 'flex-end',
  },
  wiseBalanceAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  wiseBalanceCurrency: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  // Selection UI
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '30',
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  selectionCount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  selectionTotal: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  selectionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  selectionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
  },
  selectionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  batchPayButton: {
    backgroundColor: Colors.success,
  },
  batchPayButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  selectAllText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  // Checkbox
  checkboxContainer: {
    marginRight: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxDisabled: {
    borderColor: Colors.gray[300],
    backgroundColor: Colors.gray[100],
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalCancel: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalFooter: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  // Batch Payout Modal
  batchSummary: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  batchTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  batchDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  batchDetails: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  batchDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  batchDetailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  batchDetailValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  batchDriversList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  batchDriversTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  batchDriverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  batchDriverName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  batchDriverAmount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success,
  },
  batchWarning: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  batchWarningText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    lineHeight: 18,
  },
  batchResults: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  batchResultsTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  batchResultsSummary: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  resultBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  resultBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  failedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  failedItemText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
  },
  confirmButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
