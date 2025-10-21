import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Screen for drivers to offer a ride
 * TODO: Implement route creation, pricing, and seat availability
 */
export default function OfferRideScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-2xl p-8 shadow-md items-center">
          <Text className="text-6xl mb-4">🚗</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Offer a Ride
          </Text>
          <Text className="text-sm text-gray-600 text-center mb-6">
            Share your trip and split costs with riders heading your way
          </Text>

          <View className="w-full space-y-4">
            {/* Starting Point Input - Placeholder */}
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <Text className="text-xs text-gray-500 mb-1">Starting From</Text>
              <Text className="text-base text-gray-400">📍 Tap to select start location</Text>
            </View>

            {/* Destination Input - Placeholder */}
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-3">
              <Text className="text-xs text-gray-500 mb-1">Destination</Text>
              <Text className="text-base text-gray-400">🎯 Tap to select destination</Text>
            </View>

            {/* Departure Time - Placeholder */}
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-3">
              <Text className="text-xs text-gray-500 mb-1">Departure Time</Text>
              <Text className="text-base text-gray-400">🕐 Select when you're leaving</Text>
            </View>

            {/* Available Seats - Placeholder */}
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-3">
              <Text className="text-xs text-gray-500 mb-1">Available Seats</Text>
              <Text className="text-base text-gray-400">💺 How many seats to share?</Text>
            </View>

            {/* Cost Per Seat - Placeholder */}
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-3">
              <Text className="text-xs text-gray-500 mb-1">Suggested Cost Share (per seat)</Text>
              <Text className="text-base text-gray-400">💰 Based on distance and fuel</Text>
            </View>

            {/* Create Offer Button */}
            <TouchableOpacity
              className="bg-purple-600 rounded-xl p-4 mt-6 shadow-lg"
              activeOpacity={0.7}
              onPress={() => {
                // TODO: Implement ride offer creation logic
                console.log('Creating ride offer...');
              }}
            >
              <Text className="text-white text-center font-bold text-lg">
                Create Ride Offer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Notice */}
          <View className="bg-purple-50 rounded-xl p-4 mt-6">
            <Text className="text-xs text-purple-900 text-center">
              💡 Share your trip details and connect with riders. You'll split travel costs privately.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
