import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { cancelTrip, cancelTripWithFee } from '@/src/services/ride-request.service';

export default function CancelRide() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeRide, setActiveRide, driver } = useDriverStore();
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Get driver ID from driver profile
  const driverId = driver?.id;

  // Check if driver has arrived (status is 'arrived' or later)
  const hasDriverArrived = activeRide?.status === 'arrived' ||
                          activeRide?.status === 'started' ||
                          activeRide?.status === 'in_progress' ||
                          activeRide?.arrivedAt !== undefined;

  // Calculate estimated cancellation fee (50% of trip cost)
  const estimatedCost = activeRide?.estimatedEarnings || 0;
  const cancellationFeeAmount = hasDriverArrived ? Math.round((estimatedCost * 0.5) * 100) / 100 : 0;

  const reasons = [
    'Rider requested cancellation',
    'Rider not responding',
    'Unsafe pickup location',
    'Vehicle issue',
    'Personal emergency',
    'Other',
  ];

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please select a cancellation reason');
      return;
    }
    if (selectedReason === 'Other' && !otherReason.trim()) {
      Alert.alert('Provide Reason', 'Please provide a reason for cancellation');
      return;
    }

    const finalReason = selectedReason === 'Other' ? otherReason.trim() : selectedReason;
    const confirmMessage = hasDriverArrived
      ? `You will receive a CI$${cancellationFeeAmount.toFixed(2)} cancellation fee (50% of fare) for your time, effort and gas.`
      : 'Are you sure you want to cancel this ride?';

    Alert.alert(
      'Confirm Cancellation',
      confirmMessage,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              if (!activeRide?.id) {
                throw new Error('No active ride found');
              }

              if (hasDriverArrived && driverId) {
                // Cancel with fee - rider pays 50%
                const { cancellationFee } = await cancelTripWithFee(
                  activeRide.id,
                  'RIDER',
                  finalReason,
                  driverId
                );
                console.log('✅ Trip cancelled with fee:', cancellationFee);

                // Clear local state
                setActiveRide(null);

                Alert.alert(
                  'Ride Cancelled',
                  `You will receive CI$${cancellationFee.toFixed(2)} for this cancellation.`,
                  [{ text: 'OK', onPress: () => router.replace('/(driver)/dashboard/home') }]
                );
              } else {
                // Regular cancellation - no fee
                await cancelTrip(activeRide.id, 'DRIVER', finalReason);
                console.log('✅ Trip cancelled without fee');

                // Clear local state
                setActiveRide(null);

                router.replace('/(driver)/dashboard/home');
              }
            } catch (error) {
              console.error('Failed to cancel trip:', error);
              Alert.alert('Error', 'Failed to cancel the ride. Please try again.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isCancelling}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 }
        ]}
      >
        {/* Show cancellation fee warning if driver has arrived */}
        {hasDriverArrived ? (
          <View style={styles.feeCard}>
            <Ionicons name="cash-outline" size={32} color={Colors.success} />
            <Text style={styles.feeTitle}>Cancellation Fee Applies</Text>
            <Text style={styles.feeText}>
              Since you've arrived at the pickup location, the rider will be charged 50% of the fare.
            </Text>
            <View style={styles.feeAmount}>
              <Text style={styles.feeLabel}>Your earnings:</Text>
              <Text style={styles.feeValue}>CI${cancellationFeeAmount.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle" size={32} color={Colors.warning} />
            <Text style={styles.warningTitle}>Cancellation Policy</Text>
            <Text style={styles.warningText}>
              Frequent cancellations may affect your driver rating and account status.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Why are you cancelling?</Text>

        {reasons.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[
              styles.reasonCard,
              selectedReason === reason && styles.reasonCardSelected,
            ]}
            onPress={() => setSelectedReason(reason)}
            disabled={isCancelling}
          >
            <View style={styles.radioButton}>
              {selectedReason === reason && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.reasonText}>{reason}</Text>
          </TouchableOpacity>
        ))}

        {selectedReason === 'Other' && (
          <TextInput
            style={styles.otherInput}
            value={otherReason}
            onChangeText={setOtherReason}
            placeholder="Please specify the reason..."
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.gray[400]}
            editable={!isCancelling}
          />
        )}

        <TouchableOpacity
          style={[
            styles.cancelButton,
            (!selectedReason || isCancelling) && styles.cancelButtonDisabled
          ]}
          onPress={handleCancel}
          disabled={!selectedReason || isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.cancelButtonText}>
              {hasDriverArrived ? `Cancel & Receive CI$${cancellationFeeAmount.toFixed(2)}` : 'Cancel Ride'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  content: { paddingHorizontal: Spacing.xl },
  warningCard: {
    backgroundColor: Colors.warning + '10',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  warningTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    textAlign: 'center',
  },
  // Cancellation fee card styles
  feeCard: {
    backgroundColor: Colors.success + '10',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  feeTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  feeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  feeAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    gap: 8,
  },
  feeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  feeValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.success,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  reasonCardSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  reasonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.black,
  },
  otherInput: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.sm,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cancelButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  cancelButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});