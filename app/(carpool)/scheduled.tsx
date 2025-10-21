import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Screen showing scheduled carpool trips
 * TODO: Fetch and display user's upcoming carpools
 */
export default function ScheduledCarpoolsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        {/* Empty State */}
        <View className="bg-white rounded-2xl p-12 shadow-md items-center mt-8">
          <Text className="text-6xl mb-4">📅</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            No Scheduled Carpools
          </Text>
          <Text className="text-sm text-gray-600 text-center">
            Your upcoming carpool trips will appear here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
