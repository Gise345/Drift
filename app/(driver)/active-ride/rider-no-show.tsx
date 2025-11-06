import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function RiderNoShow() {
  const router = useRouter();
  const [waitTime] = useState('5:12');

  const handleConfirmNoShow = () => {
    router.replace('/(driver)/dashboard/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="time-outline" size={80} color={Colors.warning} />
        </View>

        <Text style={styles.title}>Rider No-Show</Text>
        <Text style={styles.subtitle}>
          You've waited {waitTime} for the rider to arrive
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Cancellation Fee</Text>
            <Text style={styles.infoDescription}>
              You'll receive a CI$5.00 cancellation fee for waiting at the pickup location.
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Wait Time</Text>
            <Text style={styles.statValue}>{waitTime}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cancellation Fee</Text>
            <Text style={styles.statValue}>CI$5.00</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmNoShow}>
          <Text style={styles.confirmText}>Confirm No-Show</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
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