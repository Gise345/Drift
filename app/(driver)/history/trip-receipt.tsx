import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';

export default function TripReceiptScreen() {
  const { tripId } = useLocalSearchParams();

  const trip = {
    id: tripId,
    date: 'Nov 4, 2024',
    time: '2:30 PM',
    riderName: 'Sarah Johnson',
    pickup: 'Grand Cayman Marriott Beach Resort',
    destination: 'Owen Roberts International Airport',
    distance: 12.5,
    duration: 25,
    baseFare: 38.00,
    tip: 7.00,
    total: 45.00,
    paymentMethod: 'Credit Card',
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Drift Trip Receipt\n\nTrip #${trip.id}\nDate: ${trip.date}\nRider: ${trip.riderName}\n\nFrom: ${trip.pickup}\nTo: ${trip.destination}\n\nTotal Earned: CI$${trip.total.toFixed(2)}\n\nThank you for using Drift!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Receipt</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.receipt}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🚗</Text>
            <Text style={styles.brandName}>Drift</Text>
          </View>
          
          <Text style={styles.receiptTitle}>Trip Receipt</Text>
          <Text style={styles.tripId}>Trip #{trip.id}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{trip.date}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>{trip.time}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Rider</Text>
              <Text style={styles.value}>{trip.riderName}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route</Text>
            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.routeText}>{trip.pickup}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.routeText}>{trip.destination}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{trip.distance} km</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>{trip.duration} minutes</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earnings</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Base Fare</Text>
              <Text style={styles.value}>CI${trip.baseFare.toFixed(2)}</Text>
            </View>
            {trip.tip > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Tip</Text>
                <Text style={[styles.value, { color: Colors.success }]}>+CI${trip.tip.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Earned</Text>
              <Text style={styles.totalValue}>CI${trip.total.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment Method</Text>
              <Text style={styles.value}>{trip.paymentMethod}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for using Drift!</Text>
            <Text style={styles.footerSubtext}>Questions? Contact support@drift.ky</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>Share Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: { padding: Spacing.xs },
  headerTitle: { ...Typography.h2, color: Colors.text },
  shareButton: { padding: Spacing.xs },
  receipt: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    ...Colors.shadow,
  },
  logo: { alignItems: 'center', marginBottom: Spacing.md },
  logoText: { fontSize: 48, marginBottom: Spacing.xs },
  brandName: { ...Typography.h2, color: Colors.primary, fontWeight: '700' },
  receiptTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  tripId: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: { ...Typography.body, color: Colors.textSecondary },
  value: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  routeContainer: { marginBottom: Spacing.sm },
  routePoint: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.sm },
  routeText: { ...Typography.body, color: Colors.text, flex: 1 },
  routeLine: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginBottom: Spacing.xs },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  totalRow: { marginTop: Spacing.xs },
  totalLabel: { ...Typography.h3, color: Colors.text },
  totalValue: { ...Typography.h2, color: Colors.success, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { ...Typography.body, color: Colors.text, marginBottom: 4 },
  footerSubtext: { ...Typography.caption, color: Colors.textSecondary },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    ...Colors.shadow,
  },
  actionButtonText: { ...Typography.body, color: Colors.white, fontWeight: '600' },
});