/**
 * Navigate to Destination Screen
 * Professional navigation UI for in-progress rides
 *
 * Features:
 * - Real-time route polyline from Google Directions API
 * - Minimizable bottom sheet
 * - Turn-by-turn navigation hints
 * - Live ETA and distance updates
 * - Trip timer
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useTripStore } from '@/src/stores/trip-store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.40;
const BOTTOM_SHEET_MIN_HEIGHT = 100;

// Google Directions API Key
const GOOGLE_DIRECTIONS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

export default function NavigateToDestination() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { activeRide, updateLocation } = useDriverStore();
  const { updateDriverLocation } = useTripStore();

  // State
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RouteCoordinate | null>(null);
  const [isSheetMinimized, setIsSheetMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tripStartTime] = useState(new Date());

  // Animation
  const sheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MAX_HEIGHT)).current;

  // Trip timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - tripStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [tripStartTime]);

  // Fetch route from Google Directions API
  const fetchRoute = async (
    origin: RouteCoordinate,
    destination: RouteCoordinate
  ) => {
    if (!GOOGLE_DIRECTIONS_API_KEY) {
      console.error('❌ Google Directions API key not configured');
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        // Set ETA and distance
        setEta(Math.ceil(leg.duration.value / 60));
        setDistance(leg.distance.value / 1000);

        // Parse navigation steps
        const steps: NavigationStep[] = leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
          maneuver: step.maneuver,
        }));

        if (steps.length > 0) {
          setCurrentStep(steps[0]);
        }

        // Fit map to show route
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [origin, destination],
            {
              edgePadding: { top: 100, right: 50, bottom: BOTTOM_SHEET_MAX_HEIGHT + 50, left: 50 },
              animated: true,
            }
          );
        }
      } else {
        console.error('❌ Directions API error:', data.status);
      }
    } catch (error) {
      console.error('❌ Failed to fetch route:', error);
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

  // Start location tracking
  useEffect(() => {
    if (!activeRide) return;

    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Location permission is required for navigation.');
          return;
        }

        // Get initial location and fetch route
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const initialLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(initialLocation);

        // Fetch route to destination
        await fetchRoute(initialLocation, {
          latitude: activeRide.destination.lat,
          longitude: activeRide.destination.lng,
        });

        // Start watching position
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (loc) => {
            const { latitude, longitude, heading, speed } = loc.coords;
            setCurrentLocation({ latitude, longitude });

            // Update driver location
            updateLocation({
              lat: latitude,
              lng: longitude,
              heading: heading || 0,
              speed: speed || 0,
            });

            // Update Firebase
            if (activeRide.id) {
              updateDriverLocation(activeRide.id, {
                latitude,
                longitude,
                timestamp: new Date(),
                accuracy: loc.coords.accuracy,
                speed: speed || 0,
                heading: heading || 0,
              });
            }

            // Recalculate distance
            const distanceToDestination = calculateDistance(
              latitude,
              longitude,
              activeRide.destination.lat,
              activeRide.destination.lng
            );
            setDistance(distanceToDestination);

            // Simple ETA recalculation
            const avgSpeed = 30;
            const newEta = (distanceToDestination / avgSpeed) * 60;
            setEta(Math.ceil(newEta));
          }
        );
      } catch (error) {
        console.error('Failed to start tracking:', error);
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [activeRide?.id]);

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

  // Get maneuver icon
  const getManeuverIcon = (maneuver?: string): string => {
    switch (maneuver) {
      case 'turn-left':
        return 'arrow-back';
      case 'turn-right':
        return 'arrow-forward';
      case 'turn-slight-left':
        return 'arrow-back';
      case 'turn-slight-right':
        return 'arrow-forward';
      case 'uturn-left':
      case 'uturn-right':
        return 'refresh';
      case 'roundabout-left':
      case 'roundabout-right':
        return 'sync';
      default:
        return 'arrow-up';
    }
  };

  // Handlers
  const handleOpenMaps = () => {
    if (!activeRide) return;
    const { lat, lng } = activeRide.destination;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleComplete = () => {
    router.push('/(driver)/active-ride/complete-ride');
  };

  const handleAddStop = () => {
    router.push('/(driver)/active-ride/add-stop');
  };

  const handleCenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (!activeRide) {
    router.replace('/(driver)/tabs');
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: activeRide.destination.lat,
          longitude: activeRide.destination.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        followsUserLocation={false}
      >
        {/* Destination Marker */}
        <Marker
          coordinate={{
            latitude: activeRide.destination.lat,
            longitude: activeRide.destination.lng,
          }}
          title="Destination"
        >
          <View style={styles.destinationMarker}>
            <View style={styles.destinationMarkerInner}>
              <Ionicons name="flag" size={16} color={Colors.white} />
            </View>
          </View>
        </Marker>

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={5}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Top Navigation Card */}
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <View style={styles.navCard}>
          <View style={styles.navIconContainer}>
            <Ionicons
              name={getManeuverIcon(currentStep?.maneuver) as any}
              size={28}
              color={Colors.white}
            />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navInstruction} numberOfLines={2}>
              {currentStep?.instruction || 'Calculating route...'}
            </Text>
            <Text style={styles.navDistance}>
              {currentStep?.distance || ''}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Stats Pills */}
      <View style={styles.statsPillContainer}>
        <View style={styles.statPill}>
          <Ionicons name="time-outline" size={16} color={Colors.primary} />
          <Text style={styles.statPillText}>{formatTime(elapsed)}</Text>
        </View>
        <View style={[styles.statPill, styles.statPillPrimary]}>
          <Text style={styles.etaTime}>{eta ?? '--'}</Text>
          <Text style={styles.etaUnit}>min</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="navigate-outline" size={16} color={Colors.gray[600]} />
          <Text style={styles.statPillText}>{distance?.toFixed(1) ?? '--'} km</Text>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlButton} onPress={handleCenterMap}>
          <Ionicons name="locate" size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlButton} onPress={handleOpenMaps}>
          <Ionicons name="navigate" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeight }]}>
        {/* Handle */}
        <TouchableOpacity style={styles.sheetHandle} onPress={toggleSheet} activeOpacity={0.8}>
          <View style={styles.handleBar} />
          <Ionicons
            name={isSheetMinimized ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.gray[400]}
          />
        </TouchableOpacity>

        {/* Minimized View */}
        {isSheetMinimized ? (
          <View style={styles.minimizedContent}>
            <View style={styles.destinationIconSmall}>
              <Ionicons name="flag" size={18} color={Colors.error} />
            </View>
            <View style={styles.minimizedInfo}>
              <Text style={styles.minimizedLabel}>DESTINATION</Text>
              <Text style={styles.minimizedAddress} numberOfLines={1}>
                {activeRide.destination.address}
              </Text>
            </View>
            <TouchableOpacity style={styles.completeButtonSmall} onPress={handleComplete}>
              <Text style={styles.completeButtonSmallText}>Complete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Expanded View */
          <View style={styles.expandedContent}>
            {/* Trip Progress Indicator */}
            <View style={styles.tripProgress}>
              <View style={styles.progressDot}>
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressDotActive} />
            </View>

            {/* Rider Info */}
            <View style={styles.riderCard}>
              <View style={styles.riderAvatar}>
                <Ionicons name="person" size={24} color={Colors.primary} />
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{activeRide.riderName}</Text>
                <Text style={styles.tripStatus}>Trip in progress</Text>
              </View>
            </View>

            {/* Destination Location */}
            <View style={styles.locationCard}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>DESTINATION</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {activeRide.destination.address}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop}>
                <Ionicons name="add" size={20} color={Colors.primary} />
                <Text style={styles.addStopText}>Add Stop</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                <Text style={styles.completeText}>Complete Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Top Navigation Card
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    ...Shadows.lg,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navContent: {
    flex: 1,
  },
  navInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  navDistance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  // Stats Pills
  statsPillContainer: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    ...Shadows.sm,
  },
  statPillPrimary: {
    backgroundColor: Colors.primary,
  },
  statPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  etaTime: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  etaUnit: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 200,
    gap: 10,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },

  // Destination Marker
  destinationMarker: {
    alignItems: 'center',
  },
  destinationMarkerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.md,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Shadows.xl,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[300],
    marginBottom: 4,
  },

  // Minimized Content
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  destinationIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  minimizedLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gray[500],
    letterSpacing: 1,
  },
  minimizedAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginTop: 2,
  },
  completeButtonSmall: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  completeButtonSmallText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Expanded Content
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },

  // Trip Progress
  tripProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: Colors.primary,
  },
  progressDotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    borderWidth: 3,
    borderColor: Colors.error + '30',
  },

  // Rider Card
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  tripStatus: {
    fontSize: 13,
    color: Colors.success,
    marginTop: 2,
  },

  // Location Card
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    marginTop: 4,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[500],
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 20,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addStopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  addStopText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  completeButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
