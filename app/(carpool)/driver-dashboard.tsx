import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Driver dashboard showing stats and earnings overview
 * TODO: Implement real-time stats from Firebase
 */
export default function DriverDashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        {/* Stats Cards */}
        <View className="gap-4">
          {/* Total Rides Shared */}
          <View className="bg-white rounded-2xl p-6 shadow-md">
            <Text className="text-4xl mb-2">🚗</Text>
            <Text className="text-3xl font-bold text-gray-900">0</Text>
            <Text className="text-sm text-gray-600">Total Rides Shared</Text>
          </View>

          {/* Total Cost Savings */}
          <View className="bg-white rounded-2xl p-6 shadow-md">
            <Text className="text-4xl mb-2">💰</Text>
            <Text className="text-3xl font-bold text-purple-600">$0.00</Text>
            <Text className="text-sm text-gray-600">Cost Sharing Received</Text>
          </View>

          {/* Rating */}
          <View className="bg-white rounded-2xl p-6 shadow-md">
            <Text className="text-4xl mb-2">⭐</Text>
            <Text className="text-3xl font-bold text-gray-900">—</Text>
            <Text className="text-sm text-gray-600">Average Rating</Text>
          </View>

          {/* Total Distance */}
          <View className="bg-white rounded-2xl p-6 shadow-md">
            <Text className="text-4xl mb-2">📊</Text>
            <Text className="text-3xl font-bold text-gray-900">0 mi</Text>
            <Text className="text-sm text-gray-600">Total Distance Shared</Text>
          </View>
        </View>

        {/* Info Notice */}
        <View className="bg-purple-50 rounded-xl p-4 mt-6">
          <Text className="text-xs text-purple-900 text-center leading-5">
            💡 Your stats will appear here once you start sharing rides. Remember: all cost sharing is handled privately between you and riders.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
