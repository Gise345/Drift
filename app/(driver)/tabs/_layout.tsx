/**
 * DRIVER TABS LAYOUT
 * Bottom Navigation: Home, Earnings, Inbox, Menu
 * Custom tab bar with purple theme
 * 
 * EXPO SDK 52 Compatible
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Shadows } from '@/src/constants/theme';

export default function DriverTabsLayout() {
  const insets = useSafeAreaInsets();

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