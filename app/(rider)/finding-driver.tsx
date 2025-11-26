import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useTripStore } from '@/src/stores/trip-store';
import { cancelTrip } from '@/src/services/ride-request.service';

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

export default function FindingDriverScreen() {
  const router = useRouter();
  const { vehicleType, estimatedCost, destination, clearBookingFlow } = useCarpoolStore();

  // Get current trip from store - subscribe to full object to catch all changes
  const currentTrip = useTripStore((state) => state.currentTrip);
  const subscribeToTrip = useTripStore((state) => state.subscribeToTrip);

  const [searchStatus, setSearchStatus] = useState<string>('Searching for available drivers...');
  const [pulseAnim] = useState(new Animated.Value(1));

  // Debug: Log trip changes
  useEffect(() => {
    console.log('🔍 FindingDriver - currentTrip changed:', {
      id: currentTrip?.id,
      status: currentTrip?.status,
      driverInfo: currentTrip?.driverInfo?.name || 'None',
    });
  }, [currentTrip]);

  useEffect(() => {
    // Animated pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Track if we've already navigated to prevent duplicate navigation
  const hasNavigatedRef = React.useRef(false);
  // Track the currently subscribed trip ID to prevent duplicate subscriptions
  const subscribedTripIdRef = React.useRef<string | null>(null);

  // Listen for trip status changes in real-time
  useEffect(() => {
    if (!currentTrip?.id) {
      console.log('⚠️ No current trip to monitor');
      return;
    }

    // Prevent duplicate subscription to the same trip
    if (subscribedTripIdRef.current === currentTrip.id) {
      console.log('⚠️ Already subscribed to trip:', currentTrip.id);
      return;
    }

    console.log('👀 Starting to monitor trip:', currentTrip.id);
    setSearchStatus('Searching for available drivers...');
    hasNavigatedRef.current = false; // Reset navigation flag for new trip
    subscribedTripIdRef.current = currentTrip.id;

    // Subscribe to trip updates from Firebase
    const unsubscribe = subscribeToTrip(currentTrip.id);

    return () => {
      console.log('🔔 Unsubscribing from trip:', currentTrip.id);
      subscribedTripIdRef.current = null;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentTrip?.id]);

  // Handle trip status changes - this is the main effect that navigates when driver accepts
  useEffect(() => {
    if (!currentTrip) {
      console.log('📍 No current trip in status handler');
      return;
    }

    const status = currentTrip.status;
    const driverName = currentTrip.driverInfo?.name || 'None';

    console.log('📍 Status handler triggered:', { status, driverName, hasNavigated: hasNavigatedRef.current });

    // Prevent duplicate navigation
    if (hasNavigatedRef.current) {
      console.log('⚠️ Already navigated, skipping status handler');
      return;
    }

    // Handle different statuses
    if (status === 'REQUESTED') {
      setSearchStatus('Looking for nearby drivers...');
      return;
    }

    if (status === 'ACCEPTED' || status === 'DRIVER_ARRIVING') {
      console.log('🚗🚗🚗 DRIVER FOUND! Navigating to driver-arriving screen...');
      console.log('Driver info:', currentTrip.driverInfo);
      setSearchStatus('Driver found! Preparing trip details...');
      hasNavigatedRef.current = true; // Mark as navigated BEFORE setTimeout

      // Navigate immediately
      router.replace('/(rider)/driver-arriving');
      return;
    }

    if (status === 'CANCELLED') {
      console.log('❌ Trip was cancelled');
      hasNavigatedRef.current = true;
      Alert.alert('Trip Cancelled', 'The trip has been cancelled.');
      clearBookingFlow();
      router.back();
      return;
    }

    console.log('⚠️ Unhandled trip status:', status);
  }, [currentTrip]); // Listen to full currentTrip object, not just status

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              if (currentTrip?.id) {
                await cancelTrip(currentTrip.id, 'RIDER', 'Rider cancelled request');
                console.log('✅ Trip cancelled in Firebase');
              }
              clearBookingFlow();
              router.back();
            } catch (error) {
              console.error('❌ Failed to cancel trip:', error);
              // Still go back even if cancel fails
              clearBookingFlow();
              router.back();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Finding Your Ride</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Animated Car Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.carIcon}>🚗</Text>
          </Animated.View>

          {/* Status Text */}
          <Text style={styles.status}>{searchStatus}</Text>

          {/* Loading Indicator */}
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={styles.loader}
          />

          {/* Trip Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {destination?.address || 'Selected location'}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle Type</Text>
              <Text style={styles.detailValue}>
                {vehicleType === 'economy' && 'Drift Economy'}
                {vehicleType === 'standard' && 'Drift Standard'}
                {vehicleType === 'comfort' && 'Drift Comfort'}
                {vehicleType === 'xl' && 'Drift XL'}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Cost</Text>
              <Text style={styles.detailValue}>
                ${estimatedCost?.min}-{estimatedCost?.max} {estimatedCost?.currency}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              💡 We're finding the best available driver for your route. This usually takes less than a minute.
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: Colors.black,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  carIcon: {
    fontSize: 60,
  },
  status: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 16,
  },
  loader: {
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 4,
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 13,
    color: Colors.gray[700],
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
});