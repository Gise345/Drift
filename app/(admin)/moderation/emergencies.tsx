/**
 * ADMIN EMERGENCY ALERTS SCREEN
 * Monitor and respond to active emergency SOS alerts
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

interface EmergencyAlert {
  id: string;
  tripId: string;
  userId: string;
  userType: 'rider' | 'driver';
  userName?: string;
  userPhone?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  status: 'active' | 'resolved' | 'false_alarm';
  triggerReason?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  vehicleInfo?: {
    make?: string;
    model?: string;
    color?: string;
    plate?: string;
  };
  triggeredAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  emergencyContactsNotified: boolean;
  emergencyServicesContacted: boolean;
}

export default function EmergencyAlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'resolved' | 'all'>('active');

  // Resolution modal state
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      let query = firestore()
        .collection('emergency_alerts')
        .orderBy('triggeredAt', 'desc');

      if (filter !== 'all') {
        query = query.where('status', '==', filter);
      }

      const snapshot = await query.limit(50).get();

      const alertsList: EmergencyAlert[] = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();

          // Get user/driver/rider names
          let userName = 'Unknown';
          let userPhone = '';
          let driverName = '';
          let driverPhone = '';
          let riderName = '';
          let riderPhone = '';

          // Get triggering user info
          if (data.userId) {
            try {
              const userDoc = await firestore()
                .collection('users')
                .doc(data.userId)
                .get();
              if (userDoc.exists) {
                userName = userDoc.data()?.name || 'Unknown';
                userPhone = userDoc.data()?.phone || '';
              }
            } catch (e) {
              console.log('Could not fetch user');
            }
          }

          // Get driver info
          if (data.driverId) {
            try {
              const driverDoc = await firestore()
                .collection('drivers')
                .doc(data.driverId)
                .get();
              if (driverDoc.exists) {
                driverName = driverDoc.data()?.name || '';
                driverPhone = driverDoc.data()?.phone || '';
              }
            } catch (e) {
              console.log('Could not fetch driver');
            }
          }

          // Get rider info
          if (data.riderId) {
            try {
              const riderDoc = await firestore()
                .collection('users')
                .doc(data.riderId)
                .get();
              if (riderDoc.exists) {
                riderName = riderDoc.data()?.name || '';
                riderPhone = riderDoc.data()?.phone || '';
              }
            } catch (e) {
              console.log('Could not fetch rider');
            }
          }

          return {
            id: doc.id,
            tripId: data.tripId,
            userId: data.userId,
            userType: data.userType,
            userName,
            userPhone,
            driverId: data.driverId,
            driverName,
            driverPhone,
            riderId: data.riderId,
            riderName,
            riderPhone,
            status: data.status,
            triggerReason: data.triggerReason,
            location: data.location || { latitude: 0, longitude: 0 },
            vehicleInfo: data.vehicleInfo,
            triggeredAt: data.triggeredAt?.toDate() || new Date(),
            resolvedAt: data.resolvedAt?.toDate(),
            resolvedBy: data.resolvedBy,
            resolutionNotes: data.resolutionNotes,
            emergencyContactsNotified: data.emergencyContactsNotified || false,
            emergencyServicesContacted: data.emergencyServicesContacted || false,
          };
        })
      );

      setAlerts(alertsList);
    } catch (error) {
      console.error('Error loading emergency alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAlerts();

    // Set up real-time listener for active alerts
    const unsubscribe = firestore()
      .collection('emergency_alerts')
      .where('status', '==', 'active')
      .onSnapshot((snapshot) => {
        if (!snapshot.empty && filter === 'active') {
          loadAlerts();
        }
      });

    return () => unsubscribe();
  }, [loadAlerts, filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const openResolveModal = (alert: EmergencyAlert) => {
    setSelectedAlert(alert);
    setResolutionNotes('');
    setShowResolveModal(true);
  };

  const handleResolve = async (resolution: 'resolved' | 'false_alarm') => {
    if (!selectedAlert) return;

    if (!resolutionNotes.trim()) {
      Alert.alert('Notes Required', 'Please provide resolution notes.');
      return;
    }

    setProcessing(true);

    try {
      await firestore()
        .collection('emergency_alerts')
        .doc(selectedAlert.id)
        .update({
          status: resolution,
          resolvedAt: firestore.FieldValue.serverTimestamp(),
          resolvedBy: 'admin', // In production, use actual admin ID
          resolutionNotes: resolutionNotes.trim(),
        });

      // If false alarm, may need to flag the user
      if (resolution === 'false_alarm') {
        // Create a flag for review
        await firestore().collection('admin_alerts').add({
          type: 'false_sos',
          userId: selectedAlert.userId,
          userType: selectedAlert.userType,
          tripId: selectedAlert.tripId,
          emergencyAlertId: selectedAlert.id,
          status: 'pending',
          createdAt: firestore.FieldValue.serverTimestamp(),
          notes: resolutionNotes.trim(),
        });
      }

      Alert.alert(
        'Alert Resolved',
        `Emergency alert has been marked as ${resolution === 'false_alarm' ? 'a false alarm' : 'resolved'}.`
      );

      setShowResolveModal(false);
      setSelectedAlert(null);
      loadAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      Alert.alert('Error', 'Failed to resolve alert. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCallUser = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('No Phone', 'Phone number not available.');
    }
  };

  const handleOpenMaps = (location: { latitude: number; longitude: number }) => {
    const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const renderAlert = ({ item }: { item: EmergencyAlert }) => (
    <View style={[styles.alertCard, item.status === 'active' && styles.alertCardActive]}>
      {item.status === 'active' && (
        <View style={styles.urgentBanner}>
          <Ionicons name="warning" size={16} color="#FFFFFF" />
          <Text style={styles.urgentText}>ACTIVE EMERGENCY</Text>
          <Text style={styles.urgentTime}>{getTimeSince(item.triggeredAt)}</Text>
        </View>
      )}

      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>
              {item.userType === 'rider' ? 'Rider' : 'Driver'} SOS
            </Text>
            <Text style={styles.alertId}>Trip #{item.tripId?.slice(-6).toUpperCase() || 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: item.status === 'active' ? '#FEE2E2' :
              item.status === 'resolved' ? '#D1FAE5' : '#FEF3C7'
          }]}>
            <Text style={[styles.statusText, {
              color: item.status === 'active' ? '#DC2626' :
                item.status === 'resolved' ? '#10B981' : '#F59E0B'
            }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Parties Involved */}
        <View style={styles.partiesSection}>
          <View style={styles.partyCard}>
            <View style={styles.partyIcon}>
              <Ionicons name="person" size={18} color="#3B82F6" />
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyLabel}>Rider</Text>
              <Text style={styles.partyName}>{item.riderName || 'Unknown'}</Text>
            </View>
            {item.riderPhone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallUser(item.riderPhone!)}
              >
                <Ionicons name="call" size={16} color="#10B981" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.partyCard}>
            <View style={[styles.partyIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="car" size={18} color="#8B5CF6" />
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyLabel}>Driver</Text>
              <Text style={styles.partyName}>{item.driverName || 'Unknown'}</Text>
            </View>
            {item.driverPhone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallUser(item.driverPhone!)}
              >
                <Ionicons name="call" size={16} color="#10B981" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Vehicle Info */}
        {item.vehicleInfo && (
          <View style={styles.vehicleInfo}>
            <Ionicons name="car-sport" size={16} color={Colors.gray[600]} />
            <Text style={styles.vehicleText}>
              {item.vehicleInfo.color} {item.vehicleInfo.make} {item.vehicleInfo.model}
              {item.vehicleInfo.plate && ` • ${item.vehicleInfo.plate}`}
            </Text>
          </View>
        )}

        {/* Location */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => handleOpenMaps(item.location)}
        >
          <Ionicons name="location" size={20} color="#DC2626" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              {item.location.address || `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`}
            </Text>
            <Text style={styles.locationHint}>Tap to open in Maps</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* Notification Status */}
        <View style={styles.notificationStatus}>
          <View style={[styles.notificationBadge, {
            backgroundColor: item.emergencyContactsNotified ? '#D1FAE5' : '#FEE2E2'
          }]}>
            <Ionicons
              name={item.emergencyContactsNotified ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={item.emergencyContactsNotified ? '#10B981' : '#DC2626'}
            />
            <Text style={[styles.notificationText, {
              color: item.emergencyContactsNotified ? '#10B981' : '#DC2626'
            }]}>
              Contacts {item.emergencyContactsNotified ? 'Notified' : 'Not Notified'}
            </Text>
          </View>

          <View style={[styles.notificationBadge, {
            backgroundColor: item.emergencyServicesContacted ? '#D1FAE5' : '#FEF3C7'
          }]}>
            <Ionicons
              name={item.emergencyServicesContacted ? 'checkmark-circle' : 'time'}
              size={14}
              color={item.emergencyServicesContacted ? '#10B981' : '#F59E0B'}
            />
            <Text style={[styles.notificationText, {
              color: item.emergencyServicesContacted ? '#10B981' : '#F59E0B'
            }]}>
              911 {item.emergencyServicesContacted ? 'Called' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Resolution Notes */}
        {item.resolutionNotes && (
          <View style={styles.resolutionNotes}>
            <Text style={styles.resolutionLabel}>Resolution Notes:</Text>
            <Text style={styles.resolutionText}>{item.resolutionNotes}</Text>
          </View>
        )}

        {/* Actions */}
        {item.status === 'active' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => openResolveModal(item)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.timestamp}>
          Triggered: {item.triggeredAt.toLocaleDateString()} at {item.triggeredAt.toLocaleTimeString()}
        </Text>
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
        <Text style={styles.headerTitle}>Emergency Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['active', 'resolved', 'all'] as const).map((f) => (
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

      {/* Alerts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Alerts</Text>
              <Text style={styles.emptyText}>
                {filter === 'active' ? 'No active emergencies' : 'No emergency alerts found'}
              </Text>
            </View>
          }
        />
      )}

      {/* Resolution Modal */}
      <Modal
        visible={showResolveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResolveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Emergency</Text>
              <TouchableOpacity onPress={() => setShowResolveModal(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.notesInput}>
              <Text style={styles.modalLabel}>Resolution Notes (Required):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe the resolution..."
                multiline
                numberOfLines={4}
                value={resolutionNotes}
                onChangeText={setResolutionNotes}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.falseAlarmButton]}
                onPress={() => handleResolve('false_alarm')}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#92400E" />
                ) : (
                  <>
                    <Ionicons name="alert-circle" size={20} color="#92400E" />
                    <Text style={styles.falseAlarmText}>False Alarm</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.resolvedButton]}
                onPress={() => handleResolve('resolved')}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.resolvedButtonText}>Resolved</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  alertCardActive: {
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  urgentText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  urgentTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  alertContent: {
    padding: Spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  alertInfo: {},
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  alertId: {
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
  partiesSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  partyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  partyInfo: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  vehicleText: {
    fontSize: 13,
    color: Colors.gray[700],
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.black,
  },
  locationHint: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 2,
  },
  notificationStatus: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  notificationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resolutionNotes: {
    backgroundColor: Colors.gray[100],
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  resolutionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  resolutionText: {
    fontSize: 13,
    color: Colors.black,
  },
  actionButtons: {
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  resolveButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    color: Colors.gray[500],
    textAlign: 'center',
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
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
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
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  falseAlarmButton: {
    backgroundColor: '#FEF3C7',
  },
  falseAlarmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  resolvedButton: {
    backgroundColor: '#10B981',
  },
  resolvedButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
