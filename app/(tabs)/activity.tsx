import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActivityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-4">Activity</Text>
        <View className="bg-white rounded-xl p-6 items-center">
          <Text className="text-6xl mb-4">📋</Text>
          <Text className="text-gray-600 text-center">
            Your carpool activity will appear here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
