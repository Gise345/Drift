/**
 * ADMIN TRIP DETAIL SCREEN
 * Shows full trip details with map route, PDF download, and admin actions
 *
 * UPGRADED TO React Native Firebase v22+ Modular API
 * Using 'main' database (restored from backup) UPGRADED TO v23.5.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Shadows } from '@/src/constants/theme';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface TripData {
  id: string;
  status: string;
  date: string;
  time: string;
  completedAt: Date | null;
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
  stops: Array<{
    name: string;
    address: string;
    coords: { latitude: number; longitude: number };
    completed: boolean;
  }>;
  distance: string;
  duration: string;
  distanceRaw: number;
  durationRaw: number;
  cost: number;
  tip: number;
  totalCost: number;
  rider: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    photo?: string;
  } | null;
  driver: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    photo?: string;
    rating: number;
    vehicle: string;
    plate: string;
  } | null;
  paymentMethod: string;
  routeHistory?: Array<{ latitude: number; longitude: number }>;
  riderRating?: number;
  driverRating?: number;
  cancellation?: {
    cancelledBy: string;
    reason: string;
    fee: number;
    refundAmount: number;
  };
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
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

// Helper to format duration
const formatDuration = (seconds: number | undefined): string => {
  if (!seconds) return '0 min';
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

export default function AdminTripDetailScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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

      const tripDocRef = doc(db, 'trips', id);
      const tripDoc = await getDoc(tripDocRef);

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
      const requestedAt = data.requestedAt?.toDate?.() || data.requestedAt;
      const completedAt = data.completedAt?.toDate?.() || data.completedAt;

      // Fetch rider info
      let rider = null;
      if (data.riderId) {
        try {
          const userDocRef = doc(db, 'users', data.riderId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            rider = {
              id: data.riderId,
              name: userData?.name || userData?.firstName || 'Unknown Rider',
              email: userData?.email,
              phone: userData?.phone,
              photo: userData?.profilePhotoUrl || userData?.photoUrl,
            };
          }
        } catch (err) {
          console.warn('Could not fetch rider info:', err);
        }
      }

      // Fetch driver info
      let driver = null;
      if (data.driverId) {
        try {
          const driverDocRef = doc(db, 'drivers', data.driverId);
          const driverDoc = await getDoc(driverDocRef);
          if (driverDoc.exists()) {
            const driverData = driverDoc.data();
            driver = {
              id: data.driverId,
              name: `${driverData?.firstName || ''} ${driverData?.lastName || ''}`.trim() || 'Unknown Driver',
              email: driverData?.email,
              phone: driverData?.phone,
              photo: driverData?.profilePhotoUrl || driverData?.photoUrl,
              rating: driverData?.rating || 5.0,
              vehicle: `${driverData?.vehicle?.color || ''} ${driverData?.vehicle?.make || ''} ${driverData?.vehicle?.model || ''}`.trim() || 'Vehicle',
              plate: driverData?.vehicle?.licensePlate || driverData?.vehicle?.plate || '',
            };
          }
        } catch (err) {
          console.warn('Could not fetch driver info:', err);
        }
      }

      // Use embedded info as fallback
      if (!rider && data.riderInfo) {
        rider = {
          id: data.riderId || '',
          name: data.riderInfo.name || 'Unknown Rider',
          email: data.riderInfo.email,
          phone: data.riderInfo.phone,
          photo: data.riderInfo.photo,
        };
      }

      if (!driver && data.driverInfo) {
        driver = {
          id: data.driverId || '',
          name: data.driverInfo.name || 'Unknown Driver',
          email: data.driverInfo.email,
          phone: data.driverInfo.phone,
          photo: data.driverInfo.photo,
          rating: data.driverInfo.rating || 5.0,
          vehicle: `${data.driverInfo.vehicle?.color || ''} ${data.driverInfo.vehicle?.make || ''} ${data.driverInfo.vehicle?.model || ''}`.trim() || 'Vehicle',
          plate: data.driverInfo.vehicle?.plate || '',
        };
      }

      // Parse stops
      const stops = (data.stops || []).map((stop: any) => ({
        name: stop.placeName || 'Stop',
        address: stop.address || 'Unknown location',
        coords: {
          latitude: stop.coordinates?.latitude || 0,
          longitude: stop.coordinates?.longitude || 0,
        },
        completed: stop.completed || false,
      }));

      // Calculate costs
      const cost = data.finalCost || data.estimatedCost || 0;
      const tip = data.tip || 0;
      const totalCost = cost + tip;

      // Raw values
      const distanceRaw = data.actualDistance || data.distance || 0;
      const durationRaw = data.actualDuration || data.duration || data.estimatedDuration || 0;

      // Parse cancellation
      const cancellation = data.status === 'CANCELLED' ? {
        cancelledBy: data.cancelledBy || 'UNKNOWN',
        reason: data.cancellationReason || 'No reason provided',
        fee: data.cancellationFee || 0,
        refundAmount: data.refundAmount || cost,
      } : undefined;

      // Build trip object
      const tripData: TripData = {
        id: tripDoc.id,
        status: data.status || 'UNKNOWN',
        date: formatDate(requestedAt),
        time: formatTime(requestedAt),
        completedAt: completedAt ? new Date(completedAt) : null,
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
        distance: formatDistance(distanceRaw),
        duration: formatDuration(durationRaw),
        distanceRaw,
        durationRaw,
        cost,
        tip,
        totalCost,
        rider,
        driver,
        paymentMethod: data.paymentMethod || 'Card',
        routeHistory: data.routeHistory || [],
        riderRating: data.riderRating,
        driverRating: data.driverRating,
        cancellation,
      };

      setTrip(tripData);
    } catch (err) {
      console.error('Error loading trip details:', err);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  // Download receipt as PDF
  const handleDownloadReceipt = async () => {
    if (!trip) return;

    setDownloading(true);

    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Drift Admin Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 32px; font-weight: bold; color: #5d1289; }
              .receipt-title { font-size: 24px; margin-top: 10px; color: #333; }
              .admin-badge { background: #FEF3C7; color: #D97706; padding: 4px 12px; border-radius: 12px; font-size: 12px; display: inline-block; margin-top: 8px; }
              .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
              .row { display: flex; justify-content: space-between; padding: 8px 0; }
              .label { color: #6b7280; }
              .value { font-weight: 600; color: #000; }
              .total-row { font-size: 18px; margin-top: 10px; }
              .total-value { color: #5d1289; font-weight: 700; }
              .section-title { font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; color: #5d1289; }
              .route-item { padding: 8px 0; }
              .route-label { font-size: 12px; color: #6b7280; }
              .route-address { font-weight: 500; }
              .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px; }
              .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
              .status-completed { background: #D1FAE5; color: #065F46; }
              .status-cancelled { background: #FEE2E2; color: #DC2626; }
              .participant-box { background: #F9FAFB; padding: 16px; border-radius: 12px; margin-bottom: 12px; }
              .participant-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
              .participant-detail { font-size: 13px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">Drift</div>
              <div class="receipt-title">Trip Receipt</div>
              <div class="admin-badge">Admin Copy</div>
            </div>

            <div class="row">
              <span class="label">Trip ID</span>
              <span class="value">${trip.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="row">
              <span class="label">Date</span>
              <span class="value">${trip.date} at ${trip.time}</span>
            </div>
            <div class="row">
              <span class="label">Status</span>
              <span class="status-badge ${trip.status === 'COMPLETED' ? 'status-completed' : 'status-cancelled'}">${trip.status}</span>
            </div>

            <div class="divider"></div>

            <div class="section-title">Participants</div>
            <div class="participant-box">
              <div class="participant-name">Rider: ${trip.rider?.name || 'Unknown'}</div>
              ${trip.rider?.email ? `<div class="participant-detail">Email: ${trip.rider.email}</div>` : ''}
              ${trip.rider?.phone ? `<div class="participant-detail">Phone: ${trip.rider.phone}</div>` : ''}
            </div>
            <div class="participant-box">
              <div class="participant-name">Driver: ${trip.driver?.name || 'Unknown'}</div>
              ${trip.driver?.email ? `<div class="participant-detail">Email: ${trip.driver.email}</div>` : ''}
              ${trip.driver?.phone ? `<div class="participant-detail">Phone: ${trip.driver.phone}</div>` : ''}
              ${trip.driver?.vehicle ? `<div class="participant-detail">Vehicle: ${trip.driver.vehicle} • ${trip.driver.plate}</div>` : ''}
            </div>

            <div class="divider"></div>

            <div class="section-title">Route</div>
            <div class="route-item">
              <div class="route-label">Pickup</div>
              <div class="route-address">${trip.from.name}</div>
              <div style="color: #6b7280; font-size: 12px;">${trip.from.address}</div>
            </div>
            ${trip.stops.map((stop, i) => `
              <div class="route-item">
                <div class="route-label">Stop ${i + 1}</div>
                <div class="route-address">${stop.name}</div>
                <div style="color: #6b7280; font-size: 12px;">${stop.address}</div>
              </div>
            `).join('')}
            <div class="route-item">
              <div class="route-label">Destination</div>
              <div class="route-address">${trip.to.name}</div>
              <div style="color: #6b7280; font-size: 12px;">${trip.to.address}</div>
            </div>

            <div class="divider"></div>

            <div class="row">
              <span class="label">Distance</span>
              <span class="value">${trip.distance}</span>
            </div>
            <div class="row">
              <span class="label">Duration</span>
              <span class="value">${trip.duration}</span>
            </div>

            <div class="divider"></div>

            <div class="section-title">Payment Details</div>
            <div class="row">
              <span class="label">Trip Fare</span>
              <span class="value">CI$${trip.cost.toFixed(2)}</span>
            </div>
            ${trip.tip > 0 ? `
              <div class="row">
                <span class="label">Tip</span>
                <span class="value" style="color: #10B981;">CI$${trip.tip.toFixed(2)}</span>
              </div>
            ` : ''}
            ${trip.cancellation ? `
              <div class="row">
                <span class="label">Cancellation Fee</span>
                <span class="value" style="color: #EF4444;">CI$${trip.cancellation.fee.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="row total-row">
              <span class="label">Total</span>
              <span class="value total-value">CI$${trip.totalCost.toFixed(2)}</span>
            </div>
            <div class="row">
              <span class="label">Payment Method</span>
              <span class="value">${trip.paymentMethod}</span>
            </div>

            ${trip.riderRating || trip.driverRating ? `
              <div class="divider"></div>
              <div class="section-title">Ratings</div>
              ${trip.driverRating ? `
                <div class="row">
                  <span class="label">Rider rated Driver</span>
                  <span class="value">${trip.driverRating} / 5 stars</span>
                </div>
              ` : ''}
              ${trip.riderRating ? `
                <div class="row">
                  <span class="label">Driver rated Rider</span>
                  <span class="value">${trip.riderRating} / 5 stars</span>
                </div>
              ` : ''}
            ` : ''}

            ${trip.cancellation ? `
              <div class="divider"></div>
              <div class="section-title" style="color: #EF4444;">Cancellation Details</div>
              <div class="row">
                <span class="label">Cancelled By</span>
                <span class="value">${trip.cancellation.cancelledBy}</span>
              </div>
              <div class="row">
                <span class="label">Reason</span>
                <span class="value">${trip.cancellation.reason}</span>
              </div>
              <div class="row">
                <span class="label">Refund Amount</span>
                <span class="value" style="color: #10B981;">CI$${trip.cancellation.refundAmount.toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="footer">
              <p>Drift Admin Receipt</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>Questions? Contact info@drift-global.com</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Admin Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Receipt saved to your device');
      }
    } catch (err) {
      console.error('Error generating receipt:', err);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    } finally {
      setDownloading(false);
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
          <View style={styles.headerRight} />
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={styles.headerRight} />
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

  const statusBadge = getStatusBadge(trip.status);

  // Determine polyline coordinates
  const polylineCoordinates = trip.routeHistory && trip.routeHistory.length > 0
    ? trip.routeHistory
    : [trip.from.coords, ...trip.stops.map(s => s.coords), trip.to.coords];

  // Calculate map region
  const allCoords = [trip.from.coords, trip.to.coords, ...trip.stops.map(s => s.coords), ...(trip.routeHistory || [])];
  const latitudes = allCoords.map(c => c.latitude);
  const longitudes = allCoords.map(c => c.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latDelta = Math.max((maxLat - minLat) * 1.3, 0.02);
  const lngDelta = Math.max((maxLng - minLng) * 1.3, 0.02);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={handleDownloadReceipt}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="download-outline" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: (minLat + maxLat) / 2,
              longitude: (minLng + maxLng) / 2,
              latitudeDelta: latDelta,
              longitudeDelta: lngDelta,
            }}
          >
            <Marker coordinate={trip.from.coords} title="Pickup">
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={20} color="#10B981" />
              </View>
            </Marker>
            {trip.stops.map((stop, index) => (
              <Marker key={`stop-${index}`} coordinate={stop.coords} title={`Stop ${index + 1}`}>
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
            <Polyline
              coordinates={polylineCoordinates}
              strokeColor={Colors.primary}
              strokeWidth={3}
            />
          </MapView>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
            <Text style={styles.statusText}>{statusBadge.text}</Text>
          </View>
          {trip.routeHistory && trip.routeHistory.length > 0 && (
            <View style={styles.routeHistoryBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              <Text style={styles.routeHistoryText}>Verified Route</Text>
            </View>
          )}
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

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{trip.distance}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{trip.duration}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="cash-outline" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>CI${trip.totalCost.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routeIcons}>
              <View style={styles.greenDot} />
              <View style={styles.dottedLine} />
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
                <Text style={styles.addressText} numberOfLines={2}>{trip.from.address}</Text>
              </View>
              {trip.stops.map((stop, index) => (
                <View key={`stop-addr-${index}`} style={styles.addressRow}>
                  <Text style={styles.addressName}>Stop {index + 1}: {stop.name}</Text>
                  <Text style={styles.addressText} numberOfLines={2}>{stop.address}</Text>
                </View>
              ))}
              <View style={styles.addressRow}>
                <Text style={styles.addressName}>{trip.to.name}</Text>
                <Text style={styles.addressText} numberOfLines={2}>{trip.to.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rider Info */}
        {trip.rider && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rider</Text>
            <View style={styles.participantRow}>
              {trip.rider.photo ? (
                <Image source={{ uri: trip.rider.photo }} style={styles.participantPhoto} />
              ) : (
                <View style={[styles.participantPhoto, styles.participantPhotoPlaceholder]}>
                  <Ionicons name="person" size={24} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{trip.rider.name}</Text>
                {trip.rider.email && (
                  <Text style={styles.participantDetail}>{trip.rider.email}</Text>
                )}
                {trip.rider.phone && (
                  <Text style={styles.participantDetail}>{trip.rider.phone}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Driver Info */}
        {trip.driver && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Driver</Text>
            <View style={styles.participantRow}>
              {trip.driver.photo ? (
                <Image source={{ uri: trip.driver.photo }} style={styles.participantPhoto} />
              ) : (
                <View style={[styles.participantPhoto, styles.participantPhotoPlaceholder]}>
                  <Ionicons name="person" size={24} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{trip.driver.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{trip.driver.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.participantDetail}>
                  {trip.driver.vehicle} • {trip.driver.plate}
                </Text>
                {trip.driver.email && (
                  <Text style={styles.participantDetail}>{trip.driver.email}</Text>
                )}
                {trip.driver.phone && (
                  <Text style={styles.participantDetail}>{trip.driver.phone}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Trip Fare</Text>
            <Text style={styles.paymentValue}>CI${trip.cost.toFixed(2)}</Text>
          </View>
          {trip.tip > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tip</Text>
              <Text style={[styles.paymentValue, { color: '#10B981' }]}>CI${trip.tip.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>CI${trip.totalCost.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>{trip.paymentMethod}</Text>
          </View>
        </View>

        {/* Ratings */}
        {(trip.driverRating || trip.riderRating) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ratings</Text>
            {trip.driverRating && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Rider rated Driver</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= trip.driverRating! ? 'star' : 'star-outline'}
                      size={16}
                      color="#F59E0B"
                    />
                  ))}
                </View>
              </View>
            )}
            {trip.riderRating && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Driver rated Rider</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= trip.riderRating! ? 'star' : 'star-outline'}
                      size={16}
                      color="#F59E0B"
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Cancellation Info */}
        {trip.cancellation && (
          <View style={[styles.card, styles.cancellationCard]}>
            <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Cancellation Details</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Cancelled By</Text>
              <Text style={styles.paymentValue}>{trip.cancellation.cancelledBy}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Reason</Text>
              <Text style={styles.paymentValue}>{trip.cancellation.reason}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Cancellation Fee</Text>
              <Text style={[styles.paymentValue, { color: '#EF4444' }]}>CI${trip.cancellation.fee.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Refund Amount</Text>
              <Text style={[styles.paymentValue, { color: '#10B981' }]}>CI${trip.cancellation.refundAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Download Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadReceipt}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#FFF" />
              <Text style={styles.downloadButtonText}>Download PDF Receipt</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  headerRight: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { marginTop: 16, fontSize: 16, color: '#6B7280', textAlign: 'center' },
  retryButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
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
  stopMarkerText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  routeHistoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  routeHistoryText: { fontSize: 11, fontWeight: '600', color: '#10B981' },
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    ...Shadows.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  tripId: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
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
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 16 },
  routeContainer: { flexDirection: 'row' },
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
  addresses: { flex: 1, justifyContent: 'space-between' },
  addressRow: { paddingVertical: 4 },
  addressName: { fontSize: 14, color: '#000', fontWeight: '600' },
  addressText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  participantRow: { flexDirection: 'row', alignItems: 'center' },
  participantPhoto: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  participantPhotoPlaceholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantInfo: { flex: 1 },
  participantName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  participantDetail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { fontSize: 14, fontWeight: '500', color: '#000', marginLeft: 4 },
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
  totalValue: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  starsRow: { flexDirection: 'row', gap: 2 },
  cancellationCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
