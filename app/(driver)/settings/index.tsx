import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

/**
 * SETTINGS INDEX SCREEN
 * 
 * Main settings menu with navigation to:
 * - Notification preferences
 * - Driving preferences
 * - Payout methods
 * - Help & support
 * - Account management
 * - About & legal
 */

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route?: string;
  action?: () => void;
  badge?: string;
}

export default function SettingsScreen() {
  const appVersion = '1.0.0';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Clear auth state and navigate to login
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            console.log('Delete account');
          },
        },
      ]
    );
  };

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Push notifications and sounds',
          icon: 'notifications-outline',
          route: '/(driver)/settings/notifications',
        },
        {
          id: 'driving',
          title: 'Driving Preferences',
          subtitle: 'Auto-accept, trip types, areas',
          icon: 'car-outline',
          route: '/(driver)/settings/preferences',
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English',
          icon: 'language-outline',
          action: () => {
            Alert.alert('Coming Soon', 'Language selection will be available in a future update.');
          },
        },
      ],
    },
    {
      title: 'Payment',
      items: [
        {
          id: 'payout',
          title: 'Payout Methods',
          subtitle: 'Bank accounts and payment options',
          icon: 'card-outline',
          route: '/(driver)/settings/payout-methods',
        },
        {
          id: 'tax',
          title: 'Tax Information',
          subtitle: 'Tax forms and documents',
          icon: 'document-text-outline',
          action: () => {
            Alert.alert('Coming Soon', 'Tax information will be available soon.');
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          subtitle: 'FAQs and support articles',
          icon: 'help-circle-outline',
          route: '/(driver)/support/help',
        },
        {
          id: 'contact',
          title: 'Contact Support',
          subtitle: 'Get help from our team',
          icon: 'chatbubble-outline',
          route: '/(driver)/support/contact',
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve Drift',
          icon: 'megaphone-outline',
          action: () => {
            router.push('/(driver)/support/contact');
          },
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'terms',
          title: 'Terms of Service',
          subtitle: 'Driver agreement and policies',
          icon: 'document-outline',
          action: () => {
            // TODO: Open terms of service
            console.log('Open terms');
          },
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          subtitle: 'How we handle your data',
          icon: 'shield-checkmark-outline',
          action: () => {
            // TODO: Open privacy policy
            console.log('Open privacy');
          },
        },
        {
          id: 'about',
          title: 'About Drift',
          subtitle: `Version ${appVersion}`,
          icon: 'information-circle-outline',
          action: () => {
            Alert.alert(
              'Drift Driver',
              `Version ${appVersion}\n\n© 2024 Drift Ltd.\nMade in the Cayman Islands 🇰🇾`,
              [{ text: 'OK' }]
            );
          },
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          icon: 'log-out-outline',
          action: handleLogout,
        },
        {
          id: 'delete',
          title: 'Delete Account',
          subtitle: 'Permanently remove your account',
          icon: 'trash-outline',
          action: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={() => {
        if (item.route) {
          router.push(item.route as any);
        } else if (item.action) {
          item.action();
        }
      }}
    >
      <View style={styles.settingIcon}>
        <Ionicons
          name={item.icon as any}
          size={24}
          color={
            item.id === 'delete'
              ? Colors.error[500]
              : item.id === 'logout'
              ? Colors.warning[500]
              : Colors.primary[500]
          }
        />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[
            styles.settingTitle,
            (item.id === 'delete' || item.id === 'logout') && styles.dangerText,
          ]}
        >
          {item.title}
        </Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      {item.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {settingsSections.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            Drift Driver v{appVersion}
          </Text>
          <Text style={styles.appInfoSubtext}>
            © 2024 Drift Ltd. All rights reserved.
          </Text>
        </View>
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
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[200],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  settingSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  dangerText: {
    color: Colors.error[500],
  },
  badge: {
    backgroundColor: Colors.error[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  appInfoText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  appInfoSubtext: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
});