import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * DEV MENU - Test all driver screens
 * 
 * This is a development-only screen for testing navigation.
 * Remove or disable in production builds.
 * 
 * Access with: router.push('/(driver)/dev-menu')
 */

interface ScreenLink {
  name: string;
  route: string;
  category: string;
}

export default function DevMenuScreen() {
  const screens: ScreenLink[] = [
    // Registration (15)
    { name: 'Welcome', route: '/(driver)/registration/welcome', category: 'Registration' },
    { name: 'Legal Consent', route: '/(driver)/registration/legal-consent', category: 'Registration' },
    { name: 'Personal Info', route: '/(driver)/registration/personal-info', category: 'Registration' },
    { name: 'Vehicle Info', route: '/(driver)/registration/vehicle-info', category: 'Registration' },
    { name: 'Vehicle Photos', route: '/(driver)/registration/vehicle-photos', category: 'Registration' },
    { name: 'Drivers License', route: '/(driver)/registration/drivers-license', category: 'Registration' },
    { name: 'Insurance', route: '/(driver)/registration/insurance', category: 'Registration' },
    { name: 'Registration Cert', route: '/(driver)/registration/registration-cert', category: 'Registration' },
    { name: 'Inspection', route: '/(driver)/registration/inspection', category: 'Registration' },
    { name: 'Bank Details', route: '/(driver)/registration/bank-details', category: 'Registration' },
    { name: 'Review Application', route: '/(driver)/registration/review-application', category: 'Registration' },
    { name: 'Pending Approval', route: '/(driver)/registration/pending-approval', category: 'Registration' },
    { name: 'Approved', route: '/(driver)/registration/approved', category: 'Registration' },
    { name: 'Rejected', route: '/(driver)/registration/rejected', category: 'Registration' },

    // Dashboard (12)
    { name: 'Dashboard Home', route: '/(driver)/dashboard/home', category: 'Dashboard' },
    { name: 'Earnings', route: '/(driver)/dashboard/earnings', category: 'Dashboard' },
    { name: 'Wallet', route: '/(driver)/dashboard/wallet', category: 'Dashboard' },
    { name: 'Notifications', route: '/(driver)/dashboard/notifications', category: 'Dashboard' },
    { name: 'Stats', route: '/(driver)/dashboard/stats', category: 'Dashboard' },
    { name: 'Preferences', route: '/(driver)/dashboard/preferences', category: 'Dashboard' },
    { name: 'Promotions', route: '/(driver)/dashboard/promotions', category: 'Dashboard' },
    { name: 'Referrals', route: '/(driver)/dashboard/referrals', category: 'Dashboard' },
    { name: 'Feedback', route: '/(driver)/dashboard/feedback', category: 'Dashboard' },
    { name: 'Schedule', route: '/(driver)/dashboard/schedule', category: 'Dashboard' },
    { name: 'Incoming Requests', route: '/(driver)/dashboard/incoming-requests', category: 'Dashboard' },
    { name: 'Request Detail', route: '/(driver)/dashboard/request-detail', category: 'Dashboard' },

    // Active Ride (13)
    { name: 'Navigate to Pickup', route: '/(driver)/active-ride/navigate-to-pickup', category: 'Active Ride' },
    { name: 'Arrived at Pickup', route: '/(driver)/active-ride/arrived-at-pickup', category: 'Active Ride' },
    { name: 'Start Ride', route: '/(driver)/active-ride/start-ride', category: 'Active Ride' },
    { name: 'Navigate to Destination', route: '/(driver)/active-ride/navigate-to-destination', category: 'Active Ride' },
    { name: 'Complete Ride', route: '/(driver)/active-ride/complete-ride', category: 'Active Ride' },
    { name: 'Payment Received', route: '/(driver)/active-ride/payment-received', category: 'Active Ride' },
    { name: 'Rate Rider', route: '/(driver)/active-ride/rate-rider', category: 'Active Ride' },
    { name: 'Cancel Ride', route: '/(driver)/active-ride/cancel-ride', category: 'Active Ride' },
    { name: 'Rider No Show', route: '/(driver)/active-ride/rider-no-show', category: 'Active Ride' },
    { name: 'Add Stop', route: '/(driver)/active-ride/add-stop', category: 'Active Ride' },
    { name: 'Emergency SOS', route: '/(driver)/active-ride/emergency-sos', category: 'Active Ride' },
    { name: 'Share Trip', route: '/(driver)/active-ride/share-trip', category: 'Active Ride' },
    { name: 'Trip Summary', route: '/(driver)/active-ride/trip-summary', category: 'Active Ride' },

    // History (5)
    { name: 'Trips', route: '/(driver)/history/trips', category: 'History' },
    { name: 'Trip Detail', route: '/(driver)/history/trip-detail', category: 'History' },
    { name: 'Trip Receipt', route: '/(driver)/history/trip-receipt', category: 'History' },
    { name: 'Trip Filters', route: '/(driver)/history/trip-filters', category: 'History' },
    { name: 'Trip Support', route: '/(driver)/history/trip-support', category: 'History' },

    // Profile (14)
    { name: 'Profile View', route: '/(driver)/profile/profile-view', category: 'Profile' },
    { name: 'Edit Profile', route: '/(driver)/profile/edit-profile', category: 'Profile' },
    { name: 'Upload Photo', route: '/(driver)/profile/upload-photo', category: 'Profile' },
    { name: 'Performance Stats', route: '/(driver)/profile/performance-stats', category: 'Profile' },
    { name: 'Achievements', route: '/(driver)/profile/achievements', category: 'Profile' },
    { name: 'Weekly Summary', route: '/(driver)/profile/weekly-summary', category: 'Profile' },
    { name: 'Documents', route: '/(driver)/profile/documents', category: 'Profile' },
    { name: 'Document Detail', route: '/(driver)/profile/document-detail', category: 'Profile' },
    { name: 'Upload Document', route: '/(driver)/profile/upload-document', category: 'Profile' },
    { name: 'Vehicle Details', route: '/(driver)/profile/vehicle-details', category: 'Profile' },
    { name: 'Update Vehicle', route: '/(driver)/profile/update-vehicle', category: 'Profile' },
    { name: 'Ratings & Reviews', route: '/(driver)/profile/ratings-reviews', category: 'Profile' },
    { name: 'Review Detail', route: '/(driver)/profile/review-detail', category: 'Profile' },
    { name: 'Referral Program', route: '/(driver)/profile/referral-program', category: 'Profile' },

    // Settings (4)
    { name: 'Settings Index', route: '/(driver)/settings/index', category: 'Settings' },
    { name: 'Notifications', route: '/(driver)/settings/notifications', category: 'Settings' },
    { name: 'Preferences', route: '/(driver)/settings/preferences', category: 'Settings' },
    { name: 'Payout Methods', route: '/(driver)/settings/payout-methods', category: 'Settings' },

    // Support (2)
    { name: 'Help Center', route: '/(driver)/support/help', category: 'Support' },
    { name: 'Contact Support', route: '/(driver)/support/contact', category: 'Support' },
  ];

  // Group screens by category
  const categories = Array.from(new Set(screens.map(s => s.category)));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Registration': '#FF6B6B',
      'Dashboard': '#4ECDC4',
      'Active Ride': '#45B7D1',
      'History': '#FFA07A',
      'Profile': '#98D8C8',
      'Settings': '#F7DC6F',
      'Support': '#BB8FCE',
    };
    return colors[category] || '#95A5A6';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧪 Dev Menu</Text>
        <Text style={styles.headerSubtitle}>65 Screens</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>15</Text>
          <Text style={styles.statLabel}>Registration</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Dashboard</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>13</Text>
          <Text style={styles.statLabel}>Active Ride</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>19</Text>
          <Text style={styles.statLabel}>Profile/History</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>6</Text>
          <Text style={styles.statLabel}>Settings</Text>
        </View>
      </View>

      {/* Screen List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.map(category => (
          <View key={category} style={styles.category}>
            <Text style={styles.categoryTitle}>
              {category} ({screens.filter(s => s.category === category).length})
            </Text>
            {screens
              .filter(s => s.category === category)
              .map((screen, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.screenCard,
                    { borderLeftColor: getCategoryColor(category) },
                  ]}
                  onPress={() => router.push(screen.route as any)}
                >
                  <View style={styles.screenContent}>
                    <Text style={styles.screenName}>{screen.name}</Text>
                    <Text style={styles.screenRoute}>{screen.route}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ⚠️ This is a development menu. Remove in production.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2C3E50',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 10,
    color: '#7F8C8D',
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  category: {
    marginTop: 20,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 15,
    marginBottom: 10,
  },
  screenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  screenContent: {
    flex: 1,
  },
  screenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  screenRoute: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#E74C3C',
    textAlign: 'center',
  },
});