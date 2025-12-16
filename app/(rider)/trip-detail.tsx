import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import * as Print from 'expo-print';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/src/stores/auth-store';
import { BlockUserModal } from '@/components/modal/BlockUserModal';

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
  stops: StopData[];
  distance: string;
  duration: string;
  distanceRaw: number;
  durationRaw: number;
  cost: string;
  costRaw: number;
  tip?: number;
  totalCost: string;
  totalCostRaw: number;
  driver: {
    id: string;
    name: string;
    photo?: string;
    rating: number;
    vehicle: string;
    plate: string;
  } | null;
  rating?: number;
  paymentMethod: string;
  // Route history for safety/investigation
  routeHistory?: Array<{ latitude: number; longitude: number }>;
  // Cancellation info
  cancellation?: {
    cancelledBy: 'DRIVER' | 'RIDER';
    reason: string;
    reasonType: string;
    fee: number;
    refundAmount: number;
    wasRiderFault: boolean;
    wasDriverFault: boolean;
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

// Helper to format distance (meters to miles)
const formatDistance = (meters: number | undefined): string => {
  if (!meters) return '0 mi';
  const miles = meters * 0.000621371;
  if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
  return `${miles.toFixed(1)} mi`;
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

export default function TripDetailScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Report issue state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Block user state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  // Check if within 24 hours of trip completion
  const canReportIssue = trip?.completedAt
    ? (Date.now() - trip.completedAt.getTime()) < 24 * 60 * 60 * 1000
    : false;

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

      // Raw values for receipt - prefer actual values recorded at trip completion
      const distanceRaw = data.actualDistance || data.distance || 0;
      const durationRaw = data.actualDuration || data.duration || data.estimatedDuration || 0;

      // Load route history for accurate polyline display
      const routeHistory: Array<{ latitude: number; longitude: number }> = data.routeHistory || [];

      // Parse cancellation data if trip was cancelled
      const cancellation = data.status === 'CANCELLED' ? {
        cancelledBy: data.cancelledBy || 'UNKNOWN',
        reason: data.cancellationReason || 'No reason provided',
        reasonType: data.cancellationReasonType || 'OTHER',
        fee: data.cancellationFee || 0,
        refundAmount: data.refundAmount || baseCost,
        wasRiderFault: data.wasRiderFault || false,
        wasDriverFault: data.wasDriverFault || false,
      } : undefined;

      // Set driver ID for blocking - use driverId from trip or from driverInfo
      const driverIdFromData = data.driverId || data.driverInfo?.id;
      if (driverIdFromData) {
        setDriverId(driverIdFromData);
      }

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
        cost: `CI$${baseCost.toFixed(2)}`,
        costRaw: baseCost,
        tip: tip,
        totalCost: `CI$${totalCost.toFixed(2)}`,
        totalCostRaw: totalCost,
        driver: data.driverInfo ? {
          id: driverIdFromData || '',
          name: data.driverInfo.name || 'Driver',
          photo: data.driverInfo.photo || data.driverInfo.profilePhoto,
          rating: data.driverInfo.rating || 5.0,
          vehicle: `${data.driverInfo.vehicle?.color || ''} ${data.driverInfo.vehicle?.make || ''} ${data.driverInfo.vehicle?.model || ''}`.trim() || 'Vehicle',
          plate: data.driverInfo.vehicle?.plate || '',
        } : null,
        rating: data.driverRating,
        paymentMethod: data.paymentMethod || 'Card',
        routeHistory,
        cancellation,
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

  // Download receipt as PDF
  const handleDownloadReceipt = async () => {
    if (!trip) return;

    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Drift Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 32px; font-weight: bold; color: #5d1289; }
              .receipt-title { font-size: 24px; margin-top: 10px; color: #333; }
              .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
              .row { display: flex; justify-content: space-between; padding: 8px 0; }
              .label { color: #6b7280; }
              .value { font-weight: 600; color: #000; }
              .total-row { font-size: 18px; margin-top: 10px; }
              .total-value { color: #5d1289; font-weight: 700; }
              .section-title { font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; }
              .route-item { padding: 8px 0; }
              .route-label { font-size: 12px; color: #6b7280; }
              .route-address { font-weight: 500; }
              .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">Drift</div>
              <div class="receipt-title">Trip Receipt</div>
            </div>

            <div class="row">
              <span class="label">Trip ID</span>
              <span class="value">${trip.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="row">
              <span class="label">Date</span>
              <span class="value">${trip.date} at ${trip.time}</span>
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

            <div class="section-title">Payment</div>
            <div class="row">
              <span class="label">Trip Contribution</span>
              <span class="value">${trip.cost}</span>
            </div>
            ${trip.tip && trip.tip > 0 ? `
              <div class="row">
                <span class="label">Tip</span>
                <span class="value" style="color: #10B981;">CI$${trip.tip.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="row total-row">
              <span class="label">Total</span>
              <span class="value total-value">${trip.totalCost}</span>
            </div>
            <div class="row">
              <span class="label">Payment Method</span>
              <span class="value">${trip.paymentMethod}</span>
            </div>

            ${trip.driver ? `
              <div class="divider"></div>
              <div class="section-title">Driver</div>
              <div class="row">
                <span class="label">Name</span>
                <span class="value">${trip.driver.name}</span>
              </div>
              <div class="row">
                <span class="label">Vehicle</span>
                <span class="value">${trip.driver.vehicle} • ${trip.driver.plate}</span>
              </div>
            ` : ''}

            <div class="footer">
              <p>Thank you for riding with Drift!</p>
              <p>Questions? Contact support@drift-global.com</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Receipt saved to your device');
      }
    } catch (err) {
      console.error('Error generating receipt:', err);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    }
  };

  // Submit report issue
  const handleSubmitReport = async () => {
    if (!trip || !reportText.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }

    setSubmittingReport(true);

    try {
      const tripIssuesRef = collection(db, 'tripIssues');
      await addDoc(tripIssuesRef, {
        tripId: trip.id,
        riderId: user?.id,
        riderName: user?.name || 'Unknown',
        riderEmail: user?.email,
        driverId: trip.driver?.name ? trip.id : null,
        driverName: trip.driver?.name || 'Unknown',
        issueDescription: reportText.trim(),
        tripDate: trip.date,
        tripCost: trip.totalCostRaw,
        status: 'pending', // pending, reviewed, refunded, rejected, driver_suspended, driver_banned
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        adminAction: null,
        adminNotes: null,
        resolvedAt: null,
      });

      setShowReportModal(false);
      setReportText('');
      Alert.alert(
        'Report Submitted',
        'Thank you for your feedback. Our team will review your report and take appropriate action within 24-48 hours.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Error submitting report:', err);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
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

  // Determine polyline coordinates - use routeHistory if available, otherwise fallback to waypoints
  const polylineCoordinates = trip.routeHistory && trip.routeHistory.length > 0
    ? trip.routeHistory
    : [
        trip.from.coords,
        ...trip.stops.map(s => s.coords),
        trip.to.coords,
      ];

  // Calculate map region to fit all points
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
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={20} color="#000" />
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
            {/* Polyline - uses actual route history if available */}
            <Polyline
              coordinates={polylineCoordinates}
              strokeColor="#5d1289"
              strokeWidth={3}
            />
          </MapView>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
            <Text style={styles.statusText}>{statusBadge.text}</Text>
          </View>
          {/* Route history indicator */}
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
            <Text style={styles.paymentLabel}>Trip Contribution</Text>
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

        {/* Cancellation Info Card */}
        {trip.cancellation && (
          <View style={styles.cancellationCard}>
            <View style={styles.cancellationHeader}>
              <Ionicons
                name={
                  trip.cancellation.reasonType === 'NO_DRIVERS_AVAILABLE'
                    ? 'car-outline'
                    : trip.cancellation.wasDriverFault || trip.cancellation.fee === 0
                      ? 'checkmark-circle'
                      : 'close-circle'
                }
                size={24}
                color={
                  trip.cancellation.reasonType === 'NO_DRIVERS_AVAILABLE'
                    ? '#F59E0B'
                    : trip.cancellation.wasDriverFault || trip.cancellation.fee === 0
                      ? '#10B981'
                      : '#EF4444'
                }
              />
              <Text style={styles.cancellationTitle}>
                {trip.cancellation.reasonType === 'NO_DRIVERS_AVAILABLE'
                  ? 'No Drivers Available'
                  : trip.cancellation.wasDriverFault
                    ? 'Trip Cancelled - Full Refund'
                    : trip.cancellation.fee === 0
                      ? 'Trip Cancelled - Not Charged'
                      : 'Trip Cancelled'}
              </Text>
            </View>

            {/* Reason */}
            <View style={styles.cancellationRow}>
              <Text style={styles.cancellationLabel}>Cancelled by</Text>
              <Text style={styles.cancellationValue}>
                {trip.cancellation.reasonType === 'NO_DRIVERS_AVAILABLE'
                  ? 'System'
                  : trip.cancellation.cancelledBy === 'DRIVER'
                    ? 'Driver'
                    : 'You'}
              </Text>
            </View>

            <View style={styles.cancellationRow}>
              <Text style={styles.cancellationLabel}>Reason</Text>
              <Text style={styles.cancellationValue}>
                {trip.cancellation.reasonType === 'NO_DRIVERS_AVAILABLE'
                  ? 'No drivers were available to accept your ride request'
                  : trip.cancellation.reasonType === 'RIDER_CANCELLED_WHILE_SEARCHING'
                    ? 'Cancelled before driver was assigned'
                    : trip.cancellation.reason}
              </Text>
            </View>

            {/* Fee breakdown */}
            {trip.cancellation.fee > 0 && (
              <View style={styles.cancellationFeeSection}>
                <View style={styles.cancellationRow}>
                  <Text style={styles.cancellationLabel}>Cancellation Fee (50%)</Text>
                  <Text style={[styles.cancellationValue, { color: '#EF4444' }]}>
                    CI${trip.cancellation.fee.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.cancellationRow}>
                  <Text style={styles.cancellationLabel}>Refund Amount</Text>
                  <Text style={[styles.cancellationValue, { color: '#10B981' }]}>
                    CI${trip.cancellation.refundAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* No drivers available notice */}
            {trip.cancellation.reasonType === 'NO_DRIVERS_AVAILABLE' && (
              <View style={[styles.refundNotice, { backgroundColor: '#FEF9C3' }]}>
                <Ionicons name="information-circle" size={18} color="#F59E0B" />
                <Text style={[styles.refundNoticeText, { color: '#92400E' }]}>
                  We couldn't find any drivers for your trip. The payment authorization has been cancelled and your funds will be returned shortly.
                </Text>
              </View>
            )}

            {/* Cancelled while searching notice */}
            {trip.cancellation.reasonType === 'RIDER_CANCELLED_WHILE_SEARCHING' && (
              <View style={styles.refundNotice}>
                <Ionicons name="information-circle" size={18} color="#10B981" />
                <Text style={styles.refundNoticeText}>
                  You cancelled before a driver was assigned. The payment authorization has been cancelled and your funds will be returned shortly.
                </Text>
              </View>
            )}

            {/* Full refund notice - driver cancelled */}
            {trip.cancellation.wasDriverFault && trip.cancellation.reasonType !== 'NO_DRIVERS_AVAILABLE' && (
              <View style={styles.refundNotice}>
                <Ionicons name="information-circle" size={18} color="#10B981" />
                <Text style={styles.refundNoticeText}>
                  The driver cancelled due to their own circumstances. You received a full refund of CI${trip.cancellation.refundAmount.toFixed(2)}.
                </Text>
              </View>
            )}

            {/* Rider charged notice */}
            {trip.cancellation.fee > 0 && !trip.cancellation.wasDriverFault && (
              <View style={[styles.refundNotice, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="information-circle" size={18} color="#EF4444" />
                <Text style={[styles.refundNoticeText, { color: '#DC2626' }]}>
                  {trip.cancellation.cancelledBy === 'RIDER'
                    ? 'You cancelled after the driver was already on the way. A 50% cancellation fee has been applied.'
                    : 'The trip was cancelled due to rider issues. A 50% cancellation fee has been applied.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadReceipt}>
            <Ionicons name="download-outline" size={20} color="#5d1289" />
            <Text style={styles.actionText}>Download Receipt</Text>
          </TouchableOpacity>
          {canReportIssue && (
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowReportModal(true)}>
              <Ionicons name="flag-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Report Issue</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Block Driver Option - Always available */}
        {trip.driver && driverId && (
          <TouchableOpacity
            style={styles.blockDriverButton}
            onPress={() => setShowBlockModal(true)}
          >
            <Ionicons name="ban-outline" size={18} color="#EF4444" />
            <Text style={styles.blockDriverText}>Block this driver from future rides</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Report Issue Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report an Issue</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Please describe the issue you experienced during this trip. Our team will review your report and take appropriate action.
            </Text>

            <TextInput
              style={styles.reportInput}
              placeholder="Describe the issue..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={reportText}
              onChangeText={setReportText}
              maxLength={1000}
            />

            <Text style={styles.charCount}>{reportText.length}/1000 characters</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, (!reportText.trim() || submittingReport) && styles.submitButtonDisabled]}
                onPress={handleSubmitReport}
                disabled={!reportText.trim() || submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Block User Modal */}
      {user && driverId && trip?.driver && (
        <BlockUserModal
          visible={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          onBlocked={() => {
            // Show success and close the modal
            setShowBlockModal(false);
            Alert.alert(
              'Driver Blocked',
              `${trip.driver?.name} has been blocked. You will no longer be matched with this driver.`
            );
          }}
          blockerId={user.id}
          blockerName={user.name || 'Rider'}
          blockerType="rider"
          blockedId={driverId}
          blockedName={trip.driver.name}
          blockedType="driver"
          tripId={trip.id}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: {
    paddingBottom: 40,
  },
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
  routeHistoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  reportInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Cancellation card styles
  cancellationCard: {
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
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  cancellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cancellationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  cancellationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  cancellationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancellationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    maxWidth: '60%',
    textAlign: 'right',
  },
  cancellationFeeSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  refundNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
  },
  refundNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
  blockDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 40,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#FEF2F2',
  },
  blockDriverText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
