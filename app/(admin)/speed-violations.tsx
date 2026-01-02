/**
 * Admin Speed Violations Dashboard
 *
 * Monitor drivers' speeding violations with ability to:
 * - View all violations
 * - Filter by severity
 * - Take action on drivers (warn, suspend, ban)
 *
 * ✅ UPGRADED TO React Native Firebase v22+ Modular API
 * ✅ Using 'main' database (restored from backup)
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
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, orderBy, limit, query, serverTimestamp, increment, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { saveNotificationToInbox } from '@/src/services/driver-notification.service';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface DriverViolation {
  driverId: string;
  driverName: string;
  totalViolations: number;
  lastViolationAt: Date | null;
  violations: {
    id: string;
    tripId: string;
    maxSpeed: number;
    speedLimit: number;
    maxExcessSpeed: number;
    severity: 'minor' | 'moderate' | 'severe';
    timestamp: Date;
  }[];
}

const SEVERITY_COLORS = {
  minor: '#F59E0B',
  moderate: '#F97316',
  severe: '#EF4444',
};

export default function SpeedViolationsScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverViolation | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recent' | 'severe'>('all');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadDriverViolations();
  }, [filter]);

  const loadDriverViolations = async () => {
    try {
      setLoading(true);

      // Get all speed violations from the speedViolations collection
      const violationsRef = collection(db, 'speedViolations');
      const violationsQuery = query(
        violationsRef,
        orderBy('startTime', 'desc'),
        limit(500)
      );
      const violationsSnapshot = await getDocs(violationsQuery);

      // Group violations by driver
      const violationsByDriver: Record<string, any[]> = {};
      violationsSnapshot.docs.forEach((violationDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = violationDoc.data();
        const driverId = data.driverId;
        if (!violationsByDriver[driverId]) {
          violationsByDriver[driverId] = [];
        }
        violationsByDriver[driverId].push({
          id: violationDoc.id,
          tripId: data.tripId,
          maxSpeed: data.maxSpeed || 0,
          speedLimit: data.speedLimit || 25,
          maxExcessSpeed: data.excessSpeed || (data.maxSpeed - (data.speedLimit || 25)),
          severity: data.severity || 'minor',
          timestamp: data.startTime?.toDate?.() || new Date(),
        });
      });

      // Fetch driver info for each driver with violations
      const driversList: DriverViolation[] = [];

      for (const [driverId, violations] of Object.entries(violationsByDriver)) {
        const driverDocRef = doc(db, 'drivers', driverId);
        const driverDocSnap = await getDoc(driverDocRef);
        const driverData = driverDocSnap.data();
        const driverName = driverData
          ? `${driverData.firstName || ''} ${driverData.lastName || ''}`.trim() || 'Unknown Driver'
          : 'Unknown Driver';

        // Apply filters
        let filteredViolations = violations;
        if (filter === 'recent') {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          filteredViolations = violations.filter(
            (v: any) => v.timestamp > oneDayAgo
          );
        } else if (filter === 'severe') {
          filteredViolations = violations.filter((v: any) => v.severity === 'severe');
        }

        if (filteredViolations.length > 0 || filter === 'all') {
          // Sort violations by timestamp descending
          const sortedViolations = filteredViolations.sort(
            (a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime()
          );

          driversList.push({
            driverId,
            driverName,
            totalViolations: violations.length,
            lastViolationAt: sortedViolations.length > 0 ? sortedViolations[0].timestamp : null,
            violations: sortedViolations,
          });
        }
      }

      // Sort drivers by total violations (descending)
      driversList.sort((a, b) => b.totalViolations - a.totalViolations);

      setDrivers(driversList);
    } catch (error) {
      console.error('Error loading violations:', error);
      Alert.alert('Error', 'Failed to load speed violations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDriverViolations();
  };

  const handleWarnDriver = async (driverId: string) => {
    setProcessingAction(true);
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        'safetyData.lastWarningAt': serverTimestamp(),
        'safetyData.warningCount': increment(1),
      });

      // TODO: Send push notification to driver

      Alert.alert('Warning Sent', 'The driver has been warned about their speeding violations.');
      setShowDriverModal(false);
    } catch (error) {
      console.error('Error warning driver:', error);
      Alert.alert('Error', 'Failed to warn driver');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSuspendDriver = async (driverId: string, days: number) => {
    setProcessingAction(true);
    try {
      const suspendUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        status: 'suspended',
        suspendedUntil: suspendUntil,
        suspensionReason: 'Repeated speeding violations',
        'safetyData.suspensionCount': increment(1),
      });

      Alert.alert(
        'Driver Suspended',
        `The driver has been suspended for ${days} days due to speeding violations.`
      );
      setShowDriverModal(false);
      loadDriverViolations();
    } catch (error) {
      console.error('Error suspending driver:', error);
      Alert.alert('Error', 'Failed to suspend driver');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle ignoring a violation (dismiss as GPS error or mistake)
  const handleIgnoreViolation = async (violationId: string, driverId?: string) => {
    Alert.alert(
      'Ignore Violation',
      'Mark this violation as a mistake/GPS error? It will not count against the driver.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ignore',
          onPress: async () => {
            setProcessingAction(true);
            try {
              const violationRef = doc(db, 'speedViolations', violationId);
              await updateDoc(violationRef, {
                status: 'ignored',
                adminAction: 'ignored',
                adminActionAt: serverTimestamp(),
                adminNotes: 'Marked as GPS error or mistake by admin',
              });

              // Send notification to driver's inbox
              if (driverId) {
                await saveNotificationToInbox(
                  driverId,
                  'Speed Violation Dismissed',
                  'A speed violation alert has been reviewed and dismissed by our safety team. No action required on your part.',
                  'system',
                  { violationId, action: 'ignored' }
                );
              }

              Alert.alert('Violation Ignored', 'This violation has been dismissed and the driver has been notified.');
              loadDriverViolations();
            } catch (error) {
              console.error('Error ignoring violation:', error);
              Alert.alert('Error', 'Failed to ignore violation');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  // Handle enforcing a violation (confirm it's a real violation)
  const handleEnforceViolation = async (violationId: string, driverId: string) => {
    Alert.alert(
      'Enforce Violation',
      'Confirm this is a valid speed violation? A strike will be added to the driver.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enforce',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction(true);
            try {
              // Update the violation status
              const violationRef = doc(db, 'speedViolations', violationId);
              await updateDoc(violationRef, {
                status: 'enforced',
                adminAction: 'enforced',
                adminActionAt: serverTimestamp(),
                adminNotes: 'Confirmed as valid violation by admin',
              });

              // Add a strike to the driver's record
              const driverRef = doc(db, 'drivers', driverId);
              await updateDoc(driverRef, {
                'safetyData.enforcedViolations': increment(1),
                'safetyData.lastEnforcedViolationAt': serverTimestamp(),
              });

              // Send notification to driver's inbox
              await saveNotificationToInbox(
                driverId,
                'Speed Violation Recorded',
                'A speed violation has been reviewed and confirmed by our safety team. Please maintain safe driving speeds to avoid further action. Multiple violations may affect your account status.',
                'system',
                { violationId, action: 'enforced' }
              );

              Alert.alert('Violation Enforced', 'This violation has been confirmed and the driver has been notified.');
              loadDriverViolations();
            } catch (error) {
              console.error('Error enforcing violation:', error);
              Alert.alert('Error', 'Failed to enforce violation');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleBanDriver = async (driverId: string) => {
    Alert.alert(
      'Confirm Ban',
      'Are you sure you want to permanently ban this driver? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban Driver',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction(true);
            try {
              const driverRef = doc(db, 'drivers', driverId);
              await updateDoc(driverRef, {
                status: 'banned',
                bannedAt: serverTimestamp(),
                banReason: 'Severe speeding violations - safety risk',
              });

              Alert.alert('Driver Banned', 'The driver has been permanently banned from the platform.');
              setShowDriverModal(false);
              loadDriverViolations();
            } catch (error) {
              console.error('Error banning driver:', error);
              Alert.alert('Error', 'Failed to ban driver');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getSeverityBadge = (violations: { severity: string }[]) => {
    const severeCount = violations.filter((v) => v.severity === 'severe').length;
    const moderateCount = violations.filter((v) => v.severity === 'moderate').length;

    if (severeCount >= 3) {
      return { text: 'Critical', color: '#EF4444' };
    } else if (severeCount >= 1 || moderateCount >= 5) {
      return { text: 'High Risk', color: '#F97316' };
    } else {
      return { text: 'Monitor', color: '#F59E0B' };
    }
  };

  const renderDriverCard = ({ item }: { item: DriverViolation }) => {
    const severityBadge = getSeverityBadge(item.violations);

    return (
      <TouchableOpacity
        style={styles.driverCard}
        onPress={() => {
          setSelectedDriver(item);
          setShowDriverModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={20} color="#5d1289" />
            </View>
            <View>
              <Text style={styles.driverName}>{item.driverName}</Text>
              <Text style={styles.lastViolation}>Last: {formatDate(item.lastViolationAt)}</Text>
            </View>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: severityBadge.color + '20' }]}>
            <Text style={[styles.severityText, { color: severityBadge.color }]}>
              {severityBadge.text}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.statValue}>{item.totalViolations}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="alert-circle" size={16} color="#F97316" />
            <Text style={styles.statValue}>
              {item.violations.filter((v) => v.severity === 'severe').length}
            </Text>
            <Text style={styles.statLabel}>Severe</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="speedometer" size={16} color="#6B7280" />
            <Text style={styles.statValue}>
              {Math.max(...item.violations.map((v) => v.maxExcessSpeed), 0)}
            </Text>
            <Text style={styles.statLabel}>Max Over</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetails}>Tap to view details & take action</Text>
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
          <Text style={styles.headerTitle}>Speed Violations</Text>
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
        <Text style={styles.headerTitle}>Speed Violations</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {[
          { key: 'all', label: 'All Drivers' },
          { key: 'recent', label: 'Last 24h' },
          { key: 'severe', label: 'Severe Only' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key as typeof filter)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="people" size={24} color="#5d1289" />
          <Text style={styles.summaryValue}>{drivers.length}</Text>
          <Text style={styles.summaryLabel}>Drivers with Violations</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.summaryValue}>
            {drivers.reduce((sum, d) => sum + d.totalViolations, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Violations</Text>
        </View>
      </View>

      {/* Drivers List */}
      <FlatList
        data={drivers}
        renderItem={renderDriverCard}
        keyExtractor={(item) => item.driverId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#5d1289" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>No Violations</Text>
            <Text style={styles.emptyText}>No speed violations recorded</Text>
          </View>
        }
      />

      {/* Driver Details Modal */}
      <Modal
        visible={showDriverModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDriverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDriver?.driverName}
              </Text>
              <TouchableOpacity onPress={() => setShowDriverModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedDriver && (
              <>
                {/* Violation Summary */}
                <View style={styles.violationSummary}>
                  <Text style={styles.summaryTitle}>Violation Summary</Text>
                  <View style={styles.violationStats}>
                    <View style={[styles.violationStat, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={styles.violationStatValue}>
                        {selectedDriver.violations.filter((v) => v.severity === 'minor').length}
                      </Text>
                      <Text style={[styles.violationStatLabel, { color: '#D97706' }]}>Minor</Text>
                    </View>
                    <View style={[styles.violationStat, { backgroundColor: '#FFEDD5' }]}>
                      <Text style={styles.violationStatValue}>
                        {selectedDriver.violations.filter((v) => v.severity === 'moderate').length}
                      </Text>
                      <Text style={[styles.violationStatLabel, { color: '#EA580C' }]}>Moderate</Text>
                    </View>
                    <View style={[styles.violationStat, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={styles.violationStatValue}>
                        {selectedDriver.violations.filter((v) => v.severity === 'severe').length}
                      </Text>
                      <Text style={[styles.violationStatLabel, { color: '#DC2626' }]}>Severe</Text>
                    </View>
                  </View>
                </View>

                {/* Recent Violations */}
                <Text style={styles.recentTitle}>Recent Violations (tap to take action)</Text>
                <View style={styles.violationsList}>
                  {selectedDriver.violations.slice(0, 5).map((v, index) => (
                    <View key={index} style={styles.violationItem}>
                      <View
                        style={[
                          styles.violationDot,
                          { backgroundColor: SEVERITY_COLORS[v.severity as keyof typeof SEVERITY_COLORS] },
                        ]}
                      />
                      <View style={styles.violationInfo}>
                        <Text style={styles.violationSpeed}>
                          {v.maxSpeed} mph (limit: {v.speedLimit} mph)
                        </Text>
                        <Text style={styles.violationDate}>{formatDate(v.timestamp)}</Text>
                      </View>
                      <View style={styles.violationActions}>
                        <TouchableOpacity
                          style={styles.ignoreBtn}
                          onPress={() => handleIgnoreViolation(v.id, selectedDriver.driverId)}
                          disabled={processingAction}
                        >
                          <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.enforceBtn}
                          onPress={() => handleEnforceViolation(v.id, selectedDriver.driverId)}
                          disabled={processingAction}
                        >
                          <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <Text style={styles.actionsTitle}>Take Action</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.warnBtn]}
                    onPress={() => handleWarnDriver(selectedDriver.driverId)}
                    disabled={processingAction}
                  >
                    <Ionicons name="mail-outline" size={18} color="#D97706" />
                    <Text style={[styles.actionBtnText, { color: '#D97706' }]}>Warn</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.suspendBtn]}
                    onPress={() => handleSuspendDriver(selectedDriver.driverId, 7)}
                    disabled={processingAction}
                  >
                    <Ionicons name="pause-circle-outline" size={18} color="#EA580C" />
                    <Text style={[styles.actionBtnText, { color: '#EA580C' }]}>Suspend 7d</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.banBtn]}
                    onPress={() => handleBanDriver(selectedDriver.driverId)}
                    disabled={processingAction}
                  >
                    <Ionicons name="ban-outline" size={18} color="#DC2626" />
                    <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Ban</Text>
                  </TouchableOpacity>
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
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  driverCard: {
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
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5d128920',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  lastViolation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  viewDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
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
    maxHeight: '85%',
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
  violationSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  violationStats: {
    flexDirection: 'row',
    gap: 8,
  },
  violationStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  violationStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  violationStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  violationsList: {
    marginBottom: 20,
  },
  violationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  violationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  violationInfo: {
    flex: 1,
  },
  violationSpeed: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  violationDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  violationExcess: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  violationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ignoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enforceBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  warnBtn: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C720',
  },
  suspendBtn: {
    borderColor: '#EA580C',
    backgroundColor: '#FFEDD520',
  },
  banBtn: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E220',
  },
  actionBtnText: {
    fontSize: 13,
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
