/**
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/auth-store';
import { useDriverStore } from '@/src/stores/driver-store';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from '@react-native-firebase/firestore';

const app = getApp();
const db = getFirestore(app, 'main');

/**
 * Profile Tab Screen
 * User profile with settings and account management
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, setMode } = useAuthStore();
  const { driver } = useDriverStore();
  const [switching, setSwitching] = useState(false);
  const [stats, setStats] = useState({
    rating: 0,
    totalTrips: 0,
    memberSince: new Date(),
  });

  // Load user stats from Firestore
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;

      try {
        // Get user document for rating and createdAt
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);

        // Count completed trips from trips collection
        const tripsRef = collection(db, 'trips');
        const tripsQuery = query(
          tripsRef,
          where('riderId', '==', user.id),
          where('status', 'in', ['COMPLETED', 'AWAITING_TIP'])
        );
        const tripsSnapshot = await getDocs(tripsQuery);

        const tripCount = tripsSnapshot.size;

        if (userDoc.exists) {
          const userData = userDoc.data();
          const createdAt = userData?.createdAt?.toDate() || user.createdAt || new Date();

          setStats({
            rating: userData?.rating || user.rating || 0,
            totalTrips: tripCount,
            memberSince: createdAt,
          });
        } else {
          const createdAt = user.createdAt || new Date();
          setStats({
            rating: user.rating || 0,
            totalTrips: tripCount,
            memberSince: createdAt,
          });
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
        const createdAt = user.createdAt || new Date();
        setStats({
          rating: user.rating || 0,
          totalTrips: user.totalTrips || 0,
          memberSince: createdAt,
        });
      }
    };

    loadUserStats();
  }, [user?.id]);

  const handleSwitchToDriver = async () => {
    if (!user) return;

    setSwitching(true);

    try {
      const hasDriverRole = user?.roles?.includes('DRIVER');

      const driverRef = doc(db, 'drivers', user.id);
      const driverDoc = await getDoc(driverRef);

      const driverExists = driverDoc.exists;

      console.log('🔍 Driver check:', { hasDriverRole, driverExists, userId: user.id });

      if (driverExists && hasDriverRole) {
        console.log('✅ Driver profile exists - going to driver home');
        setMode('DRIVER');
        router.replace('/(driver)/tabs');
      } else if (hasDriverRole && !driverExists) {
        console.log('📝 Has role but no profile - going to driver registration');
        setMode('DRIVER');
        router.replace('/(driver)/registration/welcome');
      } else {
        setSwitching(false);
        Alert.alert(
          'Become a Driver',
          'Would you like to start earning by becoming a Drift driver?',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Get Started',
              onPress: async () => {
                setSwitching(true);
                try {
                  // DON'T add driver role yet - it will be added after they complete registration
                  // Just navigate to driver registration welcome
                  // The role will be added in submitDriverRegistration after all documents are submitted
                  router.push('/(driver)/registration/welcome');
                } catch (error: any) {
                  console.error('Failed to start driver registration:', error);
                  Alert.alert('Error', error.message || 'Failed to start driver registration');
                } finally {
                  setSwitching(false);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error switching to driver:', error);
      Alert.alert('Error', 'Failed to check driver status. Please try again.');
      setSwitching(false);
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your information',
      route: '/(rider)/edit-profile',
    },
    {
      icon: 'star-outline',
      title: 'My Reviews',
      subtitle: 'See reviews from drivers',
      route: '/(rider)/my-reviews',
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage cards and payments',
      route: '/(rider)/payment-methods',
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage your alerts',
      route: '/(rider)/notifications',
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'App preferences',
      route: '/(rider)/settings',
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get assistance',
      route: '/(rider)/help',
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'About Drift',
      route: '/(rider)/about',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {(user?.profilePhoto || user?.photoURL) ? (
              <Image
                source={{ uri: user.profilePhoto || user.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={50} color="#9CA3AF" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={() => router.push('/(rider)/edit-profile')}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.userEmail}>{user?.email || user?.phone}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.rating > 0 ? stats.rating.toFixed(1) : '--'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={24} color="#5d1289ff" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Admin Dashboard Button */}
        {user?.roles?.includes('ADMIN') && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/(admin)')}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={20} color="#FFF" />
            <Text style={styles.adminButtonText}>Admin Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Switch to Driver Button */}
        <TouchableOpacity
          style={styles.switchToDriverButton}
          onPress={handleSwitchToDriver}
          activeOpacity={0.8}
          disabled={switching}
        >
          {switching ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="car-sport" size={20} color="#FFF" />
              <Text style={styles.switchToDriverText}>
                {user?.roles?.includes('DRIVER') ? 'Switch to Driver' : 'Become a Driver'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.push('/(rider)/logout')}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  profileCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5d1289ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  switchToDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5d1289ff',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#5d1289ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  switchToDriverText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  version: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
});
