import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

const { width } = Dimensions.get('window');

interface StopData {
  name: string;
  address: string;
  coords: { latitude: number; longitude: number };
  completed: boolean;
}

interface TripData {
  id: string;
  riderName: string;
  riderPhoto?: string;
  riderRating: number;
  riderTrips: number;
  pickup: {
    address: string;
    fullAddress: string;
    coords: { latitude: number; longitude: number };
  };
  destination: {
    address: string;
    fullAddress: string;
    coords: { latitude: number; longitude: number };
  };
  stops: StopData[];
  date: string;
  time: string;
  duration: number;
  distance: number;
  earnings: {
    base: number;        // Driver's 80% share
    grossFare: number;   // Original fare before split
    platformFee: number; // 20% platform fee
    tip: number;
    total: number;       // Driver's total (80% + tips)
  };
  rating: number;
  feedback?: string;
  status: string;
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

export default function TripDetailScreen() {
  const params = useLocalSearchParams();
  // Accept both 'tripId' and 'id' as parameter names for flexibility
  const tripId = params.tripId || params.id;
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tripId) {
      loadTripDetails(tripId as string);
    } else {
      setError('No trip ID provided');
      setLoading(false);
    }
  }, [tripId]);

  const loadTripDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Loading driver trip details for:', id);

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

      console.log('📋 Trip data loaded:', data.status);

      // Parse timestamps
      const requestedAt = data.requestedAt?.toDate?.() || data.requestedAt;
      const completedAt = data.completedAt?.toDate?.() || data.completedAt;

      // Get rider info - check multiple possible fields
      let riderName = 'Rider';
      let riderRating = 5.0;
      let riderPhoto: string | undefined;

      if (data.riderInfo?.name) {
        riderName = data.riderInfo.name;
        riderRating = data.riderInfo.rating || 5.0;
        riderPhoto = data.riderInfo.photoUrl || data.riderInfo.photo;
      } else if (data.riderName) {
        riderName = data.riderName;
        riderRating = data.riderRating || data.riderProfileRating || 5.0;
        riderPhoto = data.riderPhoto;
      } else if (data.riderId) {
        // Fetch from users collection using modular API
        try {
          const userRef = doc(db, 'users', data.riderId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            riderName = userData?.name || userData?.firstName || 'Rider';
            riderRating = userData?.rating || 5.0;
            riderPhoto = userData?.profilePhotoUrl || userData?.photoUrl;
          }
        } catch (err) {
          console.warn('Could not fetch rider info:', err);
        }
      }

      // Calculate earnings - driver gets 80% of fare + 100% of tips
      const baseFare = data.finalCost || data.estimatedCost || 0;
      const tip = data.tip || 0;
      const driverShare = baseFare * 0.80; // Driver gets 80% of trip fare
      const platformFee = baseFare * 0.20; // Platform takes 20%
      const totalEarnings = driverShare + tip; // Total = 80% of fare + 100% of tips

      // Parse stops data
      const stops: StopData[] = (data.stops || []).map((stop: any) => ({
        name: stop.placeName || 'Stop',
        address: stop.address || 'Unknown location',
        coords: {
          latitude: stop.coordinates?.latitude || 0,
          longitude: stop.coordinates?.longitude || 0,
        },
        completed: stop.completed || false,
      }));

      // Build trip object
      const tripData: TripData = {
        id: tripDoc.id,
        riderName,
        riderPhoto,
        riderRating,
        riderTrips: data.riderInfo?.totalTrips || 0,
        pickup: {
          address: data.pickup?.placeName || 'Pickup',
          fullAddress: data.pickup?.address || 'Unknown location',
          coords: {
            latitude: data.pickup?.coordinates?.latitude || 19.2866,
            longitude: data.pickup?.coordinates?.longitude || -81.3744,
          },
        },
        destination: {
          address: data.destination?.placeName || 'Destination',
          fullAddress: data.destination?.address || 'Unknown location',
          coords: {
            latitude: data.destination?.coordinates?.latitude || 19.3133,
            longitude: data.destination?.coordinates?.longitude || -81.2546,
          },
        },
        stops,
        date: formatDate(completedAt || requestedAt),
        time: formatTime(completedAt || requestedAt),
        duration: data.actualDuration || data.duration || 0,
        distance: (data.actualDistance || data.distance || 0) / 1000, // Convert to km
        earnings: {
          base: driverShare, // Driver's 80% share
          grossFare: baseFare, // Original fare before split
          platformFee: platformFee, // 20% platform fee
          tip: tip,
          total: totalEarnings, // 80% of fare + 100% of tips
        },
        rating: data.driverRating || 0,
        feedback: data.driverFeedback || data.feedback,
        status: data.status || 'UNKNOWN',
        paymentMethod: data.paymentMethod || 'Card',
      };

      setTrip(tripData);
    } catch (err) {
      console.error('❌ Error loading trip details:', err);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={styles.moreButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={styles.moreButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const routeCoords = [
    trip.pickup.coords,
    ...trip.stops.map(s => s.coords),
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
              strokeWidth={3}
              geodesic={true}
              lineCap="round"
              lineJoin="round"
            />

            {/* Pickup marker */}
            <Marker coordinate={trip.pickup.coords}>
              <View style={styles.markerContainer}>
                <View style={[styles.marker, { backgroundColor: Colors.primary }]}>
                  <Ionicons name="location" size={20} color={Colors.white} />
                </View>
              </View>
            </Marker>

            {/* Stop markers */}
            {trip.stops.map((stop, index) => (
              <Marker key={`stop-${index}`} coordinate={stop.coords}>
                <View style={styles.stopMarker}>
                  <Text style={styles.stopMarkerText}>{index + 1}</Text>
                </View>
              </Marker>
            ))}

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
            {trip.riderPhoto ? (
              <Image source={{ uri: trip.riderPhoto }} style={styles.riderPhotoImage} />
            ) : (
              <View style={styles.riderPhotoPlaceholder}>
                <Ionicons name="person" size={28} color={Colors.textSecondary} />
              </View>
            )}
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{trip.riderName}</Text>
              <View style={styles.riderStats}>
                <View style={styles.statBadge}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.statText}>{trip.riderRating.toFixed(1)}</Text>
                </View>
                {trip.riderTrips > 0 && (
                  <>
                    <Text style={styles.statDivider}>•</Text>
                    <Text style={styles.statText}>{trip.riderTrips} trips</Text>
                  </>
                )}
              </View>
            </View>
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
                <Text style={styles.routeFullAddress} numberOfLines={2}>{trip.pickup.fullAddress}</Text>
              </View>
            </View>
            {/* Stops */}
            {trip.stops.map((stop, index) => (
              <React.Fragment key={`stop-route-${index}`}>
                <View style={styles.routeLine} />
                <View style={styles.routeItem}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.warning }]} />
                  <View style={styles.routeTextContainer}>
                    <View style={styles.stopLabelRow}>
                      <Text style={styles.routeLabel}>Stop {index + 1}</Text>
                      <View style={styles.stopBadge}>
                        <Text style={styles.stopBadgeText}>{stop.completed ? 'Completed' : 'Added'}</Text>
                      </View>
                    </View>
                    <Text style={styles.routeAddress}>{stop.name}</Text>
                    <Text style={styles.routeFullAddress} numberOfLines={2}>{stop.address}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Destination</Text>
                <Text style={styles.routeAddress}>{trip.destination.address}</Text>
                <Text style={styles.routeFullAddress} numberOfLines={2}>{trip.destination.fullAddress}</Text>
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
              <Text style={styles.statValue}>{Math.round(trip.duration / 60)} min</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{(trip.distance * 0.621371).toFixed(1)} mi</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.earningsCard}>
            {/* Rider paid (gross fare) */}
            <View style={styles.earningRow}>
              <Text style={styles.earningLabel}>Rider Contribution</Text>
              <Text style={styles.earningValue}>CI${trip.earnings.grossFare.toFixed(2)}</Text>
            </View>
            {/* Platform fee deduction */}
            <View style={styles.earningRow}>
              <Text style={styles.earningLabel}>Platform Fee (20%)</Text>
              <Text style={[styles.earningValue, { color: Colors.error }]}>
                -CI${trip.earnings.platformFee.toFixed(2)}
              </Text>
            </View>
            {/* Driver's share */}
            <View style={styles.earningRow}>
              <Text style={styles.earningLabel}>Your Trip Earnings (80%)</Text>
              <Text style={styles.earningValue}>CI${trip.earnings.base.toFixed(2)}</Text>
            </View>
            {trip.earnings.tip > 0 && (
              <View style={styles.earningRow}>
                <View style={styles.tipLabelContainer}>
                  <Text style={styles.earningLabel}>Tip (100% yours)</Text>
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
              <Text style={styles.totalLabel}>Your Total Earnings</Text>
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
            <Text style={styles.sectionTitle}>Rider's Rating</Text>
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
    width: 40,
  },
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
  stopMarker: {
    backgroundColor: Colors.warning,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  stopMarkerText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  stopLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopBadge: {
    backgroundColor: `${Colors.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stopBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
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
  riderPhotoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
  },
  riderPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
