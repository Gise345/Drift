import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('@/assets/images/NeonPalms.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Cayman Flag (faded) */}
        {/* <Image
          source={require('@/assets/cayman-flag-faded.png')}
          style={styles.flag}
        /> */}

        <View style={styles.overlay} />

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/drift-logo-purple.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Cayman Map Image */}
        <View style={styles.mapWrapper}>
          <Image
            source={require('@/assets/images/cayman-map.png')}
            style={styles.mapImage}
            resizeMode="contain"
          />
        </View>

          <Text style={styles.title}>Cayman's Carpool Movement</Text>
          <Text style={styles.subtitle}>
            Created locally by a Caymanian Engineer who wanted a better way to move and make our roads safer.
            Real people. Real rides. Real change for Cayman!
          </Text>
        </View>

        
        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Join Drift</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.legal}>
          <Text style={styles.legalText}>
            Peer-to-peer carpooling. Not a taxi or rideshare service.
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },

  background: {
    flex: 1,
    justifyContent: 'space-between',
  },

  flag: {
    position: 'absolute',
    right: -60,
    top: 30,
    width: 260,
    height: 260,
    opacity: 0.15,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  // Top content
  header: {
    marginTop: 50,
    paddingHorizontal: 32,
    alignItems: 'center',
  },

  logo: {
    width: 600,
    height: 210,
    marginBottom: -70,
    marginTop: -50,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: -10,
  },

  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 60,
  },

  // Buttons
  buttons: {
    paddingHorizontal: 32,
    marginBottom: -80,
    gap: 12,
  },

  primaryButton: {
    backgroundColor: '#5d1289ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  secondaryButton: {
    borderColor: '#fff',
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Cayman Map
  mapWrapper: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 20,
  },

  mapImage: {
    width: 350,
    height: 140,
    opacity: 0.9,
  },

  // Legal
  legal: {
    paddingBottom: 24,
    paddingHorizontal: 24,
  },

  legalText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
