/**
 * DRIVER INBOX SCREEN
 * Notifications and messages hub
 * 
 * Features:
 * - Ride requests
 * - System notifications
 * - Earnings updates
 * - Document updates
 * - Promotional messages
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '@/src/stores/driver-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import {
  NotificationService,
  Notification as FirebaseNotification,
  NotificationType,
} from '@/src/services/notification.service';

interface Notification extends FirebaseNotification {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  time: string;
}

export default function DriverInboxScreen() {
  const router = useRouter();
  const { driver } = useDriverStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Helper function to get icon and color for notification type
  const getNotificationIconAndColor = (type: NotificationType): { icon: keyof typeof Ionicons.glyphMap; iconColor: string } => {
    switch (type) {
      case 'ride':
        return { icon: 'car-sport', iconColor: Colors.primary };
      case 'earnings':
        return { icon: 'wallet', iconColor: Colors.success };
      case 'document':
        return { icon: 'alert-circle', iconColor: Colors.warning };
      case 'system':
        return { icon: 'star', iconColor: Colors.info };
      case 'promo':
        return { icon: 'gift', iconColor: Colors.info };
      case 'admin':
        return { icon: 'megaphone', iconColor: Colors.primary };
      default:
        return { icon: 'notifications', iconColor: Colors.gray[600] };
    }
  };

  // Helper function to format time
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes} min ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Subscribe to real-time notifications from Firebase
  useEffect(() => {
    if (!driver?.id) return;

    // Initial load
    loadNotifications();

    // Set up real-time listener
    const unsubscribe = NotificationService.subscribeToNotifications(
      driver.id,
      (firebaseNotifications) => {
        // Map Firebase notifications to app format
        const mappedNotifications: Notification[] = firebaseNotifications.map(notif => {
          const { icon, iconColor } = getNotificationIconAndColor(notif.type);
          return {
            ...notif,
            icon,
            iconColor,
            time: formatTime(notif.createdAt),
          };
        });
        setNotifications(mappedNotifications);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [driver?.id]);

  const loadNotifications = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const firebaseNotifications = await NotificationService.getNotifications(driver.id);

      // Map Firebase notifications to app format
      const mappedNotifications: Notification[] = firebaseNotifications.map(notif => {
        const { icon, iconColor } = getNotificationIconAndColor(notif.type);
        return {
          ...notif,
          icon,
          iconColor,
          time: formatTime(notif.createdAt),
        };
      });

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!driver?.id) return;

    try {
      // Mark as read in Firebase
      if (!notification.read) {
        await NotificationService.markAsRead(notification.id);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );

      // Navigate if action exists
      if (notification.action) {
        router.push(notification.action as any);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!driver?.id) return;

    try {
      await NotificationService.markAllAsRead(driver.id);

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleClearAll = () => {
    if (!driver?.id) return;

    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.deleteAllNotifications(driver.id);
              setNotifications([]);
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

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
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-done" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'unread' && styles.filterTabTextActive,
            ]}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'unread'
                ? 'You\'re all caught up!'
                : 'You don\'t have any notifications yet'}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification, index) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread,
                  index === filteredNotifications.length - 1 && styles.notificationItemLast,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: notification.iconColor + '20' },
                  ]}
                >
                  <Ionicons
                    name={notification.icon}
                    size={24}
                    color={notification.iconColor}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>

                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>

                {notification.action && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.gray[400]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Quick Actions (if notifications present) */}
      {filteredNotifications.length > 0 && unreadCount > 0 && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.quickActionText}>Mark All Read</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },

  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },

  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },

  filterTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  filterTabActive: {
    borderBottomColor: Colors.primary,
  },

  filterTabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
  },

  filterTabTextActive: {
    color: Colors.primary,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },

  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[400],
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  emptyStateText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    textAlign: 'center',
  },

  // Notifications List
  notificationsList: {
    marginTop: Spacing.base,
  },

  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },

  notificationItemUnread: {
    backgroundColor: Colors.primaryLight + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },

  notificationItemLast: {
    marginBottom: Spacing.base,
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
    alignItems: 'center',
    marginBottom: 4,
  },

  notificationTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    flex: 1,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.xs,
  },

  notificationMessage: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    lineHeight: 20,
    marginBottom: 4,
  },

  notificationTime: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },

  // Quick Actions
  quickActions: {
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },

  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },

  quickActionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
});