import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function PaymentReceived() {
  const router = useRouter();

  const handleRateRider = () => {
    router.push('/(driver)/active-ride/rate-rider');
  };

  const handleFinish = () => {
    router.replace('/(driver)/dashboard/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={100} color={Colors.success} />
        </View>

        <Text style={styles.title}>Payment Received!</Text>
        <Text style={styles.subtitle}>Great job completing this ride</Text>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>You Earned</Text>
          <Text style={styles.earningsAmount}>CI$18.50</Text>
          <View style={styles.earningsBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base Fare</Text>
              <Text style={styles.breakdownValue}>CI$15.00</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Tip</Text>
              <Text style={styles.breakdownValue}>CI$3.50</Text>
            </View>
          </View>
        </View>

        {/* Trip Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="navigate" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>4.2 km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>12 min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        {/* Rate Rider */}
        <TouchableOpacity style={styles.rateButton} onPress={handleRateRider}>
          <Ionicons name="star" size={20} color={Colors.white} />
          <Text style={styles.rateText}>Rate Rider</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
  successIcon: { alignItems: 'center', marginBottom: Spacing.xl },
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
  earningsCard: {
    backgroundColor: Colors.success + '15',
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  earningsAmount: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '700',
    color: Colors.success,
    marginBottom: Spacing.lg,
  },
  earningsBreakdown: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[300],
    paddingTop: Spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  breakdownValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginTop: 4,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  rateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  finishButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  finishText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
});