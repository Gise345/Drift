import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCarpoolStore } from '@/src/stores/carpool-store';

// CRITICAL: Use Places API key for JavaScript fetch() calls
// The Android-restricted Maps API key only works for native MapView display
// For Directions API, Geocoding, and other fetch() calls, use the unrestricted Places API key
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

const SelectDestinationScreen = () => {
  const params = useLocalSearchParams();
  const { pickupLocation, destination, setPickupLocation, setDestination, setRoute } = useCarpoolStore();
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const mapRef = useRef<any>(null);

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

  useEffect(() => {
    if (pickupLocation && destination) {
      fetchRoute();
    }
  }, [pickupLocation, destination]);

  const fetchRoute = async () => {
    if (!pickupLocation || !destination) return;

    setLoading(true);
    try {
      const origin = `${pickupLocation.latitude},${pickupLocation.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;

      // Using Places API key for Directions API call
      // This is a JavaScript fetch() call, so it needs the unrestricted key
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin}&destination=${dest}` +
        `&mode=driving` +
        `&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);

        setRouteCoordinates(points);
        setDistance(leg.distance.value); // in meters
        setDuration(leg.duration.value); // in seconds

        setRoute({
          polylinePoints: points,
          distance: leg.distance.value,
          duration: leg.duration.value,
        });

        // Fit map to show entire route
        if (mapRef.current && points.length > 0) {
          mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }
      } else {
        Alert.alert('Error', 'Could not fetch route. Please try again.');
        console.error('Directions API error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to fetch route. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Decode Google Maps polyline
  const decodePolyline = (encoded: string) => {
    const points: Array<{ latitude: number; longitude: number }> = [];
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

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const handleConfirm = () => {
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please select both pickup and destination locations.');
      return;
    }
    router.push('/(rider)/vehicle-selection');
  };

  // Calculate initial region based on pickup and destination
  const getInitialRegion = () => {
    if (pickupLocation && destination) {
      const midLat = (pickupLocation.latitude + destination.latitude) / 2;
      const midLng = (pickupLocation.longitude + destination.longitude) / 2;
      const latDelta = Math.abs(pickupLocation.latitude - destination.latitude) * 2 || 0.05;
      const lngDelta = Math.abs(pickupLocation.longitude - destination.longitude) * 2 || 0.05;

      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(latDelta, 0.05),
        longitudeDelta: Math.max(lngDelta, 0.05),
      };
    } else if (pickupLocation) {
      return {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    } else {
      // Default to Grand Cayman
      return {
        latitude: 19.3133,
        longitude: -81.2546,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      };
    }
  };

  return (
    <View style={styles.container}>
      {/* Map - Uses the Android-restricted key from app.config.js */}
      <MapView
        ref={(ref: any) => { mapRef.current = ref; }}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getInitialRegion()}
        showsUserLocation={true}
      >
        {pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Pickup"
            description={pickupLocation.address}
            pinColor="green"
          />
        )}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destination"
            description={destination.address}
            pinColor="red"
          />
        )}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#5d1289"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Top Info Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <Text style={styles.topLabel}>Route Preview</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#5d1289" />
          ) : (
            <Text style={styles.topValue}>{(distance / 1000).toFixed(1)} km • {Math.round(duration / 60)} min</Text>
          )}
        </View>
      </SafeAreaView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        {/* Route Info */}
        <View style={styles.routeInfo}>
          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <View style={styles.greenDot} />
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {pickupLocation?.address || 'Current Location'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(rider)/search-location')}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerLine} />

          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <View style={styles.redSquare} />
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {destination?.address || 'Select destination'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(rider)/search-location')}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Stop Button */}
        <TouchableOpacity style={styles.addStopButton}>
          <Ionicons name="add-circle-outline" size={20} color="#5d1289" />
          <Text style={styles.addStopText}>Add Stop</Text>
        </TouchableOpacity>

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]} 
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Loading...' : 'Confirm Destination'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    marginRight: 12,
  },
  topInfo: {
    flex: 1,
  },
  topLabel: {
    fontSize: 12,
    color: '#666',
  },
  topValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 2,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  routeInfo: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  redSquare: {
    width: 12,
    height: 12,
    backgroundColor: '#EF4444',
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginTop: 2,
  },
  editText: {
    fontSize: 14,
    color: '#5d1289',
    fontWeight: '600',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 8,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#5d1289',
    borderRadius: 12,
    marginBottom: 16,
  },
  addStopText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#5d1289',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// CRITICAL: Export as default for Expo Router
export default SelectDestinationScreen;