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

export default function TripSummary() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Summary</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Trip Status */}
        <View style={styles.statusBanner}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
          <Text style={styles.statusText}>Trip Completed</Text>
        </View>

        {/* Earnings */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earned</Text>
          <Text style={styles.earningsValue}>CI$18.50</Text>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={Colors.gray[600]} />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>Nov 5, 2025 • 2:30 PM</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="navigate" size={16} color={Colors.gray[600]} />
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>4.2 km</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={Colors.gray[600]} />
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>12 minutes</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color={Colors.gray[600]} />
            <Text style={styles.detailLabel}>Rider</Text>
            <Text style={styles.detailValue}>Sarah Miller</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeCard}>
          <Text style={styles.sectionTitle}>Route</Text>
          
          <View style={styles.routePoint}>
            <Ionicons name="location" size={20} color={Colors.success} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddress}>George Town Harbour</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <Ionicons name="location" size={20} color={Colors.error} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeAddress}>Seven Mile Beach</Text>
            </View>
          </View>
        </View>

        {/* Payment Breakdown */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment</Text>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Base Fare</Text>
            <Text style={styles.paymentValue}>CI$15.00</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tip</Text>
            <Text style={styles.paymentValue}>CI$3.50</Text>
          </View>
          <View style={[styles.paymentRow, styles.paymentTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>CI$18.50</Text>
          </View>
        </View>
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.success + '15',
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.success,
  },
  earningsCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  earningsValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.primary,
  },
  detailsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailLabel: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginLeft: Spacing.sm,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  routeCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  routeLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.gray[300],
    marginLeft: 9,
    marginVertical: Spacing.xs,
  },
  paymentCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  paymentLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  paymentValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  paymentTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[300],
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  totalValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.primary,
  },
});