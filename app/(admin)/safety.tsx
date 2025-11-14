/**
 * SAFETY & REPORTS SCREEN
 * Shows incident reports and safety issues
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

interface SafetyReport {
  id: string;
  type: 'accident' | 'harassment' | 'unsafe_driving' | 'vehicle_issue' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  reportedBy: 'rider' | 'driver';
  reporterName: string;
  reporterId: string;
  tripId?: string;
  driverId?: string;
  driverName?: string;
  riderId?: string;
  riderName?: string;
  description: string;
  location?: string;
  reportedAt: Date;
  resolvedAt?: Date;
  notes?: string;
}

export default function SafetyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all');

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      let query = firestore()
        .collection('safety_reports')
        .orderBy('reportedAt', 'desc')
        .limit(100);

      if (filter !== 'all') {
        query = query.where('status', '==', filter);
      }

      const snapshot = await query.get();

      const reportsList: SafetyReport[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'other',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          reportedBy: data.reportedBy,
          reporterName: data.reporterName,
          reporterId: data.reporterId,
          tripId: data.tripId,
          driverId: data.driverId,
          driverName: data.driverName,
          riderId: data.riderId,
          riderName: data.riderName,
          description: data.description,
          location: data.location,
          reportedAt: data.reportedAt?.toDate() || new Date(),
          resolvedAt: data.resolvedAt?.toDate(),
          notes: data.notes,
        };
      });

      setReports(reportsList);
    } catch (error) {
      console.error('❌ Error loading safety reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return Colors.error;
      case 'high':
        return '#FF6B35';
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.info;
      default:
        return Colors.gray[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return Colors.success;
      case 'investigating':
        return Colors.info;
      case 'pending':
        return Colors.warning;
      case 'closed':
        return Colors.gray[500];
      default:
        return Colors.gray[500];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accident':
        return 'alert-circle';
      case 'harassment':
        return 'warning';
      case 'unsafe_driving':
        return 'speedometer';
      case 'vehicle_issue':
        return 'construct';
      case 'other':
      default:
        return 'information-circle';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'accident':
        return 'Accident';
      case 'harassment':
        return 'Harassment';
      case 'unsafe_driving':
        return 'Unsafe Driving';
      case 'vehicle_issue':
        return 'Vehicle Issue';
      case 'other':
      default:
        return 'Other';
    }
  };

  const handleUpdateStatus = (report: SafetyReport, newStatus: SafetyReport['status']) => {
    Alert.alert(
      'Update Status',
      `Change report status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              const updates: any = {
                status: newStatus,
                updatedAt: new Date(),
              };

              if (newStatus === 'resolved') {
                updates.resolvedAt = new Date();
              }

              await firestore()
                .collection('safety_reports')
                .doc(report.id)
                .update(updates);

              Alert.alert('Success', 'Report status updated successfully.');
              loadReports();
            } catch (error) {
              console.error('❌ Error updating report status:', error);
              Alert.alert('Error', 'Failed to update report status.');
            }
          },
        },
      ]
    );
  };

  const renderReport = ({ item }: { item: SafetyReport }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportType}>
          <View style={[styles.typeIcon, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Ionicons
              name={getTypeIcon(item.type) as any}
              size={20}
              color={getPriorityColor(item.priority)}
            />
          </View>
          <View>
            <Text style={styles.typeLabel}>{getTypeLabel(item.type)}</Text>
            <Text style={styles.reportId}>#{item.id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) + '20' },
            ]}
          >
            <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
              {item.priority.toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.reportDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={Colors.gray[600]} />
          <Text style={styles.detailText}>
            Reported by {item.reportedBy}: {item.reporterName}
          </Text>
        </View>
        {item.tripId && (
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={16} color={Colors.gray[600]} />
            <Text style={styles.detailText}>Trip #{item.tripId.slice(-6).toUpperCase()}</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={Colors.gray[600]} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
      </View>

      <View style={styles.description}>
        <Text style={styles.descriptionLabel}>Description:</Text>
        <Text style={styles.descriptionText}>{item.description}</Text>
      </View>

      {item.notes && (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Admin Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.reportFooter}>
        <Text style={styles.dateText}>
          {item.reportedAt.toLocaleDateString()} at {item.reportedAt.toLocaleTimeString()}
        </Text>
        <View style={styles.actions}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleUpdateStatus(item, 'investigating')}
            >
              <Text style={styles.actionButtonText}>Investigate</Text>
            </TouchableOpacity>
          )}
          {item.status === 'investigating' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.success }]}
              onPress={() => handleUpdateStatus(item, 'resolved')}
            >
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'investigating' && styles.filterButtonActive]}
          onPress={() => setFilter('investigating')}
        >
          <Text style={[styles.filterText, filter === 'investigating' && styles.filterTextActive]}>
            Investigating
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'resolved' && styles.filterButtonActive]}
          onPress={() => setFilter('resolved')}
        >
          <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
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
              <Ionicons name="shield-checkmark-outline" size={64} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Reports Found</Text>
              <Text style={styles.emptyText}>
                Safety reports will appear here
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
  filterBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  filterButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.lg,
  },
  reportCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  reportId: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  badges: {
    gap: Spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  reportDetails: {
    marginBottom: Spacing.md,
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
  description: {
    marginBottom: Spacing.sm,
  },
  descriptionLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  notes: {
    backgroundColor: Colors.info + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  notesLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.info,
    marginBottom: 4,
  },
  notesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
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
