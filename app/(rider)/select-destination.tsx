import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Region, LatLng } from 'react-native-maps';
import { useCarpoolStore } from '@/src/stores/carpool-store';

/**
 * SELECT DESTINATION SCREEN - WITH MULTI-STOP SUPPORT
 * 
 * Features:
 * ✅ Shows map with route from pickup → stops → destination
 * ✅ Displays all stop markers on map
 * ✅ Shows complete route polyline through all stops
 * ✅ Calculates total distance and duration
 * ✅ Add stop button navigates to search-location
 * ✅ Fixed bottom spacing (no phone buttons blocking)
 * ✅ Professional error handling
 */

// Google Directions API Key
const GOOGLE_DIRECTIONS_API_KEY = 
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

const SelectDestinationScreen = () => {
  const params = useLocalSearchParams();
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
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [region, setRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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

  // Parse params and set in store
  useEffect(() => {
    let parsedPickup = null;
    let parsedDestination = null;

    // Parse pickup
    if (params.pickup && typeof params.pickup === 'string') {
      try {
        parsedPickup = JSON.parse(params.pickup);
        setPickupLocation(parsedPickup);
      } catch (e) {
        console.error('Failed to parse pickup:', e);
      }
    }

    // Parse destination
    if (params.destination && typeof params.destination === 'string') {
      try {
        parsedDestination = JSON.parse(params.destination);
        setDestination(parsedDestination);
      } catch (e) {
        console.error('Failed to parse destination:', e);
      }
    }

    // Set initial region based on pickup or destination
    if ((parsedPickup || pickupLocation) && !region) {
      const loc = parsedPickup || pickupLocation;
      if (loc) {
        const initialRegion: Region = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
        setRegion(initialRegion);
      }
    }
  }, [params.pickup, params.destination]);

  /**
   * Fetch route when locations or stops change
   */
  useEffect(() => {
    // Check if locations exist
    if (!pickupLocation || !destination) {
      return;
    }

    // Check if route already calculated
    if (cachedRoute && routeCoordinates.length > 0) {
      console.log('✅ Using cached route');
      return;
    }

    // Check if already loading
    if (loading) {
      console.log('⏳ Request already in progress');
      return;
    }

    // Check if component is mounted
    if (!isMountedRef.current) {
      console.log('🛑 Component unmounted');
      return;
    }

    // Debounce - wait 300ms before making request
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      console.log('📍 Fetching route from Directions API...');
      fetchRoute();
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [pickupLocation, destination, stops, cachedRoute, loading]);

  /**
   * Fetch route from Google Directions API with waypoints support
   */
  const fetchRoute = async () => {
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please select both pickup and destination');
      return;
    }

    if (!GOOGLE_DIRECTIONS_API_KEY) {
      console.error('Google API key not configured');
      // Fallback to straight line
      calculateFallbackRoute();
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const origin = `${pickupLocation.latitude},${pickupLocation.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      
      // Build waypoints string for stops
      let waypointsParam = '';
      if (stops && stops.length > 0) {
        const waypointCoords = stops.map(stop => `${stop.latitude},${stop.longitude}`);
        waypointsParam = `&waypoints=${waypointCoords.join('|')}`;
      }

      console.log('🌐 Making Directions API request with', stops?.length || 0, 'stops...');

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}${waypointsParam}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if this is still the latest request
      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) {
        return;
      }

      console.log('📊 Directions API response status:', data.status);

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Decode polyline into coordinates
        const points = decodePolyline(route.overview_polyline.points);
        
        const coords: LatLng[] = points.map((point: [number, number]) => ({
          latitude: point[0],
          longitude: point[1],
        }));

        setRouteCoordinates(coords);
        
        // Calculate total distance and duration across all legs
        let totalDistance = 0;
        let totalDuration = 0;
        
        route.legs.forEach((leg: any) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });
        
        const distanceKm = totalDistance / 1000;
        const durationMin = totalDuration / 60;
        
        setDistance(distanceKm);
        setDuration(durationMin);

        // Save to store (cache for later use)
        const routeData = {
          polylinePoints: coords,
          distance: totalDistance,
          duration: totalDuration,
          stops: stops || [],
        };
        setRoute(routeData);

        // Fit map to show entire route
        if (mapRef.current && coords.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { 
                top: 100, 
                right: 50, 
                bottom: 350, // Extra padding for bottom info card
                left: 50 
              },
              animated: true,
            });
          }, 500);
        }

        console.log('✅ Route calculated successfully');
        console.log(`📏 Total Distance: ${distanceKm.toFixed(2)} km`);
        console.log(`⏱️ Total Duration: ${Math.round(durationMin)} minutes`);
        console.log(`🛑 Stops: ${stops?.length || 0}`);

      } else {
        console.error('❌ Directions API error:', data.status);
        let errorMessage = 'Failed to calculate route';
        
        if (data.status === 'NOT_FOUND') {
          errorMessage = 'Location not found';
        } else if (data.status === 'ZERO_RESULTS') {
          errorMessage = 'No route found between locations';
        } else if (data.status === 'REQUEST_DENIED') {
          errorMessage = 'API key error';
        }
        
        setError(errorMessage);
        calculateFallbackRoute();
      }
    } catch (error) {
      console.error('❌ Error fetching route:', error);
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setError('Network error');
        calculateFallbackRoute();
      }
    } finally {
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  /**
   * Fallback: Draw straight line and estimate distance
   */
  const calculateFallbackRoute = () => {
    if (!pickupLocation || !destination) return;

    console.log('⚠️ Using fallback straight-line route');
    
    // Create array with pickup, stops, and destination
    const allPoints = [
      pickupLocation,
      ...(stops || []),
      destination,
    ];

    // Calculate total distance across all segments
    let totalDistance = 0;
    for (let i = 0; i < allPoints.length - 1; i++) {
      const d = calculateDistance(
        allPoints[i].latitude,
        allPoints[i].longitude,
        allPoints[i + 1].latitude,
        allPoints[i + 1].longitude
      );
      totalDistance += d;
    }

    // Estimate duration (assume 40 km/h average)
    const estimatedDuration = (totalDistance / 40) * 60;

    setDistance(totalDistance);
    setDuration(estimatedDuration);

    // Create simple polyline through all points
    const coords = allPoints.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));

    setRouteCoordinates(coords);

    // Fit map to show all points
    if (mapRef.current && coords.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
          animated: true,
        });
      }, 500);
    }
  };

  /**
   * Haversine formula for distance calculation
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
   * Add a stop
   */
  const addStop = () => {
    if (stops && stops.length >= 2) {
      Alert.alert('Maximum Stops', 'You can add up to 2 stops only');
      return;
    }
    
    router.push({
      pathname: '/search-location',
      params: {
        mode: 'stop',
      },
    });
  };

  /**
   * Remove a stop
   */
  const removeStop = (index: number) => {
    const updatedStops = stops?.filter((_, i) => i !== index) || [];
    setStops(updatedStops);
  };

  /**
   * Confirm destination and proceed
   */
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
            description={pickupLocation.address}
            pinColor="#10B981"
          />
        )}

        {/* Stop Markers */}
        {stops && stops.map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={`Stop ${index + 1}`}
            description={stop.address}
            pinColor="#F59E0B"
          />
        ))}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destination"
            description={destination.address}
            pinColor="#EF4444"
          />
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#5d1289"
            strokeWidth={4}
          />
        )}
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

      {/* Route Info Card - FIXED WITH PROPER BOTTOM PADDING */}
      {!loading && routeCoordinates.length > 0 && (
        <View style={styles.infoCard}>
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
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Warning Banner (only if using fallback) */}
          {error && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                Estimated route. Actual distance may vary.
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="navigate" size={20} color="#5d1289" />
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>
                {error ? '~' : ''}{distance.toFixed(1)} km
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#5d1289" />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>
                {error ? '~' : ''}{Math.round(duration)} min
              </Text>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmDestination}
          >
            <Text style={styles.confirmButtonText}>Find Drivers</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Cost Estimate */}
          <View style={styles.costEstimate}>
            <Text style={styles.costLabel}>Estimated Cost Share:</Text>
            <Text style={styles.costValue}>
              ${(distance * 1.5).toFixed(2)} - ${(distance * 2.5).toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

/**
 * Decode Google's encoded polyline format
 */
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
    bottom: Platform.OS === 'ios' ? 40 : 20,
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
    marginBottom: Platform.OS === 'android' ? 20 : 0,
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#92400E',
    flex: 1,
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
});

export default SelectDestinationScreen;