/**
 * Arrived at Pickup Screen
 * Shows when driver has arrived at pickup location
 *
 * Features:
 * - Live map in background showing pickup location
 * - Bottom sheet with rider info and actions (takes half screen)
 * - Wait timer with progress indicator
 * - Contact options (call/message)
 * - Start Ride button to begin the trip
 * - No-show option for absent riders
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { startTrip } from '@/src/services/ride-request.service';
import { endMessaging } from '@/src/services/messaging.service';
import { ChatModal } from '@/components/messaging/ChatModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.6;
const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.45;

export default function ArrivedAtPickup() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const { activeRide, startRide, setActiveRide } = useDriverStore();
  const { subscribeToTrip, currentTrip } = useTripStore();
  const { user } = useAuthStore();
  const [waitTime, setWaitTime] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const maxWaitTime = 300; // 5 minutes in seconds

  // Animation for pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subscribe to trip updates to detect rider cancellation
  useEffect(() => {
    if (!activeRide?.id) return;

    const unsubscribe = subscribeToTrip(activeRide.id);

    return () => unsubscribe();
  }, [activeRide?.id]);

  // Listen for trip status changes (e.g., rider cancellation)
  useEffect(() => {
    if (!currentTrip) {
      console.log('📍 ArrivedAtPickup: No currentTrip yet');
      return;
    }

    console.log('📍 ArrivedAtPickup: Trip update received:', {
      tripId: currentTrip.id,
      activeRideId: activeRide?.id,
      status: currentTrip.status,
      cancelledBy: (currentTrip as any).cancelledBy,
    });

    // Only process if this trip matches our active ride
    if (activeRide?.id && currentTrip.id !== activeRide.id) {
      console.log('⚠️ Trip ID mismatch, ignoring update');
      return;
    }

    // If trip was cancelled by rider
    if (currentTrip.status === 'CANCELLED') {
      console.log('⚠️ Trip was cancelled by rider while waiting at pickup');

      // Clear active ride from driver store
      setActiveRide(null);

      // Show alert and redirect
      Alert.alert(
        'Ride Cancelled',
        (currentTrip as any).cancelledBy === 'RIDER'
          ? 'The rider has cancelled this trip.'
          : 'This trip has been cancelled.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(driver)/tabs'),
          },
        ]
      );
    }
  }, [currentTrip?.status, currentTrip?.id, activeRide?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Pulsing animation for the "waiting" indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  if (!activeRide) {
    router.replace('/(driver)/tabs');
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Call button removed for safety - use in-app messaging instead
  // Phone numbers are not shared between riders and drivers for privacy

  const handleMessageRider = () => {
    if (!activeRide) return;
    setShowChatModal(true);
  };

  const handleStartRide = async () => {
    setIsStarting(true);

    try {
      // End messaging before starting the trip
      await endMessaging(activeRide.id);
      console.log('✅ Messaging ended for trip');

      // Update trip status to IN_PROGRESS in Firebase
      // This will trigger the rider's screen to navigate to trip-in-progress
      await startTrip(activeRide.id);
      console.log('✅ Trip started successfully - Rider should see status change');

      // Update local driver store
      startRide();

      // Navigate to destination screen
      router.replace('/(driver)/active-ride/navigate-to-destination');
    } catch (error) {
      console.error('❌ Failed to start trip:', error);
      Alert.alert('Error', 'Failed to start the ride. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleNoShow = () => {
    Alert.alert(
      'Report No-Show',
      'Are you sure the rider has not arrived? You will receive a cancellation fee.',
      [
        { text: 'Wait More', style: 'cancel' },
        {
          text: 'Report No-Show',
          style: 'destructive',
          onPress: () => router.push('/(driver)/active-ride/rider-no-show'),
        },
      ]
    );
  };

  const waitPercentage = Math.min((waitTime / maxWaitTime) * 100, 100);
  const isNearLimit = waitTime > 240; // Last minute warning
  const canReportNoShow = waitTime >= 120; // 2 minutes minimum wait

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: activeRide.pickup.lat,
          longitude: activeRide.pickup.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={{
            latitude: activeRide.pickup.lat,
            longitude: activeRide.pickup.lng,
          }}
          title="Pickup Location"
        >
          <View style={styles.pickupMarker}>
            <View style={styles.pickupMarkerInner}>
              <Ionicons name="person" size={18} color={Colors.white} />
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Header Banner */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.headerBanner}>
          <Animated.View style={[styles.pulseContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.pulseCircle}>
              <Ionicons name="location" size={20} color={Colors.white} />
            </View>
          </Animated.View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>You've Arrived!</Text>
            <Text style={styles.headerSubtitle}>Waiting for {activeRide.riderName}</Text>
          </View>
          <View style={styles.timerBadge}>
            <Text style={[styles.timerText, isNearLimit && styles.timerTextWarning]}>
              {formatTime(waitTime)}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { maxHeight: BOTTOM_SHEET_MAX_HEIGHT }]}>
        {/* Handle */}
        <View style={styles.sheetHandle}>
          <View style={styles.handleBar} />
        </View>

        <ScrollView
          style={styles.sheetScrollView}
          contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Wait Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${waitPercentage}%`,
                    backgroundColor: isNearLimit ? Colors.warning : Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, isNearLimit && styles.progressTextWarning]}>
              {isNearLimit
                ? 'Rider has less than 1 minute remaining'
                : `Rider has ${Math.max(0, Math.floor((maxWaitTime - waitTime) / 60))} min to arrive`}
            </Text>
          </View>

          {/* Rider Card */}
          <View style={styles.riderCard}>
            {(activeRide as any).riderPhoto ? (
              <Image
                source={{ uri: (activeRide as any).riderPhoto }}
                style={styles.riderPhoto}
              />
            ) : (
              <View style={styles.riderAvatar}>
                <Ionicons name="person" size={28} color={Colors.primary} />
              </View>
            )}
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{activeRide.riderName}</Text>
              <View style={styles.riderRating}>
                <Ionicons name="star" size={14} color={Colors.rating} />
                <Text style={styles.ratingText}>{activeRide.riderRating}</Text>
              </View>
            </View>
            {/* Message button only - call removed for safety */}
            <TouchableOpacity style={styles.contactButton} onPress={handleMessageRider}>
              <Ionicons name="chatbubble-ellipses" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Pickup Location */}
          <View style={styles.locationCard}>
            <View style={styles.locationDot} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {activeRide.pickup.address}
              </Text>
            </View>
          </View>

          {/* Destination Preview */}
          <View style={styles.destinationPreview}>
            <View style={styles.destinationDot} />
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationLabel}>GOING TO</Text>
              <Text style={styles.destinationAddress} numberOfLines={1}>
                {activeRide.destination.address}
              </Text>
            </View>
            <View style={styles.tripInfo}>
              <Text style={styles.tripDistance}>
                {(activeRide.distance || 0).toFixed(1)} km
              </Text>
              <Text style={styles.tripEarnings}>
                CI${(activeRide.estimatedEarnings || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {canReportNoShow && (
              <TouchableOpacity style={styles.noShowButton} onPress={handleNoShow}>
                <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
                <Text style={styles.noShowText}>No-Show</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.startButton, !canReportNoShow && styles.startButtonFull]}
              onPress={handleStartRide}
              disabled={isStarting}
            >
              {isStarting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="car" size={22} color={Colors.white} />
                  <Text style={styles.startButtonText}>Start Ride</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Women-Only Ride Alert */}
          {(activeRide as any).womenOnlyRide && (
            <View style={styles.womenOnlyAlert}>
              <Ionicons name="shield-checkmark" size={16} color="#BE185D" />
              <View style={styles.womenOnlyAlertContent}>
                <Text style={styles.womenOnlyAlertTitle}>Women-Only Ride</Text>
                <Text style={styles.womenOnlyAlertText}>
                  This rider requested a female driver. If a male presents themselves instead, you may cancel without penalty.
                </Text>
                <TouchableOpacity
                  style={styles.genderViolationButton}
                  onPress={() => {
                    Alert.alert(
                      'Gender Safety Cancellation',
                      'Are you cancelling because a male presented themselves instead of the expected female rider?\n\nYou will receive 50% of the ride fare as compensation.',
                      [
                        { text: 'No, Go Back', style: 'cancel' },
                        {
                          text: 'Yes, Cancel Ride',
                          style: 'destructive',
                          onPress: () => {
                            // In a real implementation, this would call a service to handle the cancellation
                            Alert.alert(
                              'Ride Cancelled',
                              'The ride has been cancelled due to a gender safety violation. You will receive 50% compensation.',
                              [{ text: 'OK', onPress: () => router.replace('/(driver)/tabs') }]
                            );
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="close-circle" size={14} color="#BE185D" />
                  <Text style={styles.genderViolationButtonText}>Cancel - Wrong Gender</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Safety Info */}
          <View style={styles.safetyInfo}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.gray[500]} />
            <Text style={styles.safetyText}>
              Verify rider identity before starting the trip
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Chat Modal */}
      {activeRide && user && (
        <ChatModal
          visible={showChatModal}
          tripId={activeRide.id}
          userId={user.id}
          userName={user.name || user.email?.split('@')[0] || 'Driver'}
          userPhoto={user.photoURL}
          userType="driver"
          otherUserName={activeRide.riderName}
          onClose={() => setShowChatModal(false)}
          isEnabled={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    ...Shadows.lg,
  },
  pulseContainer: {
    marginRight: 12,
  },
  pulseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.gray[600],
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  timerTextWarning: {
    color: Colors.warning,
  },

  // Pickup Marker
  pickupMarker: {
    alignItems: 'center',
  },
  pickupMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.md,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Shadows.xl,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sheetScrollView: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[300],
  },

  // Progress
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  progressTextWarning: {
    color: Colors.warning,
    fontWeight: '600',
  },

  // Rider Card
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  riderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  riderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.gray[700],
    marginLeft: 4,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  // Location Cards
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    marginTop: 4,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gray[500],
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 20,
  },

  // Destination Preview
  destinationPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    marginBottom: 16,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    marginTop: 4,
    marginRight: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gray[500],
    letterSpacing: 1,
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: Colors.black,
  },
  tripInfo: {
    alignItems: 'flex-end',
  },
  tripDistance: {
    fontSize: 13,
    color: Colors.gray[600],
  },
  tripEarnings: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 2,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  noShowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
  },
  noShowText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  startButtonFull: {
    flex: 1,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Safety Info
  safetyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyText: {
    fontSize: 12,
    color: Colors.gray[500],
    marginLeft: 6,
  },
  // Women-Only Styles
  womenOnlyAlert: {
    flexDirection: 'row',
    backgroundColor: '#FDF2F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    gap: 10,
  },
  womenOnlyAlertContent: {
    flex: 1,
  },
  womenOnlyAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BE185D',
    marginBottom: 4,
  },
  womenOnlyAlertText: {
    fontSize: 11,
    color: '#9D174D',
    lineHeight: 16,
    marginBottom: 10,
  },
  genderViolationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FBCFE8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  genderViolationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#BE185D',
  },
});
