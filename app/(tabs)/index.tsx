/**
 * Drift Home Screen - Rider
 * Figma: 11_Home_screen.png & 12_Home_screen.png
 * 
 * Main screen with Google Maps and "Where To?" search
 * Shows current location and allows destination input
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useLocationStore } from '@/src/stores/location-store';
import { useAuthStore } from '@/src/stores/auth-store';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentLocation, setCurrentLocation, setLocationPermission } = useLocationStore();
  
  const [region, setRegion] = useState({
    latitude: 19.3133, // George Town, Cayman Islands
    longitude: -81.2546,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: 'Current Location',
        };
        
        setCurrentLocation(userLocation);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    })();
  }, []);

  const handleMenuPress = () => {
    router.push('/(tabs)/profile');
  };

  const handleWhereToPress = () => {
    router.push('/(rider)/search-location');
  };

  const handleSchedulePress = () => {
    Alert.alert('Schedule', 'Schedule ride feature coming soon!');
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        loadingEnabled
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You are here"
          >
            <View style={styles.currentMarker}>
              <View style={styles.currentMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topBarContent}>
          {/* Menu Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>

          {/* Location Display */}
          <View style={styles.locationDisplay}>
            <Text style={styles.locationLabel}>Your Current Location</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {currentLocation?.address || 'Getting location...'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Card - "Where To?" */}
      <SafeAreaView style={styles.bottomCard} edges={['bottom']}>
        {/* Where To Search */}
        <TouchableOpacity
          style={styles.whereToButton}
          onPress={handleWhereToPress}
          activeOpacity={0.9}
        >
          <Text style={styles.whereToText}>Where To?</Text>
          <View style={styles.scheduleButton}>
            <TouchableOpacity
              onPress={handleSchedulePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.scheduleChip}>
                <Text style={styles.scheduleIcon}>🕐</Text>
                <Text style={styles.scheduleText}>Now</Text>
                <Text style={styles.scheduleDropdown}>▼</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon="🏠"
            label="Home"
            onPress={() => Alert.alert('Home', 'Set home address in profile')}
          />
          <QuickAction
            icon="💼"
            label="Work"
            onPress={() => Alert.alert('Work', 'Set work address in profile')}
          />
          <QuickAction
            icon="⭐"
            label="Saved"
            onPress={() => router.push('/(carpool)/saved-routes')}
          />
        </View>

        {/* Recent Searches */}
        <View style={styles.recentSection}>
          <Text style={styles.recentSectionTitle}>Recent</Text>
          <RecentItem
            icon="📍"
            title="Owen Roberts Airport"
            subtitle="Grand Cayman"
            onPress={() => {}}
          />
          <RecentItem
            icon="📍"
            title="Camana Bay"
            subtitle="Grand Cayman"
            onPress={() => {}}
          />
        </View>
      </SafeAreaView>

      {/* Recenter Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={async () => {
          const location = await Location.getCurrentPositionAsync({});
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }}
      >
        <Text style={styles.recenterIcon}>🎯</Text>
      </TouchableOpacity>
    </View>
  );
}

// Quick Action Component
function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Recent Item Component
function RecentItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.recentItem} onPress={onPress}>
      <Text style={styles.recentIcon}>{icon}</Text>
      <View style={styles.recentInfo}>
        <Text style={styles.recentItemTitle}>{title}</Text>
        <Text style={styles.recentSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  map: {
    width: width,
    height: height,
  },

  // Current Location Marker
  currentMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },

  currentMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  menuIcon: {
    fontSize: 24,
    color: Colors.black,
  },

  locationDisplay: {
    flex: 1,
  },

  locationLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginBottom: 2,
  },

  locationText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },

  // Bottom Card
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  // Where To Button
  whereToButton: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },

  whereToText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.gray[600],
  },

  scheduleButton: {
    // Container for schedule chip
  },

  scheduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 6,
  },

  scheduleIcon: {
    fontSize: 14,
  },

  scheduleText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },

  scheduleDropdown: {
    color: Colors.white,
    fontSize: 10,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  quickAction: {
    alignItems: 'center',
  },

  quickActionIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },

  quickActionLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    fontWeight: '500',
  },

  // Recent Section
  recentSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: Spacing.md,
  },

  recentSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Spacing.sm,
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },

  recentIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },

  recentInfo: {
    flex: 1,
  },

  recentItemTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },

  recentSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  // Recenter Button
  recenterButton: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 350, // Above bottom card
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  recenterIcon: {
    fontSize: 24,
  },
});