/**
 * DRIVER HOME SCREEN - Redesigned
 * Features:
 * - Full-screen Google Maps background
 * - Floating status card with driver name
 * - Go Online/Offline button
 * - Bottom tab navigation (Home, Earnings, Inbox, Menu)
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '@/src/stores/driver-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { DriftButton } from '@/components/ui/DriftButton';
import DriftMapView from '@/components/ui/DriftMapView';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { Region } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function DriverHomeScreen() {
  const router = useRouter();
  const { driver, isOnline, toggleOnline, todayEarnings, todayTrips } = useDriverStore();
  const { user } = useAuthStore();

  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user location and set region
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location services to use Drift.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        // Default to George Town, Cayman Islands
        setRegion({
          latitude: 19.2866,
          longitude: -81.3744,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
      
      // Default to George Town, Cayman Islands
      setRegion({
        latitude: 19.2866,
        longitude: -81.3744,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleToggleOnline = () => {
    toggleOnline();
    
    if (!isOnline) {
      Alert.alert(
        'You\'re Online!',
        'You\'ll now receive ride requests from nearby riders.',
        [{ text: 'Got it' }]
      );
    }
  };

  const handleViewOpportunities = () => {
    router.push('/(driver)/opportunities');
  };

  if (loading || !region) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full-screen Map Background using DriftMapView */}
      <DriftMapView
        region={region}
        showUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        style={styles.map}
      />

      {/* Overlay Content */}
      <SafeAreaView style={styles.overlay}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/(driver)/tabs/menu')}
          >
            <Ionicons name="menu" size={28} color={Colors.black} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.greetingText}>
              Hello, {user?.name || driver?.firstName || 'Driver'}
            </Text>
            <Text style={styles.statusText}>
              {isOnline ? "You're online" : "You're offline"}
            </Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(driver)/notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={Colors.black} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(driver)/settings')}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusCardTitle}>
            {isOnline ? 'Ready for Requests' : 'Ready to go?'}
          </Text>
          
          {isOnline && (
            <View style={styles.earningsRow}>
              <View style={styles.earningsStat}>
                <Text style={styles.earningsAmount}>
                  ${todayEarnings.toFixed(2)}
                </Text>
                <Text style={styles.earningsLabel}>Today's Earnings</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.earningsStat}>
                <Text style={styles.earningsAmount}>{todayTrips}</Text>
                <Text style={styles.earningsLabel}>Trips</Text>
              </View>
            </View>
          )}

          <DriftButton
            title={isOnline ? 'Go Offline' : 'Go Online'}
            onPress={handleToggleOnline}
            variant={isOnline ? 'outline' : 'primary'}
            icon={isOnline ? 'stop-circle' : 'play-circle'}
            fullWidth
            style={styles.toggleButton}
          />
        </View>

        {/* Opportunities Card */}
        {!isOnline && (
          <TouchableOpacity 
            style={styles.opportunitiesCard}
            onPress={handleViewOpportunities}
          >
            <View style={styles.opportunitiesContent}>
              <View style={styles.opportunitiesIcon}>
                <Ionicons name="flash" size={24} color={Colors.primary} />
              </View>
              <View style={styles.opportunitiesText}>
                <Text style={styles.opportunitiesTitle}>Opportunities</Text>
                <Text style={styles.opportunitiesSubtitle}>
                  See high-demand areas
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.gray[400]} />
          </TouchableOpacity>
        )}

        {/* Earnings Quick View (when online) */}
        {isOnline && (
          <View style={styles.earningsQuickView}>
            <View style={styles.earningsQuickContent}>
              <Ionicons name="wallet" size={20} color={Colors.primary} />
              <Text style={styles.earningsQuickText}>
                ${todayEarnings.toFixed(2)} earned today
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/(driver)/tabs/earnings')}
            >
              <Text style={styles.earningsQuickLink}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={getCurrentLocation}
      >
        <Ionicons name="locate" size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : 0,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.base,
  },
  
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  
  greetingText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: 2,
  },
  
  headerIcons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.base,
  },
  
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  
  // Status Card
  statusCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  
  statusCardTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
  },
  
  earningsStat: {
    alignItems: 'center',
    flex: 1,
  },
  
  earningsAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  
  earningsLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray[200],
  },
  
  toggleButton: {
    marginTop: Spacing.sm,
  },
  
  // Opportunities Card
  opportunitiesCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },
  
  opportunitiesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  
  opportunitiesIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  opportunitiesText: {
    gap: 2,
  },
  
  opportunitiesTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },
  
  opportunitiesSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  
  // Earnings Quick View
  earningsQuickView: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },
  
  earningsQuickContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  earningsQuickText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.black,
  },
  
  earningsQuickLink: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
  },
  
  // Location Button
  locationButton: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});