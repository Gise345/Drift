/**
 * Track Trip Screen - Public View (No Auth Required)
 *
 * Allows anyone with a shared link to track a trip in real-time.
 * Accessible via deep link: drift://track?tripId=XXX
 * Or web: https://drift-global.web.app/track?tripId=XXX
 *
 * Features:
 * - Real-time map tracking of driver location
 * - ETA and distance to destination
 * - Driver/vehicle information display
 * - Trip status updates
 * - No authentication required
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, onSnapshot } from '@react-native-firebase/firestore';

const app = getApp();
const db = getFirestore(app, 'main');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TripLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp?: any;
}

interface TripData {
  id: string;
  status: string;
  pickup: {
    address: string;
    coordinates: { latitude: number; longitude: number };
    placeName?: string;
  };
  destination: {
    address: string;
    coordinates: { latitude: number; longitude: number };
    placeName?: string;
  };
  driverInfo?: {
    name: string;
    phone?: string;
    rating?: number;
    photo?: string;
    vehicle: {
      make: string;
      model: string;
      color: string;
      plate: string;
    };
  };
  driverLocation?: TripLocation;
  riderName?: string;
}

// Calculate distance in km using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get human-readable trip status
const getTripStatusText = (status: string): string => {
  switch (status) {
    case 'REQUESTED': return 'Finding driver';
    case 'ACCEPTED': return 'Driver assigned';
    case 'DRIVER_ARRIVING': return 'Driver en route';
    case 'DRIVER_ARRIVED': return 'Driver arrived';
    case 'IN_PROGRESS': return 'Trip in progress';
    case 'AWAITING_TIP': return 'Trip completed';
    case 'COMPLETED': return 'Trip completed';
    case 'CANCELLED': return 'Cancelled';
    default: return 'Tracking';
  }
};

// Get status badge color
const getTripStatusColor = (status: string): string => {
  switch (status) {
    case 'REQUESTED': return '#f59e0b';
    case 'ACCEPTED': return '#3b82f6';
    case 'DRIVER_ARRIVING': return '#8b5cf6';
    case 'DRIVER_ARRIVED': return '#10b981';
    case 'IN_PROGRESS': return '#10b981';
    case 'AWAITING_TIP':
    case 'COMPLETED': return '#6b7280';
    case 'CANCELLED': return '#ef4444';
    default: return '#10b981';
  }
};

export default function TrackTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string; session?: string }>();
  const mapRef = useRef<MapView>(null);

  // Get tripId from either param (tripId or session for backwards compatibility)
  const tripId = params.tripId || params.session;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState<TripData | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('--');

  // Subscribe to trip updates
  useEffect(() => {
    if (!tripId) {
      setError('No trip ID provided');
      setLoading(false);
      return;
    }

    console.log('Subscribing to trip:', tripId);

    const tripRef = doc(db, 'trips', tripId);
    const unsubscribe = onSnapshot(
      tripRef,
        (doc) => {
          if (!doc.exists) {
            setError('Trip not found');
            setLoading(false);
            return;
          }

          const data = doc.data() as Omit<TripData, 'id'>;
          const tripData: TripData = { id: doc.id, ...data };

          console.log('Trip update received:', {
            status: tripData.status,
            hasDriverLocation: !!tripData.driverLocation,
          });

          // Check if trip is cancelled
          if (tripData.status === 'CANCELLED') {
            setError('This trip has been cancelled');
            setLoading(false);
            return;
          }

          setTrip(tripData);
          setLoading(false);

          // Calculate distance and ETA if we have driver location
          if (tripData.driverLocation && tripData.destination?.coordinates) {
            const dist = calculateDistance(
              tripData.driverLocation.latitude,
              tripData.driverLocation.longitude,
              tripData.destination.coordinates.latitude,
              tripData.destination.coordinates.longitude
            );
            setDistance(dist);

            // Estimate ETA (40 km/h average in traffic)
            const etaMinutes = Math.round((dist / 40) * 60);
            setEta(etaMinutes);
          }

          // Update last updated timestamp
          if (tripData.driverLocation?.timestamp) {
            const timestamp = tripData.driverLocation.timestamp;
            const then = timestamp.toMillis ? timestamp.toMillis() : timestamp;
            const diff = Math.floor((Date.now() - then) / 1000);

            if (diff < 10) {
              setLastUpdated('Just now');
            } else if (diff < 60) {
              setLastUpdated(`${diff}s ago`);
            } else if (diff < 3600) {
              setLastUpdated(`${Math.floor(diff / 60)}m ago`);
            } else {
              setLastUpdated(`${Math.floor(diff / 3600)}h ago`);
            }
          }
        },
        (err) => {
          console.error('Error fetching trip:', err);
          setError('Unable to load trip');
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [tripId]);

  // Fit map to show driver and destination
  useEffect(() => {
    if (!trip || !mapRef.current) return;

    const points: { latitude: number; longitude: number }[] = [];

    if (trip.driverLocation) {
      points.push({
        latitude: trip.driverLocation.latitude,
        longitude: trip.driverLocation.longitude,
      });
    }

    if (trip.destination?.coordinates) {
      points.push(trip.destination.coordinates);
    }

    if (trip.pickup?.coordinates && !trip.driverLocation) {
      points.push(trip.pickup.coordinates);
    }

    if (points.length > 0) {
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
    }
  }, [trip?.driverLocation, trip?.destination]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d1289" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) return null;

  const driverName = trip.driverInfo?.name?.split(' ')[0] || 'Driver';
  const vehicle = trip.driverInfo?.vehicle;
  const isCompleted = trip.status === 'COMPLETED' || trip.status === 'AWAITING_TIP';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Track Trip</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getTripStatusColor(trip.status) }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{getTripStatusText(trip.status)}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: trip.driverLocation?.latitude || trip.destination?.coordinates?.latitude || 19.2866,
            longitude: trip.driverLocation?.longitude || trip.destination?.coordinates?.longitude || -81.3744,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* Driver Marker */}
          {trip.driverLocation && (
            <Marker
              coordinate={{
                latitude: trip.driverLocation.latitude,
                longitude: trip.driverLocation.longitude,
              }}
              title="Driver"
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={trip.driverLocation.heading || 0}
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={20} color="#fff" />
              </View>
            </Marker>
          )}

          {/* Destination Marker */}
          {trip.destination?.coordinates && (
            <Marker
              coordinate={trip.destination.coordinates}
              title="Destination"
            >
              <View style={styles.destinationMarker}>
                <Ionicons name="location" size={24} color="#fff" />
              </View>
            </Marker>
          )}

          {/* Route Line */}
          {trip.driverLocation && trip.destination?.coordinates && (
            <Polyline
              coordinates={[
                {
                  latitude: trip.driverLocation.latitude,
                  longitude: trip.driverLocation.longitude,
                },
                trip.destination.coordinates,
              ]}
              strokeColor="#5d1289"
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        {/* Completed Banner */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.completedText}>Trip completed successfully</Text>
          </View>
        )}

        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>{driverName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{driverName}</Text>
            {vehicle && (
              <View style={styles.vehicleInfo}>
                <Ionicons name="car-outline" size={16} color="#6b7280" />
                <Text style={styles.vehicleText}>
                  {vehicle.color} {vehicle.make} {vehicle.model}
                  {vehicle.plate ? ` • ${vehicle.plate.slice(-4)}` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Trip Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>
              {distance !== null ? `${distance.toFixed(1)} km` : 'Calculating...'}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ETA</Text>
            <Text style={styles.metricValue}>
              {eta !== null
                ? eta < 1
                  ? 'Arriving'
                  : `${eta} min`
                : 'Calculating...'}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Updated</Text>
            <Text style={styles.metricValue}>{lastUpdated}</Text>
          </View>
        </View>

        {/* Destination */}
        <View style={styles.destinationInfo}>
          <Ionicons name="location" size={20} color="#5d1289" />
          <View style={styles.destinationText}>
            <Text style={styles.destinationLabel}>Destination</Text>
            <Text style={styles.destinationAddress} numberOfLines={2}>
              {trip.destination?.address || trip.destination?.placeName || 'Loading...'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#5d1289',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backIcon: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5d1289',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  completedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5d1289',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  metricsContainer: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f3e8ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5d1289',
  },
  destinationText: {
    flex: 1,
    marginLeft: 12,
  },
  destinationLabel: {
    fontSize: 12,
    color: '#5d1289',
    fontWeight: '600',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#4c1d95',
    lineHeight: 20,
  },
});
