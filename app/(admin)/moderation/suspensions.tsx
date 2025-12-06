/**
 * ADMIN SUSPENSIONS MANAGEMENT SCREEN
 * View and manage driver suspensions
 *
 * UPGRADED TO React Native Firebase v22+ Modular API
 * Using 'main' database (restored from backup) UPGRADED TO v23.5.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

// Initialize Firestore with 'main' database
const app = getApp();
const db = getFirestore(app, 'main');

interface Suspension {
  id: string;
  driverId: string;
  driverName?: string;
  driverEmail?: string;
  type: 'temporary' | 'permanent';
  reason: string;
  strikeId?: string;
  strikeNumber?: number;
  status: 'active' | 'lifted' | 'expired';
  startedAt: Date;
  endsAt?: Date;
  liftedAt?: Date;
  liftedBy?: string;
  liftReason?: string;
}

export default function SuspensionsScreen() {
  const router = useRouter();
  const [suspensions, setSuspensions] = useState<Suspension[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'lifted' | 'all'>('active');

  // Lift modal state
  const [selectedSuspension, setSelectedSuspension] = useState<Suspension | null>(null);
  const [showLiftModal, setShowLiftModal] = useState(false);
  const [liftReason, setLiftReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadSuspensions = useCallback(async () => {
    try {
      // Build query based on filter
      let suspensionsQuery;
      if (filter !== 'all') {
        suspensionsQuery = query(
          collection(db, 'suspensions'),
          where('status', '==', filter),
          orderBy('startedAt', 'desc'),
          limit(50)
        );
      } else {
        suspensionsQuery = query(
          collection(db, 'suspensions'),
          orderBy('startedAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(suspensionsQuery);

      const suspensionsList: Suspension[] = await Promise.all(
        snapshot.docs.map(async (suspensionDoc) => {
          const data = suspensionDoc.data();

          // Get driver info
          let driverName = 'Unknown Driver';
          let driverEmail = '';
          if (data.driverId) {
            try {
              const driverRef = doc(db, 'drivers', data.driverId);
              const driverDoc = await getDoc(driverRef);
              if (driverDoc.exists()) {
                driverName = driverDoc.data()?.name || 'Unknown Driver';
                driverEmail = driverDoc.data()?.email || '';
              }
            } catch (e) {
              console.log('Could not fetch driver');
            }
          }

          return {
            id: suspensionDoc.id,
            driverId: data.driverId,
            driverName,
            driverEmail,
            type: data.type || 'temporary',
            reason: data.reason || '',
            strikeId: data.strikeId,
            strikeNumber: data.strikeNumber,
            status: data.status || 'active',
            startedAt: data.startedAt?.toDate() || new Date(),
            endsAt: data.endsAt?.toDate(),
            liftedAt: data.liftedAt?.toDate(),
            liftedBy: data.liftedBy,
            liftReason: data.liftReason,
          };
        })
      );

      setSuspensions(suspensionsList);
    } catch (error) {
      console.error('Error loading suspensions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadSuspensions();
  }, [loadSuspensions]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSuspensions();
  };

  const openLiftModal = (suspension: Suspension) => {
    setSelectedSuspension(suspension);
    setLiftReason('');
    setShowLiftModal(true);
  };

  const handleLiftSuspension = async () => {
    if (!selectedSuspension) return;

    if (!liftReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for lifting the suspension.');
      return;
    }

    setProcessing(true);

    try {
      // Update suspension
      const suspensionRef = doc(db, 'suspensions', selectedSuspension.id);
      await updateDoc(suspensionRef, {
        status: 'lifted',
        liftedAt: serverTimestamp(),
        liftedBy: 'admin', // In production, use actual admin ID
        liftReason: liftReason.trim(),
      });

      // Update driver safety profile
      const safetyProfileRef = doc(db, 'driver_safety_profiles', selectedSuspension.driverId);
      await updateDoc(safetyProfileRef, {
        suspensionStatus: 'none',
        suspensionLiftedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create audit log entry
      await addDoc(collection(db, 'moderation_actions'), {
        type: 'suspension_lifted',
        targetType: 'driver',
        targetId: selectedSuspension.driverId,
        suspensionId: selectedSuspension.id,
        adminId: 'admin',
        reason: liftReason.trim(),
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Suspension Lifted',
        `${selectedSuspension.driverName}'s suspension has been lifted. They can now go online.`
      );

      setShowLiftModal(false);
      setSelectedSuspension(null);
      loadSuspensions();
    } catch (error) {
      console.error('Error lifting suspension:', error);
      Alert.alert('Error', 'Failed to lift suspension. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getDaysRemaining = (endsAt: Date | undefined) => {
    if (!endsAt) return null;
    const now = new Date();
    const diff = endsAt.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const renderSuspension = ({ item }: { item: Suspension }) => {
    const daysRemaining = getDaysRemaining(item.endsAt);
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 2;

    return (
      <View style={[styles.suspensionCard, item.type === 'permanent' && styles.permanentCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.driverInfo}>
            <View style={[styles.avatar, { backgroundColor: item.type === 'permanent' ? '#FEE2E2' : '#FEF3C7' }]}>
              <Ionicons
                name={item.type === 'permanent' ? 'ban' : 'time'}
                size={20}
                color={item.type === 'permanent' ? '#DC2626' : '#F59E0B'}
              />
            </View>
            <View>
              <Text style={styles.driverName}>{item.driverName}</Text>
              {item.driverEmail && (
                <Text style={styles.driverEmail}>{item.driverEmail}</Text>
              )}
            </View>
          </View>
          <View style={styles.badges}>
            <View style={[styles.typeBadge, {
              backgroundColor: item.type === 'permanent' ? '#FEE2E2' : '#FEF3C7'
            }]}>
              <Text style={[styles.typeText, {
                color: item.type === 'permanent' ? '#DC2626' : '#92400E'
              }]}>
                {item.type.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.statusBadge, {
              backgroundColor: item.status === 'active' ? '#FEE2E2' :
                item.status === 'lifted' ? '#D1FAE5' : '#E5E7EB'
            }]}>
              <Text style={[styles.statusText, {
                color: item.status === 'active' ? '#DC2626' :
                  item.status === 'lifted' ? '#10B981' : Colors.gray[600]
              }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        {item.strikeNumber && (
          <View style={styles.strikeInfo}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={styles.strikeInfoText}>
              Issued after Strike #{item.strikeNumber}
            </Text>
          </View>
        )}

        {/* Timing Info */}
        <View style={styles.timingContainer}>
          <View style={styles.timingItem}>
            <Text style={styles.timingLabel}>Started</Text>
            <Text style={styles.timingValue}>{item.startedAt.toLocaleDateString()}</Text>
          </View>

          {item.type === 'temporary' && item.endsAt && item.status === 'active' && (
            <View style={styles.timingItem}>
              <Text style={styles.timingLabel}>Ends</Text>
              <Text style={[styles.timingValue, isExpiringSoon && styles.expiringSoon]}>
                {item.endsAt.toLocaleDateString()}
                {daysRemaining !== null && ` (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''})`}
              </Text>
            </View>
          )}

          {item.liftedAt && (
            <View style={styles.timingItem}>
              <Text style={styles.timingLabel}>Lifted</Text>
              <Text style={[styles.timingValue, { color: '#10B981' }]}>
                {item.liftedAt.toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {item.liftReason && (
          <View style={styles.liftReasonContainer}>
            <Text style={styles.liftReasonLabel}>Lift Reason:</Text>
            <Text style={styles.liftReasonText}>{item.liftReason}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {item.status === 'active' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.liftButton}
              onPress={() => openLiftModal(item)}
            >
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.liftButtonText}>Lift Suspension</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewProfileButton}
              onPress={() => router.push(`/(admin)/moderation/driver-profiles?id=${item.driverId}`)}
            >
              <Ionicons name="person" size={18} color={Colors.primary} />
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suspensions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsSummary}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {suspensions.filter(s => s.status === 'active' && s.type === 'temporary').length}
          </Text>
          <Text style={styles.statLabel}>Temporary</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>
            {suspensions.filter(s => s.status === 'active' && s.type === 'permanent').length}
          </Text>
          <Text style={styles.statLabel}>Permanent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {suspensions.filter(s => s.status === 'lifted').length}
          </Text>
          <Text style={styles.statLabel}>Lifted</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['active', 'lifted', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Suspensions List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={suspensions}
          renderItem={renderSuspension}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Suspensions</Text>
              <Text style={styles.emptyText}>
                {filter === 'active' ? 'No active suspensions' : 'No suspensions found'}
              </Text>
            </View>
          }
        />
      )}

      {/* Lift Suspension Modal */}
      <Modal
        visible={showLiftModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLiftModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lift Suspension</Text>
              <TouchableOpacity onPress={() => setShowLiftModal(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            {selectedSuspension && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Driver:</Text>
                  <Text style={styles.modalValue}>{selectedSuspension.driverName}</Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Suspension Type:</Text>
                  <Text style={[styles.modalValue, {
                    color: selectedSuspension.type === 'permanent' ? '#DC2626' : '#F59E0B'
                  }]}>
                    {selectedSuspension.type.toUpperCase()}
                  </Text>
                </View>

                {selectedSuspension.type === 'permanent' && (
                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                    <Text style={styles.warningText}>
                      This is a permanent suspension. Lifting it will restore the driver's access permanently.
                    </Text>
                  </View>
                )}

                <View style={styles.notesInput}>
                  <Text style={styles.modalLabel}>Reason for Lifting (Required):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Explain why this suspension is being lifted..."
                    multiline
                    numberOfLines={4}
                    value={liftReason}
                    onChangeText={setLiftReason}
                  />
                </View>

                <TouchableOpacity
                  style={styles.confirmLiftButton}
                  onPress={handleLiftSuspension}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.confirmLiftText}>Confirm Lift Suspension</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  statsSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[600],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 4,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.lg,
  },
  suspensionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  permanentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  driverEmail: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reasonContainer: {
    marginBottom: Spacing.md,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.black,
  },
  strikeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  strikeInfoText: {
    fontSize: 12,
    color: '#92400E',
  },
  timingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  timingItem: {},
  timingLabel: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  timingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 2,
  },
  expiringSoon: {
    color: '#F59E0B',
  },
  liftReasonContainer: {
    backgroundColor: '#D1FAE5',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  liftReasonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  liftReasonText: {
    fontSize: 13,
    color: '#065F46',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  liftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: '#D1FAE5',
    gap: Spacing.xs,
  },
  liftButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  viewProfileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
    gap: Spacing.xs,
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  modalInfo: {
    marginBottom: Spacing.md,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    color: Colors.black,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  notesInput: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.black,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  confirmLiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  confirmLiftText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
