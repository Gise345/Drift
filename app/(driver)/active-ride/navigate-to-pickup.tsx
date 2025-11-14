import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useTripStore } from '@/src/stores/trip-store';
import { updateDriverArrivalStatus } from '@/src/services/ride-request.service';

export default function NavigateToPickup() {
  const router = useRouter();
  const { activeRide, updateLocation, arrivedAtPickup } = useDriverStore();
  const { updateDriverLocation } = useTripStore();
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!activeRide) return;

    // Start real-time location tracking
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Location permission is required for navigation.');
          return;
        }

        // Update driver status to "arriving"
        await updateDriverArrivalStatus(activeRide.id, 'DRIVER_ARRIVING');

        // Start watching position
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or every 10 meters
          },
          (location) => {
            const { latitude, longitude, heading, speed } = location.coords;

            setCurrentLocation({ latitude, longitude });

            // Update driver location in store
            updateLocation({
              lat: latitude,
              lng: longitude,
              heading: heading || 0,
              speed: speed || 0,
            });

            // Update driver location in Firebase
            if (activeRide.id) {
              updateDriverLocation(activeRide.id, {
                latitude,
                longitude,
                timestamp: new Date(),
                accuracy: location.coords.accuracy,
                speed: speed || 0,
                heading: heading || 0,
              });
            }

            // Calculate distance and ETA
            const distanceToPickup = calculateDistance(
              latitude,
              longitude,
              activeRide.pickup.lat,
              activeRide.pickup.lng
            );

            setDistance(distanceToPickup);

            // Simple ETA calculation (distance / average speed)
            // Assuming 30 km/h average speed
            const averageSpeed = 30; // km/h
            const etaMinutes = (distanceToPickup / averageSpeed) * 60;
            setEta(etaMinutes);
          }
        );
      } catch (error) {
        console.error('Failed to start location tracking:', error);
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [activeRide?.id]);

  // Calculate distance using Haversine formula (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!activeRide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.gray[300]} />
          <Text style={styles.errorText}>No active ride</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleOpenMaps = () => {
    const { lat, lng } = activeRide.pickup;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleCallRider = async () => {
    // TODO: Fetch rider phone from Firebase users collection
    // For now, show alert
    Alert.alert('Call Rider', 'Contact feature will be available soon.');
  };

  const handleMessageRider = async () => {
    // TODO: Use in-app messaging or fetch rider phone
    Alert.alert('Message Rider', 'In-app messaging will be available soon.');
  };

  const handleArrived = async () => {
    if (!activeRide) return;

    try {
      // Update ride status in Firebase
      await updateDriverArrivalStatus(activeRide.id, 'DRIVER_ARRIVED');

      // Update local state
      arrivedAtPickup();

      // Navigate to arrived screen
      router.push('/(driver)/active-ride/arrived-at-pickup');
    } catch (error) {
      console.error('Failed to update arrival status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => router.push('/(driver)/active-ride/cancel-ride'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: activeRide.pickup.lat,
          longitude: activeRide.pickup.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        followsUserLocation
      >
        <Marker
          coordinate={{
            latitude: activeRide.pickup.lat,
            longitude: activeRide.pickup.lng,
          }}
          title="Pickup Location"
          pinColor={Colors.success}
        />
        
        {/* Mock route polyline */}
        <Polyline
          coordinates={[
            { latitude: 19.3133, longitude: -81.2546 },
            { latitude: activeRide.pickup.lat, longitude: activeRide.pickup.lng },
          ]}
          strokeColor={Colors.primary}
          strokeWidth={4}
        />
      </MapView>

      {/* ETA Card */}
      <View style={styles.etaCard}>
        <View style={styles.etaLeft}>
          <Text style={styles.etaTime}>{eta ? Math.ceil(eta) : '--'} min</Text>
          <Text style={styles.etaLabel}>ETA</Text>
        </View>
        <View style={styles.etaDivider} />
        <View style={styles.etaRight}>
          <Text style={styles.etaDistance}>{distance ? distance.toFixed(1) : '--'} km</Text>
          <Text style={styles.etaLabel}>away</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHandle} />
        </View>

        {/* Navigation Instructions */}
        <View style={styles.instructionCard}>
          <View style={styles.instructionIcon}>
            <Ionicons name="arrow-up" size={24} color={Colors.primary} />
          </View>
          <View style={styles.instructionText}>
            <Text style={styles.instructionMain}>Continue straight</Text>
            <Text style={styles.instructionSub}>for 500 meters</Text>
          </View>
        </View>

        {/* Rider Info */}
        <View style={styles.riderCard}>
          <Ionicons name="person-circle" size={48} color={Colors.primary} />
          <View style={styles.riderInfo}>
            <Text style={styles.riderName}>{activeRide.riderName}</Text>
            <View style={styles.riderRating}>
              <Ionicons name="star" size={14} color={Colors.primary} />
              <Text style={styles.ratingText}>{activeRide.riderRating}</Text>
            </View>
          </View>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleMessageRider}>
              <Ionicons name="chatbubble" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleCallRider}>
              <Ionicons name="call" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pickup Address */}
        <View style={styles.addressCard}>
          <View style={styles.addressIcon}>
            <Ionicons name="location" size={20} color={Colors.success} />
          </View>
          <View style={styles.addressText}>
            <Text style={styles.addressLabel}>Pickup Location</Text>
            <Text style={styles.addressValue}>{activeRide.pickup.address}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mapsButton} onPress={handleOpenMaps}>
            <Ionicons name="map" size={20} color={Colors.white} />
            <Text style={styles.mapsButtonText}>Open Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Arrived Button */}
        <TouchableOpacity style={styles.arrivedButton} onPress={handleArrived}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
          <Text style={styles.arrivedButtonText}>I've Arrived</Text>
        </TouchableOpacity>

        {/* Emergency SOS */}
        <TouchableOpacity 
          style={styles.sosButton}
          onPress={() => router.push('/(driver)/active-ride/emergency-sos')}
        >
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.sosText}>Emergency SOS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  map: {
    flex: 1,
  },
  etaCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  etaLeft: {
    flex: 1,
    alignItems: 'center',
  },
  etaTime: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  etaLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  etaDivider: {
    width: 1,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Spacing.lg,
  },
  etaRight: {
    flex: 1,
    alignItems: 'center',
  },
  etaDistance: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: 2,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  instructionText: {
    flex: 1,
  },
  instructionMain: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  instructionSub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  riderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  riderName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  riderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  contactButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  addressText: {
    flex: 1,
  },
  addressLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  addressValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: 12,
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.error,
  },
  mapsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.gray[800],
    borderRadius: 12,
    paddingVertical: Spacing.md,
  },
  mapsButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  arrivedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  arrivedButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  sosText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.error,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.gray[600],
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});