import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useLocationStore } from '@/src/stores/location-store';
import { Location } from '@/src/types/carpool';

const Colors = {
  primary: '#D4E700',
  purple: '#5d1289ff',
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#10B981',
  error: '#EF4444',
};

interface RouteResponse {
  distance: number;
  duration: number;
  polyline: string;
}

export default function SelectDestinationScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const { destination, pickupLocation, setRoute } = useCarpoolStore();
  const { currentLocation } = useLocationStore();
  
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
    polylinePoints: Array<{ latitude: number; longitude: number }>;
  } | null>(null);

  // Get pickup location (either set pickup or current location)
  const pickup = pickupLocation || currentLocation;

  // Fetch route from Google Directions API
  useEffect(() => {
    if (pickup && destination) {
      fetchRoute();
    }
  }, [pickup, destination]);

  const fetchRoute = async () => {
    if (!pickup || !destination) return;

    setLoading(true);
    try {
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const origin = `${pickup.latitude},${pickup.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Decode polyline
        const polylinePoints = decodePolyline(route.overview_polyline.points);
        
        const routeData = {
          distance: leg.distance.value, // meters
          duration: leg.duration.value, // seconds
          polylinePoints,
        };
        
        setRouteInfo(routeData);
        
        // Fit map to route
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(polylinePoints, {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }
      }
    } catch (error) {
      console.error('Route fetch error:', error);
      Alert.alert('Error', 'Failed to load route');
    } finally {
      setLoading(false);
    }
  };

  // Decode Google polyline format
  const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
    const poly: Array<{ latitude: number; longitude: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
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

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return poly;
  };

  // Get initial map region
  const getInitialRegion = (): Region | undefined => {
    if (pickup) {
      return {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return undefined;
  };

  // Confirm route and go to vehicle selection
  const handleConfirmRoute = () => {
    if (!routeInfo) {
      Alert.alert('Error', 'Please wait for route to load');
      return;
    }
    
    // Save route to store
    setRoute({
      distance: routeInfo.distance,
      duration: routeInfo.duration,
      polylinePoints: routeInfo.polylinePoints,
      origin: pickup!,
      destination: destination!,
    });
    
    // Navigate to vehicle selection
    router.push('/(rider)/vehicle-selection');
  };

  const handleAddStop = () => {
    Alert.alert('Add Stop', 'Multi-stop feature coming soon!');
    // router.push('/(rider)/add-stop');
  };

  const handleEditPickup = () => {
    router.push('/(rider)/search-location');
  };

  const handleEditDestination = () => {
    router.push('/(rider)/search-location');
  };

  // Format distance
  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km < 1 ? `${meters}m` : `${km.toFixed(1)}km`;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Pickup Marker */}
        {pickup && (
          <Marker
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            title="Pickup"
            description={pickup.address}
          >
            <View style={styles.markerContainer}>
              <View style={styles.pickupMarker}>
                <View style={styles.pickupDot} />
              </View>
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destination"
            description={destination.address}
          >
            <View style={styles.markerContainer}>
              <View style={styles.destinationMarker}>
                <Text style={styles.markerText}>📍</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeInfo?.polylinePoints && (
          <Polyline
            coordinates={routeInfo.polylinePoints}
            strokeColor={Colors.black}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Menu Button (Top Right) */}
      <TouchableOpacity style={styles.menuButton}>
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </TouchableOpacity>

      {/* Location Details Card */}
      <View style={styles.detailsCard}>
        {/* Pickup */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={handleEditPickup}
        >
          <View style={styles.locationDot} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>From</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {pickup?.address || 'Current Location'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Destination */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={handleEditDestination}
        >
          <View style={[styles.locationDot, styles.locationDotRed]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Where To</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {destination?.address || 'Select destination'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddStop}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Route Info */}
        {routeInfo && (
          <View style={styles.routeInfo}>
            <Text style={styles.routeInfoText}>
              {formatDistance(routeInfo.distance)} • {formatDuration(routeInfo.duration)}
            </Text>
          </View>
        )}
      </View>

      {/* Confirm Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirmRoute}
          disabled={loading || !routeInfo}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Confirm Destination</Text>
              <Text style={styles.confirmButtonArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.black,
  },
  menuButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.black,
    marginVertical: 2,
  },
  markerContainer: {
    alignItems: 'center',
  },
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  destinationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 20,
  },
  detailsCard: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    marginRight: 12,
  },
  locationDotRed: {
    backgroundColor: Colors.error,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '500',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addIcon: {
    fontSize: 20,
    color: Colors.black,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 8,
  },
  routeInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  routeInfoText: {
    fontSize: 13,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: Colors.black,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
  confirmButtonArrow: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
});