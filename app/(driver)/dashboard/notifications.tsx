/**
 * UPGRADED TO React Native Firebase v22+ Modular API
 * Using 'main' database (restored from backup) UPGRADED TO v23.5.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { NotificationService } from '@/src/services/notification.service';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';

// Initialize Firestore with 'main' database
const app = getApp();
const db = getFirestore(app, 'main');

type NotificationType = 'ride' | 'earnings' | 'system' | 'promo' | 'document';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
};

export default function Notifications() {
  const router = useRouter();
  const { driver } = useDriverStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [rideNotifications, setRideNotifications] = useState(true);
  const [earningsNotifications, setEarningsNotifications] = useState(true);
  const [promotionNotifications, setPromotionNotifications] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [driver?.id]);

  const loadNotifications = async () => {
    if (!driver?.id) return;

    try {
      const firebaseNotifications = await NotificationService.getNotifications(driver.id);
      setNotifications(firebaseNotifications as any);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    if (!driver?.id) return;

    try {
      const settingsRef = doc(db, 'drivers', driver.id, 'settings', 'notifications');
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setNotificationsEnabled(data?.enabled ?? true);
        setRideNotifications(data?.ride ?? true);
        setEarningsNotifications(data?.earnings ?? true);
        setPromotionNotifications(data?.promo ?? true);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const saveSetting = async (key: string, value: boolean) => {
    if (!driver?.id) return;

    try {
      const settingsRef = doc(db, 'drivers', driver.id, 'settings', 'notifications');
      await setDoc(
        settingsRef,
        { [key]: value, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving notification setting:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ride':
        return 'car';
      case 'earnings':
        return 'wallet';
      case 'system':
        return 'information-circle';
      case 'promo':
        return 'gift';
      case 'document':
        return 'alert-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'ride':
        return Colors.primary;
      case 'earnings':
        return Colors.success;
      case 'system':
        return Colors.gray[600];
      case 'promo':
        return Colors.warning;
      case 'document':
        return Colors.error;
      default:
        return Colors.gray[600];
    }
  };

  const markAsRead = async (id: string) => {
    if (!driver?.id) return;

    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!driver?.id) return;

    try {
      await NotificationService.markAllAsRead(driver.id);
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!driver?.id) return;

    try {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!driver?.id) return;

    try {
      await NotificationService.deleteAllNotifications(driver.id);
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.gray[600] }}>
            Loading notifications...
          </Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/(driver)/settings/notifications')}>
          <Ionicons name="settings-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        {notifications.length > 0 && (
          <View style={styles.actionsRow}>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.actionButton} onPress={markAllAsRead}>
                <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
                <Text style={styles.actionText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={clearAll}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notification Settings Toggle */}
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color={Colors.primary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                setNotificationsEnabled(value);
                saveSetting('enabled', value);
              }}
              trackColor={{ false: Colors.gray[300], true: Colors.success }}
              thumbColor={Colors.white}
            />
          </View>

          {notificationsEnabled && (
            <>
              <View style={styles.settingDivider} />
              <View style={styles.settingRow}>
                <Text style={styles.settingSubLabel}>Ride Requests</Text>
                <Switch
                  value={rideNotifications}
                  onValueChange={(value) => {
                    setRideNotifications(value);
                    saveSetting('ride', value);
                  }}
                  trackColor={{ false: Colors.gray[300], true: Colors.success }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingDivider} />
              <View style={styles.settingRow}>
                <Text style={styles.settingSubLabel}>Earnings Updates</Text>
                <Switch
                  value={earningsNotifications}
                  onValueChange={(value) => {
                    setEarningsNotifications(value);
                    saveSetting('earnings', value);
                  }}
                  trackColor={{ false: Colors.gray[300], true: Colors.success }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingDivider} />
              <View style={styles.settingRow}>
                <Switch
                  value={promotionNotifications}
                  onValueChange={(value) => {
                    setPromotionNotifications(value);
                    saveSetting('promo', value);
                  }}
                  trackColor={{ false: Colors.gray[300], true: Colors.success }}
                  thumbColor={Colors.white}
                />
              </View>
            </>
          )}
        </View>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyMessage}>
              You're all caught up! We'll notify you about important updates.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: getNotificationColor(notification.type) + '15' },
                  ]}
                >
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={20}
                    color={getNotificationColor(notification.type)}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationTime}>{getTimeAgo(notification.createdAt)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <Ionicons name="close" size={20} color={Colors.gray[400]} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  settingsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  settingSubLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginLeft: Spacing['2xl'],
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Spacing.sm,
    marginLeft: Spacing['2xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  notificationsList: {},
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  notificationUnread: {
    backgroundColor: Colors.primary + '08',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  deleteButton: {
    padding: Spacing.xs,
  },
});