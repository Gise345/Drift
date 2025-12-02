import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import firestore from '@react-native-firebase/firestore';

interface StopData {
  name: string;
  address: string;
  coords: { latitude: number; longitude: number };
  completed: boolean;
}

interface TripData {
  id: string;
  status: string;
  date: string;
  time: string;
  from: {
    name: string;
    address: string;
    coords: { latitude: number; longitude: number };
  };
  to: {
    name: string;
    address: string;
    coords: { latitude: number; longitude: number };
  };
  stops: StopData[];
  distance: string;
  duration: string;
  cost: string;
  tip?: number;
  totalCost: string;
  driver: {
    name: string;
    photo?: string;
    rating: number;
    vehicle: string;
    plate: string;
  } | null;
  rating?: number;
  paymentMethod: string;
}

// Helper to format date
const formatDate = (date: Date | undefined): string => {
  if (!date) return 'Unknown date';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper to format time
const formatTime = (date: Date | undefined): string => {
  if (!date) return 'Unknown time';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Helper to format distance
const formatDistance = (meters: number | undefined): string => {
  if (!meters) return '0 km';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// Helper to format duration
const formatDuration = (minutes: number | undefined): string => {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

export default function TripDetailScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
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

      console.log('📋 Loading trip details for:', id);

      const tripDoc = await firestore().collection('trips').doc(id).get();

      if (!tripDoc.exists) {
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

      // Calculate costs
      const baseCost = data.finalCost || data.estimatedCost || 0;
      const tip = data.tip || 0;
      const totalCost = baseCost + tip;

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
        status: data.status || 'UNKNOWN',
        date: formatDate(requestedAt),
        time: formatTime(requestedAt),
        from: {
          name: data.pickup?.placeName || 'Pickup',
          address: data.pickup?.address || 'Unknown location',
          coords: {
            latitude: data.pickup?.coordinates?.latitude || 19.2866,
            longitude: data.pickup?.coordinates?.longitude || -81.3744,
          },
        },
        to: {
          name: data.destination?.placeName || 'Destination',
          address: data.destination?.address || 'Unknown location',
          coords: {
            latitude: data.destination?.coordinates?.latitude || 19.3133,
            longitude: data.destination?.coordinates?.longitude || -81.2546,
          },
        },
        stops,
        distance: formatDistance(data.distance || data.actualDistance),
        duration: formatDuration(data.duration || data.actualDuration || data.estimatedDuration),
        cost: `CI$${baseCost.toFixed(2)}`,
        tip: tip,
        totalCost: `CI$${totalCost.toFixed(2)}`,
        driver: data.driverInfo ? {
          name: data.driverInfo.name || 'Driver',
          photo: data.driverInfo.photo,
          rating: data.driverInfo.rating || 5.0,
          vehicle: `${data.driverInfo.vehicle?.color || ''} ${data.driverInfo.vehicle?.make || ''} ${data.driverInfo.vehicle?.model || ''}`.trim() || 'Vehicle',
          plate: data.driverInfo.vehicle?.plate || '',
        } : null,
        rating: data.driverRating,
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

  // Get status badge color and text
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { color: '#10B981', text: 'Completed' };
      case 'CANCELLED':
        return { color: '#EF4444', text: 'Cancelled' };
      case 'IN_PROGRESS':
        return { color: '#3B82F6', text: 'In Progress' };
      case 'DRIVER_ARRIVING':
      case 'DRIVER_ARRIVED':
        return { color: '#F59E0B', text: 'Driver Arriving' };
      case 'REQUESTED':
        return { color: '#8B5CF6', text: 'Requested' };
      default:
        return { color: '#6B7280', text: status };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d1289" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusBadge = getStatusBadge(trip.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: (trip.from.coords.latitude + trip.to.coords.latitude) / 2,
              longitude: (trip.from.coords.longitude + trip.to.coords.longitude) / 2,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={trip.from.coords} title="Pickup">
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={20} color="#10B981" />
              </View>
            </Marker>
            {/* Stop Markers */}
            {trip.stops.map((stop, index) => (
              <Marker
                key={`stop-${index}`}
                coordinate={stop.coords}
                title={`Stop ${index + 1}: ${stop.name}`}
              >
                <View style={styles.stopMarker}>
                  <Text style={styles.stopMarkerText}>{index + 1}</Text>
                </View>
              </Marker>
            ))}
            <Marker coordinate={trip.to.coords} title="Destination">
              <View style={styles.destinationMarker}>
                <Ionicons name="location" size={20} color="#EF4444" />
              </View>
            </Marker>
            {/* Polyline through all points */}
            <Polyline
              coordinates={[
                trip.from.coords,
                ...trip.stops.map(s => s.coords),
                trip.to.coords,
              ]}
              strokeColor="#5d1289"
              strokeWidth={3}
            />
          </MapView>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
            <Text style={styles.statusText}>{statusBadge.text}</Text>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Trip Information</Text>
            <Text style={styles.tripId}>{trip.id.substring(0, 8).toUpperCase()}</Text>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.dateText}>{trip.date} at {trip.time}</Text>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeIcons}>
              <View style={styles.greenDot} />
              <View style={styles.dottedLine} />
              {/* Stop indicators */}
              {trip.stops.map((_, index) => (
                <React.Fragment key={`stop-icon-${index}`}>
                  <View style={styles.orangeDot} />
                  <View style={styles.dottedLine} />
                </React.Fragment>
              ))}
              <View style={styles.redSquare} />
            </View>
            <View style={styles.addresses}>
              <View style={styles.addressRow}>
                <Text style={styles.addressName}>{trip.from.name}</Text>
                <Text style={styles.addressText} numberOfLines={1}>{trip.from.address}</Text>
              </View>
              {/* Stops */}
              {trip.stops.map((stop, index) => (
                <View key={`stop-addr-${index}`} style={styles.addressRow}>
                  <View style={styles.stopLabelRow}>
                    <Text style={styles.addressName}>{stop.name}</Text>
                    <View style={styles.stopBadge}>
                      <Text style={styles.stopBadgeText}>Stop {index + 1}</Text>
                    </View>
                  </View>
                  <Text style={styles.addressText} numberOfLines={1}>{stop.address}</Text>
                </View>
              ))}
              <View style={styles.addressRow}>
                <Text style={styles.addressName}>{trip.to.name}</Text>
                <Text style={styles.addressText} numberOfLines={1}>{trip.to.address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="navigate-outline" size={18} color="#5d1289" />
              <Text style={styles.statValue}>{trip.distance}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={18} color="#5d1289" />
              <Text style={styles.statValue}>{trip.duration}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="cash-outline" size={18} color="#5d1289" />
              <Text style={styles.statValue}>{trip.totalCost}</Text>
            </View>
          </View>
        </View>

        {/* Driver Info */}
        {trip.driver && (
          <View style={styles.driverCard}>
            <Text style={styles.cardTitle}>Driver</Text>
            <View style={styles.driverRow}>
              {trip.driver.photo ? (
                <Image source={{ uri: trip.driver.photo }} style={styles.driverPhoto} />
              ) : (
                <View style={[styles.driverPhoto, styles.driverPhotoPlaceholder]}>
                  <Ionicons name="person" size={28} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{trip.driver.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{trip.driver.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.vehicleText}>
                  {trip.driver.vehicle}
                  {trip.driver.plate ? ` • ${trip.driver.plate}` : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Trip Fare</Text>
            <Text style={styles.paymentValue}>{trip.cost}</Text>
          </View>
          {trip.tip !== undefined && trip.tip > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tip</Text>
              <Text style={[styles.paymentValue, { color: '#10B981' }]}>CI${trip.tip.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{trip.totalCost}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>{trip.paymentMethod}</Text>
          </View>
          {trip.rating && (
            <View style={styles.ratingSection}>
              <Text style={styles.paymentLabel}>Your Rating</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= trip.rating! ? 'star' : 'star-outline'}
                    size={20}
                    color="#F59E0B"
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={20} color="#5d1289" />
            <Text style={styles.actionText}>Download Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="flag-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  shareButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#5d1289',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  mapContainer: { height: 200, position: 'relative' },
  map: { flex: 1 },
  pickupMarker: {
    backgroundColor: '#FFF',
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  destinationMarker: {
    backgroundColor: '#FFF',
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  stopMarker: {
    backgroundColor: '#F59E0B',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  stopMarkerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  tripId: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  routeContainer: { flexDirection: 'row', marginBottom: 16 },
  routeIcons: { alignItems: 'center', marginRight: 12, width: 20 },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginBottom: 4,
  },
  dottedLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  redSquare: { width: 10, height: 10, backgroundColor: '#EF4444', marginTop: 4 },
  orangeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    marginVertical: 4,
  },
  stopLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stopBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  addresses: { flex: 1, justifyContent: 'space-between' },
  addressRow: { paddingVertical: 4 },
  addressName: { fontSize: 15, color: '#000', fontWeight: '600' },
  addressText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  statValue: { fontSize: 13, fontWeight: '600', color: '#000' },
  driverCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 16 },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverPhoto: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  driverPhotoPlaceholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { fontSize: 14, fontWeight: '500', color: '#000', marginLeft: 4 },
  vehicleText: { fontSize: 13, color: '#6B7280' },
  paymentCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentLabel: { fontSize: 14, color: '#6B7280' },
  paymentValue: { fontSize: 14, fontWeight: '600', color: '#000' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#000' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#5d1289' },
  ratingSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
  },
  stars: { flexDirection: 'row', gap: 4, marginTop: 8 },
  actions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#5d1289' },
});
