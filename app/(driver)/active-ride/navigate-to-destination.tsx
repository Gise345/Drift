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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { ProgressivePolyline } from '@/components/map/ProgressivePolyline';
import { useSpeedMonitor } from '@/src/hooks/useSpeedMonitor';
import { SpeedWarningModal } from '@/components/driver/SpeedWarningModal';
import { useRouteDeviation } from '@/src/hooks/useRouteDeviation';
import { RouteDeviationModal } from '@/components/driver/RouteDeviationModal';
import { DriverSlowDownRequestModal } from '@/components/driver/DriverSlowDownRequestModal';
import { useSafetyStore } from '@/src/stores/safety-store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT_BASE = SCREEN_HEIGHT * 0.42;
const BOTTOM_SHEET_MIN_HEIGHT_BASE = 150;

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
  const insets = useSafeAreaInsets();
  const { activeRide, updateLocation, setActiveRide, addRouteHistoryPoint } = useDriverStore();
  const { updateDriverLocation, subscribeToTrip, currentTrip } = useTripStore();
  const { user } = useAuthStore();

  // Speed monitoring hook
  const speedMonitor = useSpeedMonitor(activeRide?.id || null, user?.id || null);

  // Route deviation monitoring hook
  const routeDeviation = useRouteDeviation(activeRide?.id || null);

  // Safety store for slow-down requests from rider
  const {
    showDriverSlowDownRequest,
    slowDownRequestFrom,
    speedState,
    dismissDriverSlowDownRequest,
  } = useSafetyStore();

  // Calculate insets-aware heights
  const bottomInset = Math.max(insets.bottom, 20);
  const BOTTOM_SHEET_MAX_HEIGHT = BOTTOM_SHEET_MAX_HEIGHT_BASE + bottomInset;
  const BOTTOM_SHEET_MIN_HEIGHT = BOTTOM_SHEET_MIN_HEIGHT_BASE + bottomInset;

  // State
  const [eta, setEta] = useState<number | null>(null);
  const [googleEta, setGoogleEta] = useState<number | null>(null); // Store Google's ETA
  const [distance, setDistance] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RouteCoordinate | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [isSheetMinimized, setIsSheetMinimized] = useState(true); // Auto-collapsed on start
  const [elapsed, setElapsed] = useState(0);
  const [tripStartTime] = useState(new Date());
  const [isRecalculatingRoute, setIsRecalculatingRoute] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0); // Speed in m/s
  const [isAutoFollowEnabled, setIsAutoFollowEnabled] = useState(true);
  const [isInitialCameraSet, setIsInitialCameraSet] = useState(false);
  const lastRouteRecalculation = useRef<number>(0);
  const hasHandledCancellationRef = useRef(false);
  const lastCameraUpdate = useRef<number>(0);
  const lastEtaRefresh = useRef<number>(0);
  const ROUTE_RECALC_COOLDOWN = 10000; // 10 seconds between recalculations
  const CAMERA_UPDATE_INTERVAL = 300; // Update camera every 300ms for smoother following
  const ETA_REFRESH_INTERVAL = 30000; // Refresh ETA from Google every 30 seconds

  // Stop request state
  const [showStopRequestModal, setShowStopRequestModal] = useState(false);
  const [pendingStopRequest, setPendingStopRequest] = useState<{
    address: string;
    placeName?: string;
    coordinates: { latitude: number; longitude: number };
    requestedBy: 'driver' | 'rider';
    estimatedAdditionalCost?: number;
  } | null>(null);

  // Animation - initialize with min height (auto-collapsed)
  const sheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;

  // Sync animated value when insets change
  useEffect(() => {
    const targetHeight = isSheetMinimized ? BOTTOM_SHEET_MIN_HEIGHT : BOTTOM_SHEET_MAX_HEIGHT;
    Animated.timing(sheetHeight, {
      toValue: targetHeight,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [bottomInset, BOTTOM_SHEET_MIN_HEIGHT, BOTTOM_SHEET_MAX_HEIGHT]);

  // Subscribe to trip updates to detect rider cancellation
  useEffect(() => {
    if (!activeRide?.id) return;

    const unsubscribe = subscribeToTrip(activeRide.id);

    return () => unsubscribe();
  }, [activeRide?.id]);

  // Listen for trip status changes (e.g., rider cancellation)
  useEffect(() => {
    if (!currentTrip) {
      console.log('📍 NavigateToDestination: No currentTrip yet');
      return;
    }

    // Prevent duplicate handling
    if (hasHandledCancellationRef.current) {
      return;
    }

    console.log('📍 NavigateToDestination: Trip update received:', {
      tripId: currentTrip.id,
      activeRideId: activeRide?.id,
      status: currentTrip.status,
      cancelledBy: (currentTrip as any).cancelledBy,
    });

    // Only process if this trip matches our active ride
    if (activeRide?.id && currentTrip.id !== activeRide.id) {
      console.log('⚠️ Trip ID mismatch, ignoring update');
      return;
    }

    // If trip was cancelled by rider
    if (currentTrip.status === 'CANCELLED') {
      console.log('⚠️ Trip was cancelled - notifying driver');
      hasHandledCancellationRef.current = true;

      // Clear active ride from driver store
      setActiveRide(null);

      // Show alert and redirect
      Alert.alert(
        'Ride Cancelled',
        (currentTrip as any).cancelledBy === 'RIDER'
          ? 'The rider has cancelled this trip.'
          : 'This trip has been cancelled.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(driver)/tabs'),
          },
        ]
      );
    }
  }, [currentTrip?.status, currentTrip?.id, activeRide?.id]);

  // Re-fetch route when stops are added/changed
  useEffect(() => {
    if (!currentTrip || !currentLocation || !activeRide) return;

    const tripData = currentTrip as any;
    if (tripData.stops && tripData.stops.length > 0) {
      console.log('📍 Stops changed, re-fetching route with', tripData.stops.length, 'stops');
      fetchRoute(
        currentLocation,
        {
          latitude: activeRide.destination.lat,
          longitude: activeRide.destination.lng,
        },
        tripData.stops
      );
    }
  }, [(currentTrip as any)?.stops?.length]);

  // Listen for pending stop requests from rider
  useEffect(() => {
    if (!currentTrip) return;

    const tripData = currentTrip as any;
    if (tripData.pendingStopRequest && tripData.pendingStopRequest.status === 'pending') {
      const stopRequest = tripData.pendingStopRequest;
      // Only show modal for rider-initiated requests
      if (stopRequest.requestedBy === 'rider' && !showStopRequestModal) {
        console.log('📍 Rider requested a stop:', stopRequest.address);
        setPendingStopRequest({
          address: stopRequest.address,
          placeName: stopRequest.placeName,
          coordinates: stopRequest.coordinates,
          requestedBy: 'rider',
          estimatedAdditionalCost: stopRequest.estimatedAdditionalCost,
        });
        setShowStopRequestModal(true);
      }
    }
  }, [(currentTrip as any)?.pendingStopRequest]);

  // Track if driver has been notified of declined stop to prevent repeated alerts
  const hasNotifiedDeclinedStop = useRef(false);

  // Listen for driver-initiated stop request being declined by rider
  useEffect(() => {
    if (!currentTrip) return;

    const tripData = currentTrip as any;
    const stopRequest = tripData.pendingStopRequest;

    // Check if this is a driver-initiated stop that was declined by the rider
    if (
      stopRequest?.requestedBy === 'driver' &&
      stopRequest?.status === 'declined' &&
      !hasNotifiedDeclinedStop.current
    ) {
      hasNotifiedDeclinedStop.current = true;
      console.log('❌ Rider declined driver stop request:', stopRequest.address);

      Alert.alert(
        'Stop Request Declined',
        `The rider has declined your request to add a stop at ${stopRequest.placeName || stopRequest.address}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset the notification flag after some time to allow future notifications
              setTimeout(() => {
                hasNotifiedDeclinedStop.current = false;
              }, 5000);
            },
          },
        ]
      );
    }

    // Reset notification flag when there's no pending stop request or it's a new request
    if (!stopRequest || stopRequest.status === 'pending') {
      hasNotifiedDeclinedStop.current = false;
    }
  }, [(currentTrip as any)?.pendingStopRequest?.status]);

  // Handle route deviation - trigger recalculation when hook signals it
  useEffect(() => {
    if (routeDeviation.shouldRecalculateRoute && currentLocation && activeRide && !isRecalculatingRoute) {
      console.log('🔄 Route deviation detected, recalculating route...');
      setIsRecalculatingRoute(true);

      fetchRoute(currentLocation, {
        latitude: activeRide.destination.lat,
        longitude: activeRide.destination.lng,
      }, (currentTrip as any)?.stops)
        .then(() => {
          routeDeviation.acknowledgeRouteRecalculation();
        })
        .catch((error) => {
          console.error('Failed to recalculate route:', error);
        })
        .finally(() => {
          setIsRecalculatingRoute(false);
        });
    }
  }, [routeDeviation.shouldRecalculateRoute, currentLocation, activeRide, isRecalculatingRoute]);

  // Handle route deviation - recalculate route when driver goes off route
  const handleRouteDeviation = async (distanceFromRoute: number) => {
    const now = Date.now();

    // Check cooldown to prevent excessive API calls
    if (now - lastRouteRecalculation.current < ROUTE_RECALC_COOLDOWN) {
      return;
    }

    // Only recalculate if significantly off route (more than 100 meters)
    if (distanceFromRoute > 100 && currentLocation && activeRide && !isRecalculatingRoute) {
      console.log(`🔄 Driver deviated ${distanceFromRoute.toFixed(0)}m from route, recalculating...`);
      lastRouteRecalculation.current = now;
      setIsRecalculatingRoute(true);

      try {
        await fetchRoute(currentLocation, {
          latitude: activeRide.destination.lat,
          longitude: activeRide.destination.lng,
        });
      } catch (error) {
        console.error('Failed to recalculate route:', error);
      } finally {
        setIsRecalculatingRoute(false);
      }
    }
  };

  // Trip timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - tripStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [tripStartTime]);

  // Fetch route from Google Directions API (with optional stops as waypoints)
  const fetchRoute = async (
    origin: RouteCoordinate,
    destination: RouteCoordinate,
    stops?: Array<{ coordinates: { latitude: number; longitude: number }; completed?: boolean }>
  ) => {
    if (!GOOGLE_DIRECTIONS_API_KEY) {
      console.error('❌ Google Directions API key not configured');
      return;
    }

    try {
      // Use traffic-aware routing for accurate ETA (best practice from Google Routes API docs)
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      // Add waypoints for uncompleted stops
      if (stops && stops.length > 0) {
        const waypointsStr = stops
          .filter(stop => !stop.completed)
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
        const leg = route.legs[0];

        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        // Set planned route for deviation monitoring
        routeDeviation.setPlannedRoute(points);
        routeDeviation.setDestination(destination);

        // Set ETA from Google (accurate, traffic-aware) and distance
        const googleEtaMinutes = Math.ceil(leg.duration.value / 60);
        setGoogleEta(googleEtaMinutes);
        setEta(googleEtaMinutes);
        setDistance(leg.distance.value / 1000);
        lastEtaRefresh.current = Date.now();

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

        // Fetch route to destination (include stops from currentTrip)
        await fetchRoute(
          initialLocation,
          {
            latitude: activeRide.destination.lat,
            longitude: activeRide.destination.lng,
          },
          (currentTrip as any)?.stops
        );

        // Start watching position - faster updates for smoother navigation
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 500, // Update every 500ms for very smooth following
            distanceInterval: 3, // Update every 3 meters for responsive navigation
          },
          async (loc) => {
            const { latitude, longitude, heading, speed } = loc.coords;
            setCurrentLocation({ latitude, longitude });

            // Update heading for car rotation
            if (heading !== null && heading >= 0) {
              setCurrentHeading(heading);
            }

            // Auto-follow camera with heading orientation (like Google Maps navigation)
            // Best practice: Match animation duration to update interval for seamless movement
            const now = Date.now();
            if (isAutoFollowEnabled && mapRef.current && now - lastCameraUpdate.current >= CAMERA_UPDATE_INTERVAL) {
              lastCameraUpdate.current = now;
              mapRef.current.animateCamera(
                {
                  center: { latitude, longitude },
                  heading: heading || 0,
                  pitch: 50, // More tilted for better road view
                  zoom: 18, // Closer zoom for navigation
                },
                { duration: CAMERA_UPDATE_INTERVAL } // Match update interval for smooth transitions
              );
            }

            // Record route history for safety/investigation purposes
            addRouteHistoryPoint({ latitude, longitude });

            // Update current speed (in m/s from GPS)
            if (speed !== null && speed >= 0) {
              setCurrentSpeed(speed);
              // Update speed monitor with smoothing and limit checking
              await speedMonitor.updateSpeed(speed, latitude, longitude);
            }

            // Check for route deviation
            await routeDeviation.checkLocation({ latitude, longitude });

            // Update driver location
            updateLocation({
              lat: latitude,
              lng: longitude,
              heading: heading || 0,
              speed: speed || 0,
            });

            // Update Firebase (throttled to reduce network usage)
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

            // Recalculate distance locally
            const distanceToDestination = calculateDistance(
              latitude,
              longitude,
              activeRide.destination.lat,
              activeRide.destination.lng
            );
            setDistance(distanceToDestination);

            // Refresh ETA from Google periodically (every 30 seconds) for accuracy
            if (now - lastEtaRefresh.current >= ETA_REFRESH_INTERVAL) {
              fetchRoute(
                { latitude, longitude },
                { latitude: activeRide.destination.lat, longitude: activeRide.destination.lng },
                (currentTrip as any)?.stops
              );
            }
          }
        );

        // Set initial camera immediately after getting location
        if (mapRef.current && !isInitialCameraSet) {
          setIsInitialCameraSet(true);
          mapRef.current.animateCamera(
            {
              center: initialLocation,
              heading: 0,
              pitch: 50,
              zoom: 18,
            },
            { duration: 500 }
          );
        }
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

  // Handle approving a stop request from rider
  const handleApproveStopRequest = async () => {
    if (!pendingStopRequest || !activeRide?.id) return;

    try {
      // Import updateTrip from trip store
      const { updateTrip } = useTripStore.getState();

      // Update trip with approved stop and new price
      const additionalCost = pendingStopRequest.estimatedAdditionalCost || 0;
      await updateTrip(activeRide.id, {
        pendingStopRequest: {
          ...pendingStopRequest,
          status: 'approved',
          approvedAt: new Date(),
        },
        // Add stop to the trip's stops array
        stops: [
          ...(currentTrip as any)?.stops || [],
          {
            address: pendingStopRequest.address,
            placeName: pendingStopRequest.placeName,
            coordinates: pendingStopRequest.coordinates,
            addedBy: 'rider',
            approvedAt: new Date(),
          },
        ],
        // Update the estimated cost
        estimatedCost: ((currentTrip as any)?.estimatedCost || 0) + additionalCost,
      });

      Alert.alert(
        'Stop Approved',
        `The stop at ${pendingStopRequest.placeName || pendingStopRequest.address} has been added.${
          additionalCost > 0 ? ` Fare increased by $${additionalCost.toFixed(2)}.` : ''
        }`,
        [{ text: 'OK' }]
      );

      setPendingStopRequest(null);
      setShowStopRequestModal(false);
    } catch (error) {
      console.error('Failed to approve stop:', error);
      Alert.alert('Error', 'Failed to approve stop request. Please try again.');
    }
  };

  // Handle declining a stop request from rider
  const handleDeclineStopRequest = async () => {
    if (!pendingStopRequest || !activeRide?.id) return;

    try {
      const { updateTrip } = useTripStore.getState();

      await updateTrip(activeRide.id, {
        pendingStopRequest: {
          ...pendingStopRequest,
          status: 'declined',
          declinedAt: new Date(),
        },
      });

      Alert.alert(
        'Stop Declined',
        'The rider has been notified that the stop request was declined.',
        [{ text: 'OK' }]
      );

      setPendingStopRequest(null);
      setShowStopRequestModal(false);
    } catch (error) {
      console.error('Failed to decline stop:', error);
      Alert.alert('Error', 'Failed to decline stop request. Please try again.');
    }
  };

  const handleCenterMap = () => {
    if (currentLocation && mapRef.current) {
      // Re-enable auto-follow and center with navigation view
      setIsAutoFollowEnabled(true);
      mapRef.current.animateCamera(
        {
          center: currentLocation,
          heading: currentHeading,
          pitch: 45,
          zoom: 17,
        },
        { duration: 500 }
      );
    }
  };

  // Handle navigation when no active ride - must be in useEffect to avoid setState during render
  useEffect(() => {
    if (!activeRide) {
      router.replace('/(driver)/tabs');
    }
  }, [activeRide, router]);

  // Show loading while redirecting if no active ride
  if (!activeRide) {
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
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        followsUserLocation={false}
        onPanDrag={() => {
          // Disable auto-follow when user manually pans the map
          if (isAutoFollowEnabled) {
            setIsAutoFollowEnabled(false);
          }
        }}
      >
        {/* Driver Car Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={currentHeading}
          >
            <CarMarker size="medium" />
          </Marker>
        )}

        {/* Stop Markers */}
        {(currentTrip as any)?.stops?.map((stop: any, index: number) => (
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

        {/* Route Polyline with Progress Tracking */}
        {routeCoordinates.length > 0 && (
          <ProgressivePolyline
            routeCoordinates={routeCoordinates}
            currentLocation={currentLocation}
            remainingColor={Colors.primary}
            traveledColor={Colors.gray[400]}
            strokeWidth={3}
            onRouteDeviation={handleRouteDeviation}
            deviationThreshold={100}
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

      {/* Stats Pills with Color-Coded Speed */}
      <View style={styles.statsPillContainer}>
        {/* Speed Pill - Color coded based on limit */}
        <View style={[styles.statPill, { backgroundColor: speedMonitor.speedColor + '20', borderColor: speedMonitor.speedColor, borderWidth: 2 }]}>
          <Ionicons name="speedometer" size={16} color={speedMonitor.speedColor} />
          <Text style={[styles.statPillText, { color: speedMonitor.speedColor, fontWeight: '700' }]}>
            {speedMonitor.currentSpeed} mph
          </Text>
        </View>
        {/* Speed Limit Pill */}
        {speedMonitor.speedLimit && (
          <View style={styles.statPillLimit}>
            <Text style={styles.limitText}>LIMIT</Text>
            <Text style={styles.limitValue}>{speedMonitor.speedLimit}</Text>
          </View>
        )}
        <View style={styles.statPill}>
          <Ionicons name="time-outline" size={16} color={Colors.gray[600]} />
          <Text style={styles.statPillText}>{formatTime(elapsed)}</Text>
        </View>
        <View style={[styles.statPill, styles.statPillPrimary]}>
          <Text style={styles.etaTime}>{eta ?? '--'}</Text>
          <Text style={styles.etaUnit}>min</Text>
        </View>
      </View>

      {/* Map Controls - Center/Follow button only */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={[
            styles.mapControlButton,
            isAutoFollowEnabled && styles.mapControlButtonActive
          ]}
          onPress={handleCenterMap}
        >
          <Ionicons
            name={isAutoFollowEnabled ? "navigate-circle" : "locate"}
            size={22}
            color={isAutoFollowEnabled ? Colors.white : Colors.gray[700]}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: bottomInset }]}>
        <View style={styles.bottomSheetSafeArea}>
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
                {(activeRide as any).riderPhoto ? (
                  <Image
                    source={{ uri: (activeRide as any).riderPhoto }}
                    style={styles.riderPhoto}
                  />
                ) : (
                  <View style={styles.riderAvatar}>
                    <Ionicons name="person" size={24} color={Colors.primary} />
                  </View>
                )}
                <View style={styles.riderInfo}>
                  <Text style={styles.riderName}>{activeRide.riderName}</Text>
                  <Text style={styles.tripStatus}>Trip in progress</Text>
                </View>
              </View>

              {/* Stops (if any) */}
              {(currentTrip as any)?.stops && (currentTrip as any).stops.length > 0 && (
                <View style={styles.stopsSection}>
                  {(currentTrip as any).stops.map((stop: any, index: number) => (
                    <View key={`stop-card-${index}`} style={styles.stopCard}>
                      <View style={styles.stopDot}>
                        <Text style={styles.stopDotText}>{index + 1}</Text>
                      </View>
                      <View style={styles.stopInfoCard}>
                        <Text style={styles.stopLabel}>STOP {index + 1}</Text>
                        <Text style={styles.stopAddress} numberOfLines={2}>
                          {stop.placeName || stop.address}
                        </Text>
                      </View>
                      {stop.completed && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      )}
                    </View>
                  ))}
                </View>
              )}

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
        </View>
      </Animated.View>

      {/* Stop Request Modal (when rider requests a stop) */}
      <Modal
        visible={showStopRequestModal && pendingStopRequest !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStopRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stopRequestModal}>
            <View style={styles.stopRequestIconContainer}>
              <Ionicons name="location" size={40} color={Colors.primary} />
            </View>

            <Text style={styles.stopRequestTitle}>Rider Requested a Stop</Text>

            <Text style={styles.stopRequestAddress}>
              {pendingStopRequest?.placeName || pendingStopRequest?.address}
            </Text>

            {pendingStopRequest?.estimatedAdditionalCost && pendingStopRequest.estimatedAdditionalCost > 0 && (
              <View style={styles.additionalCostContainer}>
                <Text style={styles.additionalCostLabel}>Additional Fare</Text>
                <Text style={styles.additionalCostValue}>
                  +${pendingStopRequest.estimatedAdditionalCost.toFixed(2)}
                </Text>
              </View>
            )}

            <Text style={styles.stopRequestMessage}>
              The rider would like to add this stop to the trip. Do you approve?
            </Text>

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
          </View>
        </View>
      </Modal>

      {/* Speed Warning Modal */}
      <SpeedWarningModal
        visible={speedMonitor.shouldShowWarning}
        currentSpeed={speedMonitor.currentSpeed}
        speedLimit={speedMonitor.speedLimit || 0}
        tripId={activeRide?.id}
        driverId={user?.id}
        onDismiss={speedMonitor.dismissWarning}
      />

      {/* Route Deviation "Are you OK?" Modal */}
      <RouteDeviationModal
        visible={routeDeviation.shouldShowAlert}
        deviationDistance={routeDeviation.deviationDistance}
        onOkay={() => routeDeviation.handleAlertResponse('okay')}
        onSOS={() => routeDeviation.handleAlertResponse('sos')}
      />

      {/* Rider Slow Down Request Modal */}
      <DriverSlowDownRequestModal
        visible={showDriverSlowDownRequest}
        riderName={slowDownRequestFrom || 'Rider'}
        tripId={activeRide?.id || ''}
        currentSpeed={speedState.currentSpeed}
        speedLimit={speedState.currentSpeedLimit || 0}
        onAcknowledge={dismissDriverSlowDownRequest}
      />
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
  statPillLimit: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6B7280',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  limitText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
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
  mapControlButtonActive: {
    backgroundColor: Colors.primary,
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

  // Stop Marker
  stopMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.md,
  },
  stopMarkerText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Stops Section in Bottom Sheet
  stopsSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    paddingBottom: 8,
    marginBottom: 8,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stopDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stopDotText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  stopInfoCard: {
    flex: 1,
  },
  stopLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stopAddress: {
    fontSize: 14,
    color: Colors.gray[700],
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
  bottomSheetSafeArea: {
    flex: 1,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    minHeight: 48,
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
    paddingBottom: 8, // Extra padding for button to be above nav bar
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
    paddingBottom: 16, // Extra padding for action buttons to be above nav bar
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
  riderPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
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

  // Stop Request Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
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
    backgroundColor: Colors.primary + '15',
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
    backgroundColor: '#DCFCE7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  additionalCostLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  additionalCostValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
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
    backgroundColor: Colors.primary,
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
