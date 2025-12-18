import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/stores/auth-store';

/**
 * ROOT ENTRY POINT
 *
 * This is the first screen that loads.
 * It checks if user is logged in and routes accordingly.
 * Uses saved mode from AsyncStorage to return user to their last screen.
 *
 * NOTE: Auth initialization happens in _layout.tsx (root layout)
 * This component only handles routing based on auth state.
 */
export default function Index() {
  const { user, loading, currentMode } = useAuthStore();

  // Show loading while checking auth (initialized in _layout.tsx)
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

    // IMPORTANT: If currentMode is DRIVER, route to driver flow even without DRIVER role
    // The /(driver)/tabs/_layout acts as a guard that:
    // - Routes to registration screen (or saved step) if no driver profile
    // - Routes to pending-approval if waiting for admin review
    // - Routes to rejected if application was denied
    // - Only shows driver home tabs after admin approval
    // This allows users mid-registration to continue where they left off
    if (currentMode === 'DRIVER') {
      console.log('🚗 Navigating to driver flow (will check registration status)');
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