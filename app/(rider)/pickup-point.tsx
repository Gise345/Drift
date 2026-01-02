import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTripStore } from '@/src/stores/trip-store';
import { useUserStore } from '@/src/stores/user-store';
import { cancelTrip } from '@/src/services/ride-request.service';
import { ChatModal } from '@/components/messaging/ChatModal';
import { CarMarker } from '@/components/map/CarMarker';

export default function PickupPointScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTrip, subscribeToTrip } = useTripStore();
  const { user } = useUserStore();
  const [waitTime, setWaitTime] = useState(0); // Track wait time in seconds
  const [showChatModal, setShowChatModal] = useState(false);
  const hasNavigatedRef = useRef(false);

  // If no current trip, redirect back
  if (!currentTrip) {
    router.replace('/(rider)');
    return null;
  }

  // Get driver info from current trip
  const driver = currentTrip.driverInfo;

  // Get pickup location from current trip
  const pickupLocation = currentTrip.pickup?.coordinates || {
    latitude: 19.3133,
    longitude: -81.2546,
  };

  // Subscribe to trip updates and handle status changes
  useEffect(() => {
    if (!currentTrip?.id) return;

    const unsubscribe = subscribeToTrip(currentTrip.id);

    return () => unsubscribe();
  }, [currentTrip?.id]);

  // Handle trip status changes - navigate when driver starts the ride
  useEffect(() => {
    if (!currentTrip || hasNavigatedRef.current) return;

    // When driver starts the ride, navigate to trip-in-progress
    if (currentTrip.status === 'IN_PROGRESS') {
      console.log('🚗 Driver started the ride! Navigating to trip-in-progress...');
      hasNavigatedRef.current = true;
      router.replace('/(rider)/trip-in-progress');
      return;
    }

    // If trip was cancelled, go back
    if (currentTrip.status === 'CANCELLED') {
      console.log('❌ Trip was cancelled');
      hasNavigatedRef.current = true;
      Alert.alert(
        'Ride Cancelled',
        (currentTrip as any).cancelledBy === 'DRIVER'
          ? 'Your driver has cancelled this trip.'
          : 'The ride has been cancelled.',
        [{ text: 'OK', onPress: () => router.replace('/(rider)') }]
      );
      return;
    }
  }, [currentTrip?.status]);

  // Wait time counter (for display purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Call button removed for safety - use in-app messaging instead
  // Phone numbers are not shared between riders and drivers for privacy

  const handleMessage = () => {
    if (!driver || !currentTrip) return;
    setShowChatModal(true);
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
          onPress: async () => {
            try {
              if (currentTrip?.id) {
                await cancelTrip(currentTrip.id, 'RIDER', 'Rider cancelled at pickup point');
                console.log('✅ Trip cancelled');
              }
              router.replace('/(rider)');
            } catch (error) {
              console.error('❌ Failed to cancel trip:', error);
              Alert.alert('Error', 'Failed to cancel ride. Please try again.');
            }
          },
        },
      ]
    );
  };

  // If no driver info, show loading
  if (!driver) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Loading driver information...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {/* Pickup marker */}
          <Marker
            coordinate={pickupLocation}
            title="Pickup Point"
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="location" size={32} color="#10B981" />
            </View>
          </Marker>

          {/* Driver marker - show at pickup since driver has arrived */}
          <Marker
            coordinate={currentTrip.driverLocation ? {
              latitude: currentTrip.driverLocation.latitude,
              longitude: currentTrip.driverLocation.longitude,
            } : {
              latitude: pickupLocation.latitude + 0.0002,
              longitude: pickupLocation.longitude + 0.0002,
            }}
            title={driver.name}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <CarMarker
              heading={currentTrip.driverLocation?.heading || 0}
              size="medium"
            />
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
              Wait time: {formatTime(waitTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* Driver Info Card */}
      <View style={[styles.driverCard, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
        <View style={styles.driverHeader}>
          {driver.photo ? (
            <Image
              source={{ uri: driver.photo }}
              style={styles.driverPhoto}
            />
          ) : (
            <View style={[styles.driverPhoto, styles.driverPhotoPlaceholder]}>
              <Ionicons name="person" size={28} color="#5d1289ff" />
            </View>
          )}
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{driver.rating}</Text>
            </View>
          </View>

          {/* Message button only - call removed for safety */}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleMessage}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#5d1289ff" />
          </TouchableOpacity>
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

        {/* Waiting for driver to start info */}
        <View style={styles.waitingForDriverContainer}>
          <Ionicons name="hourglass-outline" size={20} color="#5d1289ff" />
          <Text style={styles.waitingForDriverText}>
            Waiting for driver to start the ride...
          </Text>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Modal */}
      {currentTrip && driver && user && (
        <ChatModal
          visible={showChatModal}
          tripId={currentTrip.id}
          userId={user.id}
          userName={user.name || 'Rider'}
          userPhoto={user.profilePhoto}
          userType="rider"
          otherUserName={driver.name}
          onClose={() => setShowChatModal(false)}
          isEnabled={true}
        />
      )}
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
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 12,
    color: '#5d1289ff',
    marginLeft: 8,
    flex: 1,
  },
  waitingForDriverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  waitingForDriverText: {
    fontSize: 14,
    color: '#5d1289ff',
    fontWeight: '500',
    marginLeft: 8,
  },
  driverPhotoPlaceholder: {
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});