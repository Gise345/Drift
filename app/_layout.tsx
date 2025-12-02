import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AutoUpdate } from '@/src/components/AutoUpdate';

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Check if we're in Expo Go (where native Stripe won't work)
// In EAS dev builds, appOwnership is 'standalone' or undefined
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import StripeProvider - try to load it directly
let StripeProvider: React.ComponentType<any> | null = null;

// Always try to load Stripe in non-Expo Go builds
if (!isExpoGo) {
  try {
    const StripeModule = require('@stripe/stripe-react-native');
    if (StripeModule && StripeModule.StripeProvider) {
      StripeProvider = StripeModule.StripeProvider;
      console.log('✅ StripeProvider loaded successfully');
    }
  } catch (e) {
    console.log('Stripe native module not available:', e);
  }
}

console.log('📱 Root Layout - App ownership:', Constants.appOwnership, '| StripeProvider:', !!StripeProvider);

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

  const stackContent = (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Entry point */}
      <Stack.Screen name="index" />

      {/* Role selection (Rider or Driver) */}
      <Stack.Screen name="select-role" />

      {/* Auth flow */}
      <Stack.Screen name="(auth)" />

      {/* Main app (after login) */}
      <Stack.Screen name="(tabs)" />

      {/* Rider screens */}
      <Stack.Screen name="(rider)" />

      {/* Driver screens */}
      <Stack.Screen name="(driver)" />
    </Stack>
  );

  // Wrap with StripeProvider only if available (not in Expo Go)
  const content = StripeProvider ? (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.drift.app"
      urlScheme="drift"
    >
      {stackContent}
    </StripeProvider>
  ) : (
    stackContent
  );

  return (
    <SafeAreaProvider>
      <AutoUpdate />
      {content}
    </SafeAreaProvider>
  );
}