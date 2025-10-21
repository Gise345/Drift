import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth-store';
import { useEffect } from 'react';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#2563eb' }}>
      <Text style={{ fontSize: 48, color: 'white', marginBottom: 16 }}>
        🚗 Drift
      </Text>
      <Text style={{ fontSize: 20, color: 'white', textAlign: 'center', marginBottom: 48 }}>
        Cayman's Private Carpool Network
      </Text>
      
      <TouchableOpacity
        style={{ backgroundColor: 'white', width: '100%', paddingVertical: 16, borderRadius: 12, marginBottom: 16 }}
        onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={{ color: '#2563eb', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
            Get Started
          </Text>
        </TouchableOpacity>
  
        <TouchableOpacity
          style={{ width: '100%', paddingVertical: 16 }}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
        
      
    
  );
}