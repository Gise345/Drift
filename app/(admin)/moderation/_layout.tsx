/**
 * Admin Moderation Layout
 */

import { Stack } from 'expo-router';

export default function ModerationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="strikes" />
      <Stack.Screen name="appeals" />
      <Stack.Screen name="emergencies" />
      <Stack.Screen name="suspensions" />
      <Stack.Screen name="disputes" />
      <Stack.Screen name="driver-profiles" />
    </Stack>
  );
}
