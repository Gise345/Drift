import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function CancelRide() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const reasons = [
    'Rider requested cancellation',
    'Rider not responding',
    'Unsafe pickup location',
    'Vehicle issue',
    'Personal emergency',
    'Other',
  ];

  const handleCancel = () => {
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please select a cancellation reason');
      return;
    }
    if (selectedReason === 'Other' && !otherReason.trim()) {
      Alert.alert('Provide Reason', 'Please provide a reason for cancellation');
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => router.replace('/(driver)/dashboard/home'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningCard}>
          <Ionicons name="alert-circle" size={32} color={Colors.warning} />
          <Text style={styles.warningTitle}>Cancellation Policy</Text>
          <Text style={styles.warningText}>
            Frequent cancellations may affect your driver rating and account status.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Why are you cancelling?</Text>

        {reasons.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[
              styles.reasonCard,
              selectedReason === reason && styles.reasonCardSelected,
            ]}
            onPress={() => setSelectedReason(reason)}
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
          />
        )}

        <TouchableOpacity
          style={[styles.cancelButton, !selectedReason && styles.cancelButtonDisabled]}
          onPress={handleCancel}
          disabled={!selectedReason}
        >
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
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
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
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