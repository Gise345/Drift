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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '@/src/stores/driver-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

type NotificationType = 'ride' | 'earnings' | 'system' | 'document' | 'promo';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  action?: string;
}

export default function DriverInboxScreen() {
  const router = useRouter();
  const { driver } = useDriverStore();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'ride',
      title: 'New Ride Request',
      message: 'John D. requested a ride to Seven Mile Beach',
      time: '5 min ago',
      read: false,
      icon: 'car-sport',
      iconColor: Colors.primary,
      action: '/(driver)/requests/123',
    },
    {
      id: '2',
      type: 'earnings',
      title: 'Weekly Earnings Summary',
      message: 'You earned $450.50 this week with 32 trips',
      time: '1 hour ago',
      read: false,
      icon: 'wallet',
      iconColor: Colors.success,
      action: '/(driver)/tabs/earnings',
    },
    {
      id: '3',
      type: 'document',
      title: 'Document Expiring Soon',
      message: 'Your vehicle insurance expires in 15 days',
      time: '3 hours ago',
      read: true,
      icon: 'alert-circle',
      iconColor: Colors.warning,
      action: '/(driver)/profile/documents',
    },
    {
      id: '4',
      type: 'system',
      title: 'Rating Update',
      message: 'Great job! Your rating increased to 4.9 ⭐',
      time: '1 day ago',
      read: true,
      icon: 'star',
      iconColor: Colors.warning,
    },
    {
      id: '5',
      type: 'promo',
      title: 'Weekend Bonus!',
      message: 'Complete 20 trips this weekend and earn $50 bonus',
      time: '2 days ago',
      read: true,
      icon: 'gift',
      iconColor: Colors.info,
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Load notifications from Firebase
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    // Navigate if action exists
    if (notification.action) {
      router.push(notification.action as any);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

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