import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/stores/auth-store';

/**
 * ROOT ENTRY POINT
 *
 * This is the first screen that loads.
 * It checks if user is logged in and routes accordingly.
 * Uses saved mode from AsyncStorage to return user to their last screen.
 */
export default function Index() {
  const { user, loading, currentMode, initialize } = useAuthStore();

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

  // Route based on auth state and saved mode
  if (user) {
    // User is logged in - use the currentMode which was loaded from AsyncStorage
    // This ensures user returns to their last screen (rider or driver)
    if (currentMode === 'DRIVER' && user.roles?.includes('DRIVER')) {
      console.log('🚗 Navigating to driver screen (saved mode)');
      return <Redirect href="/(driver)/tabs" />;
    } else if (user.roles?.includes('RIDER')) {
      console.log('🧑 Navigating to rider screen');
      return <Redirect href="/(tabs)" />;
    } else if (user.roles?.includes('DRIVER')) {
      // User only has driver role
      console.log('🚗 Navigating to driver screen (only role)');
      return <Redirect href="/(driver)/tabs" />;
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