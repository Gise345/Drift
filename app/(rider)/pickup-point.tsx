import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function PickupPointScreen() {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes

  // Mock driver data
  const driver = {
    name: 'John Smith',
    photo: 'https://i.pravatar.cc/150?img=12',
    rating: 4.9,
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      color: 'Silver',
      plate: 'CI 1234',
    },
    phone: '+1-345-555-0123',
  };

  // Mock location
  const currentLocation = {
    latitude: 19.3133,
    longitude: -81.2546,
  };

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto-navigate to trip in progress
      router.push('/(rider)/trip-in-progress');
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = () => {
    Linking.openURL(`tel:${driver.phone}`);
  };

  const handleMessage = () => {
    Alert.alert(
      'Message Driver',
      'This feature will be available soon',
      [{ text: 'OK' }]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel? Driver is already at pickup point.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => router.push('/(tabs)'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>At Pickup Point</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {/* Pickup marker */}
          <Marker
            coordinate={currentLocation}
            title="Pickup Point"
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="location" size={32} color="#10B981" />
            </View>
          </Marker>

          {/* Driver marker */}
          <Marker
            coordinate={{
              latitude: currentLocation.latitude + 0.0005,
              longitude: currentLocation.longitude + 0.0005,
            }}
            title="Driver"
          >
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={24} color="#FFF" />
            </View>
          </Marker>
        </MapView>

        {/* Waiting indicator */}
        <View style={styles.waitingBanner}>
          <View style={styles.pulseContainer}>
            <View style={styles.pulse} />
            <Ionicons name="time-outline" size={24} color="#5d1289ff" />
          </View>
          <View style={styles.waitingTextContainer}>
            <Text style={styles.waitingTitle}>Driver is here!</Text>
            <Text style={styles.waitingTime}>
              Waiting: {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>
      </View>

      {/* Driver Info Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <Image
            source={{ uri: driver.photo }}
            style={styles.driverPhoto}
          />
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{driver.rating}</Text>
            </View>
          </View>

          {/* Contact buttons */}
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleMessage}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#5d1289ff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCall}
            >
              <Ionicons name="call-outline" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleRow}>
            <Ionicons name="car-outline" size={18} color="#6B7280" />
            <Text style={styles.vehicleText}>
              {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
            </Text>
          </View>
          <View style={styles.plateContainer}>
            <Text style={styles.plateText}>{driver.vehicle.plate}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle" size={16} color="#5d1289ff" />
          <Text style={styles.instructionsText}>
            Look for {driver.vehicle.color} {driver.vehicle.make} with plate {driver.vehicle.plate}
          </Text>
        </View>

        {/* Start Ride Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/(rider)/trip-in-progress')}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Ride</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  pickupMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarker: {
    width: 36,
    height: 36,
    backgroundColor: '#000',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  waitingBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pulseContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
  },
  waitingTextContainer: {
    flex: 1,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  waitingTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  driverCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    marginLeft: 4,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  plateContainer: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  plateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 12,
    color: '#5d1289ff',
    marginLeft: 8,
    flex: 1,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});