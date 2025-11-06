import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';

const { width } = Dimensions.get('window');

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams();

  // Mock trip data
  const trip = {
    id: tripId,
    riderName: 'Sarah Johnson',
    riderPhoto: '👩‍💼',
    riderRating: 4.9,
    riderTrips: 127,
    pickup: {
      address: 'Grand Cayman Marriott Beach Resort',
      fullAddress: '389 West Bay Road, Seven Mile Beach',
      coords: { latitude: 19.3362, longitude: -81.4003 },
    },
    destination: {
      address: 'Owen Roberts International Airport',
      fullAddress: 'Roberts Drive, George Town',
      coords: { latitude: 19.2928, longitude: -81.3578 },
    },
    date: 'Nov 4, 2024',
    time: '2:30 PM',
    duration: 25,
    distance: 12.5,
    earnings: {
      base: 38.00,
      tip: 7.00,
      total: 45.00,
    },
    rating: 5,
    feedback: 'Great driver! Very friendly and professional.',
    status: 'completed',
    paymentMethod: 'Credit Card',
  };

  const routeCoords = [
    trip.pickup.coords,
    { latitude: 19.32, longitude: -81.39 },
    { latitude: 19.30, longitude: -81.37 },
    trip.destination.coords,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(driver)/history/trip-support',
              params: { tripId }
            })}
            style={styles.moreButton}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: (trip.pickup.coords.latitude + trip.destination.coords.latitude) / 2,
              longitude: (trip.pickup.coords.longitude + trip.destination.coords.longitude) / 2,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {/* Route line */}
            <Polyline
              coordinates={routeCoords}
              strokeColor={Colors.primary}
              strokeWidth={4}
            />
            
            {/* Pickup marker */}
            <Marker coordinate={trip.pickup.coords}>
              <View style={styles.markerContainer}>
                <View style={[styles.marker, { backgroundColor: Colors.primary }]}>
                  <Ionicons name="location" size={20} color={Colors.white} />
                </View>
              </View>
            </Marker>

            {/* Destination marker */}
            <Marker coordinate={trip.destination.coords}>
              <View style={styles.markerContainer}>
                <View style={[styles.marker, { backgroundColor: Colors.success }]}>
                  <Ionicons name="flag" size={20} color={Colors.white} />
                </View>
              </View>
            </Marker>
          </MapView>
        </View>

        {/* Rider Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rider Information</Text>
          <View style={styles.riderCard}>
            <Text style={styles.riderPhoto}>{trip.riderPhoto}</Text>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{trip.riderName}</Text>
              <View style={styles.riderStats}>
                <View style={styles.statBadge}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.statText}>{trip.riderRating}</Text>
                </View>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statText}>{trip.riderTrips} trips</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          {/* Route */}
          <View style={styles.routeCard}>
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeAddress}>{trip.pickup.address}</Text>
                <Text style={styles.routeFullAddress}>{trip.pickup.fullAddress}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Destination</Text>
                <Text style={styles.routeAddress}>{trip.destination.address}</Text>
                <Text style={styles.routeFullAddress}>{trip.destination.fullAddress}</Text>
              </View>
            </View>
          </View>

          {/* Trip Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{trip.date}</Text>
              <Text style={styles.statLabel}>Date</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{trip.duration} min</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{trip.distance} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningRow}>
              <Text style={styles.earningLabel}>Base Fare</Text>
              <Text style={styles.earningValue}>CI${trip.earnings.base.toFixed(2)}</Text>
            </View>
            {trip.earnings.tip > 0 && (
              <View style={styles.earningRow}>
                <View style={styles.tipLabelContainer}>
                  <Text style={styles.earningLabel}>Tip</Text>
                  <View style={styles.tipBadge}>
                    <Ionicons name="heart" size={12} color={Colors.error} />
                    <Text style={styles.tipBadgeText}>Thank you!</Text>
                  </View>
                </View>
                <Text style={[styles.earningValue, { color: Colors.success }]}>
                  +CI${trip.earnings.tip.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.earningRow}>
              <Text style={styles.totalLabel}>Total Earnings</Text>
              <Text style={styles.totalValue}>CI${trip.earnings.total.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentMethod}>
              <Ionicons name="card-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.paymentMethodText}>{trip.paymentMethod}</Text>
            </View>
          </View>
        </View>

        {/* Rating & Feedback */}
        {trip.rating > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.ratingCard}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= trip.rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= trip.rating ? Colors.warning : Colors.border}
                  />
                ))}
              </View>
              {trip.feedback && (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackText}>"{trip.feedback}"</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/(driver)/history/trip-receipt',
              params: { tripId }
            })}
          >
            <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>View Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/(driver)/history/trip-support',
              params: { tripId }
            })}
          >
            <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Get Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  moreButton: {
    padding: Spacing.xs,
  },
  mapContainer: {
    height: 250,
    width: '100%',
    backgroundColor: Colors.border,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  riderPhoto: {
    fontSize: 48,
    marginRight: Spacing.md,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  riderStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statDivider: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginHorizontal: 8,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Colors.shadow,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: Spacing.sm,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
    marginLeft: 5,
    marginVertical: Spacing.xs,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  routeAddress: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeFullAddress: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    ...Colors.shadow,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  earningsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  earningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  earningLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  earningValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  tipLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  tipBadgeText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    ...Typography.h3,
    color: Colors.text,
  },
  totalValue: {
    ...Typography.h2,
    color: Colors.success,
    fontWeight: '700',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  paymentMethodText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  ratingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    ...Colors.shadow,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  feedbackContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    width: '100%',
  },
  feedbackText: {
    ...Typography.body,
    color: Colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Colors.shadow,
  },
  actionButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
});