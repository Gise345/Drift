import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function RequestDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { incomingRequests, acceptRequest, declineRequest } = useDriverStore();
  const [timeRemaining, setTimeRemaining] = useState(15);

  const request = incomingRequests.find((r) => r.id === id);

  useEffect(() => {
    if (!request) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((request.expiresAt.getTime() - Date.now()) / 1000)
      );
      setTimeRemaining(remaining);

      if (remaining === 0) {
        Alert.alert('Request Expired', 'This ride request has expired.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [request]);

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.gray[300]} />
          <Text style={styles.errorText}>Request not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAccept = async () => {
    await acceptRequest(request.id);
    router.replace('/(driver)/active-ride/navigate-to-pickup');
  };

  const handleDecline = async () => {
    Alert.alert('Decline Request', 'Are you sure you want to decline this ride request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          await declineRequest(request.id, 'Driver declined');
          router.back();
        },
      },
    ]);
  };

  const isExpiringSoon = timeRemaining <= 5;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Timer Alert */}
        <View style={[styles.timerAlert, isExpiringSoon && styles.timerAlertExpiring]}>
          <Ionicons
            name="time-outline"
            size={24}
            color={isExpiringSoon ? Colors.error : Colors.primary}
          />
          <View style={styles.timerInfo}>
            <Text style={[styles.timerLabel, isExpiringSoon && { color: Colors.error }]}>
              {isExpiringSoon ? 'EXPIRING SOON!' : 'Time Remaining'}
            </Text>
            <Text style={[styles.timerValue, isExpiringSoon && { color: Colors.error }]}>
              {timeRemaining} seconds
            </Text>
          </View>
          <View
            style={[
              styles.timerProgress,
              { width: `${(timeRemaining / 15) * 100}%` },
              isExpiringSoon && { backgroundColor: Colors.error },
            ]}
          />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: (request.pickup.lat + request.destination.lat) / 2,
              longitude: (request.pickup.lng + request.destination.lng) / 2,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={{ latitude: request.pickup.lat, longitude: request.pickup.lng }}
              title="Pickup"
              pinColor={Colors.success}
            />
            <Marker
              coordinate={{
                latitude: request.destination.lat,
                longitude: request.destination.lng,
              }}
              title="Destination"
              pinColor={Colors.error}
            />
          </MapView>
        </View>

        {/* Earnings */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Estimated Earnings</Text>
          <Text style={styles.earningsAmount}>CI${request.estimatedEarnings.toFixed(2)}</Text>
          <Text style={styles.earningsNote}>
            Including base fare + distance + voluntary cost-sharing
          </Text>
        </View>

        {/* Rider Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rider Information</Text>
          <View style={styles.riderCard}>
            <Ionicons name="person-circle" size={56} color={Colors.primary} />
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{request.riderName}</Text>
              <View style={styles.riderStats}>
                <View style={styles.riderStat}>
                  <Ionicons name="star" size={16} color={Colors.primary} />
                  <Text style={styles.riderStatText}>{request.riderRating} rating</Text>
                </View>
                <Text style={styles.statDivider}>•</Text>
                <View style={styles.riderStat}>
                  <Ionicons name="car" size={16} color={Colors.gray[600]} />
                  <Text style={styles.riderStatText}>{(request as any).riderTrips || 0} trips</Text>
                </View>
              </View>
              <View style={styles.passengerInfo}>
                <Ionicons name="people" size={16} color={Colors.gray[600]} />
                <Text style={styles.passengerText}>{(request as any).passengers || 1} passengers</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={styles.locationIconContainer}>
                <Ionicons name="location" size={20} color={Colors.success} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress}>{request.pickup.address}</Text>
              </View>
            </View>

            <View style={styles.routeDivider}>
              <View style={styles.routeLine} />
            </View>

            <View style={styles.locationRow}>
              <View style={styles.locationIconContainer}>
                <Ionicons name="location" size={20} color={Colors.error} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationAddress}>{request.destination.address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripMetrics}>
            <View style={styles.metricItem}>
              <Ionicons name="navigate" size={20} color={Colors.primary} />
              <Text style={styles.metricValue}>
                {(Math.random() * 5 + 0.5).toFixed(1)} km
              </Text>
              <Text style={styles.metricLabel}>Distance</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Ionicons name="time" size={20} color={Colors.primary} />
              <Text style={styles.metricValue}>{request.estimatedDuration} min</Text>
              <Text style={styles.metricLabel}>Duration</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Ionicons name="cash" size={20} color={Colors.primary} />
              <Text style={styles.metricValue}>
                CI${(request.estimatedEarnings / request.estimatedDuration).toFixed(2)}
              </Text>
              <Text style={styles.metricLabel}>Per Minute</Text>
            </View>
          </View>
        </View>

        {/* Special Notes */}
        {(request as any).notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Notes</Text>
            <View style={styles.notesCard}>
              <Ionicons name="document-text" size={20} color={Colors.primary} />
              <Text style={styles.notesText}>{(request as any).notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
            <Text style={styles.acceptText}>Accept Ride</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  timerAlert: {
    backgroundColor: Colors.primary + '15',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 16,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  timerAlertExpiring: {
    backgroundColor: Colors.error + '15',
  },
  timerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  timerLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  timerValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  timerProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: Colors.primary,
  },
  mapContainer: {
    height: 250,
    marginBottom: Spacing.lg,
  },
  map: {
    flex: 1,
  },
  earningsCard: {
    backgroundColor: Colors.success + '15',
    marginHorizontal: Spacing.xl,
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
  earningsAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  earningsNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  riderCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  riderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  riderName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  riderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  riderStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  riderStatText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  statDivider: {
    marginHorizontal: Spacing.sm,
    color: Colors.gray[400],
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  passengerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  locationCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.gray[300],
    marginLeft: 15,
  },
  tripMetrics: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.black,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Spacing.md,
  },
  notesCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: Spacing.md,
  },
  notesText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginLeft: Spacing.md,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
  },
  declineText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.error,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
  },
  acceptText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.gray[600],
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});