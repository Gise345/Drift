/**
 * Navigate to Pickup Screen
 * Professional navigation UI similar to Uber/Google Maps
 *
 * Features:
 * - Real-time route polyline from Google Directions API
 * - Minimizable bottom sheet
 * - Turn-by-turn navigation hints
 * - Live ETA and distance updates
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
  Modal,
  ActivityIndicator,
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
import { updateDriverArrivalStatus } from '@/src/services/ride-request.service';
import { initializeMessaging } from '@/src/services/messaging.service';
import { ProgressivePolyline } from '@/components/map/ProgressivePolyline';
import { ChatModal, ChatButton } from '@/components/messaging';
import { useSpeedMonitor } from '@/src/hooks/useSpeedMonitor';
import { SpeedWarningModal } from '@/components/driver/SpeedWarningModal';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.45;
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

export default function NavigateToPickup() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const { activeRide, updateLocation, arrivedAtPickup, setActiveRide } = useDriverStore();
  const { updateDriverLocation, subscribeToTrip } = useTripStore();
  const { user } = useAuthStore();

  // Speed monitoring hook
  const speedMonitor = useSpeedMonitor(activeRide?.id || null, user?.id || null);

  // State
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [allSteps, setAllSteps] = useState<NavigationStep[]>([]);
  const [currentLocation, setCurrentLocation] = useState<RouteCoordinate | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [isSheetMinimized, setIsSheetMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculatingRoute, setIsRecalculatingRoute] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isAutoFollowEnabled, setIsAutoFollowEnabled] = useState(true);
  const [showPaymentWaitingModal, setShowPaymentWaitingModal] = useState(false);
  const [paymentTimeRemaining, setPaymentTimeRemaining] = useState<number | null>(null); // Calculated from acceptedAt
  const paymentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const paymentStartTimeRef = useRef<Date | null>(null); // Track when payment waiting started
  const PAYMENT_TIMEOUT_SECONDS = 120; // 2 minutes to match rider's timeout
  const lastRouteRecalculation = useRef<number>(0);
  const messagingInitializedRef = useRef(false);
  const hasHandledCancellationRef = useRef(false);
  const lastCameraUpdate = useRef<number>(0);
  const ROUTE_RECALC_COOLDOWN = 10000; // 10 seconds between recalculations
  const CAMERA_UPDATE_INTERVAL = 500; // Update camera every 500ms for smooth following

  // Animation
  const sheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MAX_HEIGHT)).current;

  // Debug: Track activeRide changes to identify white screen cause
  useEffect(() => {
    console.log('🔍 [navigate-to-pickup] activeRide changed:', activeRide ? {
      id: activeRide.id,
      status: activeRide.status,
      riderName: activeRide.riderName,
    } : 'NULL');

    if (!activeRide) {
      console.warn('⚠️ [navigate-to-pickup] activeRide is NULL - this will show error state!');
      console.trace('Stack trace for NULL activeRide:');
    }
  }, [activeRide]);

  // Subscribe to trip updates to detect rider cancellation
  useEffect(() => {
    if (!activeRide?.id) {
      console.log('⏭️ [navigate-to-pickup] Skipping trip subscription - no activeRide.id');
      return;
    }

    console.log('📡 [navigate-to-pickup] Subscribing to trip:', activeRide.id);
    const unsubscribe = subscribeToTrip(activeRide.id);

    return () => {
      console.log('🔌 [navigate-to-pickup] Unsubscribing from trip:', activeRide.id);
      unsubscribe();
    };
  }, [activeRide?.id]);

  // Listen for trip status changes (e.g., rider cancellation)
  const { currentTrip } = useTripStore();

  useEffect(() => {
    if (!currentTrip) {
      return;
    }

    // Prevent duplicate handling
    if (hasHandledCancellationRef.current) {
      return;
    }

    // Only process if this trip matches our active ride
    if (activeRide?.id && currentTrip.id !== activeRide.id) {
      return;
    }

    // If trip was cancelled by rider
    if (currentTrip.status === 'CANCELLED') {
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

  // Handle AWAITING_PAYMENT status - show waiting modal until rider pays
  useEffect(() => {
    if (!currentTrip) return;

    if (currentTrip.status === 'AWAITING_PAYMENT') {
      // Rider needs to complete payment - show waiting modal
      setShowPaymentWaitingModal(true);
      console.log('💳 Waiting for rider to complete payment...');

      // Calculate remaining time based on acceptedAt timestamp
      // This ensures timer persists even if driver closes and reopens the app
      const acceptedAt = currentTrip.acceptedAt;
      if (acceptedAt) {
        const acceptedTime = acceptedAt instanceof Date ? acceptedAt : new Date(acceptedAt);
        paymentStartTimeRef.current = acceptedTime;
        const elapsed = Math.floor((Date.now() - acceptedTime.getTime()) / 1000);
        const remaining = Math.max(0, PAYMENT_TIMEOUT_SECONDS - elapsed);
        setPaymentTimeRemaining(remaining);
        console.log('⏱️ Payment timer: elapsed', elapsed, 'seconds, remaining', remaining, 'seconds');
      } else {
        // Fallback if no acceptedAt - start fresh
        paymentStartTimeRef.current = new Date();
        setPaymentTimeRemaining(PAYMENT_TIMEOUT_SECONDS);
      }
    } else if (currentTrip.status === 'DRIVER_ARRIVING') {
      // Payment completed - hide modal and proceed
      if (showPaymentWaitingModal) {
        setShowPaymentWaitingModal(false);
        setPaymentTimeRemaining(null);
        console.log('✅ Rider completed payment - proceeding to pickup');
      }
    }
  }, [currentTrip?.status, currentTrip?.acceptedAt]);

  // Payment countdown timer - syncs with actual elapsed time
  useEffect(() => {
    if (showPaymentWaitingModal && paymentTimeRemaining !== null && paymentTimeRemaining > 0) {
      // Start countdown when modal shows and we have a valid time
      paymentTimerRef.current = setInterval(() => {
        // Calculate remaining time from the original start time for accuracy
        if (paymentStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - paymentStartTimeRef.current.getTime()) / 1000);
          const remaining = Math.max(0, PAYMENT_TIMEOUT_SECONDS - elapsed);
          setPaymentTimeRemaining(remaining);

          if (remaining <= 0) {
            // Timer expired - rider should have cancelled by now
            if (paymentTimerRef.current) {
              clearInterval(paymentTimerRef.current);
            }
          }
        }
      }, 1000);

      return () => {
        if (paymentTimerRef.current) {
          clearInterval(paymentTimerRef.current);
        }
      };
    } else if (!showPaymentWaitingModal) {
      // Clear timer when modal closes
      if (paymentTimerRef.current) {
        clearInterval(paymentTimerRef.current);
      }
    }
  }, [showPaymentWaitingModal, paymentTimeRemaining !== null]);

  // Format time for display
  const formatPaymentTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize messaging when driver accepts ride
  useEffect(() => {
    if (activeRide?.id && user?.id && !messagingInitializedRef.current) {
      messagingInitializedRef.current = true;
      const driverName = user.name || user.email?.split('@')[0] || 'Driver';
      initializeMessaging(activeRide.id, driverName).catch((error) => {
        console.error('Failed to initialize messaging:', error);
      });
    }
  }, [activeRide?.id, user?.id]);

  // Handle route deviation - recalculate route when driver goes off route
  const handleRouteDeviation = async (distanceFromRoute: number) => {
    const now = Date.now();

    // Check cooldown to prevent excessive API calls
    if (now - lastRouteRecalculation.current < ROUTE_RECALC_COOLDOWN) {
      return;
    }

    // Only recalculate if significantly off route (more than 100 meters)
    if (distanceFromRoute > 100 && currentLocation && activeRide && !isRecalculatingRoute) {
      lastRouteRecalculation.current = now;
      setIsRecalculatingRoute(true);

      try {
        await fetchRoute(currentLocation, {
          latitude: activeRide.pickup.lat,
          longitude: activeRide.pickup.lng,
        });
      } catch (error) {
        console.error('Failed to recalculate route:', error);
      } finally {
        setIsRecalculatingRoute(false);
      }
    }
  };

  // Fetch route from Google Directions API
  const fetchRoute = async (
    origin: RouteCoordinate,
    destination: RouteCoordinate
  ) => {
    if (!GOOGLE_DIRECTIONS_API_KEY) {
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
        setEta(Math.ceil(leg.duration.value / 60)); // Convert seconds to minutes
        setDistance(leg.distance.value / 1000); // Convert meters to km

        // Parse navigation steps
        const steps: NavigationStep[] = leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: step.distance.text,
          duration: step.duration.text,
          maneuver: step.maneuver,
        }));
        setAllSteps(steps);
        if (steps.length > 0) {
          setCurrentStep(steps[0]);
        }

        // Fit map to show both points
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [origin, destination],
            {
              edgePadding: { top: 100, right: 50, bottom: BOTTOM_SHEET_MAX_HEIGHT + 50, left: 50 },
              animated: true,
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
    } finally {
      setIsLoading(false);
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

        // IMPORTANT: Only update to DRIVER_ARRIVING if not in AWAITING_PAYMENT status
        // When using the new payment flow, the trip starts as AWAITING_PAYMENT
        // and should only change to DRIVER_ARRIVING after rider completes payment
        // The status will be updated by the complete-payment screen on the rider side
        //
        // Fetch current trip status from Firestore to ensure we have the latest
        const tripData = await useTripStore.getState().getTrip(activeRide.id);
        const currentStatus = tripData?.status;
        console.log('📋 Current trip status:', currentStatus);

        // Handle case where trip fetch failed (network error, etc.)
        if (!tripData) {
          console.warn('⚠️ Could not fetch trip data - showing payment modal as fallback');
          // Default to showing payment modal - rider can cancel if wrong
          setShowPaymentWaitingModal(true);
        } else if (currentStatus === 'AWAITING_PAYMENT') {
          console.log('💳 Trip is AWAITING_PAYMENT - waiting for rider to complete payment');
          setShowPaymentWaitingModal(true);
        } else if (currentStatus === 'CANCELLED') {
          // Trip was already cancelled - don't proceed
          console.log('🚫 Trip is CANCELLED - redirecting to home');
          setActiveRide(null);
          Alert.alert('Trip Cancelled', 'This trip has been cancelled.', [
            { text: 'OK', onPress: () => router.replace('/(driver)/tabs') }
          ]);
          return;
        } else if (currentStatus !== 'DRIVER_ARRIVING' && currentStatus !== 'DRIVER_ARRIVED') {
          // Only update status if NOT waiting for payment and not already in a later status
          console.log('🚗 Updating status to DRIVER_ARRIVING');
          try {
            await updateDriverArrivalStatus(activeRide.id, 'DRIVER_ARRIVING');
          } catch (updateError) {
            console.error('❌ Failed to update arrival status:', updateError);
            // Continue anyway - the subscription will sync the status
          }
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

        // Fetch route to pickup
        await fetchRoute(initialLocation, {
          latitude: activeRide.pickup.lat,
          longitude: activeRide.pickup.lng,
        });

        // Start watching position - faster updates for smoother navigation
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000, // Update every 1 second for smooth following
            distanceInterval: 5, // Update every 5 meters for responsive navigation
          },
          async (loc) => {
            try {
              // CRITICAL: Check if activeRide is still valid at the start of callback
              // This prevents crashes if activeRide becomes null during async operations
              const currentRide = useDriverStore.getState().activeRide;
              if (!currentRide) {
                console.log('⚠️ Location callback: activeRide is null, skipping update');
                return;
              }

              const { latitude, longitude, heading, speed } = loc.coords;
            const newLocation = { latitude, longitude };
            setCurrentLocation(newLocation);

            // Update heading for car rotation
            if (heading !== null && heading >= 0) {
              setCurrentHeading(heading);
            }

            // Auto-follow camera with heading orientation (like Google Maps navigation)
            const now = Date.now();
            if (isAutoFollowEnabled && mapRef.current && now - lastCameraUpdate.current >= CAMERA_UPDATE_INTERVAL) {
              lastCameraUpdate.current = now;
              mapRef.current.animateCamera(
                {
                  center: { latitude, longitude },
                  heading: heading || 0,
                  pitch: 45, // Tilted view for navigation
                  zoom: 17, // Close zoom for navigation
                },
                { duration: 500 } // Smooth 500ms animation
              );
            }

            // Update driver location in store
            updateLocation({
              lat: latitude,
              lng: longitude,
              heading: heading || 0,
              speed: speed || 0,
            });

            // Update Firebase with privacy-aware broadcasting
            // Pass pickup coordinates so the store can check if privacy delay should apply
            if (currentRide.id && currentRide.pickup) {
              updateDriverLocation(
                currentRide.id,
                {
                  latitude,
                  longitude,
                  timestamp: new Date(),
                  accuracy: loc.coords.accuracy,
                  speed: speed || 0,
                  heading: heading || 0,
                },
                {
                  latitude: currentRide.pickup.lat,
                  longitude: currentRide.pickup.lng,
                }
              );
            }

            // Recalculate distance (straight line for display)
            if (!currentRide.pickup) return;

            const distanceToPickup = calculateDistance(
              latitude,
              longitude,
              currentRide.pickup.lat,
              currentRide.pickup.lng
            );
            setDistance(distanceToPickup);

            // Fetch accurate ETA from Google Directions API every 10 seconds
            // Only do this if significant movement has occurred
            const currentTime = Date.now();
            if (currentTime - lastRouteRecalculation.current >= 10000) {
              lastRouteRecalculation.current = currentTime;
              try {
                const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${latitude},${longitude}&destination=${currentRide.pickup.lat},${currentRide.pickup.lng}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.status === 'OK' && data.routes.length > 0) {
                  const leg = data.routes[0].legs[0];
                  // Use Google's accurate duration calculation
                  setEta(Math.ceil(leg.duration.value / 60));
                  // Use Google's accurate distance
                  setDistance(leg.distance.value / 1000);
                }
              } catch (error) {
                // Fallback to simple calculation if API fails
                const avgSpeed = 30; // km/h fallback
                const newEta = (distanceToPickup / avgSpeed) * 60;
                setEta(Math.ceil(newEta));
              }
            }
            } catch (error) {
              // Catch any unexpected errors in the location callback to prevent crashes
              console.error('❌ Error in location callback:', error);
            }
          }
        );
      } catch (error) {
        console.error('Failed to start tracking:', error);
        setIsLoading(false);
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
    const { lat, lng } = activeRide.pickup;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleArrived = async () => {
    if (!activeRide) return;

    try {
      await updateDriverArrivalStatus(activeRide.id, 'DRIVER_ARRIVED');
      arrivedAtPickup();
      router.push('/(driver)/active-ride/arrived-at-pickup');
    } catch (error) {
      console.error('Failed to update arrival:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Ride?', 'Are you sure you want to cancel this ride?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => router.push('/(driver)/active-ride/cancel-ride'),
      },
    ]);
  };

  // Call button removed for safety - use in-app messaging instead
  // Phone numbers are not shared between riders and drivers for privacy

  const handleMessageRider = () => {
    if (!activeRide) return;
    setShowChatModal(true);
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

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: activeRide.pickup.lat,
          longitude: activeRide.pickup.lng,
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
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#4285F4', borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 3 }} />
          </Marker>
        )}

        {/* Pickup Marker */}
        <Marker
          coordinate={{
            latitude: activeRide.pickup.lat,
            longitude: activeRide.pickup.lng,
          }}
          title={activeRide.riderName}
          description="Pickup Location"
        >
          <View style={styles.pickupMarker}>
            <View style={styles.pickupMarkerInner}>
              <Ionicons name="person" size={16} color={Colors.white} />
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

      {/* ETA Pill */}
      <View style={styles.etaPill}>
        <Text style={styles.etaTime}>{eta ?? '--'}</Text>
        <Text style={styles.etaUnit}>min</Text>
        <View style={styles.etaDivider} />
        <Text style={styles.etaDistance}>{distance?.toFixed(1) ?? '--'} km</Text>
      </View>

      {/* Map Controls */}
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
        <TouchableOpacity style={styles.mapControlButton} onPress={handleOpenMaps}>
          <Ionicons name="navigate" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 20) }]}>
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
            <View style={styles.riderAvatarSmall}>
              <Ionicons name="person" size={20} color={Colors.primary} />
            </View>
            <View style={styles.minimizedInfo}>
              <Text style={styles.minimizedName}>{activeRide.riderName}</Text>
              <Text style={styles.minimizedAddress} numberOfLines={1}>
                {activeRide.pickup.address}
              </Text>
            </View>
            <TouchableOpacity style={styles.arrivedButtonSmall} onPress={handleArrived}>
              <Text style={styles.arrivedButtonSmallText}>Arrived</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Expanded View */
          <View style={styles.expandedContent}>
            {/* Rider Card */}
            <View style={styles.riderCard}>
              <View style={styles.riderAvatar}>
                <Ionicons name="person" size={28} color={Colors.primary} />
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{activeRide.riderName}</Text>
                <View style={styles.riderRating}>
                  <Ionicons name="star" size={14} color={Colors.rating} />
                  <Text style={styles.ratingText}>{activeRide.riderRating}</Text>
                </View>
              </View>
              {/* Message button only - call removed for safety */}
              <TouchableOpacity style={styles.contactButton} onPress={handleMessageRider}>
                <Ionicons name="chatbubble-ellipses" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Pickup Location */}
            <View style={styles.locationCard}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {activeRide.pickup.address}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Ionicons name="close" size={20} color={Colors.error} />
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.arrivedButton} onPress={handleArrived}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                <Text style={styles.arrivedText}>I've Arrived</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Chat Modal */}
      {activeRide && user && (
        <ChatModal
          visible={showChatModal}
          tripId={activeRide.id}
          userId={user.id}
          userName={user.name || user.email?.split('@')[0] || 'Driver'}
          userPhoto={user.photoURL}
          userType="driver"
          otherUserName={activeRide.riderName}
          onClose={() => setShowChatModal(false)}
          isEnabled={true}
        />
      )}

      {/* Payment Waiting Modal - shown while waiting for rider to complete payment */}
      <Modal
        visible={showPaymentWaitingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          Alert.alert(
            'Cancel Ride?',
            'The rider is completing payment. Are you sure you want to cancel?',
            [
              { text: 'Keep Waiting', style: 'cancel' },
              { text: 'Cancel Ride', style: 'destructive', onPress: handleCancel }
            ]
          );
        }}
      >
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentWaitingCard}>
            <View style={styles.paymentWaitingIconContainer}>
              <Ionicons name="card-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.paymentWaitingTitle}>Waiting for Payment</Text>
            <Text style={styles.paymentWaitingDescription}>
              {activeRide?.riderName || 'The rider'} is completing their payment.
            </Text>

            {/* Timer Display */}
            <View style={styles.paymentTimerContainer}>
              <Ionicons
                name="time-outline"
                size={20}
                color={paymentTimeRemaining !== null && paymentTimeRemaining <= 60 ? Colors.error : Colors.gray[500]}
              />
              <Text style={[
                styles.paymentTimerText,
                paymentTimeRemaining !== null && paymentTimeRemaining <= 60 && styles.paymentTimerWarning
              ]}>
                {paymentTimeRemaining === null
                  ? 'Calculating time...'
                  : paymentTimeRemaining > 0
                    ? `Time remaining: ${formatPaymentTime(paymentTimeRemaining)}`
                    : 'Payment timeout - ride will be cancelled'}
              </Text>
            </View>

            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 16 }} />

            <TouchableOpacity
              style={styles.paymentCancelButton}
              onPress={() => {
                Alert.alert(
                  'Cancel Ride?',
                  'The rider is completing payment. Are you sure you want to cancel?',
                  [
                    { text: 'Keep Waiting', style: 'cancel' },
                    { text: 'Cancel Ride', style: 'destructive', onPress: handleCancel }
                  ]
                );
              }}
            >
              <Text style={styles.paymentCancelText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // ETA Pill
  etaPill: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    ...Shadows.md,
  },
  etaTime: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  etaUnit: {
    fontSize: 14,
    color: Colors.gray[600],
    marginLeft: 4,
  },
  etaDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.gray[300],
    marginHorizontal: 12,
  },
  etaDistance: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
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

  // Pickup Marker
  pickupMarker: {
    alignItems: 'center',
  },
  pickupMarkerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
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
  },
  riderAvatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
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
    color: Colors.black,
  },
  minimizedAddress: {
    fontSize: 13,
    color: Colors.gray[600],
    marginTop: 2,
  },
  arrivedButtonSmall: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  arrivedButtonSmallText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Expanded Content
  expandedContent: {
    paddingHorizontal: 20,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  riderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  riderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.gray[700],
    marginLeft: 4,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.success,
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
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  arrivedButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  arrivedText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.gray[600],
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Payment Waiting Modal
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentWaitingCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...Shadows.xl,
  },
  paymentWaitingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  paymentWaitingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  paymentWaitingDescription: {
    fontSize: 15,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  paymentTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    gap: 8,
  },
  paymentTimerText: {
    fontSize: 14,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  paymentTimerWarning: {
    color: Colors.error,
    fontWeight: '600',
  },
  paymentCancelButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  paymentCancelText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
