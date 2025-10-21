import { Stack } from 'expo-router';

export default function CarpoolLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="request"
        options={{
          title: 'Find a Carpool Match',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="offer"
        options={{
          title: 'Offer a Ride',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="scheduled"
        options={{
          title: 'Scheduled Carpools',
        }}
      />
      <Stack.Screen
        name="saved-routes"
        options={{
          title: 'Saved Routes',
        }}
      />
      <Stack.Screen
        name="active-offers"
        options={{
          title: 'Active Ride Offers',
        }}
      />
      <Stack.Screen
        name="driver-dashboard"
        options={{
          title: 'Driver Dashboard',
        }}
      />
    </Stack>
  );
}
