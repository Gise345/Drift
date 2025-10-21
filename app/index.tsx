import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth-store';
import { useEffect } from 'react';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading, setUser } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  // Dev login bypass
  const handleDevLogin = () => {
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@drift.com',
      name: 'Dev User',
      phone: '+1-345-555-0123',
      roles: ['rider', 'driver'],
      hasAcceptedTerms: true,
      createdAt: new Date(),
      rating: 5.0,
    };
    setUser(mockUser);
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#7C3AED' }}>
        <Text style={{ fontSize: 48, color: 'white', marginBottom: 24 }}>
          🚗 Drift
        </Text>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ fontSize: 16, color: 'white', marginTop: 16 }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#7C3AED' }}>
      <Text style={{ fontSize: 48, color: 'white', marginBottom: 16 }}>
        🚗 Drift
      </Text>
      <Text style={{ fontSize: 20, color: 'white', textAlign: 'center', marginBottom: 48 }}>
        Cayman's Private Carpool Network
      </Text>

      {/* DEV LOGIN - Remove in production */}
      <TouchableOpacity
        style={{ backgroundColor: '#6D28D9', width: '100%', paddingVertical: 16, borderRadius: 12, marginBottom: 16 }}
        onPress={handleDevLogin}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
          🔧 Dev Login (Bypass)
        </Text>
      </TouchableOpacity>

      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.3)', width: '100%', marginVertical: 16 }} />

      <TouchableOpacity
        style={{ backgroundColor: 'white', width: '100%', paddingVertical: 16, borderRadius: 12, marginBottom: 16 }}
        onPress={() => router.push('/(auth)/sign-up')}
      >
        <Text style={{ color: '#7C3AED', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
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