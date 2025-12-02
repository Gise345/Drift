import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Region, LatLng } from 'react-native-maps';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { detectZone } from '@/src/utils/pricing/drift-zone-utils';

/**
 * SELECT DESTINATION SCREEN - ULTIMATE FIX v2
 * 
 * FIXES APPLIED:
 * ✅ Visible route polyline (double layer with shadow)
 * ✅ Custom markers with labels  
 * ✅ Distance in MILES (accurate from Google API)
 * ✅ Map auto-pans to show full route
 * ✅ Removed unnecessary mapReady state
 * ✅ Simplified - no extra components needed
 */

// Google Directions API Key
const GOOGLE_DIRECTIONS_API_KEY = 
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

const SelectDestinationScreen = () => {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const {
    pickupLocation,
    destination,
    stops,
    setPickupLocation,
    setDestination,
    setStops,
    route: cachedRoute,
    setRoute
  } = useCarpoolStore();

  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [region, setRegion] = useState<Region | null>(null);
  const [showPolyline, setShowPolyline] = useState(false); // Control polyline visibility
  
  const mapRef = useRef<MapView>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Parse params and set in store - ONLY RUN ONCE
  useEffect(() => {
    let parsedPickup = null;
    let parsedDestination = null;

    // Parse pickup
    if (params.pickup && typeof params.pickup === 'string') {
      try {
        parsedPickup = JSON.parse(params.pickup);
        console.log('✅ Parsed pickup:', parsedPickup);
        setPickupLocation(parsedPickup);
      } catch (e) {
        console.error('❌ Failed to parse pickup:', e);
      }
    } else if (pickupLocation) {
      parsedPickup = pickupLocation;
    }

    // Parse destination
    if (params.destination && typeof params.destination === 'string') {
      try {
        parsedDestination = JSON.parse(params.destination);
        console.log('✅ Parsed destination:', parsedDestination);
        setDestination(parsedDestination);
      } catch (e) {
        console.error('❌ Failed to parse destination:', e);
      }
    } else if (destination) {
      parsedDestination = destination;
    }

    // Set initial region based on pickup or destination
    if (parsedPickup && !region) {
      const initialRegion: Region = {
        latitude: parsedPickup.latitude,
        longitude: parsedPickup.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setRegion(initialRegion);
    } else if (parsedDestination && !region) {
      const initialRegion: Region = {
        latitude: parsedDestination.latitude,
        longitude: parsedDestination.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setRegion(initialRegion);
    }

    console.log('📍 Select Destination - Final state:');
    console.log('  Pickup:', parsedPickup || pickupLocation);
    console.log('  Destination:', parsedDestination || destination);
  }, []);

  /**
   * Fetch route when locations or stops change
   * FIXED: Prevent infinite loops and validate coordinates
   */
  useEffect(() => {
    // Validate that we have proper coordinates
    if (!pickupLocation || !destination) {
      console.log('⏭️ Skipping route fetch - missing locations');
      return;
    }

    // Validate coordinates
    if (
      typeof pickupLocation.latitude !== 'number' ||
      typeof pickupLocation.longitude !== 'number' ||
      typeof destination.latitude !== 'number' ||
      typeof destination.longitude !== 'number'
    ) {
      console.error('❌ Invalid coordinates:', { pickupLocation, destination });
      return;
    }

    // Check cache
    if (cachedRoute && routeCoordinates.length > 0) {
      console.log('✅ Using cached route');
      setRouteCoordinates(cachedRoute.polylinePoints);
      setDistanceMiles(cachedRoute.distance * 0.000621371);
      setDurationMinutes(cachedRoute.duration / 60);
      
      // Fit map to cached route
      setTimeout(() => {
        fitMapToRoute(cachedRoute.polylinePoints);
      }, 500);
      
      return;
    }

    if (loading) {
      console.log('⏳ Request already in progress');
      return;
    }

    if (!isMountedRef.current) {
      console.log('🛑 Component unmounted');
      return;
    }

    // Debounce
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    console.log('📍 Fetching route from Directions API...');
    console.log('  From:', pickupLocation);
    console.log('  To:', destination);
    console.log('  Stops:', stops?.length || 0);

    fetchTimeoutRef.current = setTimeout(() => {
      fetchRoute();
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [pickupLocation?.latitude, pickupLocation?.longitude, destination?.latitude, destination?.longitude, stops?.length]);

  /**
   * Fit map to show entire route
   */
  const fitMapToRoute = (coords: LatLng[]) => {
    if (!mapRef.current || coords.length < 2) {
      console.log('⚠️ Cannot fit map to route - missing map ref or coordinates');
      return;
    }

    console.log('🗺️ Fitting map to route with', coords.length, 'points');
    
    try {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 400,
          left: 50,
        },
        animated: true,
      });
    } catch (error) {
      console.error('❌ Failed to fit map to route:', error);
    }
  };

  /**
   * Fetch route from Google Directions API
   */
  const fetchRoute = async () => {
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please select both pickup and destination');
      return;
    }

    if (!GOOGLE_DIRECTIONS_API_KEY) {
      console.error('❌ Google API key not configured');
      Alert.alert('Configuration Error', 'Google Maps API key is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const origin = `${pickupLocation.latitude},${pickupLocation.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      
      let waypointsParam = '';
      if (stops && stops.length > 0) {
        const waypointCoords = stops.map(stop => `${stop.latitude},${stop.longitude}`);
        waypointsParam = `&waypoints=${waypointCoords.join('|')}`;
      }

      console.log('🌐 Making Directions API request:');
      console.log('  Origin:', origin);
      console.log('  Destination:', dest);
      console.log('  Stops:', stops?.length || 0);

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}${waypointsParam}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) {
        console.log('⏭️ Ignoring stale request');
        return;
      }

      console.log('📊 Directions API response status:', data.status);

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        
        const coords: LatLng[] = points.map((point: [number, number]) => ({
          latitude: point[0],
          longitude: point[1],
        }));

        console.log('✅ Route decoded, total points:', coords.length);
        console.log('🎯 First point:', coords[0]);
        console.log('🎯 Last point:', coords[coords.length - 1]);
        
        // CRITICAL: Set route coordinates immediately
        setRouteCoordinates(coords);
        console.log('📍 setRouteCoordinates called with', coords.length, 'points');
        
        // CRITICAL: Enable polyline rendering after a short delay
        setTimeout(() => {
          setShowPolyline(true);
          console.log('✅ Polyline rendering enabled');
        }, 100);
        
        // Calculate distance and duration
        let totalDistanceMeters = 0;
        let totalDurationSeconds = 0;
        
        route.legs.forEach((leg: any) => {
          totalDistanceMeters += leg.distance.value;
          totalDurationSeconds += leg.duration.value;
        });
        
        const totalDistanceMiles = totalDistanceMeters * 0.000621371;
        const totalDurationMinutes = totalDurationSeconds / 60;
        
        console.log('📏 Distance:', totalDistanceMiles.toFixed(2), 'miles');
        console.log('⏱️ Duration:', Math.round(totalDurationMinutes), 'minutes');
        
        // CRITICAL: Set route coordinates BEFORE fitting map
        setRouteCoordinates(coords);
        setDistanceMiles(totalDistanceMiles);
        setDurationMinutes(totalDurationMinutes);
        
        // Store in Zustand
        setRoute({
          distance: totalDistanceMeters,
          duration: totalDurationSeconds,
          polylinePoints: coords,
          origin: pickupLocation,
          destination: destination,
          stops: stops || [],
        });

        // Detect zones for pricing
        detectZonesForPricing();

        // Fit map after state update
        setTimeout(() => {
          fitMapToRoute(coords);
        }, 500);

        setLoading(false);
      } else {
        console.error('❌ Directions API error:', data.status);
        console.error('Error message:', data.error_message);
        setLoading(false);
        handleRouteError();
      }
    } catch (error) {
      console.error('❌ Route fetch error:', error);
      setLoading(false);
      handleRouteError();
    }
  };

  /**
   * Calculate distance using Haversine formula (fallback)
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (deg: number): number => deg * (Math.PI / 180);

  /**
   * Fallback to straight line when API fails
   */
  const calculateFallbackRoute = () => {
    if (!pickupLocation || !destination) return;

    console.log('⚠️ Using fallback straight-line route');

    // Create straight line coordinates
    const straightLine: LatLng[] = [
      { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
    ];

    // Add stops if any
    if (stops && stops.length > 0) {
      stops.forEach(stop => {
        straightLine.push({ latitude: stop.latitude, longitude: stop.longitude });
      });
    }

    straightLine.push({ latitude: destination.latitude, longitude: destination.longitude });

    // Calculate total distance
    let totalDistanceKm = 0;
    for (let i = 0; i < straightLine.length - 1; i++) {
      totalDistanceKm += calculateDistance(
        straightLine[i].latitude,
        straightLine[i].longitude,
        straightLine[i + 1].latitude,
        straightLine[i + 1].longitude
      );
    }

    // Multiply by 1.3 to account for roads not being straight
    const adjustedDistanceKm = totalDistanceKm * 1.3;
    const distanceMiles = adjustedDistanceKm * 0.621371;
    const durationMin = (distanceMiles / 25) * 60; // Assume 25 mph average

    console.log('📏 Fallback Distance:', distanceMiles.toFixed(2), 'miles');

    setRouteCoordinates(straightLine);
    setDistanceMiles(distanceMiles);
    setDurationMinutes(durationMin);
    setShowPolyline(true);

    setRoute({
      distance: adjustedDistanceKm * 1000,
      duration: durationMin * 60,
      polylinePoints: straightLine,
      origin: pickupLocation,
      destination: destination,
      stops: stops || [],
    });

    // Detect zones for pricing
    detectZonesForPricing();

    setTimeout(() => {
      fitMapToRoute(straightLine);
    }, 500);

    Alert.alert(
      'Route Estimated',
      'Using estimated route. Actual distance may vary slightly.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Detect zones for pricing
   */
  const detectZonesForPricing = () => {
    if (!pickupLocation || !destination) return;

    const pickupZone = detectZone(pickupLocation.latitude, pickupLocation.longitude);
    const destZone = detectZone(destination.latitude, destination.longitude);

    if (pickupZone && destZone) {
      console.log('📍 Zones detected:', {
        pickup: pickupZone.displayName,
        destination: destZone.displayName,
      });
    } else {
      console.warn('⚠️ One or more locations outside service area');
      if (!pickupZone) {
        console.warn('  Pickup location not in any zone');
      }
      if (!destZone) {
        console.warn('  Destination not in any zone');
      }
    }
  };

  /**
   * Handle route calculation error - show error and allow retry or use fallback
   */
  const handleRouteError = () => {
    if (!pickupLocation || !destination) return;

    console.error('❌ Failed to calculate route via Google Directions API');

    Alert.alert(
      'Route Error',
      'Unable to calculate route from Google. Would you like to use an estimated route instead?',
      [
        {
          text: 'Use Estimate',
          onPress: () => {
            calculateFallbackRoute();
          }
        },
        {
          text: 'Retry',
          onPress: () => {
            setLoading(false);
            fetchRoute();
          }
        },
        {
          text: 'Go Back',
          onPress: () => router.back(),
          style: 'cancel'
        }
      ]
    );
  };


  const addStop = () => {
    if (stops && stops.length >= 2) {
      Alert.alert('Maximum Stops', 'You can add up to 2 stops only');
      return;
    }
    
    router.push({
      pathname: '/search-location',
      params: { mode: 'stop' },
    });
  };

  const removeStop = (index: number) => {
    const updatedStops = stops?.filter((_, i) => i !== index) || [];
    setStops(updatedStops);
  };

  const confirmDestination = () => {
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please select both pickup and destination');
      return;
    }

    router.push('/vehicle-selection');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Destination</Text>
        <TouchableOpacity 
          style={styles.addStopButton} 
          onPress={addStop}
          disabled={stops && stops.length >= 2}
        >
          <Ionicons 
            name="add-circle" 
            size={24} 
            color={stops && stops.length >= 2 ? '#ccc' : '#5d1289'} 
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region || undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
      >
        {/* Pickup Marker */}
        {pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Pickup"
            tracksViewChanges={false}
          >
            <View style={styles.markerContainer}>
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText} numberOfLines={1}>
                  {pickupLocation.name}
                </Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Stop Markers - rendered in order (Stop 1, Stop 2) */}
        {stops && stops.map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={`Stop ${index + 1}`}
            tracksViewChanges={false}
            zIndex={10 + index}
          >
            <View style={styles.markerContainer}>
              <View style={styles.stopMarker}>
                <Text style={styles.stopNumber}>{index + 1}</Text>
              </View>
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText} numberOfLines={1}>
                  Stop {index + 1}: {stop.name}
                </Text>
              </View>
            </View>
          </Marker>
        ))}

        {/* Destination Marker - always last, no number, uses flag icon */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destination"
            tracksViewChanges={false}
            zIndex={100}
          >
            <View style={styles.markerContainer}>
              <View style={styles.destinationMarker}>
                <Ionicons name="flag" size={20} color="#FFFFFF" />
              </View>
              <View style={[styles.markerLabel, styles.destinationLabel]}>
                <Text style={[styles.markerLabelText, { color: '#FFFFFF' }]} numberOfLines={1}>
                  {destination.name}
                </Text>
              </View>
            </View>
          </Marker>
        )}

        {/* CRITICAL: Route Polyline - render AFTER markers */}
        {showPolyline && routeCoordinates.length > 0 && (() => {
          const normalizedCoords = routeCoordinates.map(coord => ({
            latitude: Number(coord.latitude),
            longitude: Number(coord.longitude),
          }));

           
            console.log('🎨 Rendering Polyline with', normalizedCoords.length, 'normalized coordinates');
            console.log('🔧 Android fix applied: geodesic={true}, plain objects');
  
          
          return (
            <>
              <Polyline
                key="shadow-polyline"
                coordinates={normalizedCoords}
                strokeColor="rgba(202, 110, 255, 0.3)"
                strokeWidth={8}
                geodesic={true}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                key="main-polyline"
                coordinates={normalizedCoords}
                strokeColor="#7820acff"
                strokeWidth={4}
                geodesic={true}
                lineCap="round"
                lineJoin="round"
              />
            </>
          );
        })()}
      </MapView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#5d1289" />
            <Text style={styles.loadingText}>Calculating best route...</Text>
          </View>
        </View>
      )}

      {/* Route Info Card */}
      {!loading && routeCoordinates.length > 0 && (
        <View style={[styles.infoCard, { bottom: insets.bottom + 16 }]}>
          {/* Stops List */}
          {stops && stops.length > 0 && (
            <View style={styles.stopsContainer}>
              <Text style={styles.stopsTitle}>Stops ({stops.length}/2):</Text>
              {stops.map((stop, index) => (
                <View key={index} style={styles.stopItem}>
                  <Ionicons name="location" size={16} color="#5d1289" />
                  <Text style={styles.stopText} numberOfLines={1}>
                    {stop.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeStop(index)}
                    style={styles.removeStopButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Distance & Duration */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="navigate" size={24} color="#5d1289" />
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{distanceMiles.toFixed(1)} mi</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Ionicons name="time" size={24} color="#5d1289" />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{Math.round(durationMinutes)} min</Text>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmDestination}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Find Drivers</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Cost Estimate */}
          <View style={styles.costEstimate}>
            <Text style={styles.costLabel}>Estimated Cost Share:</Text>
            <Text style={styles.costValue}>
              ${(distanceMiles * 1.5).toFixed(2)} - ${(distanceMiles * 2.5).toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const decodePolyline = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  addStopButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5d1289',
    fontWeight: '500',
  },
  infoCard: {
    position: 'absolute',
    bottom: 0, // Will be overridden by inline style with safe area insets
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  stopsContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  stopText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  removeStopButton: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5E5',
  },
  confirmButton: {
    backgroundColor: '#5d1289',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  costEstimate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5d1289',
  },
  markerContainer: {
    alignItems: 'center',
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  stopMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  stopNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerLabel: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    maxWidth: 150,
  },
  destinationLabel: {
    backgroundColor: '#EF4444',
    maxWidth: 150,
  },
  markerLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});

export default SelectDestinationScreen;