/**
 * DRIVER MENU SCREEN
 * Complete navigation hub for driver app
 * Includes:
 * - Profile & Documents
 * - Earnings & Wallet
 * - Trip History
 * - Preferences
 * - Registration Status
 * - Feedback & Ratings
 * - Help & Support
 * - Legal & Policies
 * - Settings
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '@/src/stores/driver-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { addRoleToUser } from '@/src/services/role-service';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  route: string;
  badge?: string | number;
  color?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function DriverMenuScreen() {
  const router = useRouter();
  const { driver, registrationStatus } = useDriverStore();
  const { user, logout, setMode } = useAuthStore();
  const [switching, setSwitching] = useState(false);

  const handleSwitchToRider = async () => {
    if (!user) return;

    // Check if user already has rider role
    const hasRiderRole = user?.roles?.includes('RIDER');

    if (hasRiderRole) {
      // User has rider role, just switch mode and navigate
      console.log('✅ Switching to rider mode');
      setMode('RIDER');
      router.replace('/(tabs)');
    } else {
      // User doesn't have rider role, ask if they want to become a rider
      Alert.alert(
        'Switch to Rider Mode',
        'Would you like to use Drift as a rider?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch to Rider',
            onPress: async () => {
              setSwitching(true);
              try {
                // Add rider role to user
                await addRoleToUser('RIDER');

                // Switch to rider mode
                setMode('RIDER');

                // Navigate to rider home
                router.replace('/(tabs)');
              } catch (error: any) {
                console.error('Failed to add rider role:', error);
                Alert.alert('Error', error.message || 'Failed to switch to rider mode');
              } finally {
                setSwitching(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Earnings & Wallet',
      items: [
        {
          icon: 'wallet-outline',
          title: 'Wallet',
          subtitle: 'View balance and transactions',
          route: '/(driver)/dashboard/wallet',
        },
        {
          icon: 'trending-up-outline',
          title: "Today's Earnings",
          subtitle: 'View earnings breakdown',
          route: '/(driver)/dashboard/earnings',
        },
        {
          icon: 'calendar-outline',
          title: 'Weekly Summary',
          subtitle: 'See your weekly performance',
          route: '/(driver)/profile/weekly-summary',
        },
        {
          icon: 'card-outline',
          title: 'Payment Methods',
          subtitle: 'Manage payout methods',
          route: '/(driver)/settings/payout-methods',
        },
        {
          icon: 'cash-outline',
          title: 'Payout History',
          subtitle: 'Transaction history',
          route: '/(driver)/history/trips',
        },
      ],
    },
    {
      title: 'Trip History',
      items: [
        {
          icon: 'car-sport-outline',
          title: 'Completed Trips',
          subtitle: 'View all completed trips',
          route: '/(driver)/history/trips',
        },
        {
          icon: 'close-circle-outline',
          title: 'Cancelled Trips',
          subtitle: 'See cancellation history',
          route: '/(driver)/history/trips',
        },
        {
          icon: 'time-outline',
          title: 'Upcoming Trips',
          subtitle: 'Scheduled rides',
          route: '/(driver)/dashboard/schedule',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'time-outline',
          title: 'Working Hours',
          subtitle: 'Set your availability',
          route: '/(driver)/settings/preferences',
        },
        {
          icon: 'location-outline',
          title: 'Service Area',
          subtitle: 'Choose your preferred areas',
          route: '/(driver)/settings/preferences',
        },
        {
          icon: 'car-outline',
          title: 'Vehicle Preferences',
          subtitle: 'Manage vehicle settings',
          route: '/(driver)/dashboard/preferences',
        },
      ],
    },
    {
      title: 'Feedback & Performance',
      items: [
        {
          icon: 'star-outline',
          title: 'My Ratings',
          subtitle: `${driver?.rating || 0} stars`,
          route: '/(driver)/dashboard/stats',
        },
        {
          icon: 'chatbubbles-outline',
          title: 'Rider Reviews',
          subtitle: 'See what riders say',
          route: '/(driver)/dashboard/feedback',
        },
        {
          icon: 'analytics-outline',
          title: 'Performance Stats',
          subtitle: 'Track your performance',
          route: '/(driver)/dashboard/stats',
        },
      ],
    },
    {
      title: 'Help & Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'FAQ',
          subtitle: 'Frequently asked questions',
          route: '/(driver)/support/help',
        },
        {
          icon: 'chatbox-ellipses-outline',
          title: 'Contact Support',
          subtitle: '24/7 driver support',
          route: '/(driver)/support/contact',
        },
        {
          icon: 'warning-outline',
          title: 'Report Issue',
          subtitle: 'Report a problem',
          route: '/(driver)/support/help',
        },
        {
          icon: 'school-outline',
          title: 'Driver Resources',
          subtitle: 'Tips and best practices',
          route: '/(driver)/support/help',
        },
      ],
    },
    {
      title: 'Legal & Policies',
      items: [
        {
          icon: 'document-text-outline',
          title: 'Terms & Conditions',
          subtitle: 'Read terms of service',
          route: '/(driver)/legal/terms',
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacy Policy',
          subtitle: 'How we protect your data',
          route: '/(driver)/legal/privacy',
        },
        {
          icon: 'document-attach-outline',
          title: 'Driver Agreement',
          subtitle: 'View your agreement',
          route: '/(driver)/legal/agreement',
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          route: '/(driver)/settings/notifications',
        },
        {
          icon: 'lock-closed-outline',
          title: 'Privacy & Security',
          subtitle: 'Account security settings',
          route: '/(driver)/settings/privacy',
        },
        {
          icon: 'language-outline',
          title: 'Language',
          subtitle: 'English',
          route: '/(driver)/settings/language',
        },
        {
          icon: 'settings-outline',
          title: 'Account Settings',
          subtitle: 'Manage your account',
          route: '/(driver)/settings/account',
        },
      ],
    },
  ];

  const handleMenuPress = (route: string) => {
    try {
      router.push(route as any);
    } catch (error) {
      Alert.alert('Coming Soon', 'This feature is under development.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/(driver)/profile/view')}
        >
          <View style={styles.profileAvatar}>
            {driver?.photoUrl ? (
              <Image
                source={{ uri: driver.photoUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={32} color={Colors.primary} />
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {driver?.firstName} {driver?.lastName}
            </Text>
            <View style={styles.profileRating}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.profileRatingText}>
                {driver?.rating?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.profileTrips}>
                • {driver?.totalTrips || 0} trips
              </Text>
            </View>
            <Text style={styles.profileLink}>
              View Profile & Documents →
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={24} color={Colors.gray[400]} />
        </TouchableOpacity>

        {/* Menu Sections */}
        {menuSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex !== section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => handleMenuPress(item.route)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[
                      styles.menuItemIcon,
                      item.color && { backgroundColor: item.color + '20' }
                    ]}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={item.color || Colors.primary}
                      />
                    </View>
                    
                    <View style={styles.menuItemText}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.menuItemRight}>
                    {item.badge && (
                      <View style={[
                        styles.badge,
                        { backgroundColor: item.color || Colors.primary }
                      ]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Admin Dashboard Button */}
        {user?.roles?.includes('ADMIN') && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/(admin)')}
          >
            <Ionicons name="shield-checkmark" size={22} color={Colors.white} />
            <Text style={styles.adminButtonText}>Admin Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Switch to Rider Button */}
        <TouchableOpacity
          style={styles.switchToRiderButton}
          onPress={handleSwitchToRider}
          disabled={switching}
        >
          {switching ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="car-outline" size={22} color={Colors.white} />
              <Text style={styles.switchToRiderText}>
                {user?.roles?.includes('RIDER') ? 'Switch to Rider' : 'Use Drift as Rider'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>Drift Driver v1.0.0</Text>
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
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  
  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.base,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },
  
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
  },
  
  profileInfo: {
    flex: 1,
  },
  
  profileName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: 4,
  },
  
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  profileRatingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginLeft: 4,
  },
  
  profileTrips: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginLeft: 4,
  },
  
  profileLink: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
    marginTop: 4,
  },
  
  // Menu Sections
  section: {
    marginTop: Spacing.base,
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.base,
    marginBottom: Spacing.sm,
  },
  
  sectionContent: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  
  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
  },
  
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  
  menuItemText: {
    flex: 1,
  },
  
  menuItemTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: 2,
  },
  
  menuItemSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  // Admin Dashboard Button
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.base,
    marginTop: Spacing.xl,
    padding: Spacing.base,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
  },
  adminButtonText: {
    ...Typography.buttonText,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: Spacing.xs,
  },

  // Switch to Rider Button
  switchToRiderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
  },

  switchToRiderText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.base,
    marginTop: Spacing.xl,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    ...Shadows.sm,
  },
  
  logoutText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
  
  version: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[400],
    textAlign: 'center',
    marginTop: Spacing.base,
  },
});