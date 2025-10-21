import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/auth-store';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-6">Profile</Text>

        <View className="bg-white rounded-xl p-6 mb-4">
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-purple-600 items-center justify-center mb-3">
              <Text className="text-white text-3xl font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">{user?.name || 'User'}</Text>
            <Text className="text-gray-600">{user?.email || 'user@drift.com'}</Text>
          </View>

          <View className="border-t border-gray-200 pt-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Phone</Text>
              <Text className="font-semibold text-gray-900">{user?.phone || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Rating</Text>
              <Text className="font-semibold text-gray-900">⭐ {user?.rating || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Member Since</Text>
              <Text className="font-semibold text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-600 rounded-xl p-4 items-center"
        >
          <Text className="text-white font-semibold text-lg">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
