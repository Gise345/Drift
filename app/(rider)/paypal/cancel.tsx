/**
 * PAYPAL CANCEL SCREEN
 * Handles redirect when user cancels PayPal payment
 * URL: drift://paypal/cancel?token=ORDER_ID
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCarpoolStore } from '@/src/stores/carpool-store';

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
  warning: '#F59E0B',
};

export default function PayPalCancelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { clearBookingFlow } = useCarpoolStore();

  useEffect(() => {
    const orderId = params.token as string;
    if (orderId) {
      console.log('❌ PayPal payment cancelled for order:', orderId);
    }
  }, []);

  const handleTryAgain = () => {
    // Go back to payment selection
    router.back();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride Request',
      'Are you sure you want to cancel this ride request?',
      [
        {
          text: 'No, Go Back',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            clearBookingFlow();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.warningCircle}>
            <Ionicons name="alert-circle" size={64} color={Colors.white} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Payment Cancelled</Text>

        {/* Message */}
        <Text style={styles.message}>
          You cancelled the PayPal payment. Your ride has not been requested yet.
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.gray[600]} />
          <Text style={styles.infoText}>
            No charges were made to your account. You can try again with a different payment method or cancel this ride request.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTryAgain}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Try Different Payment Method</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Cancel Ride Request</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  warningCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.gray[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 20,
    marginLeft: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.black,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[300],
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
});