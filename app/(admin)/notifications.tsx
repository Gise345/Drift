/**
 * ADMIN NOTIFICATIONS SCREEN
 * View and manage admin notifications for driver applications, document submissions, etc.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  writeBatch,
} from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  driverId?: string;
  driverName?: string;
  driverEmail?: string;
  driverPhone?: string;
  vehicleInfo?: string;
  documentsSubmitted?: string[];
  priority: 'high' | 'normal' | 'low';
  status: 'unread' | 'read';
  actionRequired: boolean;
  actionType?: string;
  createdAt: any;
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'action_required'>('all');

  useEffect(() => {
    // Subscribe to real-time notifications
    const notificationsRef = collection(db, 'admin_notifications');
    const notificationsQuery = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationData: AdminNotification[] = [];
        snapshot.forEach((doc) => {
          notificationData.push({
            id: doc.id,
            ...doc.data(),
          } as AdminNotification);
        });
        setNotifications(notificationData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading notifications:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    // The onSnapshot will automatically refresh
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'admin_notifications', notificationId);
      await updateDoc(notifRef, { status: 'read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadQuery = query(
        collection(db, 'admin_notifications'),
        where('status', '==', 'unread')
      );
      const snapshot = await getDocs(unreadQuery);

      if (snapshot.empty) {
        Alert.alert('Info', 'No unread notifications to mark');
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: 'read' });
      });
      await batch.commit();

      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const notifRef = doc(db, 'admin_notifications', notificationId);
              await deleteDoc(notifRef);
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: AdminNotification) => {
    // Mark as read
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }

    // Navigate based on action type
    if (notification.driverId) {
      if (notification.actionType === 'review_application' || notification.actionType === 'review_documents') {
        router.push(`/(admin)/drivers/review/${notification.driverId}` as any);
      }
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'new_driver_application':
        return 'person-add';
      case 'document_resubmission':
      case 'documents_resubmitted':
        return 'document-text';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return Colors.error;
      case 'normal':
        return Colors.warning;
      default:
        return Colors.info;
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.status === 'unread';
    if (filter === 'action_required') return n.actionRequired;
    return true;
  });

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.headerAction}>
          <Ionicons name="checkmark-done" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'unread', 'action_required'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Action Required'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'unread'
                ? 'All caught up!'
                : filter === 'action_required'
                ? 'No actions required'
                : 'Notifications will appear here'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                notification.status === 'unread' && styles.notificationCardUnread,
              ]}
              onPress={() => handleNotificationPress(notification)}
              onLongPress={() => deleteNotification(notification.id)}
            >
              <View
                style={[
                  styles.notificationIcon,
                  { backgroundColor: getNotificationColor(notification.priority) + '20' },
                ]}
              >
                <Ionicons
                  name={getNotificationIcon(notification.type) as any}
                  size={24}
                  color={getNotificationColor(notification.priority)}
                />
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.createdAt)}
                  </Text>
                </View>

                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>

                {notification.vehicleInfo && (
                  <View style={styles.notificationMeta}>
                    <Ionicons name="car" size={14} color={Colors.gray[500]} />
                    <Text style={styles.notificationMetaText}>{notification.vehicleInfo}</Text>
                  </View>
                )}

                {notification.actionRequired && (
                  <View style={styles.actionBadge}>
                    <Ionicons name="alert-circle" size={14} color={Colors.white} />
                    <Text style={styles.actionBadgeText}>Action Required</Text>
                  </View>
                )}
              </View>

              {notification.status === 'unread' && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
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
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
    marginTop: Spacing.sm,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  notificationCardUnread: {
    backgroundColor: Colors.primary + '08',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginRight: Spacing.sm,
  },
  notificationTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  notificationMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  notificationMetaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  actionBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
});
