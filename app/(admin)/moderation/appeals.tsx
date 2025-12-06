/**
 * ADMIN APPEALS REVIEW SCREEN
 * Review and process driver appeals for strikes and suspensions
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
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, orderBy, where, limit, query, serverTimestamp, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface Appeal {
  id: string;
  driverId: string;
  driverName?: string;
  strikeId?: string;
  suspensionId?: string;
  reason: string;
  evidenceUrls: string[];
  status: 'pending' | 'approved' | 'denied';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  strikeType?: string;
  strikeNumber?: number;
}

export default function AppealsReviewScreen() {
  const router = useRouter();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'denied' | 'all'>('pending');

  // Review modal state
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadAppeals = useCallback(async () => {
    try {
      const appealsRef = collection(db, 'appeals');
      let appealsQuery;

      if (filter !== 'all') {
        appealsQuery = query(
          appealsRef,
          where('status', '==', filter),
          orderBy('submittedAt', 'desc'),
          limit(50)
        );
      } else {
        appealsQuery = query(appealsRef, orderBy('submittedAt', 'desc'), limit(50));
      }

      const snapshot = await getDocs(appealsQuery);

      const appealsList: Appeal[] = await Promise.all(
        snapshot.docs.map(async (appealDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = appealDoc.data();

          // Get driver name
          let driverName = 'Unknown Driver';
          if (data.driverId) {
            try {
              const driverDocRef = doc(db, 'drivers', data.driverId);
              const driverDoc = await getDoc(driverDocRef);
              if (driverDoc.exists()) {
                driverName = driverDoc.data()?.name || 'Unknown Driver';
              }
            } catch (e) {
              console.log('Could not fetch driver name');
            }
          }

          // Get strike info if available
          let strikeType = '';
          let strikeNumber = 0;
          if (data.strikeId) {
            try {
              const strikeDocRef = doc(db, 'strikes', data.strikeId);
              const strikeDoc = await getDoc(strikeDocRef);
              if (strikeDoc.exists()) {
                strikeType = strikeDoc.data()?.type || '';
                strikeNumber = strikeDoc.data()?.strikeNumber || 0;
              }
            } catch (e) {
              console.log('Could not fetch strike info');
            }
          }

          return {
            id: appealDoc.id,
            driverId: data.driverId,
            driverName,
            strikeId: data.strikeId,
            suspensionId: data.suspensionId,
            reason: data.reason || '',
            evidenceUrls: data.evidenceUrls || [],
            status: data.status || 'pending',
            submittedAt: data.submittedAt?.toDate() || new Date(),
            reviewedAt: data.reviewedAt?.toDate(),
            reviewedBy: data.reviewedBy,
            reviewNotes: data.reviewNotes,
            strikeType,
            strikeNumber,
          };
        })
      );

      setAppeals(appealsList);
    } catch (error) {
      console.error('Error loading appeals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAppeals();
  };

  const openReviewModal = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleReviewDecision = async (decision: 'approved' | 'denied') => {
    if (!selectedAppeal) return;

    if (!reviewNotes.trim()) {
      Alert.alert('Notes Required', 'Please provide review notes explaining your decision.');
      return;
    }

    setProcessing(true);

    try {
      // Update appeal status
      const appealDocRef = doc(db, 'appeals', selectedAppeal.id);
      await updateDoc(appealDocRef, {
        status: decision,
        reviewedAt: serverTimestamp(),
        reviewedBy: 'admin', // In production, use actual admin ID
        reviewNotes: reviewNotes.trim(),
      });

      // If approved and has strikeId, remove the strike
      if (decision === 'approved' && selectedAppeal.strikeId) {
        const strikeDocRef = doc(db, 'strikes', selectedAppeal.strikeId);
        await updateDoc(strikeDocRef, {
          status: 'appealed',
          appealedAt: serverTimestamp(),
          appealId: selectedAppeal.id,
        });

        // Update driver's active strike count
        const strikesRef = collection(db, 'strikes');
        const strikesQuery = query(
          strikesRef,
          where('driverId', '==', selectedAppeal.driverId),
          where('status', '==', 'active')
        );
        const strikesSnapshot = await getDocs(strikesQuery);

        const safetyProfileRef = doc(db, 'driver_safety_profiles', selectedAppeal.driverId);
        await updateDoc(safetyProfileRef, {
          activeStrikes: strikesSnapshot.size,
          updatedAt: serverTimestamp(),
        });
      }

      // If approved and has suspensionId, lift the suspension
      if (decision === 'approved' && selectedAppeal.suspensionId) {
        const suspensionDocRef = doc(db, 'suspensions', selectedAppeal.suspensionId);
        await updateDoc(suspensionDocRef, {
          status: 'lifted',
          liftedAt: serverTimestamp(),
          liftReason: 'appeal_approved',
          appealId: selectedAppeal.id,
        });
      }

      Alert.alert(
        'Decision Recorded',
        `Appeal has been ${decision}. The driver will be notified.`
      );

      setShowReviewModal(false);
      setSelectedAppeal(null);
      loadAppeals();
    } catch (error) {
      console.error('Error processing appeal:', error);
      Alert.alert('Error', 'Failed to process appeal. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'denied': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return Colors.gray[500];
    }
  };

  const getStrikeTypeLabel = (type: string) => {
    switch (type) {
      case 'speed_violation': return 'Speed Violation';
      case 'route_deviation': return 'Route Deviation';
      case 'early_completion': return 'Early Completion';
      case 'rider_report': return 'Rider Report';
      default: return type || 'Unknown';
    }
  };

  const renderAppeal = ({ item }: { item: Appeal }) => (
    <TouchableOpacity
      style={styles.appealCard}
      onPress={() => item.status === 'pending' && openReviewModal(item)}
      disabled={item.status !== 'pending'}
    >
      <View style={styles.appealHeader}>
        <View style={styles.appealInfo}>
          <Text style={styles.driverName}>{item.driverName}</Text>
          <Text style={styles.appealId}>Appeal #{item.id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {item.strikeId && (
        <View style={styles.strikeInfo}>
          <Ionicons name="flash" size={16} color="#F59E0B" />
          <Text style={styles.strikeText}>
            Strike #{item.strikeNumber} - {getStrikeTypeLabel(item.strikeType || '')}
          </Text>
        </View>
      )}

      <View style={styles.reasonContainer}>
        <Text style={styles.reasonLabel}>Appeal Reason:</Text>
        <Text style={styles.reasonText} numberOfLines={3}>{item.reason}</Text>
      </View>

      {item.evidenceUrls.length > 0 && (
        <View style={styles.evidenceContainer}>
          <Ionicons name="attach" size={16} color={Colors.gray[600]} />
          <Text style={styles.evidenceText}>
            {item.evidenceUrls.length} file{item.evidenceUrls.length > 1 ? 's' : ''} attached
          </Text>
        </View>
      )}

      <View style={styles.appealFooter}>
        <Text style={styles.dateText}>
          Submitted: {item.submittedAt.toLocaleDateString()} at {item.submittedAt.toLocaleTimeString()}
        </Text>
        {item.status === 'pending' && (
          <View style={styles.reviewPrompt}>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </View>
        )}
      </View>

      {item.reviewNotes && (
        <View style={styles.reviewNotesContainer}>
          <Text style={styles.reviewNotesLabel}>Admin Notes:</Text>
          <Text style={styles.reviewNotesText}>{item.reviewNotes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appeal Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['pending', 'approved', 'denied', 'all'] as const).map((f) => (
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

      {/* Appeals List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={appeals}
          renderItem={renderAppeal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Appeals</Text>
              <Text style={styles.emptyText}>
                {filter === 'pending' ? 'No pending appeals to review' : 'No appeals found'}
              </Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Appeal</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            {selectedAppeal && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Driver:</Text>
                  <Text style={styles.modalValue}>{selectedAppeal.driverName}</Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Appeal Reason:</Text>
                  <Text style={styles.modalValue}>{selectedAppeal.reason}</Text>
                </View>

                {selectedAppeal.strikeType && (
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Strike Type:</Text>
                    <Text style={styles.modalValue}>
                      {getStrikeTypeLabel(selectedAppeal.strikeType)}
                    </Text>
                  </View>
                )}

                <View style={styles.notesInput}>
                  <Text style={styles.modalLabel}>Review Notes (Required):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Explain your decision..."
                    multiline
                    numberOfLines={4}
                    value={reviewNotes}
                    onChangeText={setReviewNotes}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.decisionButton, styles.denyButton]}
                    onPress={() => handleReviewDecision('denied')}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.decisionButtonText}>Deny Appeal</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionButton, styles.approveButton]}
                    onPress={() => handleReviewDecision('approved')}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.decisionButtonText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
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
  appealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  appealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  appealInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  appealId: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  strikeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  strikeText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
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
    lineHeight: 20,
  },
  evidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  evidenceText: {
    fontSize: 13,
    color: Colors.gray[600],
  },
  appealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  dateText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  reviewPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewNotesContainer: {
    backgroundColor: Colors.gray[100],
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  reviewNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  reviewNotesText: {
    fontSize: 13,
    color: Colors.black,
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
    maxHeight: '80%',
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
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  decisionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  denyButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  decisionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
