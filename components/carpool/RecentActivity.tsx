import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAnimations } from '@/src/hooks/useAnimations';
import { RecentActivityItem } from '@/src/types/carpool';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  activities: RecentActivityItem[];
  onActivityPress?: (activity: RecentActivityItem) => void;
  delay?: number;
}

/**
 * Recent activity feed component showing user's carpool history
 * Displays trips, requests, and matches with status indicators
 */
export function RecentActivity({
  activities,
  onActivityPress,
  delay = 300,
}: RecentActivityProps) {
  const { staggeredEntry } = useAnimations();

  if (activities.length === 0) {
    return <RecentActivityEmpty delay={delay} />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'MATCHED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'MATCHING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'IN_PROGRESS':
        return 'Active';
      case 'MATCHED':
        return 'Matched';
      case 'CANCELLED':
        return 'Cancelled';
      case 'MATCHING':
        return 'Finding match';
      default:
        return status;
    }
  };

  const renderActivity = ({ item, index }: { item: RecentActivityItem; index: number }) => (
    <Animated.View entering={staggeredEntry(index, 80)}>
      <TouchableOpacity
        onPress={() => onActivityPress?.(item)}
        activeOpacity={0.7}
        className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
      >
        <View className="mr-4">
          <Text className="text-3xl">{item.icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {item.title}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">
            {item.subtitle}
          </Text>
          <View className="flex-row items-center">
            <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
              <Text className="text-xs font-medium">
                {getStatusLabel(item.status)}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 ml-2">
              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
            </Text>
          </View>
        </View>
        <Text className="text-gray-400 text-xl ml-2">›</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View className="mt-6">
      <Animated.View entering={staggeredEntry(0)}>
        <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
          Recent Activity
        </Text>
      </Animated.View>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

/**
 * Empty state for when user has no recent activity
 */
function RecentActivityEmpty({ delay }: { delay: number }) {
  const { fadeIn } = useAnimations();

  return (
    <Animated.View entering={fadeIn(delay)} className="mt-6">
      <View className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 items-center">
        <Text className="text-6xl mb-3">🚗</Text>
        <Text className="text-base font-semibold text-gray-900 mb-2">
          No Recent Activity
        </Text>
        <Text className="text-sm text-gray-600 text-center">
          Find a carpool match to get started on your journey
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * Compact activity summary for dashboard
 */
export function ActivitySummary({
  totalTrips,
  activeTrips,
  delay = 200,
}: {
  totalTrips: number;
  activeTrips: number;
  delay?: number;
}) {
  const { cardEntry } = useAnimations();

  return (
    <Animated.View entering={cardEntry(delay)}>
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <Text className="text-sm font-semibold text-gray-700 mb-3">
          Your Activity
        </Text>
        <View className="flex-row">
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-blue-600">{totalTrips}</Text>
            <Text className="text-xs text-gray-600 mt-1">Total Carpools</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-emerald-600">{activeTrips}</Text>
            <Text className="text-xs text-gray-600 mt-1">Active Now</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
