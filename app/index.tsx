import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/stores/auth-store';

/**
 * ROOT ENTRY POINT
 * 
 * This is the first screen that loads.
 * It checks if user is logged in and routes accordingly.
 */
export default function Index() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state listener
    initialize();
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5d1289" />
      </View>
    );
  }

  // Route based on auth state
  if (user) {
    // User is logged in - check their role and navigate accordingly
    // Note: Users should have selected their mode during sign-up
    // If they have both roles, default to rider mode (they can switch in profile)
    if (user.roles?.includes('DRIVER')) {
      return <Redirect href="/(driver)/tabs" />;
    } else if (user.roles?.includes('RIDER')) {
      return <Redirect href="/(tabs)" />;
    } else {
      // No role assigned (shouldn't happen) - send to role selection
      return <Redirect href="/select-role" />;
    }
  } else {
    // User not logged in → Go to welcome page (no guest access)
    return <Redirect href="/(auth)/welcome" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});