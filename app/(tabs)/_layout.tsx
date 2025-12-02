import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/auth-store';

/**
 * TABS LAYOUT
 *
 * Bottom navigation with 3 tabs:
 * 1. Home - Main map and booking
 * 2. Activity - Trip history
 * 3. Profile - User profile
 *
 * REQUIRES AUTHENTICATION - Redirects to welcome if not logged in
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const router = useRouter();

  // Auth guard - redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/welcome');
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5d1289',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Activity Tab - Renders activity.tsx content directly */}
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Profile Tab - Renders profile.tsx content directly */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
