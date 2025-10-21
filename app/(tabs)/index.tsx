import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth-store';
import { useCarpoolStore } from '@/src/stores/carpool-store';

export default function HomeScreen() {
  const router = useRouter();
  const { user, currentMode, setMode } = useAuthStore();
  const { recentActivity, totalTrips, activeTripsCount } = useCarpoolStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch fresh data from Firebase
    setTimeout(() => setRefreshing(false), 1000);
  };

  const isRiderMode = currentMode === 'RIDER';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-3xl font-bold text-gray-900">🚗 Drift</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {isRiderMode ? 'Where are you headed?' : 'Ready to share a ride?'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-full bg-purple-600 items-center justify-center shadow-md">
              <Text className="text-white text-lg font-semibold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mode Switcher */}
        <View className="bg-white rounded-2xl p-1 shadow-sm mb-6 flex-row">
          <TouchableOpacity
            onPress={() => setMode('RIDER')}
            activeOpacity={0.7}
            className={`flex-1 py-3 rounded-xl ${
              isRiderMode ? 'bg-purple-600' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                isRiderMode ? 'text-white' : 'text-gray-600'
              }`}
            >
              🧑 Rider
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('DRIVER')}
            activeOpacity={0.7}
            className={`flex-1 py-3 rounded-xl ${
              !isRiderMode ? 'bg-purple-600' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                !isRiderMode ? 'text-white' : 'text-gray-600'
              }`}
            >
              🚗 Driver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Action Cards - Different for Rider vs Driver */}
        {isRiderMode ? (
          <>
            {/* Rider Main Action */}
            <TouchableOpacity
              onPress={() => router.push('/(carpool)/request')}
              activeOpacity={0.7}
              className="bg-purple-600 rounded-2xl p-6 shadow-lg mb-4"
            >
              <View className="flex-row items-center">
                <View className="mr-4">
                  <Text className="text-4xl">🎯</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold mb-1 text-white">
                    Find a Carpool Match
                  </Text>
                  <Text className="text-sm text-purple-100">
                    Connect with drivers heading your way
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Rider Secondary Actions */}
            <TouchableOpacity
              onPress={() => router.push('/(carpool)/scheduled')}
              activeOpacity={0.7}
              className="bg-white rounded-xl p-4 shadow-sm flex-row items-center mb-3"
            >
              <Text className="text-2xl mr-3">📅</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Scheduled Carpools
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  View your upcoming rides
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(carpool)/saved-routes')}
              activeOpacity={0.7}
              className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
            >
              <Text className="text-2xl mr-3">⭐</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Saved Routes
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  Quick access to frequent trips
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Driver Main Action */}
            <TouchableOpacity
              onPress={() => router.push('/(carpool)/offer')}
              activeOpacity={0.7}
              className="bg-purple-600 rounded-2xl p-6 shadow-lg mb-4"
            >
              <View className="flex-row items-center">
                <View className="mr-4">
                  <Text className="text-4xl">🚗</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold mb-1 text-white">
                    Offer a Ride
                  </Text>
                  <Text className="text-sm text-purple-100">
                    Share your trip and split costs
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Driver Secondary Actions */}
            <TouchableOpacity
              onPress={() => router.push('/(carpool)/active-offers')}
              activeOpacity={0.7}
              className="bg-white rounded-xl p-4 shadow-sm flex-row items-center mb-3"
            >
              <Text className="text-2xl mr-3">📍</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Active Ride Offers
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  Manage your current offers
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(carpool)/driver-dashboard')}
              activeOpacity={0.7}
              className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
            >
              <Text className="text-2xl mr-3">📊</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Driver Dashboard
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  Stats and earnings overview
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Legal Notice */}
        <View className="mt-6 mb-4">
          <View className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <View className="flex-row items-start">
              <Text className="text-purple-600 text-lg mr-2">ℹ️</Text>
              <View className="flex-1">
                <Text className="text-xs text-purple-900 leading-5">
                  <Text className="font-semibold">Peer-to-Peer Platform: </Text>
                  Drift facilitates private carpooling between independent users.
                  We're not a transportation company or rideshare service.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Tips Card */}
        <View className="bg-purple-50 rounded-xl p-4 mt-4 mb-6">
          <View className="flex-row items-start">
            <Text className="text-2xl mr-3">💡</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-purple-900 mb-1">
                {isRiderMode ? 'Rider Tip' : 'Driver Tip'}
              </Text>
              <Text className="text-xs text-purple-800 leading-5">
                {isRiderMode
                  ? 'Save your frequent routes for faster matching next time!'
                  : 'Offering regular commute routes helps build a reliable carpool network.'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
