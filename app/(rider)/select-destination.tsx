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
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCarpoolStore } from '@/src/stores/carpool-store';

// CRITICAL: Use the correct API key for Directions API
// If you created a separate Directions API key (recommended), use it here
// Otherwise, use the Places API key which should have Directions API enabled
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface RouteData {
  polylinePoints: LatLng[];
  distance: number;
  duration: number;
}

const SelectDestinationScreen = () => {
  const params = useLocalSearchParams();
  const { 
    pickupLocation, 
    destination, 
    setPickupLocation, 
    setDestination, 
    setRoute 
  } = useCarpoolStore();

  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [region, setRegion] = useState<Region | null>(null);
  
  const mapRef = useRef<MapView>(null);

  // Parse params and set in store if provided
  useEffect(() => {
    if (params.pickup && typeof params.pickup === 'string') {
      try {
        const pickup = JSON.parse(params.pickup);
        setPickupLocation(pickup);
      } catch (e) {
        console.error('Failed to parse pickup:', e);
      }
    }
    if (params.destination && typeof params.destination === 'string') {
      try {
        const dest = JSON.parse(params.destination);
        setDestination(dest);
      } catch (e) {
        console.error('Failed to parse destination:', e);
      }
    }
  }, [params]);

  // Fetch route when both locations are set
  useEffect(() => {
    if (pickupLocation && destination) {
      fetchRoute();
    }
  }, [pickupLocation, destination]);

  // Set initial region
  useEffect(() => {
    if (pickupLocation) {
      const initialRegion: Region = {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setRegion(initialRegion);
    }
  }, [pickupLocation]);

  const fetchRoute = async () => {
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please select both pickup and destination');
      return;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      Alert.alert('Error', 'Google Directions API key not configured');
      console.error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY or EXPO_PUBLIC_GOOGLE_PLACES_API_KEY not found in environment');
      return;
    }

    setLoading(true);
    try {
      const origin = `${pickupLocation.latitude},${pickupLocation.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;

      // CRITICAL: Using the Directions/Places API key for fetch() calls
      // This key MUST have Directions API enabled in Google Cloud Console
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${GOOGLE_PLACES_API_KEY}`;

      console.log('Fetching route...');
      console.log('From:', origin);
      console.log('To:', dest);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('Directions API response status:', data.status);

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        
        const coords: LatLng[] = points.map((point: [number, number]) => ({
          latitude: point[0],
          longitude: point[1],
        }));

        setRouteCoordinates(coords);
        setDistance(leg.distance.value / 1000); // Convert to km
        setDuration(leg.duration.value / 60); // Convert to minutes

        // Save to store
        const routeData: RouteData = {
          polylinePoints: coords,
          distance: leg.distance.value,
          duration: leg.duration.value,
        };
        setRoute(routeData);

        // Fit map to show entire route
        if (mapRef.current && coords.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { 
                top: 100, 
                right: 50, 
                bottom: 300, 
                left: 50 
              },
              animated: true,
            });
          }, 500);
        }

        console.log('Route calculated successfully');
        console.log(`Distance: ${(leg.distance.value / 1000).toFixed(2)} km`);
        console.log(`Duration: ${Math.round(leg.duration.value / 60)} minutes`);

      } else {
        console.error('Directions API error:', data.status);
        if (data.error_message) {
          console.error('Error message:', data.error_message);
        }
        
        let errorMessage = 'Failed to calculate route';
        if (data.status === 'REQUEST_DENIED') {
          errorMessage = 'API key error. Please check your Google Cloud Console configuration.';
        } else if (data.status === 'ZERO_RESULTS') {
          errorMessage = 'No route found between these locations';
        }
        
        Alert.alert('Route Error', errorMessage);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert(
        'Network Error', 
        'Failed to calculate route. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmDestination = () => {
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please select both pickup and destination');
      return;
    }

    if (routeCoordinates.length === 0) {
      Alert.alert('Error', 'Please wait for route calculation');
      return;
    }

    // Navigate to next screen (ride request or driver selection)
    router.push('/(rider)/find-drivers');
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Destination</Text>
        <View style={styles.backButton} />
      </View>

      {/* Map */}
      {region && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation={false}
          loadingEnabled={true}
          loadingIndicatorColor="#5d1289ff"
          onMapReady={() => console.log('Map ready for route display')}
        >
          {/* Pickup Marker */}
          {pickupLocation && (
            <Marker
              key={`pickup-${Date.now()}`}
              coordinate={pickupLocation}
              title="Pickup Location"
              pinColor="#10B981"
            >
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={30} color="#10B981" />
              </View>
            </Marker>
          )}

          {/* Destination Marker */}
          {destination && (
            <Marker
              key={`destination-${Date.now()}`}
              coordinate={destination}
              title="Destination"
              pinColor="#EF4444"
            >
              <View style={styles.destinationMarker}>
                <Ionicons name="flag" size={30} color="#EF4444" />
              </View>
            </Marker>
          )}

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#5d1289ff"
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}
        </MapView>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#5d1289ff" />
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        </View>
      )}

      {/* Route Info Card */}
      {!loading && routeCoordinates.length > 0 && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="navigate" size={20} color="#5d1289ff" />
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#5d1289ff" />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{Math.round(duration)} min</Text>
            </View>
          </View>

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

      {/* Retry Button (if route failed) */}
      {!loading && routeCoordinates.length === 0 && pickupLocation && destination && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={40} color="#EF4444" />
          <Text style={styles.errorTitle}>Route not found</Text>
          <Text style={styles.errorMessage}>
            Unable to calculate route between these locations
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchRoute}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

/**
 * Decode Google's encoded polyline format
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  map: {
    flex: 1,
  },
  pickupMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5d1289ff',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  costEstimate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  errorCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5d1289ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SelectDestinationScreen;