/**
 * ADMIN STRIKES MANAGEMENT SCREEN
 * View and manage driver strikes from the strike queue
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
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from '@react-native-firebase/firestore';
import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

// Initialize Firestore with 'main' database
const app = getApp();
const db = getFirestore(app, 'main');

interface StrikeQueueItem {
  id: string;
  driverId: string;
  driverName?: string;
  tripId: string;
  type: 'speed_violation' | 'route_deviation' | 'early_completion' | 'rider_report' | 'no_response';
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'issued' | 'dismissed';
  details: {
    description?: string;
    speedViolations?: number;
    deviationDistance?: number;
    riderResponse?: string;
  };
  createdAt: Date;
  processedAt?: Date;
}

interface Strike {
  id: string;
  driverId: string;
  driverName?: string;
  tripId: string;
  type: string;
  strikeNumber: number;
  status: 'active' | 'expired' | 'appealed';
  issuedAt: Date;
  expiresAt?: Date;
}

export default function StrikesManagementScreen() {
  const router = useRouter();
  const [queueItems, setQueueItems] = useState<StrikeQueueItem[]>([]);
  const [recentStrikes, setRecentStrikes] = useState<Strike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'recent'>('queue');

  // Issue modal state
  const [selectedItem, setSelectedItem] = useState<StrikeQueueItem | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueNotes, setIssueNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load strike queue
      const queueQuery = query(
        collection(db, 'strike_queue'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const queueSnapshot = await getDocs(queueQuery);

      const queueList: StrikeQueueItem[] = await Promise.all(
        queueSnapshot.docs.map(async (queueDoc) => {
          const data = queueDoc.data();

          // Get driver name
          let driverName = 'Unknown Driver';
          if (data.driverId) {
            try {
              const driverRef = doc(db, 'drivers', data.driverId);
              const driverDoc = await getDoc(driverRef);
              if (driverDoc.exists()) {
                driverName = driverDoc.data()?.name || 'Unknown Driver';
              }
            } catch (e) {
              console.log('Could not fetch driver name');
            }
          }

          return {
            id: queueDoc.id,
            driverId: data.driverId,
            driverName,
            tripId: data.tripId,
            type: data.type,
            severity: data.severity || 'medium',
            status: data.status,
            details: data.details || {},
            createdAt: data.createdAt?.toDate() || new Date(),
            processedAt: data.processedAt?.toDate(),
          };
        })
      );

      setQueueItems(queueList);

      // Load recent strikes
      const strikesQuery = query(
        collection(db, 'strikes'),
        orderBy('issuedAt', 'desc'),
        limit(30)
      );
      const strikesSnapshot = await getDocs(strikesQuery);

      const strikesList: Strike[] = await Promise.all(
        strikesSnapshot.docs.map(async (strikeDoc) => {
          const data = strikeDoc.data();

          let driverName = 'Unknown Driver';
          if (data.driverId) {
            try {
              const driverRef = doc(db, 'drivers', data.driverId);
              const driverDoc = await getDoc(driverRef);
              if (driverDoc.exists()) {
                driverName = driverDoc.data()?.name || 'Unknown Driver';
              }
            } catch (e) {
              console.log('Could not fetch driver name');
            }
          }

          return {
            id: strikeDoc.id,
            driverId: data.driverId,
            driverName,
            tripId: data.tripId,
            type: data.type,
            strikeNumber: data.strikeNumber || 1,
            status: data.status,
            issuedAt: data.issuedAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate(),
          };
        })
      );

      setRecentStrikes(strikesList);
    } catch (error) {
      console.error('Error loading strikes data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openIssueModal = (item: StrikeQueueItem) => {
    setSelectedItem(item);
    setIssueNotes('');
    setShowIssueModal(true);
  };

  const handleIssueStrike = async () => {
    if (!selectedItem) return;

    setProcessing(true);

    try {
      // Get current strike count for driver
      const existingStrikesQuery = query(
        collection(db, 'strikes'),
        where('driverId', '==', selectedItem.driverId),
        where('status', '==', 'active')
      );
      const existingStrikes = await getDocs(existingStrikesQuery);

      const strikeNumber = existingStrikes.size + 1;

      // Create strike
      const strikeData = {
        driverId: selectedItem.driverId,
        tripId: selectedItem.tripId,
        type: selectedItem.type,
        strikeNumber,
        status: 'active',
        issuedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
        ),
        queueItemId: selectedItem.id,
        adminNotes: issueNotes.trim() || undefined,
      };

      await addDoc(collection(db, 'strikes'), strikeData);

      // Update queue item
      const queueItemRef = doc(db, 'strike_queue', selectedItem.id);
      await updateDoc(queueItemRef, {
        status: 'issued',
        processedAt: serverTimestamp(),
      });

      // Update driver safety profile
      const safetyProfileRef = doc(db, 'driver_safety_profiles', selectedItem.driverId);
      await setDoc(safetyProfileRef, {
        activeStrikes: strikeNumber,
        lastStrikeAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Check if suspension needed (strike 2 = 7 day suspension, strike 3 = permanent)
      if (strikeNumber >= 2) {
        const suspensionType = strikeNumber >= 3 ? 'permanent' : 'temporary';
        const suspensionEnd = strikeNumber >= 3
          ? null
          : Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

        await addDoc(collection(db, 'suspensions'), {
          driverId: selectedItem.driverId,
          type: suspensionType,
          reason: `Strike ${strikeNumber} issued`,
          strikeId: selectedItem.id,
          status: 'active',
          startedAt: serverTimestamp(),
          endsAt: suspensionEnd,
        });

        Alert.alert(
          'Strike Issued',
          `Strike #${strikeNumber} issued. Driver has been ${suspensionType === 'permanent' ? 'permanently suspended' : 'suspended for 7 days'}.`
        );
      } else {
        Alert.alert('Strike Issued', `Strike #${strikeNumber} has been issued to the driver.`);
      }

      setShowIssueModal(false);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error('Error issuing strike:', error);
      Alert.alert('Error', 'Failed to issue strike. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDismissItem = async () => {
    if (!selectedItem) return;

    Alert.alert(
      'Dismiss Queue Item',
      'Are you sure you want to dismiss this item without issuing a strike?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const queueItemRef = doc(db, 'strike_queue', selectedItem.id);
              await updateDoc(queueItemRef, {
                status: 'dismissed',
                processedAt: serverTimestamp(),
                dismissReason: issueNotes.trim() || 'No reason provided',
              });

              Alert.alert('Dismissed', 'Queue item has been dismissed.');
              setShowIssueModal(false);
              setSelectedItem(null);
              loadData();
            } catch (error) {
              console.error('Error dismissing item:', error);
              Alert.alert('Error', 'Failed to dismiss item.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'speed_violation': return 'speedometer';
      case 'route_deviation': return 'navigate';
      case 'early_completion': return 'flag';
      case 'rider_report': return 'person';
      case 'no_response': return 'time';
      default: return 'warning';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'speed_violation': return 'Speed Violation';
      case 'route_deviation': return 'Route Deviation';
      case 'early_completion': return 'Early Completion';
      case 'rider_report': return 'Rider Report';
      case 'no_response': return 'No Response to Alert';
      default: return type;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#3B82F6';
      default: return Colors.gray[500];
    }
  };

  const renderQueueItem = ({ item }: { item: StrikeQueueItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => openIssueModal(item)}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: getSeverityColor(item.severity) + '20' }]}>
          <Ionicons
            name={getTypeIcon(item.type) as any}
            size={20}
            color={getSeverityColor(item.severity)}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.driverName}>{item.driverName}</Text>
          <Text style={styles.cardSubtitle}>{getTypeLabel(item.type)}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '20' }]}>
          <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
            {item.severity.toUpperCase()}
          </Text>
        </View>
      </View>

      {item.details.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.details.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {item.createdAt.toLocaleDateString()} at {item.createdAt.toLocaleTimeString()}
        </Text>
        <View style={styles.reviewButton}>
          <Text style={styles.reviewButtonText}>Review</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStrike = ({ item }: { item: Strike }) => (
    <View style={styles.strikeCard}>
      <View style={styles.strikeHeader}>
        <View style={[styles.strikeNumber, {
          backgroundColor: item.strikeNumber >= 3 ? '#DC2626' : item.strikeNumber === 2 ? '#F59E0B' : '#3B82F6'
        }]}>
          <Text style={styles.strikeNumberText}>#{item.strikeNumber}</Text>
        </View>
        <View style={styles.strikeInfo}>
          <Text style={styles.driverName}>{item.driverName}</Text>
          <Text style={styles.cardSubtitle}>{getTypeLabel(item.type)}</Text>
        </View>
        <View style={[styles.statusBadge, {
          backgroundColor: item.status === 'active' ? '#FEE2E2' : item.status === 'expired' ? '#D1FAE5' : '#DBEAFE'
        }]}>
          <Text style={[styles.statusText, {
            color: item.status === 'active' ? '#DC2626' : item.status === 'expired' ? '#10B981' : '#3B82F6'
          }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.strikeFooter}>
        <Text style={styles.dateText}>
          Issued: {item.issuedAt.toLocaleDateString()}
        </Text>
        {item.expiresAt && item.status === 'active' && (
          <Text style={styles.expiresText}>
            Expires: {item.expiresAt.toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Strike Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'queue' && styles.tabActive]}
          onPress={() => setActiveTab('queue')}
        >
          <Text style={[styles.tabText, activeTab === 'queue' && styles.tabTextActive]}>
            Queue ({queueItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
            Recent Strikes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeTab === 'queue' ? (
        <FlatList
          data={queueItems}
          renderItem={renderQueueItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>Queue Empty</Text>
              <Text style={styles.emptyText}>No pending items to review</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={recentStrikes}
          renderItem={renderStrike}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="flash-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Strikes</Text>
              <Text style={styles.emptyText}>No strikes have been issued</Text>
            </View>
          }
        />
      )}

      {/* Issue Strike Modal */}
      <Modal
        visible={showIssueModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIssueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Violation</Text>
              <TouchableOpacity onPress={() => setShowIssueModal(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Driver:</Text>
                  <Text style={styles.modalValue}>{selectedItem.driverName}</Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Violation Type:</Text>
                  <Text style={styles.modalValue}>{getTypeLabel(selectedItem.type)}</Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Severity:</Text>
                  <Text style={[styles.modalValue, { color: getSeverityColor(selectedItem.severity) }]}>
                    {selectedItem.severity.toUpperCase()}
                  </Text>
                </View>

                {selectedItem.details.description && (
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Details:</Text>
                    <Text style={styles.modalValue}>{selectedItem.details.description}</Text>
                  </View>
                )}

                <View style={styles.notesInput}>
                  <Text style={styles.modalLabel}>Admin Notes (Optional):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Add notes about this decision..."
                    multiline
                    numberOfLines={3}
                    value={issueNotes}
                    onChangeText={setIssueNotes}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={handleDismissItem}
                    disabled={processing}
                  >
                    <Text style={styles.dismissButtonText}>Dismiss</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.issueButton]}
                    onPress={handleIssueStrike}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="flash" size={20} color="#FFFFFF" />
                        <Text style={styles.issueButtonText}>Issue Strike</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  tabTextActive: {
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.gray[600],
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  cardFooter: {
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
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 4,
  },
  strikeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  strikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strikeNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  strikeNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  strikeInfo: {
    flex: 1,
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
  strikeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  expiresText: {
    fontSize: 12,
    color: Colors.gray[500],
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  dismissButton: {
    backgroundColor: Colors.gray[200],
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[700],
  },
  issueButton: {
    backgroundColor: '#DC2626',
  },
  issueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
