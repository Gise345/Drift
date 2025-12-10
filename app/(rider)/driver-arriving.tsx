import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTripStore, TripLocation } from '@/src/stores/trip-store';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useUserStore } from '@/src/stores/user-store';
import { ShareTripModal } from '@/components/modal/ShareTripModal';
import { ChatModal } from '@/components/messaging/ChatModal';
import { BlockUserModal } from '@/components/modal/BlockUserModal';
import { cancelTrip } from '@/src/services/ride-request.service';
import { ProgressivePolyline } from '@/components/map/ProgressivePolyline';

// Google Directions API Key
const GOOGLE_DIRECTIONS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export default function DriverArrivingScreen() {
  const { currentTrip, subscribeToTrip, startLocationTracking } = useTripStore();
  const { clearBookingFlow } = useCarpoolStore();
  const { user } = useUserStore();
  const mapRef = useRef<MapView>(null);
  const [eta, setEta] = useState(5); // minutes
  const [distance, setDistance] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const hasNavigatedRef = React.useRef(false);
  const lastRouteFetch = useRef<number>(0);
  const ROUTE_FETCH_INTERVAL = 15000; // Fetch new route every 15 seconds

  // If no current trip, redirect back
  if (!currentTrip) {
    router.replace('/(rider)');
    return null;
  }

  // Get driver info from current trip
  const driver = currentTrip.driverInfo || null;

  useEffect(() => {
    // Start background location tracking (gracefully degrades to foreground-only)
    if (currentTrip?.id) {
      startLocationTracking(currentTrip.id).catch((error) => {
        console.error('⚠️ Could not start background location tracking:', error);
        // Note: We don't show an alert anymore because the hook will handle
        // foreground tracking automatically. Background tracking is optional.
      });

      // Subscribe to real-time trip updates
      const unsubscribe = subscribeToTrip(currentTrip.id);
      return () => unsubscribe();
    }
  }, [currentTrip?.id]);

  // Handle trip status changes - navigate when driver arrives or trip starts
  useEffect(() => {
    if (!currentTrip || hasNavigatedRef.current) return;

    // When driver has arrived at pickup, navigate to pickup-point
    if (currentTrip.status === 'DRIVER_ARRIVED') {
      hasNavigatedRef.current = true;
      router.replace('/(rider)/pickup-point');
      return;
    }

    // When driver starts the ride (skipping pickup-point), go directly to trip-in-progress
    if (currentTrip.status === 'IN_PROGRESS') {
      hasNavigatedRef.current = true;
      router.replace('/(rider)/trip-in-progress');
      return;
    }

    // If trip was cancelled
    if (currentTrip.status === 'CANCELLED') {
      hasNavigatedRef.current = true;
      clearBookingFlow();
      Alert.alert(
        'Ride Cancelled',
        (currentTrip as any).cancelledBy === 'DRIVER'
          ? 'Your driver has cancelled this trip.'
          : 'The ride has been cancelled.',
        [{ text: 'OK', onPress: () => router.replace('/(rider)') }]
      );
      return;
    }
  }, [currentTrip?.status]);

  useEffect(() => {
    // Countdown ETA (backup - status change should trigger navigation first)
    if (eta > 0) {
      const timer = setTimeout(() => setEta(eta - 1), 60000);
      return () => clearTimeout(timer);
    }
    // Note: Don't auto-navigate based on ETA anymore - let status change handle it
  }, [eta]);

  // Fetch route and update ETA when driver location changes
  useEffect(() => {
    if (currentTrip?.driverLocation && currentTrip?.pickup) {
      // Fetch route from Google Directions API periodically
      const now = Date.now();
      if (now - lastRouteFetch.current >= ROUTE_FETCH_INTERVAL) {
        lastRouteFetch.current = now;
        fetchRouteFromDriverToPickup(
          {
            latitude: currentTrip.driverLocation.latitude,
            longitude: currentTrip.driverLocation.longitude,
          },
          currentTrip.pickup.coordinates
        );
      }

      // Fallback: calculate ETA using Haversine if no route yet
      if (routeCoordinates.length === 0) {
        calculateFallbackETA(currentTrip.driverLocation, currentTrip.pickup.coordinates);
      }
    }
  }, [currentTrip?.driverLocation]);

  // Initial route fetch when component mounts with driver location
  useEffect(() => {
    if (currentTrip?.driverLocation && currentTrip?.pickup && routeCoordinates.length === 0) {
      fetchRouteFromDriverToPickup(
        {
          latitude: currentTrip.driverLocation.latitude,
          longitude: currentTrip.driverLocation.longitude,
        },
        currentTrip.pickup.coordinates
      );
    }
  }, [currentTrip?.id]);

  // Decode Google polyline
  const decodePolyline = (encoded: string): RouteCoordinate[] => {
    const points: RouteCoordinate[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Fetch route from Google Directions API
  const fetchRouteFromDriverToPickup = async (
    driverLocation: RouteCoordinate,
    pickupLocation: RouteCoordinate
  ) => {
    if (!GOOGLE_DIRECTIONS_API_KEY) {
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driverLocation.latitude},${driverLocation.longitude}&destination=${pickupLocation.latitude},${pickupLocation.longitude}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode and set route coordinates for polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        // Set accurate ETA and distance from Google
        setEta(Math.ceil(leg.duration.value / 60)); // seconds to minutes
        setDistance(leg.distance.value / 1000); // meters to km
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
    }
  };

  // Fallback ETA calculation using Haversine formula
  const calculateFallbackETA = (
    driverLocation: TripLocation,
    pickupLocation: { latitude: number; longitude: number }
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(pickupLocation.latitude - driverLocation.latitude);
    const dLon = toRad(pickupLocation.longitude - driverLocation.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(driverLocation.latitude)) *
        Math.cos(toRad(pickupLocation.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    setDistance(dist);

    // Estimate ETA based on average speed (assuming 40 km/h in city)
    const avgSpeed = driverLocation.speed || 40 / 3.6; // m/s
    const timeInSeconds = (dist * 1000) / avgSpeed;
    const timeInMinutes = Math.ceil(timeInSeconds / 60);

    setEta(Math.max(1, timeInMinutes));
  };

  const toRad = (degrees: number) => degrees * (Math.PI / 180);

  // Call button removed for safety - users should use in-app messaging instead
  // Phone numbers are not shared between riders and drivers for privacy

  const handleMessage = () => {
    if (!driver || !currentTrip) return;
    setShowChatModal(true);
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              if (currentTrip?.id) {
                await cancelTrip(currentTrip.id, 'RIDER', 'Rider cancelled after driver accepted');
              }
              clearBookingFlow();
              router.replace('/(rider)');
            } catch (error) {
              console.error('Failed to cancel trip:', error);
              Alert.alert('Error', 'Failed to cancel trip. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleShareTrip = () => {
    setShowShareModal(true);
  };

  // Calculate map region to show both driver and pickup
  const driverLat = currentTrip.driverLocation?.latitude || currentTrip.pickup.coordinates.latitude;
  const driverLng = currentTrip.driverLocation?.longitude || currentTrip.pickup.coordinates.longitude;

  const mapRegion = {
    latitude: (driverLat + currentTrip.pickup.coordinates.latitude) / 2,
    longitude: (driverLng + currentTrip.pickup.coordinates.longitude) / 2,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Don't render if no driver info
  if (!driver) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Loading driver information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation={true}
      >
        {/* Driver Marker */}
        {currentTrip.driverLocation && (
          <Marker
            coordinate={{
              latitude: currentTrip.driverLocation.latitude,
              longitude: currentTrip.driverLocation.longitude,
            }}
            title={driver.name}
            description={`${driver.vehicle.make} ${driver.vehicle.model}`}
          >
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={24} color="white" />
            </View>
          </Marker>
        )}

        {/* Pickup Marker */}
        {currentTrip?.pickup && (
          <Marker
            coordinate={currentTrip.pickup.coordinates}
            title="Pickup Location"
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="person" size={24} color="white" />
            </View>
          </Marker>
        )}

        {/* Route Line with Progress Tracking - Use fetched route or trip.route as fallback */}
        {(routeCoordinates.length > 0 || (currentTrip?.route && currentTrip.route.length > 0)) && (
          <ProgressivePolyline
            routeCoordinates={routeCoordinates.length > 0 ? routeCoordinates : currentTrip?.route || []}
            currentLocation={
              currentTrip?.driverLocation
                ? {
                    latitude: currentTrip.driverLocation.latitude,
                    longitude: currentTrip.driverLocation.longitude,
                  }
                : null
            }
            remainingColor="#5d1289"
            traveledColor="#9CA3AF"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver is on the way</Text>
        <TouchableOpacity onPress={handleShareTrip} style={styles.shareButton}>
          <Ionicons name="share-social" size={24} color="#5d1289" />
        </TouchableOpacity>
      </View>

      {/* ETA Banner */}
      <View style={styles.etaBanner}>
        <View style={styles.etaContent}>
          {currentTrip?.driverLocation ? (
            <>
              <Text style={styles.etaLabel}>Arriving in</Text>
              <Text style={styles.etaTime}>{eta} min</Text>
              {distance !== null && (
                <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
              )}
            </>
          ) : (
            <>
              <Ionicons name="car" size={24} color="#5d1289" style={{ marginBottom: 4 }} />
              <Text style={styles.etaLabel}>Locating driver...</Text>
              <Text style={styles.locatingSubtext}>Your driver is on the way</Text>
            </>
          )}
        </View>
        {currentTrip?.sharedWith && currentTrip.sharedWith.length > 0 && (
          <View style={styles.sharingBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#27ae60" />
            <Text style={styles.sharingText}>
              Shared with {currentTrip.sharedWith.length}
            </Text>
          </View>
        )}
      </View>

      {/* Driver Info Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={32} color="#5d1289" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.driverRating}>
              <Ionicons name="star" size={16} color="#f39c12" />
              <Text style={styles.ratingText}>{driver.rating}</Text>
              <Text style={styles.tripsText}>• {driver.totalTrips} trips</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Ionicons name="car-sport" size={16} color="#666" />
              <Text style={styles.vehicleText}>
                {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
              </Text>
            </View>
            <Text style={styles.plateNumber}>{driver.vehicle.plate}</Text>
          </View>
        </View>

        {/* Action Buttons - Message only (call removed for safety) */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.messageButton]} onPress={handleMessage}>
            <Ionicons name="chatbubble-ellipses" size={24} color="white" />
            <Text style={styles.actionButtonText}>Message Driver</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>

        {/* Block Driver Option - Safety Feature */}
        <TouchableOpacity
          style={styles.blockButton}
          onPress={() => setShowBlockModal(true)}
        >
          <Ionicons name="ban-outline" size={16} color="#EF4444" />
          <Text style={styles.blockButtonText}>Block driver</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Info */}
      <View style={styles.safetyInfo}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#27ae60" />
        <Text style={styles.safetyText}>
          Your location is being tracked for safety
        </Text>
      </View>

      {/* Share Trip Modal */}
      {currentTrip && (
        <ShareTripModal
          visible={showShareModal}
          tripId={currentTrip.id}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Chat Modal */}
      {currentTrip && driver && user && (
        <ChatModal
          visible={showChatModal}
          tripId={currentTrip.id}
          userId={user.id}
          userName={user.name || 'Rider'}
          userPhoto={user.profilePhoto}
          userType="rider"
          otherUserName={driver.name}
          onClose={() => setShowChatModal(false)}
          isEnabled={true}
        />
      )}

      {/* Block User Modal */}
      {currentTrip && driver && user && (
        <BlockUserModal
          visible={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          onBlocked={() => {
            // Cancel the trip and navigate away
            if (currentTrip?.id) {
              cancelTrip(currentTrip.id, 'RIDER', 'Rider blocked driver');
            }
            clearBookingFlow();
            router.replace('/(rider)');
          }}
          blockerId={user.id}
          blockerName={user.name}
          blockerType="rider"
          blockedId={currentTrip.driverId || ''}
          blockedName={driver.name}
          blockedType="driver"
          tripId={currentTrip.id}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  etaBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 108,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  etaContent: {
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 14,
    color: '#666',
  },
  etaTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5d1289',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  locatingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sharingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  sharingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27ae60',
    marginLeft: 4,
  },
  driverCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0e6f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  tripsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  vehicleText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5d1289',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#5d1289',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    backgroundColor: '#5d1289',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    gap: 6,
  },
  blockButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  safetyInfo: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 340 : 320,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
  },
  safetyText: {
    fontSize: 14,
    color: '#27ae60',
    marginLeft: 8,
    flex: 1,
  },
  driverMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5d1289',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  pickupMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});