import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>
          🚗 Drift
        </Text>
        <Text style={{ fontSize: 24, textAlign: 'center', color: '#374151', marginBottom: 48 }}>
          Where would you like to go?
        </Text>

        <TouchableOpacity
          style={{ backgroundColor: '#2563eb', paddingVertical: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, marginBottom: 32 }}
          onPress={() => router.push('/(carpool)/request')}
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>
              Request a Carpool
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' }}>
              Find someone heading your way
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ backgroundColor: '#fef3c7', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#f59e0b' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 4 }}>
            ⚖️ Platform Notice
          </Text>
          <Text style={{ fontSize: 12, color: '#78350f', lineHeight: 18 }}>
            Drift facilitates private carpooling between independent users.
            We don't provide transport services or employ drivers.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}