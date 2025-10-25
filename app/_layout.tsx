import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth-store';

/**
 * ROOT LAYOUT
 * 
 * This defines the overall navigation structure of your app.
 * All routes must be defined here or in sub-layouts.
 */
export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth on app start
    initialize();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide header by default
        animation: 'slide_from_right',
      }}
    >
      {/* Entry point */}
      <Stack.Screen name="index" />
      
      {/* Auth flow */}
      <Stack.Screen name="(auth)" />
      
      {/* Main app (after login) */}
      <Stack.Screen name="(tabs)" />
      
      {/* Rider screens */}
      <Stack.Screen name="(rider)" />
    </Stack>
  );
}