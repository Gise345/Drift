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
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTripStore, TripLocation } from '@/src/stores/trip-store';
import { useSafetyStore } from '@/src/stores/safety-store';
import { ShareTripModal } from '@/components/modal/ShareTripModal';
import { ProgressivePolyline } from '@/components/map/ProgressivePolyline';
import { SafetyAlertContainer } from '@/components/safety/SafetyAlertModal';
import { SpeedMonitorDisplay } from '@/components/safety/SpeedMonitorDisplay';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT_BASE = SCREEN_HEIGHT * 0.38;
const BOTTOM_SHEET_MIN_HEIGHT_BASE = 140;

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
  const insets = useSafeAreaInsets();
  const { currentTrip, subscribeToTrip } = useTripStore();
  const {
    startMonitoring,
    stopMonitoring,
    updateSpeed,
    checkLocation,
    isMonitoring,
    speedState,
  } = useSafetyStore();
  const hasNavigatedRef = useRef(false);
  const safetyInitializedRef = useRef(false);

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
  const [showStopRequestModal, setShowStopRequestModal] = useState(false);
  const [pendingStopRequest, setPendingStopRequest] = useState<{
    address: string;
    coordinates: { latitude: number; longitude: number };
    requestedBy: 'driver' | 'rider';
    additionalCost?: number;
  } | null>(null);

  // Calculate insets-aware heights
  const bottomInset = Math.max(insets.bottom, 20);
  const BOTTOM_SHEET_MAX_HEIGHT = BOTTOM_SHEET_MAX_HEIGHT_BASE + bottomInset;
  const BOTTOM_SHEET_MIN_HEIGHT = BOTTOM_SHEET_MIN_HEIGHT_BASE + bottomInset;

  // Animation
  const sheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MAX_HEIGHT_BASE + bottomInset)).current;

  // Get driver info from current trip
  const driver = currentTrip?.driverInfo;

  // If no current trip, redirect back (must be in useEffect to avoid navigation before mount)
  useEffect(() => {
    if (!currentTrip) {
      router.replace('/(rider)');
    }
  }, [currentTrip]);

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

    // When trip is fully completed - still let rider add tip/rating
    // Driver may have clicked "Finish Without Waiting", but rider should still be able to tip
    if (currentTrip.status === 'COMPLETED') {
      console.log('Trip completed! Navigating to add-tip so rider can still tip/rate...');
      hasNavigatedRef.current = true;
      router.replace('/(rider)/add-tip');
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

  // Track processed stop requests to prevent duplicates
  const processedStopRequestRef = useRef<string | null>(null);

  // Listen for stop request status changes (driver approves/declines)
  useEffect(() => {
    if (!currentTrip) return;

    const tripData = currentTrip as any;
    const stopRequest = tripData.pendingStopRequest;

    if (stopRequest && stopRequest.requestedBy === 'rider') {
      // Create a unique key for this stop request to track if we've processed it
      const stopRequestKey = `${stopRequest.address}-${stopRequest.status}-${stopRequest.requestedAt}`;

      if (stopRequest.status === 'approved' && processedStopRequestRef.current !== stopRequestKey) {
        // Mark this request as processed to prevent duplicates
        processedStopRequestRef.current = stopRequestKey;

        // Driver approved the stop - update the trip with the new stop and fare
        const additionalCost = stopRequest.estimatedAdditionalCost || 0;
        const newEstimatedCost = (currentTrip.estimatedCost || 0) + additionalCost;

        // Build the new stop object
        const newStop = {
          address: stopRequest.address,
          coordinates: stopRequest.coordinates,
          placeName: stopRequest.placeName,
          completed: false,
        };

        // Get existing stops or initialize empty array
        const existingStops = currentTrip.stops || [];

        // Check if this stop already exists to prevent duplicates
        const stopExists = existingStops.some(
          (stop: any) =>
            stop.coordinates?.latitude === newStop.coordinates?.latitude &&
            stop.coordinates?.longitude === newStop.coordinates?.longitude
        );

        if (!stopExists) {
          // Update the trip with the new stop and updated fare
          const { updateTrip } = useTripStore.getState();
          updateTrip(currentTrip.id, {
            stops: [...existingStops, newStop],
            estimatedCost: newEstimatedCost,
            pendingStopRequest: null, // Clear the pending request
          }).catch(err => console.error('Failed to update trip with approved stop:', err));

          Alert.alert(
            'Stop Approved',
            `Your driver has approved the stop at ${stopRequest.placeName || stopRequest.address}.${
              additionalCost > 0 ? ` The fare has been increased by CI$${additionalCost.toFixed(2)}.` : ''
            }`,
            [{ text: 'OK' }]
          );
        }
      } else if (stopRequest.status === 'declined' && processedStopRequestRef.current !== stopRequestKey) {
        // Mark this request as processed
        processedStopRequestRef.current = stopRequestKey;

        // Driver declined the stop - clear the pending request
        const { updateTrip } = useTripStore.getState();
        updateTrip(currentTrip.id, {
          pendingStopRequest: null,
        }).catch(err => console.error('Failed to clear declined stop request:', err));

        Alert.alert(
          'Stop Declined',
          'Your driver was unable to accommodate the stop request.',
          [{ text: 'OK' }]
        );
      }
    }

    // Check for driver-initiated stop requests
    if (stopRequest && stopRequest.requestedBy === 'driver' && stopRequest.status === 'pending') {
      if (!showStopRequestModal) {
        setPendingStopRequest({
          address: stopRequest.address,
          coordinates: stopRequest.coordinates,
          requestedBy: 'driver',
          additionalCost: stopRequest.estimatedAdditionalCost,
        });
        setShowStopRequestModal(true);
      }
    }
  }, [(currentTrip as any)?.pendingStopRequest]);

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

  // Re-fetch route when stops are added/removed
  useEffect(() => {
    if (currentTrip?.driverLocation && currentTrip?.destination && currentTrip?.stops) {
      console.log('📍 Stops changed, re-fetching route with', currentTrip.stops.length, 'stops');
      fetchRoute(
        {
          latitude: currentTrip.driverLocation.latitude,
          longitude: currentTrip.driverLocation.longitude,
        },
        currentTrip.destination.coordinates,
        currentTrip.stops
      );
    }
  }, [currentTrip?.stops?.length]);

  // Start safety monitoring when trip starts and route is ready
  useEffect(() => {
    if (
      currentTrip?.id &&
      currentTrip?.driverId &&
      currentTrip?.riderId &&
      originalRoute.length > 0 &&
      currentTrip?.destination?.coordinates &&
      !safetyInitializedRef.current
    ) {
      console.log('Starting safety monitoring for trip:', currentTrip.id);
      safetyInitializedRef.current = true;

      startMonitoring(
        currentTrip.id,
        currentTrip.driverId,
        currentTrip.riderId,
        originalRoute,
        currentTrip.destination.coordinates
      );
    }

    // Cleanup when trip ends
    return () => {
      if (safetyInitializedRef.current) {
        console.log('Stopping safety monitoring');
        stopMonitoring();
        safetyInitializedRef.current = false;
      }
    };
  }, [currentTrip?.id, currentTrip?.driverId, currentTrip?.riderId, originalRoute, currentTrip?.destination?.coordinates]);

  // Check for route deviation and update ETA when driver location updates
  useEffect(() => {
    if (currentTrip?.driverLocation && currentTrip?.destination) {
      // Update route display from driver's current position (include stops)
      fetchRoute(
        {
          latitude: currentTrip.driverLocation.latitude,
          longitude: currentTrip.driverLocation.longitude,
        },
        currentTrip.destination.coordinates,
        currentTrip.stops // Pass stops for waypoints
      );

      // Calculate ETA
      calculateETA(currentTrip.driverLocation, currentTrip.destination.coordinates);

      // Update safety monitoring with current location
      if (isMonitoring) {
        checkLocation(
          currentTrip.driverLocation.latitude,
          currentTrip.driverLocation.longitude
        );

        // Update speed if available (speed is in m/s from GPS)
        if (currentTrip.driverLocation.speed !== undefined) {
          updateSpeed(
            currentTrip.driverLocation.speed,
            currentTrip.driverLocation.latitude,
            currentTrip.driverLocation.longitude
          );
        }
      }

      // Check for route deviation (legacy - now handled by safety store)
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
  }, [currentTrip?.driverLocation, originalRoute, routeDeviationConfirmed, isMonitoring]);

  // Calculate ETA based on driver location using Google Directions API
  const lastEtaFetch = useRef<number>(0);
  const ETA_FETCH_INTERVAL = 15000; // Fetch new ETA every 15 seconds

  const calculateETA = async (
    driverLocation: TripLocation,
    destinationLocation: { latitude: number; longitude: number }
  ) => {
    // Calculate straight-line distance for display
    const dist = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      destinationLocation.latitude,
      destinationLocation.longitude
    );

    const now = Date.now();
    // Only fetch from Google API periodically to avoid excessive API calls
    if (now - lastEtaFetch.current >= ETA_FETCH_INTERVAL && GOOGLE_DIRECTIONS_API_KEY) {
      lastEtaFetch.current = now;
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driverLocation.latitude},${driverLocation.longitude}&destination=${destinationLocation.latitude},${destinationLocation.longitude}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
          const leg = data.routes[0].legs[0];
          // Use Google's accurate duration (in seconds, convert to minutes)
          setEta(Math.ceil(leg.duration.value / 60));
          // Use Google's accurate distance (in meters, convert to km)
          setDistance(leg.distance.value / 1000);
          return;
        }
      } catch (error) {
        console.warn('Failed to fetch ETA from Google Directions:', error);
      }
    }

    // Fallback: use straight-line distance with speed estimate
    setDistance(dist);
    const avgSpeedKmPerMin = 0.5; // 30 km/h = 0.5 km/min (city speed fallback)
    const timeInMinutes = Math.ceil(dist / avgSpeedKmPerMin);
    setEta(Math.max(1, Math.min(timeInMinutes, 999)));
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
  // Includes any stops as waypoints
  const fetchRoute = async (origin: RouteCoordinate, destination: RouteCoordinate, stops?: Array<{ coordinates: { latitude: number; longitude: number } }>) => {
    if (!GOOGLE_DIRECTIONS_API_KEY) return;

    try {
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      // Add waypoints for stops
      if (stops && stops.length > 0) {
        const waypointsStr = stops
          .filter(stop => !stop.completed) // Only include uncompleted stops
          .map(stop => `${stop.coordinates.latitude},${stop.coordinates.longitude}`)
          .join('|');
        if (waypointsStr) {
          url += `&waypoints=${waypointsStr}`;
        }
      }

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
  const handleAddStop = () => {
    // Navigate to add stop screen
    router.push('/(rider)/add-stop');
  };

  const handleShareTrip = () => {
    setShowShareModal(true);
  };

  // Handle stop request from driver (listener would update pendingStopRequest)
  const handleApproveStopRequest = () => {
    if (!pendingStopRequest || !currentTrip) return;

    Alert.alert(
      'Stop Request Approved',
      `The stop at ${pendingStopRequest.address} has been added to your trip.${
        pendingStopRequest.additionalCost
          ? ` Additional cost: $${pendingStopRequest.additionalCost.toFixed(2)}`
          : ''
      }`,
      [{ text: 'OK' }]
    );

    // TODO: Update trip in Firebase with approved stop
    setPendingStopRequest(null);
    setShowStopRequestModal(false);
  };

  const handleDeclineStopRequest = () => {
    if (!currentTrip) return;

    Alert.alert(
      'Stop Request Declined',
      'The driver has been notified that you declined the stop request.',
      [{ text: 'OK' }]
    );

    // TODO: Update trip in Firebase with declined stop request
    setPendingStopRequest(null);
    setShowStopRequestModal(false);
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

  // Don't render if no current trip or driver info (redirect will happen via useEffect)
  if (!currentTrip || !driver) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Loading trip information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate map region (after null check so currentTrip is guaranteed)
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

        {/* Stop Markers */}
        {currentTrip.stops && currentTrip.stops.map((stop, index) => (
          <Marker
            key={`stop-marker-${index}`}
            coordinate={stop.coordinates}
            title={`Stop ${index + 1}`}
            description={stop.placeName || stop.address}
          >
            <View style={styles.stopMarker}>
              <Text style={styles.stopMarkerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}

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
      <Animated.View style={[styles.bottomSheet, { height: sheetHeight }]}>
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
            <View style={[styles.minimizedContent, { paddingBottom: bottomInset }]}>
              <View style={styles.driverAvatarSmall}>
                <Ionicons name="person" size={20} color="#5d1289" />
              </View>
              <View style={styles.minimizedInfo}>
                <Text style={styles.minimizedName}>{driver.name}</Text>
                <Text style={styles.minimizedVehicle}>
                  {driver.vehicle.color} {driver.vehicle.make}
                </Text>
              </View>
              <TouchableOpacity style={styles.addStopButtonSmall} onPress={handleAddStop}>
                <Ionicons name="add" size={20} color="#5d1289" />
                <Text style={styles.addStopTextSmall}>Stop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Expanded View - Make it scrollable */
            <ScrollView
              style={styles.expandedScrollView}
              contentContainerStyle={[styles.expandedContent, { paddingBottom: bottomInset + 16 }]}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
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

              {/* Stops (if any) */}
              {currentTrip.stops && currentTrip.stops.length > 0 && (
                <View style={styles.stopsContainer}>
                  {currentTrip.stops.map((stop, index) => (
                    <View key={`stop-${index}`} style={styles.stopCard}>
                      <View style={styles.stopDot}>
                        <Text style={styles.stopNumber}>{index + 1}</Text>
                      </View>
                      <View style={styles.stopInfo}>
                        <Text style={styles.stopLabel}>STOP {index + 1}</Text>
                        <Text style={styles.stopAddress} numberOfLines={2}>
                          {stop.placeName || stop.address}
                        </Text>
                      </View>
                      {stop.completed && (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      )}
                    </View>
                  ))}
                </View>
              )}

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

              {/* Action Button */}
              <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop}>
                <Ionicons name="add-circle" size={24} color="white" />
                <Text style={styles.addStopButtonText}>Add a Stop</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Animated.View>

      {/* Speed Monitor Display - positioned above bottom sheet */}
      {isMonitoring && (
        <View style={styles.speedMonitorContainer}>
          <SpeedMonitorDisplay compact />
        </View>
      )}

      {/* Safety Alert Modal (Are you okay?) */}
      <SafetyAlertContainer />

      {/* Share Trip Modal */}
      {currentTrip && (
        <ShareTripModal
          visible={showShareModal}
          tripId={currentTrip.id}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Stop Request Modal (when driver requests a stop) */}
      <Modal
        visible={showStopRequestModal && pendingStopRequest !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStopRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stopRequestModal}>
            <View style={styles.stopRequestIconContainer}>
              <Ionicons name="location" size={40} color="#5d1289" />
            </View>

            <Text style={styles.stopRequestTitle}>
              {pendingStopRequest?.requestedBy === 'driver' ? 'Driver' : 'You'} Requested a Stop
            </Text>

            <Text style={styles.stopRequestAddress}>
              {pendingStopRequest?.address}
            </Text>

            {pendingStopRequest?.additionalCost && pendingStopRequest.additionalCost > 0 && (
              <View style={styles.additionalCostContainer}>
                <Text style={styles.additionalCostLabel}>Additional Cost</Text>
                <Text style={styles.additionalCostValue}>
                  +${pendingStopRequest.additionalCost.toFixed(2)}
                </Text>
              </View>
            )}

            <Text style={styles.stopRequestMessage}>
              {pendingStopRequest?.requestedBy === 'driver'
                ? 'Your driver has requested to add this stop to your trip. Do you approve?'
                : 'Waiting for driver to confirm the stop...'}
            </Text>

            {pendingStopRequest?.requestedBy === 'driver' && (
              <View style={styles.stopRequestButtons}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={handleDeclineStopRequest}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={handleApproveStopRequest}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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

  // Stop Marker
  stopMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  stopMarkerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },

  // Stops Container (in bottom sheet)
  stopsContainer: {
    marginBottom: 8,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stopDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  stopInfo: {
    flex: 1,
  },
  stopLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stopAddress: {
    fontSize: 14,
    color: '#374151',
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
    paddingBottom: 8,
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
  addStopButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#5d1289',
    backgroundColor: '#F3E8FF',
  },
  addStopTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5d1289',
  },

  // Expanded Content
  expandedScrollView: {
    flex: 1,
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
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

  // Add Stop Button
  addStopButton: {
    flexDirection: 'row',
    backgroundColor: '#5d1289',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  addStopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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

  // Speed Monitor Container
  speedMonitorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 200 : 180,
    left: 16,
    zIndex: 10,
  },

  // Stop Request Modal Styles
  stopRequestModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  stopRequestIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stopRequestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  stopRequestAddress: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  additionalCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  additionalCostLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  additionalCostValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
  },
  stopRequestMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  stopRequestButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#5d1289',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
