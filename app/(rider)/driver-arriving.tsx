import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTripStore, TripLocation } from '@/src/stores/trip-store';
import { ShareTripModal } from '@/components/modal/ShareTripModal';

export default function DriverArrivingScreen() {
  const { currentTrip, subscribeToTrip, startLocationTracking } = useTripStore();
  const [eta, setEta] = useState(5); // minutes
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Mock driver for now - will come from real trip data
  const driver = {
    id: '1',
    name: 'John Smith',
    rating: 4.9,
    totalTrips: 247,
    photo: 'https://via.placeholder.com/150',
    phone: '+1 (345) 926-0000',
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      year: 2021,
      color: 'Silver',
      plate: 'ABC 123',
    },
    location: {
      latitude: 19.3133,
      longitude: -81.2546,
    },
  };

  useEffect(() => {
    // Start background location tracking
    if (currentTrip?.id) {
      startLocationTracking(currentTrip.id).catch((error) => {
        console.error('Failed to start location tracking:', error);
        Alert.alert(
          'Location Tracking',
          'Failed to start background location tracking. Your location will be shared while the app is open.'
        );
      });

      // Subscribe to real-time trip updates
      const unsubscribe = subscribeToTrip(currentTrip.id);
      return () => unsubscribe();
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    // Countdown ETA
    if (eta > 0) {
      const timer = setTimeout(() => setEta(eta - 1), 60000);
      return () => clearTimeout(timer);
    } else {
      // Driver arrived - navigate to at-pickup screen
      router.replace('/(rider)/pickup-point');
    }
  }, [eta]);

  useEffect(() => {
    // Update ETA based on driver location changes
    if (currentTrip?.driverLocation && currentTrip?.pickup) {
      // Calculate real ETA using distance and speed
      calculateETA(currentTrip.driverLocation, currentTrip.pickup.coordinates);
    }
  }, [currentTrip?.driverLocation]);

  const calculateETA = (
    driverLocation: TripLocation,
    pickupLocation: { latitude: number; longitude: number }
  ) => {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = toRad(pickupLocation.latitude - driverLocation.latitude);
    const dLon = toRad(pickupLocation.longitude - driverLocation.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(driverLocation.latitude)) *
        Math.cos(toRad(pickupLocation.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate ETA based on average speed (assuming 40 km/h in city)
    const avgSpeed = driverLocation.speed || 40 / 3.6; // m/s
    const timeInSeconds = (distance * 1000) / avgSpeed;
    const timeInMinutes = Math.ceil(timeInSeconds / 60);

    setEta(Math.max(1, timeInMinutes));
  };

  const toRad = (degrees: number) => degrees * (Math.PI / 180);

  const handleCall = () => {
    Alert.alert(
      'Call Driver',
      `Call ${driver.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${driver.phone}`)
        },
      ]
    );
  };

  const handleMessage = () => {
    const sms = Platform.OS === 'ios' ? 'sms:' : 'sms:';
    Linking.openURL(`${sms}${driver.phone}`);
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            // TODO: Cancel trip in database
            router.replace('/(rider)');
          }
        },
      ]
    );
  };

  const handleShareTrip = () => {
    setShowShareModal(true);
  };

  // Calculate map region to show both driver and pickup
  const mapRegion = {
    latitude: (driver.location.latitude + (currentTrip?.pickup?.coordinates.latitude || 19.3133)) / 2,
    longitude: (driver.location.longitude + (currentTrip?.pickup?.coordinates.longitude || -81.2546)) / 2,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation={true}
      >
        {/* Driver Marker */}
        <Marker
          coordinate={driver.location}
          title={driver.name}
          description={`${driver.vehicle.make} ${driver.vehicle.model}`}
        >
          <View style={styles.driverMarker}>
            <Ionicons name="car" size={24} color="white" />
          </View>
        </Marker>

        {/* Pickup Marker */}
        {currentTrip?.pickup && (
          <Marker
            coordinate={currentTrip.pickup.coordinates}
            title="Pickup Location"
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="person" size={24} color="white" />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {currentTrip?.route && (
          <Polyline
            coordinates={currentTrip.route}
            strokeColor="#5d1289"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver is on the way</Text>
        <TouchableOpacity onPress={handleShareTrip} style={styles.shareButton}>
          <Ionicons name="share-social" size={24} color="#5d1289" />
        </TouchableOpacity>
      </View>

      {/* ETA Banner */}
      <View style={styles.etaBanner}>
        <View style={styles.etaContent}>
          <Text style={styles.etaLabel}>Arriving in</Text>
          <Text style={styles.etaTime}>{eta} min</Text>
        </View>
        {currentTrip?.sharedWith && currentTrip.sharedWith.length > 0 && (
          <View style={styles.sharingBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#27ae60" />
            <Text style={styles.sharingText}>
              Shared with {currentTrip.sharedWith.length}
            </Text>
          </View>
        )}
      </View>

      {/* Driver Info Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={32} color="#5d1289" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.driverRating}>
              <Ionicons name="star" size={16} color="#f39c12" />
              <Text style={styles.ratingText}>{driver.rating}</Text>
              <Text style={styles.tripsText}>• {driver.totalTrips} trips</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Ionicons name="car-sport" size={16} color="#666" />
              <Text style={styles.vehicleText}>
                {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
              </Text>
            </View>
            <Text style={styles.plateNumber}>{driver.vehicle.plate}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={24} color="white" />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Info */}
      <View style={styles.safetyInfo}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#27ae60" />
        <Text style={styles.safetyText}>
          Your location is being tracked for safety
        </Text>
      </View>

      {/* Share Trip Modal */}
      {currentTrip && (
        <ShareTripModal
          visible={showShareModal}
          tripId={currentTrip.id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </SafeAreaView>
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
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  etaBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 108,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  etaContent: {
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 14,
    color: '#666',
  },
  etaTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5d1289',
  },
  sharingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  sharingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27ae60',
    marginLeft: 4,
  },
  driverCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0e6f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 20,
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
  tripsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  vehicleText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5d1289',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#5d1289',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  safetyInfo: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 340 : 320,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
  },
  safetyText: {
    fontSize: 14,
    color: '#27ae60',
    marginLeft: 8,
    flex: 1,
  },
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
  pickupMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27ae60',
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
});