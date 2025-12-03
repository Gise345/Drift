/**
 * ADMIN ACTIVITY LOGS
 * Real-time activity log viewer for monitoring app events
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { ActivityLogger, ActivityLogEntry, ActivityEventType } from '@/src/services/activity-logger.service';
import { Logger } from '@/src/services/logger.service';

// Event type configuration for display
const EVENT_CONFIG: Record<string, { icon: string; color: string; category: string }> = {
  // Auth events
  AUTH_SIGN_UP: { icon: 'person-add', color: Colors.success, category: 'Auth' },
  AUTH_SIGN_IN: { icon: 'log-in', color: Colors.info, category: 'Auth' },
  AUTH_SIGN_OUT: { icon: 'log-out', color: Colors.gray[500], category: 'Auth' },
  AUTH_PASSWORD_RESET: { icon: 'key', color: Colors.warning, category: 'Auth' },
  AUTH_ERROR: { icon: 'alert-circle', color: Colors.error, category: 'Auth' },
  // Ride events
  RIDE_REQUESTED: { icon: 'hand-right', color: Colors.info, category: 'Trip' },
  RIDE_ACCEPTED: { icon: 'checkmark-circle', color: Colors.success, category: 'Trip' },
  RIDE_STARTED: { icon: 'play-circle', color: Colors.primary, category: 'Trip' },
  RIDE_PICKUP_ARRIVED: { icon: 'location', color: Colors.info, category: 'Trip' },
  RIDE_IN_PROGRESS: { icon: 'car', color: Colors.primary, category: 'Trip' },
  RIDE_COMPLETED: { icon: 'checkmark-done-circle', color: Colors.success, category: 'Trip' },
  RIDE_CANCELLED: { icon: 'close-circle', color: Colors.error, category: 'Trip' },
  RIDE_ERROR: { icon: 'alert-circle', color: Colors.error, category: 'Trip' },
  // Payment events
  PAYMENT_METHOD_ADDED: { icon: 'card', color: Colors.info, category: 'Payment' },
  PAYMENT_INITIATED: { icon: 'card-outline', color: Colors.warning, category: 'Payment' },
  PAYMENT_COMPLETED: { icon: 'checkmark-circle', color: Colors.success, category: 'Payment' },
  PAYMENT_FAILED: { icon: 'close-circle', color: Colors.error, category: 'Payment' },
  PAYMENT_REFUNDED: { icon: 'arrow-undo', color: Colors.warning, category: 'Payment' },
  TIP_ADDED: { icon: 'gift', color: Colors.success, category: 'Payment' },
  // Driver events
  DRIVER_REGISTRATION_STARTED: { icon: 'person', color: Colors.info, category: 'Driver' },
  DRIVER_REGISTRATION_COMPLETED: { icon: 'person-done', color: Colors.success, category: 'Driver' },
  DRIVER_DOCUMENT_UPLOADED: { icon: 'document', color: Colors.info, category: 'Driver' },
  DRIVER_APPROVED: { icon: 'checkmark-circle', color: Colors.success, category: 'Driver' },
  DRIVER_REJECTED: { icon: 'close-circle', color: Colors.error, category: 'Driver' },
  DRIVER_ONLINE: { icon: 'radio-button-on', color: Colors.success, category: 'Driver' },
  DRIVER_OFFLINE: { icon: 'radio-button-off', color: Colors.gray[500], category: 'Driver' },
  // Safety events
  SPEED_VIOLATION: { icon: 'speedometer', color: Colors.error, category: 'Safety' },
  ROUTE_DEVIATION: { icon: 'navigate', color: Colors.warning, category: 'Safety' },
  EMERGENCY_TRIGGERED: { icon: 'warning', color: Colors.error, category: 'Safety' },
  STRIKE_ISSUED: { icon: 'flag', color: Colors.error, category: 'Safety' },
  SAFETY_CONCERN_REPORTED: { icon: 'shield', color: Colors.warning, category: 'Safety' },
  // Navigation events
  NAVIGATION_STARTED: { icon: 'navigate', color: Colors.info, category: 'Nav' },
  NAVIGATION_REROUTED: { icon: 'git-branch', color: Colors.warning, category: 'Nav' },
  NAVIGATION_COMPLETED: { icon: 'checkmark', color: Colors.success, category: 'Nav' },
  // General events
  APP_OPENED: { icon: 'phone-portrait', color: Colors.info, category: 'App' },
  APP_BACKGROUNDED: { icon: 'phone-portrait-outline', color: Colors.gray[500], category: 'App' },
  SCREEN_VIEWED: { icon: 'eye', color: Colors.gray[500], category: 'App' },
  FEATURE_USED: { icon: 'flash', color: Colors.info, category: 'App' },
  ERROR_OCCURRED: { icon: 'bug', color: Colors.error, category: 'Error' },
};

// Filter options
const ENVIRONMENT_FILTERS = ['all', 'development', 'preview', 'production'] as const;
const CATEGORY_FILTERS = ['all', 'Auth', 'Trip', 'Payment', 'Driver', 'Safety', 'Nav', 'App', 'Error'] as const;

export default function ActivityLogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);
  const [envFilter, setEnvFilter] = useState<typeof ENVIRONMENT_FILTERS[number]>('all');
  const [categoryFilter, setCategoryFilter] = useState<typeof CATEGORY_FILTERS[number]>('all');
  const [isLive, setIsLive] = useState(true);

  // Load logs
  const loadLogs = useCallback(async () => {
    try {
      const query: any = { limit: 100 };
      if (envFilter !== 'all') {
        query.environment = envFilter;
      }
      const fetchedLogs = await ActivityLogger.getLogs(query);

      // Filter by category if needed
      let filteredLogs = fetchedLogs;
      if (categoryFilter !== 'all') {
        filteredLogs = fetchedLogs.filter(log => {
          const config = EVENT_CONFIG[log.eventType];
          return config?.category === categoryFilter;
        });
      }

      setLogs(filteredLogs);
    } catch (error) {
      Logger.error('ActivityLogs', 'Failed to load logs', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [envFilter, categoryFilter]);

  // Initial load and subscribe to updates
  useEffect(() => {
    loadLogs();

    // Set up real-time subscription if live mode is enabled
    if (isLive) {
      const unsubscribe = ActivityLogger.subscribeToLogs(
        (newLogs) => {
          let filteredLogs = newLogs;
          if (categoryFilter !== 'all') {
            filteredLogs = newLogs.filter(log => {
              const config = EVENT_CONFIG[log.eventType];
              return config?.category === categoryFilter;
            });
          }
          setLogs(filteredLogs);
        },
        {
          environment: envFilter !== 'all' ? envFilter : undefined,
          limit: 100,
        }
      );

      return () => unsubscribe();
    }
  }, [loadLogs, isLive, envFilter, categoryFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLogs();
  }, [loadLogs]);

  const formatTimestamp = (timestamp: any): string => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatTimeAgo = (timestamp: any): string => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getEventConfig = (eventType: ActivityEventType) => {
    return EVENT_CONFIG[eventType] || { icon: 'help-circle', color: Colors.gray[500], category: 'Unknown' };
  };

  const renderLogItem = ({ item }: { item: ActivityLogEntry }) => {
    const config = getEventConfig(item.eventType);

    return (
      <TouchableOpacity
        style={styles.logItem}
        onPress={() => setSelectedLog(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={styles.eventType}>{item.eventType.replace(/_/g, ' ')}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.timestamp)}</Text>
          </View>
          <View style={styles.logMeta}>
            <View style={[styles.envBadge, { backgroundColor: getEnvColor(item.environment) + '20' }]}>
              <Text style={[styles.envText, { color: getEnvColor(item.environment) }]}>
                {item.environment.toUpperCase()}
              </Text>
            </View>
            {item.userType && (
              <Text style={styles.userType}>{item.userType}</Text>
            )}
            {item.tripId && (
              <Text style={styles.tripId}>Trip: ...{item.tripId.slice(-6)}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />
      </TouchableOpacity>
    );
  };

  const getEnvColor = (env: string): string => {
    switch (env) {
      case 'development': return Colors.info;
      case 'preview': return Colors.warning;
      case 'production': return Colors.success;
      default: return Colors.gray[500];
    }
  };

  const renderDetailModal = () => {
    if (!selectedLog) return null;
    const config = getEventConfig(selectedLog.eventType);

    return (
      <Modal
        visible={!!selectedLog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedLog(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Details</Text>
            <TouchableOpacity onPress={() => setSelectedLog(null)}>
              <Ionicons name="close" size={24} color={Colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <View style={[styles.detailIcon, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon as any} size={32} color={config.color} />
              </View>
              <Text style={styles.detailEventType}>
                {selectedLog.eventType.replace(/_/g, ' ')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Timestamp</Text>
              <Text style={styles.detailValue}>{formatTimestamp(selectedLog.timestamp)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Environment</Text>
              <View style={[styles.envBadge, { backgroundColor: getEnvColor(selectedLog.environment) + '20' }]}>
                <Text style={[styles.envText, { color: getEnvColor(selectedLog.environment) }]}>
                  {selectedLog.environment.toUpperCase()}
                </Text>
              </View>
            </View>

            {selectedLog.userId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User ID</Text>
                <Text style={styles.detailValue} selectable>{selectedLog.userId}</Text>
              </View>
            )}

            {selectedLog.userType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User Type</Text>
                <Text style={styles.detailValue}>{selectedLog.userType}</Text>
              </View>
            )}

            {selectedLog.tripId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trip ID</Text>
                <Text style={styles.detailValue} selectable>{selectedLog.tripId}</Text>
              </View>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <View style={styles.metadataSection}>
                <Text style={styles.detailLabel}>Metadata</Text>
                <View style={styles.metadataBox}>
                  <Text style={styles.metadataText} selectable>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </Text>
                </View>
              </View>
            )}

            {selectedLog.deviceInfo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Device</Text>
                <Text style={styles.detailValue}>
                  {selectedLog.deviceInfo.platform} v{selectedLog.deviceInfo.version}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Activity Logs</Text>
          <Text style={styles.headerSubtitle}>
            {Logger.getEnvironment().toUpperCase()} | {logs.length} events
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsLive(!isLive)}
          style={[styles.liveButton, isLive && styles.liveButtonActive]}
        >
          <Ionicons name={isLive ? 'radio-button-on' : 'radio-button-off'} size={16} color={isLive ? Colors.success : Colors.gray[400]} />
          <Text style={[styles.liveText, isLive && styles.liveTextActive]}>LIVE</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {ENVIRONMENT_FILTERS.map((env) => (
            <TouchableOpacity
              key={env}
              style={[styles.filterChip, envFilter === env && styles.filterChipActive]}
              onPress={() => setEnvFilter(env)}
            >
              <Text style={[styles.filterChipText, envFilter === env && styles.filterChipTextActive]}>
                {env === 'all' ? 'All Envs' : env.charAt(0).toUpperCase() + env.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {CATEGORY_FILTERS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>
                {cat === 'all' ? 'All Categories' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Logs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading logs...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>No activity logs found</Text>
          <Text style={styles.emptySubtext}>Events will appear here as they occur</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id || String(item.timestamp)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        />
      )}

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
  },
  liveButtonActive: {
    backgroundColor: Colors.success + '20',
  },
  liveText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[400],
  },
  liveTextActive: {
    color: Colors.success,
  },
  filtersContainer: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  filterRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    marginRight: Spacing.xs,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[400],
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  eventType: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    flex: 1,
  },
  timeAgo: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[400],
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  envBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  envText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  userType: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  tripId: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  detailSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  detailIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  detailEventType: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    maxWidth: '60%',
    textAlign: 'right',
  },
  metadataSection: {
    marginTop: Spacing.md,
  },
  metadataBox: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  metadataText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
  },
});
