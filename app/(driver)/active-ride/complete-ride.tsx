import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

export default function CompleteRide() {
  const router = useRouter();
  const { activeRide } = useDriverStore();
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [notes, setNotes] = useState('');

  if (!activeRide) {
    router.replace('/(driver)/dashboard/home');
    return null;
  }

  const baseFare = activeRide.estimatedEarnings;
  const additional = parseFloat(additionalCharges) || 0;
  const totalEarnings = baseFare + additional;

  const handleComplete = () => {
    router.replace('/(driver)/active-ride/payment-received');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        </View>
        <Text style={styles.title}>Trip Completed!</Text>
        <Text style={styles.subtitle}>Review the trip details before finishing</Text>

        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Fare</Text>
            <Text style={styles.summaryValue}>CI${baseFare.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>4.2 km</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>12 min</Text>
          </View>
        </View>

        {/* Additional Charges */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Additional Charges (Optional)</Text>
          <TextInput
            style={styles.input}
            value={additionalCharges}
            onChangeText={setAdditionalCharges}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={Colors.gray[400]}
          />
        </View>

        {/* Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Trip Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes about this trip..."
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.gray[400]}
          />
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalValue}>CI${totalEarnings.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeText}>Finish Trip</Text>
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
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  successIcon: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.lg },
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
  summaryCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  summaryLabel: { fontSize: Typography.fontSize.sm, color: Colors.gray[600] },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  inputSection: { marginBottom: Spacing.lg },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  totalCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  totalValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.primary,
  },
  completeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  completeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});