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
    // User is logged in → Go to main app
    return <Redirect href="/(tabs)" />;
  } else {
    // User not logged in → Go to auth
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