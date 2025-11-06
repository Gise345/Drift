import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

type NotificationType = 'ride' | 'earnings' | 'system' | 'promotion' | 'alert';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  read: boolean;
};

export default function Notifications() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [rideNotifications, setRideNotifications] = useState(true);
  const [earningsNotifications, setEarningsNotifications] = useState(true);
  const [promotionNotifications, setPromotionNotifications] = useState(true);

  // Mock notifications - replace with real data from store
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'ride',
      title: 'New Ride Request',
      message: 'Pickup at George Town Harbour in 5 minutes',
      time: new Date(Date.now() - 300000),
      read: false,
    },
    {
      id: '2',
      type: 'earnings',
      title: 'Daily Earnings Summary',
      message: 'You earned CI$85.50 today with 8 trips completed',
      time: new Date(Date.now() - 3600000),
      read: false,
    },
    {
      id: '3',
      type: 'promotion',
      title: 'Weekend Bonus Active!',
      message: 'Earn 1.5x on all rides this Saturday and Sunday',
      time: new Date(Date.now() - 7200000),
      read: true,
    },
    {
      id: '4',
      type: 'system',
      title: 'Document Expiring Soon',
      message: 'Your vehicle insurance expires in 30 days. Please update.',
      time: new Date(Date.now() - 86400000),
      read: true,
    },
    {
      id: '5',
      type: 'alert',
      title: 'Weekly Platform Fee Due',
      message: 'Your CI$25 weekly fee will be deducted tomorrow',
      time: new Date(Date.now() - 172800000),
      read: true,
    },
  ]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ride':
        return 'car';
      case 'earnings':
        return 'wallet';
      case 'system':
        return 'information-circle';
      case 'promotion':
        return 'gift';
      case 'alert':
        return 'alert-circle';
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
      case 'promotion':
        return Colors.warning;
      case 'alert':
        return Colors.error;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              onValueChange={setNotificationsEnabled}
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
                  onValueChange={setRideNotifications}
                  trackColor={{ false: Colors.gray[300], true: Colors.success }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingDivider} />
              <View style={styles.settingRow}>
                <Text style={styles.settingSubLabel}>Earnings Updates</Text>
                <Switch
                  value={earningsNotifications}
                  onValueChange={setEarningsNotifications}
                  trackColor={{ false: Colors.gray[300], true: Colors.success }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.settingDivider} />
              <View style={styles.settingRow}>
                <Text style={styles.settingSubLabel}>Promotions</Text>
                <Switch
                  value={promotionNotifications}
                  onValueChange={setPromotionNotifications}
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
                  <Text style={styles.notificationTime}>{getTimeAgo(notification.time)}</Text>
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