import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Platform, Linking, AppState, AppStateStatus } from 'react-native';
import { AutoUpdate } from '@/src/components/AutoUpdate';
import { initializeMonitoring } from '@/src/services/firebase-monitoring-service';

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
/**
 * Parse tracking URL and extract trip ID
 * Supports:
 * - drift://track?tripId=XXX
 * - drift://track?session=XXX (legacy)
 * - https://drift-global.web.app/track?tripId=XXX
 * - https://drift-global.web.app/track?session=XXX
 */
function parseTrackingUrl(url: string): string | null {
  try {
    // Handle drift:// scheme
    if (url.startsWith('drift://track')) {
      const queryStart = url.indexOf('?');
      if (queryStart === -1) return null;

      const queryString = url.substring(queryStart + 1);
      const params = new URLSearchParams(queryString);
      return params.get('tripId') || params.get('session');
    }

    // Handle https:// URLs
    if (url.includes('/track')) {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('tripId') || urlObj.searchParams.get('session');
    }

    return null;
  } catch (e) {
    console.error('Error parsing tracking URL:', e);
    return null;
  }
}

// Time threshold for reinitializing auth after background (5 minutes)
const BACKGROUND_THRESHOLD_MS = 5 * 60 * 1000;

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const router = useRouter();

  // Track when app goes to background for stale connection handling
  const appState = useRef(AppState.currentState);
  const backgroundTimestamp = useRef<number | null>(null);

  useEffect(() => {
    // Initialize auth on app start
    initialize();
    // Initialize Firebase monitoring (Analytics, Crashlytics, Performance)
    initializeMonitoring();
  }, []);

  // Handle app state changes to prevent crashes after long background periods
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App going to background
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTimestamp.current = Date.now();
        console.log('📱 App going to background');
      }

      // App coming back to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const wasInBackground = backgroundTimestamp.current;
        const timeInBackground = wasInBackground ? Date.now() - wasInBackground : 0;

        console.log(`📱 App returning to foreground after ${Math.round(timeInBackground / 1000)}s`);

        // If app was in background for more than threshold, reinitialize auth
        // This refreshes Firebase connections and prevents stale state crashes
        if (timeInBackground > BACKGROUND_THRESHOLD_MS) {
          console.log('🔄 Reinitializing auth after long background period...');
          try {
            initialize();
          } catch (error) {
            console.error('Error reinitializing auth:', error);
          }
        }

        backgroundTimestamp.current = null;
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [initialize]);

  // Handle deep links for tracking
  useEffect(() => {
    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received (foreground):', url);
      const tripId = parseTrackingUrl(url);
      if (tripId) {
        console.log('Navigating to track-trip with tripId:', tripId);
        router.push({ pathname: '/track-trip', params: { tripId } });
      }
    });

    // Handle URL that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Deep link received (initial):', url);
        const tripId = parseTrackingUrl(url);
        if (tripId) {
          console.log('Navigating to track-trip with tripId:', tripId);
          // Small delay to ensure navigation stack is ready
          setTimeout(() => {
            router.push({ pathname: '/track-trip', params: { tripId } });
          }, 100);
        }
      }
    });

    return () => subscription.remove();
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

      {/* Public tracking screen (no auth required) */}
      <Stack.Screen
        name="track-trip"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );

  // Check if we're using Stripe test keys
  const isStripeTestMode = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');

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