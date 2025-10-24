import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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

export default function DriverArrivingScreen() {
  const router = useRouter();
  const [eta, setEta] = useState(5);

  // Mock driver data
  const driver = {
    id: '1',
    name: 'John Smith',
    rating: 4.8,
    totalTrips: 234,
    phone: '+1 345 123 4567',
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Silver',
      plate: 'ABC 123',
    },
    photo: '👤',
    location: {
      latitude: 19.3133,
      longitude: -81.2546,
    },
  };

  useEffect(() => {
    // Simulate ETA countdown
    const interval = setInterval(() => {
      setEta(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.replace('/(rider)/driver-on-way');
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleCall = () => {
    Linking.openURL(`tel:${driver.phone}`);
  };

  const handleMessage = () => {
    Alert.alert('Message', 'In-app messaging coming soon!');
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel? You may be charged a cancellation fee.',
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Map */}
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 19.3133,
            longitude: -81.2546,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
        >
          <Marker
            coordinate={driver.location}
            title="Driver"
          >
            <View style={styles.driverMarker}>
              <Text style={styles.carEmoji}>🚗</Text>
            </View>
          </Marker>
        </MapView>

        {/* Driver Card */}
        <View style={styles.driverCard}>
          {/* ETA Banner */}
          <View style={styles.etaBanner}>
            <Text style={styles.etaText}>Arriving in {eta} min</Text>
          </View>

          {/* Driver Info */}
          <View style={styles.driverInfo}>
            <View style={styles.driverPhotoContainer}>
              <Text style={styles.driverPhoto}>{driver.photo}</Text>
            </View>

            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>⭐ {driver.rating}</Text>
                <Text style={styles.trips}>• {driver.totalTrips} trips</Text>
              </View>
              <Text style={styles.vehicle}>
                {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
              </Text>
              <Text style={styles.plate}>{driver.vehicle.plate}</Text>
            </View>

            {/* Contact Buttons */}
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleCall}
              >
                <Text style={styles.contactIcon}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleMessage}
              >
                <Text style={styles.contactIcon}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carEmoji: {
    fontSize: 24,
  },
  driverCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  etaBanner: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  etaText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverPhotoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverPhoto: {
    fontSize: 32,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  trips: {
    fontSize: 14,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  vehicle: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  plate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
  },
  contactButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  contactButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 24,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
});