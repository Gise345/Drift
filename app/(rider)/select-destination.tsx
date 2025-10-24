/**
 * Drift Select Destination Screen
 * Figma: 13_Single_Destination.png
 * 
 * Map view with route preview and confirmation
 * Built for Expo SDK 52
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useLocationStore } from '@/src/stores/location-store';
import { useCarpoolStore } from '@/src/stores/carpool-store';

const { width, height } = Dimensions.get('window');

interface RouteInfo {
  distance: string;
  duration: string;
  polylinePoints: { latitude: number; longitude: number }[];
}

export default function SelectDestinationScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useLocationStore();
  const { destination, pickupLocation, setRoute } = useCarpoolStore();
  
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddStop, setShowAddStop] = useState(false);

  // Calculate initial region
  const getInitialRegion = () => {
    const pickup = pickupLocation || currentLocation;
    if (!pickup || !destination) {
      return {
        latitude: 19.3133,
        longitude: -81.2546,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Calculate center between pickup and destination
    const centerLat = (pickup.latitude + destination.latitude) / 2;
    const centerLng = (pickup.longitude + destination.longitude) / 2;
    
    // Calculate deltas to show both points
    const latDelta = Math.abs(pickup.latitude - destination.latitude) * 1.5;
    const lngDelta = Math.abs(pickup.longitude - destination.longitude) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.05),
      longitudeDelta: Math.max(lngDelta, 0.05),
    };
  };

  // Fetch route from Google Directions API
  const fetchRoute = async () => {
    const pickup = pickupLocation || currentLocation;
    if (!pickup || !destination) return;

    setLoading(true);

    try {
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const origin = `${pickup.latitude},${pickup.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=driving&key=${API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          polylinePoints: points,
        });

        // Save route to store
        setRoute({
          distance: leg.distance.value,
          duration: leg.duration.value,
          polyline: route.overview_polyline.points,
        });

        // Fit map to show entire route
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(points, {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to load route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Decode Google's polyline format
  const decodePolyline = (encoded: string) => {
    const poly: { latitude: number; longitude: number }[] = [];
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

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return poly;
  };

  // Load route on mount
  useEffect(() => {
    fetchRoute();
  }, []);

  const handleConfirmRoute = () => {
    if (!routeInfo) {
      Alert.alert('Error', 'Please wait for route to load');
      return;
    }
    
    // Navigate to vehicle selection
    router.push('/(rider)/vehicle-selection');
  };

  const handleAddStop = () => {
    setShowAddStop(true);
    router.push('/(rider)/add-stop');
  };

  const handleEditPickup = () => {
    Alert.alert('Edit Pickup', 'Edit pickup location feature coming soon');
  };

  const handleEditDestination = () => {
    router.push('/(rider)/search-location');
  };

  const pickup = pickupLocation || currentLocation;

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
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.backCircle}>
            <Text style={styles.backIcon}>←</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Card */}
      <SafeAreaView style={styles.bottomCard} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Route Info */}
          <View style={styles.routeInfo}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Your Carpool Route</Text>
              {routeInfo && (
                <View style={styles.routeStats}>
                  <Text style={styles.routeDuration}>{routeInfo.duration}</Text>
                  <Text style={styles.routeDivider}>•</Text>
                  <Text style={styles.routeDistance}>{routeInfo.distance}</Text>
                </View>
              )}
            </View>

            {/* Location Cards */}
            <View style={styles.locationsContainer}>
              {/* Pickup */}
              <TouchableOpacity 
                style={styles.locationCard}
                onPress={handleEditPickup}
              >
                <View style={styles.locationDot}>
                  <View style={styles.pickupDotInner} />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>PICKUP</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {pickup?.address || 'Current Location'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditPickup}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Line Connector */}
              <View style={styles.lineConnector} />

              {/* Add Stop Button */}
              <TouchableOpacity
                style={styles.addStopButton}
                onPress={handleAddStop}
              >
                <Text style={styles.addStopIcon}>+</Text>
                <Text style={styles.addStopText}>Add stop</Text>
              </TouchableOpacity>

              {/* Destination */}
              <TouchableOpacity 
                style={styles.locationCard}
                onPress={handleEditDestination}
              >
                <View style={styles.locationDot}>
                  <Text style={styles.destinationDotIcon}>📍</Text>
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>DESTINATION</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {destination?.address || 'Select destination'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditDestination}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Estimated Cost Share */}
            <View style={styles.costEstimate}>
              <Text style={styles.costLabel}>Estimated Cost Share:</Text>
              <Text style={styles.costAmount}>$8-12 CI</Text>
              <Text style={styles.costNote}>
                Peer-to-peer cost sharing only
              </Text>
            </View>

            {/* Confirm Button */}
            <DriftButton
              title="Choose Carpool Type"
              onPress={handleConfirmRoute}
              variant="black"
              size="large"
              icon={<ArrowRight />}
              loading={loading}
              disabled={!routeInfo}
              style={styles.confirmButton}
            />

            {/* Legal Notice */}
            <View style={styles.legalNotice}>
              <Text style={styles.legalText}>
                🚗 Private carpooling arrangement between independent users
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  map: {
    width: width,
    height: height,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  backButton: {
    alignSelf: 'flex-start',
  },

  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  backIcon: {
    fontSize: 24,
    color: Colors.black,
  },

  // Markers
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },

  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },

  destinationMarker: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  markerText: {
    fontSize: 28,
  },

  // Bottom Card
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: height * 0.55,
  },

  routeInfo: {
    padding: Spacing.xl,
  },

  routeHeader: {
    marginBottom: Spacing.lg,
  },

  routeTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },

  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  routeDuration: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primary,
  },

  routeDivider: {
    marginHorizontal: Spacing.sm,
    color: Colors.gray[400],
  },

  routeDistance: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
  },

  // Locations
  locationsContainer: {
    marginBottom: Spacing.xl,
  },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },

  locationDot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  pickupDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  destinationDotIcon: {
    fontSize: 20,
  },

  locationDetails: {
    flex: 1,
  },

  locationLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.gray[500],
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  locationAddress: {
    fontSize: Typography.fontSize.base,
    color: Colors.black,
  },

  editButton: {
    padding: Spacing.sm,
  },

  editIcon: {
    fontSize: 16,
  },

  // Line Connector
  lineConnector: {
    width: 2,
    height: 20,
    backgroundColor: Colors.gray[300],
    marginLeft: 11,
    marginVertical: -4,
  },

  // Add Stop
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginLeft: 36,
    marginVertical: Spacing.xs,
  },

  addStopIcon: {
    fontSize: 20,
    color: Colors.purple,
    marginRight: Spacing.sm,
  },

  addStopText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.purple,
    fontWeight: '600',
  },

  // Cost Estimate
  costEstimate: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },

  costLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: 4,
  },

  costAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },

  costNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    fontStyle: 'italic',
  },

  // Confirm Button
  confirmButton: {
    marginBottom: Spacing.md,
  },

  // Legal Notice
  legalNotice: {
    backgroundColor: Colors.purple + '10',
    borderRadius: 8,
    padding: Spacing.sm,
  },

  legalText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    textAlign: 'center',
    lineHeight: 16,
  },
});