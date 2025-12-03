/**
 * Trip Complete Screen - Rider
 * Shows trip summary after completion
 *
 * Features:
 * - Trip summary with actual data from Firebase
 * - Rate driver option
 * - Navigate back to home
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '@/src/stores/trip-store';

const Colors = {
  primary: '#5d1289',
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
};

export default function TripCompleteScreen() {
  const router = useRouter();
  const { currentTrip, setCurrentTrip } = useTripStore();

  // Clear trip when leaving this screen
  useEffect(() => {
    return () => {
      // Cleanup on unmount
    };
  }, []);

  // If no trip data, use placeholder
  const trip = currentTrip || {
    id: 'N/A',
    driverInfo: { name: 'Driver', rating: 4.5 },
    pickup: { address: 'Pickup location' },
    destination: { address: 'Destination' },
    distance: 0,
    duration: 0,
    finalCost: 0,
    estimatedCost: 0,
    tip: 0,
    totalWithTip: 0,
  };

  const driver = trip.driverInfo;
  const tripCost = trip.finalCost || trip.estimatedCost || 0;
  const tipAmount = trip.tip || 0;
  const totalPaid = trip.totalWithTip || tripCost + tipAmount;
  const distance = trip.distance ? (trip.distance / 1000).toFixed(1) : '0';
  const duration = trip.duration ? Math.round(trip.duration) : 0;

  const handleDone = () => {
    setCurrentTrip(null);
    router.replace('/(tabs)');
  };

  const handleRate = () => {
    router.push('/(rider)/rate-driver');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={48} color={Colors.white} />
            </View>
            <Text style={styles.successTitle}>Trip Complete!</Text>
            <Text style={styles.successSubtitle}>
              Thanks for riding with Drift
            </Text>
          </View>

          {/* Driver Card */}
          {driver && (
            <View style={styles.driverCard}>
              <View style={styles.driverHeader}>
                {(driver as any).photo ? (
                  <Image source={{ uri: (driver as any).photo }} style={styles.driverPhoto} />
                ) : (
                  <View style={styles.driverPhotoPlaceholder}>
                    <Ionicons name="person" size={28} color={Colors.primary} />
                  </View>
                )}
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.name || 'Your Driver'}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#f39c12" />
                    <Text style={styles.ratingText}>{driver.rating?.toFixed(1) || '4.5'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.rateDriverBtn} onPress={handleRate}>
                  <Ionicons name="star-outline" size={20} color={Colors.primary} />
                  <Text style={styles.rateDriverText}>Rate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Trip Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Trip Summary</Text>

            {/* Route */}
            <View style={styles.routeSection}>
              <View style={styles.routeRow}>
                <View style={styles.routeDot} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>PICKUP</Text>
                  <Text style={styles.routeAddress} numberOfLines={1}>
                    {trip.pickup?.address || 'Pickup location'}
                  </Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, styles.routeDotDestination]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>DROP-OFF</Text>
                  <Text style={styles.routeAddress} numberOfLines={1}>
                    {trip.destination?.address || 'Destination'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="navigate-outline" size={20} color={Colors.gray[500]} />
                <Text style={styles.statValue}>{distance} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color={Colors.gray[500]} />
                <Text style={styles.statValue}>{duration} min</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Cost Breakdown */}
            <View style={styles.costSection}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Trip Contribution</Text>
                <Text style={styles.costValue}>CI${tripCost.toFixed(2)}</Text>
              </View>
              {tipAmount > 0 && (
                <View style={styles.costRow}>
                  <View style={styles.tipRow}>
                    <Ionicons name="heart" size={14} color={Colors.success} />
                    <Text style={[styles.costLabel, styles.tipText]}>Tip</Text>
                  </View>
                  <Text style={[styles.costValue, styles.tipValue]}>CI${tipAmount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalAmount}>CI${totalPaid.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRate}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="star" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Rate Driver</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(rider)/my-trips')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>View Trip History</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Done Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.success + '10',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.gray[600],
  },
  driverCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  driverPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  rateDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rateDriverText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
  },
  routeSection: {
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginTop: 4,
    marginRight: 12,
  },
  routeDotDestination: {
    backgroundColor: Colors.error,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.gray[300],
    marginLeft: 5,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gray[500],
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: Colors.black,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    alignSelf: 'stretch',
    marginHorizontal: 16,
  },
  costSection: {},
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipText: {
    color: Colors.success,
    fontWeight: '600',
  },
  tipValue: {
    color: Colors.success,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginLeft: 68,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    padding: 16,
    paddingBottom: 32,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
