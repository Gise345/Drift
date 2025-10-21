import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Screen showing driver's active ride offers
 * TODO: Display active offers and allow drivers to manage them
 */
export default function ActiveOffersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        {/* Empty State */}
        <View className="bg-white rounded-2xl p-12 shadow-md items-center mt-8">
          <Text className="text-6xl mb-4">📍</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            No Active Ride Offers
          </Text>
          <Text className="text-sm text-gray-600 text-center">
            Create a ride offer to share your trip with riders
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
