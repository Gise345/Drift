import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface TripReceipt {
  id: string;
  date: string;
  time: string;
  riderName: string;
  pickup: string;
  destination: string;
  distance: number;
  duration: number;
  baseFare: number;
  tip: number;
  total: number;
  paymentMethod: string;
}

// Helper functions
const formatDate = (date: Date | undefined): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (date: Date | undefined): string => {
  if (!date) return 'N/A';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export default function TripReceiptScreen() {
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<TripReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tripId) {
      loadTripReceipt(tripId as string);
    } else {
      setError('No trip ID provided');
      setLoading(false);
    }
  }, [tripId]);

  const loadTripReceipt = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Loading trip receipt for:', id);

      const tripRef = doc(db, 'trips', id);
      const tripDoc = await getDoc(tripRef);

      if (!tripDoc.exists()) {
        setError('Trip not found');
        setLoading(false);
        return;
      }

      const data = tripDoc.data();
      if (!data) {
        setError('Trip data is empty');
        setLoading(false);
        return;
      }

      // Parse timestamps
      const completedAt = data.completedAt?.toDate?.() || data.completedAt;
      const requestedAt = data.requestedAt?.toDate?.() || data.requestedAt;

      // Get rider name
      let riderName = 'Rider';
      if (data.riderInfo?.name) {
        riderName = data.riderInfo.name;
      } else if (data.riderName) {
        riderName = data.riderName;
      } else if (data.riderId) {
        try {
          const userRef = doc(db, 'users', data.riderId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            riderName = userData?.name || userData?.firstName || 'Rider';
          }
        } catch (err) {
          console.warn('Could not fetch rider name:', err);
        }
      }

      // Calculate earnings
      const baseFare = data.finalCost || data.estimatedCost || 0;
      const tip = data.tip || 0;
      const total = baseFare + tip;

      const tripReceipt: TripReceipt = {
        id: tripDoc.id,
        date: formatDate(completedAt || requestedAt),
        time: formatTime(completedAt || requestedAt),
        riderName,
        pickup: data.pickup?.address || 'Unknown pickup',
        destination: data.destination?.address || 'Unknown destination',
        distance: (data.actualDistance || data.distance || 0) / 1000, // Convert to km
        duration: data.actualDuration || data.duration || 0,
        baseFare,
        tip,
        total,
        paymentMethod: data.paymentMethod || 'Card',
      };

      setTrip(tripReceipt);
    } catch (err) {
      console.error('❌ Error loading trip receipt:', err);
      setError('Failed to load trip receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!trip) return;

    try {
      await Share.share({
        message: `Drift Trip Receipt\n\nTrip #${trip.id.substring(0, 8).toUpperCase()}\nDate: ${trip.date}\nRider: ${trip.riderName}\n\nFrom: ${trip.pickup}\nTo: ${trip.destination}\n\nTotal Earned: CI$${trip.total.toFixed(2)}\n\nThank you for driving with Drift!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Receipt</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Receipt</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error || 'Receipt not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Image
              source={require('@/assets/images/drift-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.receiptTitle}>Trip Receipt</Text>
          <Text style={styles.tripId}>Trip #{trip.id.substring(0, 8).toUpperCase()}</Text>

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
                <Text style={styles.routeText} numberOfLines={2}>{trip.pickup}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.routeText} numberOfLines={2}>{trip.destination}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{trip.distance.toFixed(1)} km</Text>
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
            <Text style={styles.footerText}>Thank you for driving with Drift!</Text>
            <Text style={styles.footerSubtext}>Questions? Contact info@drift-global.com</Text>
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
  shareButton: { padding: Spacing.xs, width: 40 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  receipt: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    ...Colors.shadow,
  },
  logo: { alignItems: 'center', marginBottom: Spacing.md },
  logoImage: {
    width: 120,
    height: 60,
  },
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
  value: { ...Typography.body, color: Colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  routeContainer: { marginBottom: Spacing.sm },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.xs },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.sm, marginTop: 4 },
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
