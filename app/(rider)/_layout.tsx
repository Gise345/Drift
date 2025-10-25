import { Stack } from 'expo-router';

/**
 * RIDER LAYOUT
 * 
 * This defines the rider booking flow navigation.
 * Modal-style presentation for booking screens.
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
    </Stack>
  );
}