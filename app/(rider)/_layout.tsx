import { Stack } from 'expo-router';

/**
 * RIDER LAYOUT
 * 
 * Registers all rider screens so they can be navigated to.
 * All screens use modal presentation for consistent UX.
 */
export default function RiderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        presentation: 'modal',
        contentStyle: {
          backgroundColor: '#fff',
        },
      }}
    >
      {/* Booking Flow */}
      <Stack.Screen name="search-location" />
      <Stack.Screen name="select-destination" />
      <Stack.Screen name="vehicle-selection" />
      <Stack.Screen name="select-payment" />
      <Stack.Screen name="add-card" />
      <Stack.Screen name="finding-driver" />
      <Stack.Screen name="driver-arriving" />
      <Stack.Screen name="trip-in-progress" />
      <Stack.Screen name="trip-complete" />
      <Stack.Screen name="rate-driver" />
      <Stack.Screen name="add-tip" />
      
      {/* Profile & Settings - Your existing screens */}
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="trip-detail" />
      <Stack.Screen name="logout" />
      <Stack.Screen name="my-trips" />
      
      {/* Additional Menu Screens */}
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="language" />
      <Stack.Screen name="units" />
    </Stack>
  );
}