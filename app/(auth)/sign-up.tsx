import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FirebaseService } from '../../src/services/firebase-service';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await FirebaseService.signUp(email, password, { name, phone });
      Alert.alert('Success', 'Account created!');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 24, paddingTop: 60 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#1f2937' }}>
          Create Account
        </Text>
        <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>
          Join Drift's carpool community
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
            Full Name
          </Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 }}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
            Email
          </Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 }}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
            Phone Number
          </Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 }}
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (345) 123-4567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
            Password
          </Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 }}
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, marginBottom: 16 }}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            Already have an account?{' '}
            <Text style={{ color: '#2563eb', fontWeight: '600' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}