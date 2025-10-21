import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface LegalNoticeProps {
  variant?: 'full' | 'compact';
  delay?: number;
}

/**
 * Legal notice component ensuring compliance with carpooling regulations
 * Clearly communicates that Drift is a peer-to-peer platform, not a rideshare service
 */
export function LegalNotice({ variant = 'compact', delay = 400 }: LegalNoticeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'compact') {
    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(delay)}
        className="mt-6 mb-4"
      >
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <View className="flex-row items-start">
            <Text className="text-blue-600 text-lg mr-2">ℹ️</Text>
            <View className="flex-1">
              <Text className="text-xs text-blue-900 leading-5">
                <Text className="font-semibold">Peer-to-Peer Platform: </Text>
                Drift facilitates private carpooling between independent users.
                We're not a transportation company or rideshare service.
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      className="mt-6 mb-4"
    >
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <View className="flex-row items-start mb-2">
            <Text className="text-blue-600 text-2xl mr-3">ℹ️</Text>
            <View className="flex-1">
              <Text className="text-sm font-bold text-blue-900 mb-1">
                Important Platform Notice
              </Text>
              <Text className="text-xs text-blue-800 leading-5">
                Drift is a peer-to-peer carpooling platform connecting independent individuals
              </Text>
            </View>
            <Text className="text-blue-600 text-xl ml-2">
              {isExpanded ? '−' : '+'}
            </Text>
          </View>

          {isExpanded && (
            <View className="mt-3 pt-3 border-t border-blue-200">
              <Text className="text-xs text-blue-900 leading-5 mb-2">
                <Text className="font-semibold">What Drift Does:</Text>{'\n'}
                • Connects riders and drivers for shared travel{'\n'}
                • Facilitates cost-sharing arrangements{'\n'}
                • Provides a platform for private carpooling
              </Text>
              <Text className="text-xs text-blue-900 leading-5">
                <Text className="font-semibold">What Drift Is NOT:</Text>{'\n'}
                • Not a rideshare or taxi service{'\n'}
                • Not a transportation company{'\n'}
                • Does not employ drivers or operate vehicles{'\n'}
                • Does not dispatch drivers for hire
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Banner variant for prominent placement
 */
export function LegalBanner() {
  return (
    <View className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
      <View className="flex-row items-center">
        <Text className="text-yellow-700 text-base mr-2">⚠️</Text>
        <Text className="text-xs text-yellow-800 flex-1 leading-4">
          <Text className="font-semibold">Private Carpooling Platform:</Text> Users independently
          share rides and split travel costs. Drift facilitates connections only.
        </Text>
      </View>
    </View>
  );
}
