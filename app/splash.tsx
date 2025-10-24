/**
 * Drift Splash Screen
 * Figma: 01_Splash_Screen.png
 * 
 * Initial loading screen shown on app launch
 * Features yellow/lime background with branding
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after splash
    const timer = setTimeout(() => {
      if (loading) return;
      
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, loading]);

  return (
    <View style={styles.container}>
      {/* Top section - empty space */}
      <View style={styles.topSection} />

      {/* Logo section */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.logo}>Drift</Text>
        <View style={styles.carIcon}>
          <Text style={styles.carEmoji}>🚗</Text>
        </View>
      </Animated.View>

      {/* Illustration section */}
      <Animated.View
        style={[styles.illustrationContainer, { opacity: fadeAnim }]}
      >
        {/* Placeholder for illustration - replace with actual image */}
        <View style={styles.illustrationPlaceholder}>
          <Text style={styles.illustrationEmoji}>🗺️</Text>
          <Text style={styles.illustrationEmoji}>📱</Text>
          <Text style={styles.illustrationEmoji}>📍</Text>
        </View>
        <Text style={styles.subtitle}>Cayman's Private Carpool Network</Text>
      </Animated.View>

      {/* Bottom accent bar */}
      <View style={styles.bottomBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF0', // Cream/off-white from Figma
  },

  topSection: {
    flex: 0.3,
  },

  logoContainer: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 2,
  },

  carIcon: {
    marginTop: 8,
  },

  carEmoji: {
    fontSize: 32,
  },

  illustrationContainer: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  illustrationPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },

  illustrationEmoji: {
    fontSize: 48,
    opacity: 0.7,
  },

  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    fontWeight: '500',
  },

  bottomBar: {
    flex: 0.1,
    backgroundColor: Colors.primary, // Yellow/lime accent
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});