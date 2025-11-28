/**
 * PAYPAL SUCCESS SCREEN
 * Handles redirect after successful PayPal payment
 * URL: drift://paypal/success?token=ORDER_ID
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { capturePayPalPayment } from '@/src/services/paypal.service';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';

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

export default function PayPalSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { pickupLocation, destination, vehicleType, estimatedCost, clearBookingFlow } = useCarpoolStore();
  const { createTrip } = useTripStore();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    handlePaymentCapture();
  }, []);

  const handlePaymentCapture = async () => {
    try {
      // Get order ID from URL params
      const orderId = params.token as string;

      if (!orderId) {
        throw new Error('No order ID provided');
      }

      console.log('💳 Capturing PayPal payment:', orderId);

      // Capture the payment via Cloud Function
      const result = await capturePayPalPayment(orderId);

      console.log('✅ Payment captured:', result);

      setMessage('Payment successful! Creating your ride request...');

      // Create trip with payment details
      if (!user || !pickupLocation || !destination || !estimatedCost) {
        throw new Error('Missing trip information');
      }

      const tripId = await createTrip({
        riderId: user.id,
        riderName: user.name || 'Rider',
        riderPhoto: user.profilePhoto,
        riderProfileRating: user.rating || 5.0,
        status: 'REQUESTED',
        pickup: {
          address: pickupLocation.address || '',
          coordinates: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
          placeName: (pickupLocation as any).placeName || pickupLocation.address || '',
        },
        destination: {
          address: destination.address || '',
          coordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
          placeName: (destination as any).placeName || destination.address || '',
        },
        vehicleType: vehicleType || 'standard',
        distance: (pickupLocation as any).distance || 0,
        duration: (pickupLocation as any).duration || 0,
        estimatedCost: estimatedCost.max || 0,
        paymentMethod: `paypal:${result.orderId}:${result.captureId}`,
        paymentStatus: 'COMPLETED',
        requestedAt: new Date(),
      } as any);

      console.log('✅ Trip created:', tripId);

      setStatus('success');
      setMessage('Payment successful!');

      // Wait a moment then navigate to finding driver
      setTimeout(() => {
        router.replace('/(rider)/finding-driver');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Payment capture failed:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to process payment');

      Alert.alert(
        'Payment Error',
        'There was a problem processing your payment. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => router.back(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              clearBookingFlow();
              router.replace('/(tabs)');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          {status === 'processing' && (
            <ActivityIndicator size="large" color={Colors.primary} />
          )}
          {status === 'success' && (
            <View style={[styles.iconCircle, styles.successCircle]}>
              <Ionicons name="checkmark" size={48} color={Colors.white} />
            </View>
          )}
          {status === 'error' && (
            <View style={[styles.iconCircle, styles.errorCircle]}>
              <Ionicons name="close" size={48} color={Colors.white} />
            </View>
          )}
        </View>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {status === 'processing' && (
          <Text style={styles.subMessage}>
            Please wait while we confirm your payment with PayPal...
          </Text>
        )}

        {status === 'success' && (
          <Text style={styles.subMessage}>
            Redirecting you to find a driver...
          </Text>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    backgroundColor: Colors.success,
  },
  errorCircle: {
    backgroundColor: Colors.error,
  },
  message: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 12,
  },
  subMessage: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});