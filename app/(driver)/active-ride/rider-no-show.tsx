import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { cancelTripWithFee } from '@/src/services/ride-request.service';

export default function RiderNoShow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeRide, setActiveRide, driver } = useDriverStore();
  const [waitTime] = useState('5:12');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get driver ID from driver profile
  const driverId = driver?.id;

  // Calculate the cancellation fee (50% of Trip Contribution)
  const estimatedCost = activeRide?.estimatedEarnings || 0;
  const cancellationFee = Math.round((estimatedCost * 0.5) * 100) / 100;

  const handleConfirmNoShow = async () => {
    if (!activeRide?.id || !driverId) {
      Alert.alert('Error', 'Unable to process no-show. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const { cancellationFee: fee } = await cancelTripWithFee(
        activeRide.id,
        'RIDER',
        'Rider no-show at pickup location',
        driverId
      );

      setActiveRide(null);

      Alert.alert(
        'No-Show Confirmed',
        `You will receive CI$${fee.toFixed(2)} for waiting at the pickup location.`,
        [{ text: 'OK', onPress: () => router.replace('/(driver)/tabs') }]
      );
    } catch (error) {
      console.error('Failed to process no-show:', error);
      Alert.alert('Error', 'Failed to process no-show. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.icon}>
          <Ionicons name="time-outline" size={80} color={Colors.warning} />
        </View>

        <Text style={styles.title}>Rider No-Show</Text>
        <Text style={styles.subtitle}>
          You've waited {waitTime} for the rider to arrive
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.success} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Cancellation Fee (50%)</Text>
            <Text style={styles.infoDescription}>
              You'll receive 50% of the Trip Contribution for your time, effort, and gas spent waiting at the pickup location.
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Wait Time</Text>
            <Text style={styles.statValue}>{waitTime}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Your Earnings</Text>
            <Text style={[styles.statValue, styles.earningsValue]}>CI${cancellationFee.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, isProcessing && styles.confirmButtonDisabled]}
          onPress={handleConfirmNoShow}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.confirmText}>Confirm No-Show & Receive CI${cancellationFee.toFixed(2)}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Text style={styles.backText}>Wait Longer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'] },
  icon: { alignItems: 'center', marginBottom: Spacing.xl },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoText: { flex: 1, marginLeft: Spacing.md },
  infoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  infoDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statLabel: { fontSize: Typography.fontSize.sm, color: Colors.gray[600] },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  earningsValue: {
    color: Colors.success,
    fontSize: Typography.fontSize.lg,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  confirmText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  backButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  backText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
});