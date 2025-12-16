/**
 * Admin Trip Issues Screen
 *
 * UPGRADED TO React Native Firebase v22+ Modular API
 * Using 'main' database (restored from backup) UPGRADED TO v23.5.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, doc, getDocs, updateDoc, orderBy, where, query, serverTimestamp, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');
const functions = getFunctions(app, 'us-east1');

interface TripIssue {
  id: string;
  tripId: string;
  riderId: string;
  riderName: string;
  riderEmail: string;
  driverName: string;
  issueDescription: string;
  tripDate: string;
  tripCost: number;
  status: 'pending' | 'reviewed' | 'refunded' | 'rejected' | 'driver_suspended' | 'driver_banned';
  createdAt: Date;
  adminAction: string | null;
  adminNotes: string | null;
  resolvedAt: Date | null;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'reviewed', label: 'Reviewed', color: '#3B82F6' },
  { value: 'refunded', label: 'Refunded', color: '#10B981' },
  { value: 'rejected', label: 'Rejected', color: '#6B7280' },
  { value: 'driver_suspended', label: 'Driver Suspended', color: '#F97316' },
  { value: 'driver_banned', label: 'Driver Banned', color: '#EF4444' },
];

const ACTION_OPTIONS = [
  { value: 'refund', label: 'Issue Refund', icon: 'cash-outline', color: '#10B981' },
  { value: 'reject', label: 'Reject Claim', icon: 'close-circle-outline', color: '#6B7280' },
  { value: 'suspend', label: 'Suspend Driver', icon: 'pause-circle-outline', color: '#F97316' },
  { value: 'ban', label: 'Ban Driver', icon: 'ban-outline', color: '#EF4444' },
];

export default function TripIssuesScreen() {
  const router = useRouter();
  const [issues, setIssues] = useState<TripIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<TripIssue | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  useEffect(() => {
    loadIssues();
  }, [filter]);

  const loadIssues = async () => {
    try {
      setLoading(true);

      const issuesRef = collection(db, 'tripIssues');
      let issuesQuery;

      if (filter === 'pending') {
        issuesQuery = query(
          issuesRef,
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
      } else {
        issuesQuery = query(issuesRef, orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(issuesQuery);
      const issuesList: TripIssue[] = [];

      snapshot.forEach((issueDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = issueDoc.data();
        issuesList.push({
          id: issueDoc.id,
          tripId: data.tripId,
          riderId: data.riderId,
          riderName: data.riderName || 'Unknown',
          riderEmail: data.riderEmail || '',
          driverName: data.driverName || 'Unknown',
          issueDescription: data.issueDescription,
          tripDate: data.tripDate,
          tripCost: data.tripCost || 0,
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
          adminAction: data.adminAction,
          adminNotes: data.adminNotes,
          resolvedAt: data.resolvedAt?.toDate() || null,
        });
      });

      setIssues(issuesList);
    } catch (error) {
      console.error('Error loading issues:', error);
      Alert.alert('Error', 'Failed to load trip issues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadIssues();
  };

  const handleAction = async (action: string) => {
    if (!selectedIssue) return;

    // Confirm before processing refunds
    if (action === 'refund') {
      Alert.alert(
        'Confirm Refund',
        `Are you sure you want to issue a full refund of CI$${selectedIssue.tripCost.toFixed(2)} to ${selectedIssue.riderName}?\n\nThis will process the refund through Stripe and cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Issue Refund', style: 'destructive', onPress: () => processAction(action) },
        ]
      );
      return;
    }

    // Confirm before suspending/banning
    if (action === 'suspend' || action === 'ban') {
      Alert.alert(
        `Confirm ${action === 'suspend' ? 'Suspension' : 'Ban'}`,
        `Are you sure you want to ${action} driver ${selectedIssue.driverName}?\n\nThis action will prevent them from receiving new ride requests.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: action === 'suspend' ? 'Suspend' : 'Ban', style: 'destructive', onPress: () => processAction(action) },
        ]
      );
      return;
    }

    processAction(action);
  };

  const processAction = async (action: string) => {
    if (!selectedIssue) return;

    setProcessingAction(true);

    try {
      // Call Cloud Function to process the issue
      const processTripIssueRefund = httpsCallable(functions, 'processTripIssueRefund');
      const result = await processTripIssueRefund({
        issueId: selectedIssue.id,
        action: action,
        adminNotes: adminNotes.trim() || undefined,
      });

      const data = result.data as { success: boolean; status: string; refund?: { amount: number } };

      setShowActionModal(false);
      setSelectedIssue(null);
      setAdminNotes('');

      if (action === 'refund' && data.refund) {
        Alert.alert(
          'Refund Processed',
          `Successfully refunded CI$${data.refund.amount.toFixed(2)} to ${selectedIssue.riderName}.\n\nThe rider will receive the funds within 5-10 business days.`
        );
      } else {
        Alert.alert('Success', `Issue has been marked as ${data.status.replace('_', ' ')}`);
      }

      loadIssues();
    } catch (error: any) {
      console.error('Error processing action:', error);
      const errorMessage = error?.message || 'Failed to process action';
      Alert.alert('Error', errorMessage);
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option || { label: status, color: '#6B7280' };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderIssueCard = ({ item }: { item: TripIssue }) => {
    const statusBadge = getStatusBadge(item.status);

    return (
      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => {
          setSelectedIssue(item);
          setShowActionModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.riderName}>{item.riderName}</Text>
            <Text style={styles.tripDate}>Trip: {item.tripDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusBadge.color }]}>{statusBadge.label}</Text>
          </View>
        </View>

        <View style={styles.issueDetails}>
          <Text style={styles.driverLabel}>Driver: {item.driverName}</Text>
          <Text style={styles.costLabel}>Trip Cost: CI${item.tripCost.toFixed(2)}</Text>
        </View>

        <Text style={styles.issueDescription} numberOfLines={3}>
          {item.issueDescription}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.reportedDate}>Reported: {formatDate(item.createdAt)}</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Issues</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d1289" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Issues</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All Issues
          </Text>
        </TouchableOpacity>
      </View>

      {/* Issues List */}
      <FlatList
        data={issues}
        renderItem={renderIssueCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#5d1289" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>No Issues</Text>
            <Text style={styles.emptyText}>
              {filter === 'pending' ? 'No pending issues to review' : 'No issues reported yet'}
            </Text>
          </View>
        }
      />

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Issue</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedIssue && (
              <>
                <View style={styles.issueInfo}>
                  <Text style={styles.infoLabel}>Rider: {selectedIssue.riderName}</Text>
                  <Text style={styles.infoLabel}>Driver: {selectedIssue.driverName}</Text>
                  <Text style={styles.infoLabel}>Trip Date: {selectedIssue.tripDate}</Text>
                  <Text style={styles.infoLabel}>Cost: CI${selectedIssue.tripCost.toFixed(2)}</Text>
                </View>

                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionLabel}>Issue Description:</Text>
                  <Text style={styles.descriptionText}>{selectedIssue.issueDescription}</Text>
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Admin notes (optional)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                />

                <Text style={styles.actionsLabel}>Take Action:</Text>
                <View style={styles.actionButtons}>
                  {ACTION_OPTIONS.map((action) => (
                    <TouchableOpacity
                      key={action.value}
                      style={[styles.actionButton, { borderColor: action.color }]}
                      onPress={() => handleAction(action.value)}
                      disabled={processingAction}
                    >
                      <Ionicons name={action.icon as any} size={20} color={action.color} />
                      <Text style={[styles.actionButtonText, { color: action.color }]}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {processingAction && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#5d1289" />
                  </View>
                )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  filterTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#5d1289',
    borderColor: '#5d1289',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  issueCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  tripDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  issueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  driverLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  costLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5d1289',
  },
  issueDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  reportedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  issueInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  descriptionBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#000',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    minWidth: '45%',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
});
