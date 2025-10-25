import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCarpoolStore } from '@/src/stores/carpool-store';

const SelectDestinationScreen = () => {
  const { pickupLocation, destination, setRoute } = useCarpoolStore();
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (pickupLocation && destination) {
      fetchRoute();
    }
  }, [pickupLocation, destination]);

  const fetchRoute = async () => {
    setLoading(true);
    try {
      // Mock route data - replace with actual Google Directions API call
      const mockRoute = {
        coordinates: [
          { latitude: 19.3133, longitude: -81.2546 },
          { latitude: 19.3200, longitude: -81.2600 },
        ],
        distance: 5200, // in meters
        duration: 720, // in seconds (12 minutes)
      };

      setRouteCoordinates(mockRoute.coordinates);
      setDistance(mockRoute.distance);
      setDuration(mockRoute.duration);

      setRoute({
        polylinePoints: mockRoute.coordinates,
        distance: mockRoute.distance,
        duration: mockRoute.duration,
      });
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    router.push('/(rider)/vehicle-selection');
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 19.3133,
          longitude: -81.2546,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Pickup"
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
      <View style={styles.topBar}>
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
      </View>

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
            <TouchableOpacity onPress={() => router.back()}>
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
            <TouchableOpacity onPress={() => router.back()}>
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
    top: 48,
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