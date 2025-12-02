/**
 * DRIVER TABS LAYOUT
 * Bottom Navigation: Home, Earnings, Inbox, Menu
 * Custom tab bar with purple theme
 *
 * EXPO SDK 52 Compatible
 *
 * GUARD: Redirects to registration if driver profile doesn't exist or registration is incomplete
 */

import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';
import firestore from '@react-native-firebase/firestore';

export default function DriverTabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);

  useEffect(() => {
    checkDriverRegistration();

    // Safety timeout - if check takes longer than 10 seconds, redirect to rider home
    const timeout = setTimeout(() => {
      if (isChecking) {
        console.log('⏰ Check timed out - redirecting to rider home');
        setIsChecking(false);
        router.replace('/(tabs)');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [user?.id]);

  const checkDriverRegistration = async () => {
    if (!user?.id) {
      // No user logged in - redirect to sign in
      console.log('❌ No user ID - redirecting to sign in');
      router.replace('/(auth)/sign-in');
      setIsChecking(false);
      return;
    }

    try {
      // Check if driver profile exists in Firebase
      const driverDoc = await firestore()
        .collection('drivers')
        .doc(user.id)
        .get();

      if (!driverDoc.exists) {
        // No driver profile - check if there's a saved registration in progress
        try {
          const registrationDoc = await firestore()
            .collection('driverRegistrationProgress')
            .doc(user.id)
            .get();

          if (registrationDoc.exists) {
            const progress = registrationDoc.data();
            const step = progress?.currentStep || 1;
            console.log('📝 Found registration in progress at step:', step);

            // Redirect to the appropriate registration screen based on saved step
            const stepRoutes: { [key: number]: string } = {
              1: '/(driver)/registration/welcome',
              2: '/(driver)/registration/legal-consent',
              3: '/(driver)/registration/personal-info',
              4: '/(driver)/registration/vehicle-info',
              5: '/(driver)/registration/vehicle-photos',
              6: '/(driver)/registration/drivers-license',
              7: '/(driver)/registration/insurance',
              8: '/(driver)/registration/registration-cert',
              9: '/(driver)/registration/inspection',
              10: '/(driver)/registration/background-check',
              11: '/(driver)/registration/bank-details',
              12: '/(driver)/registration/review-application',
            };

            router.replace(stepRoutes[step] || '/(driver)/registration/welcome');
          } else {
            // No registration progress - start from beginning
            console.log('📝 No driver profile - redirecting to registration');
            router.replace('/(driver)/registration/welcome');
          }
        } catch (progressError: any) {
          // If we can't read registration progress, just start fresh
          console.log('⚠️ Could not check registration progress, starting fresh');
          router.replace('/(driver)/registration/welcome');
        }
        setIsChecking(false);
        return;
      }

      const driverData = driverDoc.data();
      const registrationStatus = driverData?.registrationStatus;

      // Check registration status
      if (registrationStatus === 'pending') {
        console.log('⏳ Registration pending approval');
        router.replace('/(driver)/registration/pending-approval');
        setIsChecking(false);
        return;
      }

      if (registrationStatus === 'rejected') {
        console.log('❌ Registration rejected');
        router.replace('/(driver)/registration/rejected');
        setIsChecking(false);
        return;
      }

      // Registration is approved or driver exists - allow access
      console.log('✅ Driver registration complete - allowing access to tabs');
      setIsRegistrationComplete(true);
      setIsChecking(false);
    } catch (error: any) {
      console.error('❌ Error checking driver registration:', error);

      // Handle permission denied or other Firebase errors
      if (error?.code === 'firestore/permission-denied' ||
          error?.message?.includes('permission-denied') ||
          error?.message?.includes('Permission denied')) {
        console.log('🔒 Permission denied - user may not have driver access');
        // Check if user has DRIVER role
        if (!user?.roles?.includes('DRIVER')) {
          // User doesn't have driver role - redirect to rider profile or registration
          console.log('👤 User is not a driver - redirecting to registration welcome');
          router.replace('/(driver)/registration/welcome');
        } else {
          // User has role but permission issue - redirect to rider home
          console.log('⚠️ Permission issue - redirecting to rider home');
          router.replace('/(tabs)');
        }
      } else {
        // Other error - redirect to rider home to be safe
        console.log('⚠️ Unknown error - redirecting to rider home');
        router.replace('/(tabs)');
      }
      setIsChecking(false);
    }
  };

  // Show loading while checking registration status
  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Checking registration status...</Text>
      </View>
    );
  }

  // Don't render tabs if registration is not complete (redirect will happen)
  if (!isRegistrationComplete) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          height: (Platform.OS === 'ios' ? 70 : 60) + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.gray[200],
          ...Shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontFamily: Typography.fontFamily.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name="home" size={size} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name="wallet" size={size} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name="mail" size={size} color={color} />
              {/* Notification Badge */}
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>5</Text>
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name="menu" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 35,
    borderRadius: BorderRadius.md,
  },

  iconContainerActive: {
    backgroundColor: Colors.primaryLight + '20',
  },

  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});