import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

/**
 * Screen for riders to request a carpool match
 * TODO: Implement location picker, time selection, and matching algorithm
 */
export default function RequestCarpoolScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-2xl p-8 shadow-md items-center">
            <Text className="text-6xl mb-4">🎯</Text>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Find a Carpool Match
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-6">
              Connect with drivers heading your way and share travel costs
            </Text>

            <View className="w-full space-y-4">
              {/* Pickup Location Input - Placeholder */}
              <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <Text className="text-xs text-gray-500 mb-1">Pickup Location</Text>
                <Text className="text-base text-gray-400">📍 Tap to select location</Text>
              </View>

              {/* Dropoff Location Input - Placeholder */}
              <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-3">
                <Text className="text-xs text-gray-500 mb-1">Dropoff Location</Text>
                <Text className="text-base text-gray-400">🎯 Tap to select destination</Text>
              </View>

              {/* Time Selection - Placeholder */}
              <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-3">
                <Text className="text-xs text-gray-500 mb-1">When?</Text>
                <Text className="text-base text-gray-400">🕐 Select departure time</Text>
              </View>

              {/* Find Match Button */}
              <TouchableOpacity
                className="bg-purple-600 rounded-xl p-4 mt-6 shadow-lg"
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: Implement carpool matching logic
                  console.log('Finding carpool match...');
                }}
              >
                <Text className="text-white text-center font-bold text-lg">
                  Find Available Matches
                </Text>
              </TouchableOpacity>
            </View>

          {/* Info Notice */}
          <View className="bg-purple-50 rounded-xl p-4 mt-6">
            <Text className="text-xs text-purple-900 text-center">
              💡 We'll connect you with drivers heading your way. You'll share travel costs privately.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
