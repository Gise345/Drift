/**
 * Trip In Progress Screen - Rider View
 * Shows the rider their trip status while the driver is taking them to the destination
 *
 * Features:
 * - Real-time map tracking of driver location
 * - ETA and distance to destination
 * - Driver information display
 * - Trip sharing capability
 * - Emergency contact options
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Animated,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTripStore, TripLocation } from '@/src/stores/trip-store';
import { ShareTripModal } from '@/components/modal/ShareTripModal';
import { ProgressivePolyline } from '@/components/map/ProgressivePolyline';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.35;
const BOTTOM_SHEET_MIN_HEIGHT = 100;
// Extra padding for Android navigation bar
const ANDROID_NAV_BAR_HEIGHT = Platform.OS === 'android' ? 48 : 0;

// Route deviation threshold in meters (200m = ~0.12 miles)
const ROUTE_DEVIATION_THRESHOLD = 200;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
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

/**
 * Calculate minimum distance from a point to a polyline route
 * @returns Minimum distance in meters
 */
const getDistanceFromRoute = (
  point: RouteCoordinate,
  route: RouteCoordinate[]
): number => {
  if (route.length === 0) return 0;

  let minDistance = Infinity;

  for (const routePoint of route) {
    const dist = calculateDistanceMeters(
      point.latitude,
      point.longitude,
      routePoint.latitude,
      routePoint.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
};

// Google Directions API Key
const GOOGLE_DIRECTIONS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export default function TripInProgressScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentTrip, subscribeToTrip } = useTripStore();
  const hasNavigatedRef = useRef(false);

  // State
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [originalRoute, setOriginalRoute] = useState<RouteCoordinate[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSheetMinimized, setIsSheetMinimized] = useState(false);
  const [tripStartTime] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [showRouteDeviationModal, setShowRouteDeviationModal] = useState(false);
  const [routeDeviationConfirmed, setRouteDeviationConfirmed] = useState(false);

  // Animation
  const sheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MAX_HEIGHT)).current;

  // If no current trip, redirect back
  if (!currentTrip) {
    router.replace('/(rider)');
    return null;
  }

  // Get driver info from current trip
  const driver = currentTrip.driverInfo;

  // Subscribe to trip updates
  useEffect(() => {
    if (!currentTrip?.id) return;

    const unsubscribe = subscribeToTrip(currentTrip.id);
    return () => unsubscribe();
  }, [currentTrip?.id]);

  // Handle trip status changes
  useEffect(() => {
    if (!currentTrip || hasNavigatedRef.current) return;

    // When trip is awaiting tip, navigate to add-tip screen
    if (currentTrip.status === 'AWAITING_TIP') {
      console.log('Trip completed! Driver is waiting for tip. Navigating to add-tip...');
      hasNavigatedRef.current = true;
      router.replace('/(rider)/add-tip');
      return;
    }

    // When trip is fully completed (after tip or skip), navigate to trip-complete
    if (currentTrip.status === 'COMPLETED') {
      console.log('Trip fully completed! Navigating to trip-complete...');
      hasNavigatedRef.current = true;
      router.replace('/(rider)/trip-complete');
      return;
    }

    // If trip was cancelled
    if (currentTrip.status === 'CANCELLED') {
      console.log('Trip was cancelled');
      hasNavigatedRef.current = true;
      Alert.alert('Ride Cancelled', 'The ride has been cancelled.');
      router.replace('/(rider)');
      return;
    }
  }, [currentTrip?.status]);

  // Trip timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - tripStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [tripStartTime]);

  // Fetch initial route when trip starts (only once)
  useEffect(() => {
    if (currentTrip?.pickup && currentTrip?.destination && originalRoute.length === 0) {
      fetchInitialRoute(
        currentTrip.pickup.coordinates,
        currentTrip.destination.coordinates
      );
    }
  }, [currentTrip?.pickup, currentTrip?.destination]);

  // Check for route deviation and update ETA when driver location updates
  useEffect(() => {
    if (currentTrip?.driverLocation && currentTrip?.destination) {
      // Update route display from driver's current position
      fetchRoute(
        {
          latitude: currentTrip.driverLocation.latitude,
          longitude: currentTrip.driverLocation.longitude,
        },
        currentTrip.destination.coordinates
      );

      // Calculate ETA
      calculateETA(currentTrip.driverLocation, currentTrip.destination.coordinates);

      // Check for route deviation
      if (originalRoute.length > 0 && !routeDeviationConfirmed) {
        const driverPoint = {
          latitude: currentTrip.driverLocation.latitude,
          longitude: currentTrip.driverLocation.longitude,
        };
        const distanceFromRoute = getDistanceFromRoute(driverPoint, originalRoute);

        if (distanceFromRoute > ROUTE_DEVIATION_THRESHOLD) {
          setShowRouteDeviationModal(true);
        }
      }
    }
  }, [currentTrip?.driverLocation, originalRoute, routeDeviationConfirmed]);

  // Calculate ETA based on driver location
  const calculateETA = (
    driverLocation: TripLocation,
    destinationLocation: { latitude: number; longitude: number }
  ) => {
    const dist = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      destinationLocation.latitude,
      destinationLocation.longitude
    );
    setDistance(dist);

    // Estimate ETA based on average speed
    const avgSpeed = driverLocation.speed || 40 / 3.6; // m/s
    const timeInSeconds = (dist * 1000) / avgSpeed;
    const timeInMinutes = Math.ceil(timeInSeconds / 60);
    setEta(Math.max(1, timeInMinutes));
  };

  // Calculate distance (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
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

  // Fetch initial route from pickup to destination (saved for deviation detection)
  const fetchInitialRoute = async (origin: RouteCoordinate, destination: RouteCoordinate) => {
    if (!GOOGLE_DIRECTIONS_API_KEY) return;

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setOriginalRoute(points);
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.error('Failed to fetch initial route:', error);
    }
  };

  // Fetch route from Google Directions API (for display updates)
  const fetchRoute = async (origin: RouteCoordinate, destination: RouteCoordinate) => {
    if (!GOOGLE_DIRECTIONS_API_KEY) return;

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
    }
  };

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

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle sheet
  const toggleSheet = () => {
    const toValue = isSheetMinimized ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT;
    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,
      friction: 8,
    }).start();
    setIsSheetMinimized(!isSheetMinimized);
  };

  // Handlers
  const handleCall = () => {
    if (!driver?.phone) return;
    Alert.alert('Call Driver', `Call ${driver.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${driver.phone}`) },
    ]);
  };

  const handleMessage = () => {
    if (!driver?.phone) return;
    Linking.openURL(`sms:${driver.phone}`);
  };

  const handleShareTrip = () => {
    setShowShareModal(true);
  };

  // Emergency call - directly opens phone dialer with 911
  const handleEmergencyCall = () => {
    Linking.openURL('tel:911');
  };

  // Route deviation safety confirmation - user says they're OK
  const handleRouteDeviationConfirmOk = () => {
    setRouteDeviationConfirmed(true);
    setShowRouteDeviationModal(false);
  };

  // Calculate map region
  const driverLat = currentTrip.driverLocation?.latitude || currentTrip.pickup.coordinates.latitude;
  const driverLng = currentTrip.driverLocation?.longitude || currentTrip.pickup.coordinates.longitude;
  const destLat = currentTrip.destination.coordinates.latitude;
  const destLng = currentTrip.destination.coordinates.longitude;

  const mapRegion = {
    latitude: (driverLat + destLat) / 2,
    longitude: (driverLng + destLng) / 2,
    latitudeDelta: Math.abs(driverLat - destLat) * 1.5 + 0.01,
    longitudeDelta: Math.abs(driverLng - destLng) * 1.5 + 0.01,
  };

  // Don't render if no driver info
  if (!driver) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Loading trip information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
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

        {/* Destination Marker */}
        <Marker
          coordinate={currentTrip.destination.coordinates}
          title="Destination"
        >
          <View style={styles.destinationMarker}>
            <Ionicons name="flag" size={20} color="white" />
          </View>
        </Marker>

        {/* Route Line with Progress Tracking */}
        {routeCoordinates.length > 0 && (
          <ProgressivePolyline
            routeCoordinates={routeCoordinates}
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

      {/* Route Deviation Safety Modal */}
      <Modal
        visible={showRouteDeviationModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.safetyModal}>
            <View style={styles.safetyIconContainer}>
              <Ionicons name="navigate" size={60} color="#EF4444" />
            </View>

            <Text style={styles.safetyTitle}>Route Change Detected</Text>
            <Text style={styles.safetyMessage}>
              Your driver appears to be taking a different route than expected. Is everything okay?
            </Text>

            <TouchableOpacity
              style={styles.safetyOkButton}
              onPress={handleRouteDeviationConfirmOk}
            >
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.safetyOkText}>Yes, I'm okay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosButton}
              onPress={handleEmergencyCall}
            >
              <Ionicons name="warning" size={22} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>Call Emergency (911)</Text>
            </TouchableOpacity>

            <Text style={styles.safetyNote}>
              If you feel unsafe, please call emergency services immediately.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.sosHeaderButton} onPress={handleEmergencyCall}>
            <Ionicons name="warning" size={18} color="#FFFFFF" />
            <Text style={styles.sosHeaderText}>SOS</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip in Progress</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleShareTrip}>
            <Ionicons name="share-social" size={22} color="#5d1289" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(elapsed)}</Text>
          <Text style={styles.statLabel}>Trip Time</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statValuePrimary]}>{eta ?? '--'} min</Text>
          <Text style={styles.statLabel}>ETA</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{distance?.toFixed(1) ?? '--'} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
      </View>

      {/* Safety Info */}
      {currentTrip.sharedWith && currentTrip.sharedWith.length > 0 && (
        <View style={styles.sharingBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#27ae60" />
          <Text style={styles.sharingText}>
            Shared with {currentTrip.sharedWith.length} contact{currentTrip.sharedWith.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: ANDROID_NAV_BAR_HEIGHT }]}>
        <View style={styles.bottomSheetSafeArea}>
          {/* Handle */}
          <TouchableOpacity style={styles.sheetHandle} onPress={toggleSheet} activeOpacity={0.8}>
            <View style={styles.handleBar} />
            <Ionicons
              name={isSheetMinimized ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {/* Minimized View */}
          {isSheetMinimized ? (
            <View style={styles.minimizedContent}>
              <View style={styles.driverAvatarSmall}>
                <Ionicons name="person" size={20} color="#5d1289" />
              </View>
              <View style={styles.minimizedInfo}>
                <Text style={styles.minimizedName}>{driver.name}</Text>
                <Text style={styles.minimizedVehicle}>
                  {driver.vehicle.color} {driver.vehicle.make}
                </Text>
              </View>
              <TouchableOpacity style={styles.callButtonSmall} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            /* Expanded View */
            <View style={styles.expandedContent}>
              {/* Driver Info */}
              <View style={styles.driverInfo}>
                {driver.photo ? (
                  <Image
                    source={{ uri: driver.photo }}
                    style={styles.driverPhotoLarge}
                  />
                ) : (
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={32} color="#5d1289" />
                  </View>
                )}
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <View style={styles.driverRating}>
                    <Ionicons name="star" size={14} color="#f39c12" />
                    <Text style={styles.ratingText}>{driver.rating}</Text>
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleText}>
                      {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
                    </Text>
                  </View>
                  <Text style={styles.plateNumber}>{driver.vehicle.plate}</Text>
                </View>
              </View>

              {/* Destination */}
              <View style={styles.destinationCard}>
                <View style={styles.destinationDot} />
                <View style={styles.destinationInfo}>
                  <Text style={styles.destinationLabel}>DESTINATION</Text>
                  <Text style={styles.destinationAddress} numberOfLines={2}>
                    {currentTrip.destination.address}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                  <Ionicons name="call" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
                  <Ionicons name="chatbubble" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Share Trip Modal */}
      {currentTrip && (
        <ShareTripModal
          visible={showShareModal}
          tripId={currentTrip.id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </View>
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

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  // Stats Banner
  statsBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statValuePrimary: {
    color: '#5d1289',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },

  // Sharing Badge
  sharingBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 200 : 180,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sharingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27ae60',
    marginLeft: 6,
  },

  // Driver Marker
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

  // Destination Marker
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
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

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomSheetSafeArea: {
    flex: 1,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 4,
  },

  // Minimized Content
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
  },
  driverAvatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  minimizedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  minimizedVehicle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  callButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5d1289',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Expanded Content
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  driverInfo: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverPhotoLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  driverDetails: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 18,
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
  vehicleInfo: {
    marginTop: 4,
  },
  vehicleText: {
    fontSize: 13,
    color: '#6B7280',
  },
  plateNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5d1289',
    marginTop: 2,
  },

  // Destination Card
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginTop: 4,
    marginRight: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Safety Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  safetyModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  safetyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  safetyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  safetyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  safetyOkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  safetyOkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  sosButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  safetyNote: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // SOS Header Button
  sosHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sosHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
