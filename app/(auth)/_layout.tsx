/**
 * Drift Auth Layout
 * Configures the authentication flow screens
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#ffffff',
        },
      }}
    >
      {/* Welcome/Landing */}
      <Stack.Screen name="welcome" />

      {/* Registration Flow */}
      <Stack.Screen name="sign-up" />

      {/* Login Flow */}
      <Stack.Screen name="sign-in" />

      {/* Password Reset Flow */}
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />

      {/* Verification screens */}
      <Stack.Screen name="verification" />
      <Stack.Screen name="email-verification" />
    </Stack>
  );
}