/**
 * DRIVER HOME SCREEN - Redesigned
 * Features:
 * - Full-screen Google Maps background
 * - Floating status card with driver name
 * - Go Online/Offline button
 * - Bottom tab navigation (Home, Earnings, Inbox, Menu)
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Animated,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useDriverStore, ActiveRide } from '@/src/stores/driver-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { DriftButton } from '@/components/ui/DriftButton';
import DriftMapView from '@/components/ui/DriftMapView';
import RideRequestModal from '@/components/modal/RideRequestModal';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { Region } from 'react-native-maps';
import { getActiveDriverTrip } from '@/src/services/ride-request.service';
import {
  initializeDriverNotifications,
  setupDriverNotificationListener,
  setupPushNotificationListener,
} from '@/src/services/driver-notification.service';
import { NotificationService } from '@/src/services/notification.service';
import { useBackgroundLocationPermission } from '@/src/hooks/useBackgroundLocationPermission';
import { BackgroundLocationDisclosureModal } from '@/components/location/BackgroundLocationDisclosureModal';

export default function DriverHomeScreen() {
  const router = useRouter();
  const {
    driver,
    isOnline,
    toggleOnline,
    todayEarnings,
    todayTrips,
    incomingRequests,
    acceptRequest,
    declineRequest,
    updateLocation,
    loadDriverProfile,
    markRequestProcessed,
    processedRequestIds,
    activeRide,
    setActiveRide,
    startListeningForRequests,
  } = useDriverStore();
  const { user } = useAuthStore();

  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [isStatusCardMinimized, setIsStatusCardMinimized] = useState(false);
  const [isActiveTripMinimized, setIsActiveTripMinimized] = useState(false);
  const [hasCheckedActiveTrip, setHasCheckedActiveTrip] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Track shown request IDs to prevent modal from re-appearing for same request
  const shownRequestIds = useRef<Set<string>>(new Set());
  // Track accepted request ID to prevent showing it again
  const acceptedRequestId = useRef<string | null>(null);
  // Track if we're currently processing an accept
  const isAccepting = useRef(false);
  // Location subscription for continuous tracking while online
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Animation values for status card
  const statusCardAnimation = useRef(new Animated.Value(1)).current;
  const minimizedButtonAnimation = useRef(new Animated.Value(0)).current;
  const activeTripCardAnimation = useRef(new Animated.Value(1)).current;

  // Background location permission with prominent disclosure modal
  const {
    hasPermission: hasBackgroundPermission,
    hasForegroundPermission,
    isChecking: isCheckingPermission,
    showDisclosureModal,
    requestPermission: requestBackgroundPermission,
    onDisclosureAccept,
    onDisclosureDecline,
  } = useBackgroundLocationPermission({
    userType: 'driver',
    onPermissionGranted: () => {
      // Refresh location immediately when permission is granted
      getCurrentLocation();
    },
    onPermissionDenied: () => {
      // Location permission denied
    },
  });

  // Load driver profile from Firebase on mount
  useEffect(() => {
    if (user?.id) {
      loadDriverProfile(user.id);
    }
  }, [user?.id]);

  // Subscribe to real-time notifications for unread count badge
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      (notifications) => {
        const unread = notifications.filter(n => !n.read).length;
        setUnreadNotificationCount(unread);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Initialize driver notifications
  useEffect(() => {
    initializeDriverNotifications();

    // Set up notification response listener for accept/decline from notification
    const responseSubscription = setupDriverNotificationListener(
      // On Accept from notification
      async (requestId) => {
        try {
          await acceptRequest(requestId);
          router.push('/(driver)/active-ride/navigate-to-pickup');
        } catch (error) {
          console.error('Failed to accept from notification:', error);
        }
      },
      // On Decline from notification
      async (requestId) => {
        try {
          await declineRequest(requestId, 'Declined from notification');
        } catch (error) {
          console.error('Failed to decline from notification:', error);
        }
      }
    );

    // Set up push notification listener to save notifications to inbox
    let pushSubscription: any = null;
    if (user?.id) {
      pushSubscription = setupPushNotificationListener(
        user.id,
        // On chat message received
        (tripId, senderName) => {
          console.log(`📬 New message from ${senderName} for trip ${tripId}`);
        }
      );
    }

    return () => {
      responseSubscription.remove();
      if (pushSubscription) {
        pushSubscription.remove();
      }
    };
  }, [user?.id]);

  // Keep online status persistent - restart listener when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // When app comes back to foreground and driver is online
      if (nextAppState === 'active' && isOnline && !activeRide) {
        // Restart listening if we're online but not currently listening
        const state = useDriverStore.getState();
        if (!state.rideRequestListener && state.currentLocation) {
          state.startListeningForRequests();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isOnline, activeRide]);

  // Check for active trip on mount (persists across app restart/logout)
  useEffect(() => {
    if (!hasCheckedActiveTrip && driver?.id) {
      checkForActiveTrip();
    }
  }, [driver?.id, hasCheckedActiveTrip]);

  /**
   * Check if driver has an active trip and restore it
   * Only restore trips that are genuinely in progress (IN_PROGRESS status)
   * or recently accepted (within last 30 minutes)
   */
  const checkForActiveTrip = async () => {
    if (!driver?.id) return;

    try {
      const activeTrip = await getActiveDriverTrip(driver.id);

      if (activeTrip) {
        // Only restore trips that are genuinely active:
        // 1. IN_PROGRESS trips should always be restored (driver is mid-ride)
        // 2. For other statuses (DRIVER_ARRIVING, DRIVER_ARRIVED), only restore if recently accepted (within 30 min)
        const isInProgress = activeTrip.status === 'IN_PROGRESS';
        const acceptedAt = activeTrip.acceptedAt;
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const isRecentlyAccepted = acceptedAt && new Date(acceptedAt) > thirtyMinutesAgo;

        if (!isInProgress && !isRecentlyAccepted) {
          setHasCheckedActiveTrip(true);
          return;
        }

        // Get rider info from the trip data
        const riderName = (activeTrip as any).riderName || 'Rider';
        const riderRating = (activeTrip as any).riderRating || 4.5;
        const riderPhoto = (activeTrip as any).riderPhoto;

        // Convert to ActiveRide format
        const restoredRide: ActiveRide = {
          id: activeTrip.id,
          riderId: activeTrip.riderId,
          riderName: riderName,
          riderRating: riderRating,
          riderPhoto: riderPhoto,
          pickup: {
            lat: activeTrip.pickup.coordinates.latitude,
            lng: activeTrip.pickup.coordinates.longitude,
            address: activeTrip.pickup.address,
          },
          destination: {
            lat: activeTrip.destination.coordinates.latitude,
            lng: activeTrip.destination.coordinates.longitude,
            address: activeTrip.destination.address,
          },
          distance: activeTrip.distance || 0,
          estimatedDuration: activeTrip.duration || 0,
          estimatedEarnings: activeTrip.estimatedCost || 0,
          requestedAt: activeTrip.requestedAt || new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          status: mapTripStatusToRideStatus(activeTrip.status),
          acceptedAt: activeTrip.acceptedAt || new Date(),
          arrivedAt: activeTrip.status === 'DRIVER_ARRIVED' ? new Date() : undefined,
          startedAt: activeTrip.startedAt,
        };

        setActiveRide(restoredRide);
      } else {
        // No active trip found - clear any stale activeRide state
        setActiveRide(null);
      }

      setHasCheckedActiveTrip(true);
    } catch (error) {
      console.error('Error checking for active trip:', error);
      setHasCheckedActiveTrip(true);
    }
  };

  /**
   * Map trip status to driver ride status
   */
  const mapTripStatusToRideStatus = (status: string): ActiveRide['status'] => {
    switch (status) {
      case 'ACCEPTED':
      case 'DRIVER_ARRIVING':
        return 'navigating_to_pickup';
      case 'DRIVER_ARRIVED':
        return 'arrived';
      case 'IN_PROGRESS':
        return 'started';
      default:
        return 'accepted';
    }
  };

  /**
   * Navigate to the appropriate screen based on active ride status
   */
  const navigateToActiveRide = () => {
    if (!activeRide) return;

    switch (activeRide.status) {
      case 'accepted':
      case 'navigating_to_pickup':
        router.push('/(driver)/active-ride/navigate-to-pickup');
        break;
      case 'arrived':
        router.push('/(driver)/active-ride/arrived-at-pickup');
        break;
      case 'started':
      case 'in_progress':
        router.push('/(driver)/active-ride/navigate-to-destination');
        break;
      default:
        router.push('/(driver)/active-ride/navigate-to-pickup');
    }
  };

  // Get user location and set region
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Refresh location after permission is granted through disclosure flow
  // This triggers when either background OR foreground permission is granted
  useEffect(() => {
    if (hasForegroundPermission === true) {
      getCurrentLocation();
    }
  }, [hasForegroundPermission]);

  // NOTE: The modal now shows automatically from the hook on first app open
  // No need to manually trigger it here

  // Start listening for ride requests when online and location is available
  // This handles restoration of online status after app restart
  useEffect(() => {
    const state = useDriverStore.getState();
    if (isOnline && state.currentLocation && !state.rideRequestListener && !activeRide) {
      startListeningForRequests();
    }
  }, [isOnline, region]);

  // Reset accept flags when screen mounts or driver goes back online
  // This ensures the driver can receive new requests after completing/cancelling a ride
  useEffect(() => {
    // Reset flags when driver goes online (might be returning from a completed ride)
    if (isOnline) {
      isAccepting.current = false;
      acceptedRequestId.current = null;
      // Clear shown request IDs so old requests can be shown again if they're still available
      shownRequestIds.current.clear();
    }
  }, [isOnline]);

  // Continuous location tracking while driver is online
  // Updates driver location in Firebase every 10 seconds so admin map can show live drivers
  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        // Check for foreground permission first
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('⚠️ Location permission not granted for tracking');
          return;
        }

        console.log('🟢 Starting continuous location tracking for online driver');

        // Start watching location - update every 10 seconds or 50 meters
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // 10 seconds
            distanceInterval: 50, // 50 meters
          },
          (location) => {
            // Update driver location in store (which updates Firebase)
            updateLocation({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              heading: location.coords.heading || 0,
              speed: location.coords.speed || 0,
            });

            // Also update the map region
            setRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        );

        locationSubscriptionRef.current = subscription;
      } catch (error) {
        console.error('❌ Error starting location tracking:', error);
      }
    };

    const stopLocationTracking = () => {
      if (locationSubscriptionRef.current) {
        console.log('🔴 Stopping continuous location tracking');
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };

    if (isOnline) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, [isOnline, updateLocation]);

  // Listen for incoming ride requests
  useEffect(() => {
    // Don't show new requests if we're currently accepting one
    if (isAccepting.current) {
      return;
    }

    // Check if the currently shown request was cancelled by the rider
    // (i.e., modal is open but request is no longer in the list)
    if (showRequestModal && currentRequest) {
      const requestStillExists = incomingRequests.some(r => r.id === currentRequest.id);
      if (!requestStillExists) {
        // Request disappeared - rider cancelled or request was taken by another driver
        console.log('🚫 Current request was cancelled/taken:', currentRequest.id);
        setShowRequestModal(false);
        setCurrentRequest(null);
        markRequestProcessed(currentRequest.id);

        // Show appropriate message
        Alert.alert(
          'Ride Cancelled',
          'The rider has cancelled this ride request.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (incomingRequests.length > 0) {
      // Find the NEWEST unprocessed request (first in list since sorted by requestedAt desc)
      const newestRequest = incomingRequests.find(
        (request) =>
          request.id !== acceptedRequestId.current &&
          !processedRequestIds.has(request.id) // Also check store's processed IDs
      );

      if (newestRequest) {
        // Check if this is different from what's currently being shown
        if (!showRequestModal) {
          // No modal open - show this request
          shownRequestIds.current.add(newestRequest.id);
          setCurrentRequest(newestRequest);
          setShowRequestModal(true);
        } else if (currentRequest && currentRequest.id !== newestRequest.id) {
          // Modal is open but showing a different (older) request
          // Update to show the newer request
          shownRequestIds.current.add(newestRequest.id);
          setCurrentRequest(newestRequest);
        }
      }
    }
  }, [incomingRequests, showRequestModal, processedRequestIds, currentRequest, markRequestProcessed]);

  const getCurrentLocation = async () => {
    try {
      // First CHECK if we already have foreground permission (don't request yet)
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

      // Default location for Cayman Islands (used when no permission)
      const defaultLocation = {
        latitude: 19.2866,
        longitude: -81.3744,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      if (currentStatus !== 'granted') {
        // Don't request permission here - let the disclosure modal flow handle it
        // Just use default location for now
        setRegion(defaultLocation);
        updateLocation({
          lat: defaultLocation.latitude,
          lng: defaultLocation.longitude,
          heading: 0,
          speed: 0,
        });
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(locationData);

      // Update driver location in store
      updateLocation({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
        heading: currentLocation.coords.heading || 0,
        speed: currentLocation.coords.speed || 0,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);

      // Default to George Town, Cayman Islands
      const defaultLocation = {
        latitude: 19.2866,
        longitude: -81.3744,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(defaultLocation);
      updateLocation({
        lat: defaultLocation.latitude,
        lng: defaultLocation.longitude,
        heading: 0,
        speed: 0,
      });
    }
  };

  const handleToggleOnline = () => {
    // Check if driver is approved before allowing them to go online
    // Check both 'status' and 'registrationStatus' fields
    const driverStatus = driver?.registrationStatus || driver?.status;
    const isApproved = driverStatus === 'approved';
    const isPendingReapproval = driverStatus === 'pending_reapproval';
    const isPending = driverStatus === 'pending';

    if (!isOnline && !isApproved) {
      if (isPendingReapproval) {
        Alert.alert(
          'Documents Pending Review',
          'You updated your vehicle information and need to resubmit your documents. You cannot go online until your new documents are reviewed and approved.',
          [
            { text: 'View Status', onPress: () => router.push('/(driver)/registration/pending-approval') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else if (isPending) {
        Alert.alert(
          'Application Pending',
          'Your driver application is still being reviewed. You\'ll be able to go online once our team has approved your application.',
          [
            { text: 'View Status', onPress: () => router.push('/(driver)/registration/pending-approval') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          'Account Not Approved',
          'Your driver account is not approved. Please contact support if you believe this is an error.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    toggleOnline();

    if (!isOnline) {
      Alert.alert(
        'You\'re Online!',
        'You\'ll now receive ride requests from nearby riders.',
        [{ text: 'Got it' }]
      );
    }
  };

  const toggleStatusCard = () => {
    const toMinimized = !isStatusCardMinimized;
    setIsStatusCardMinimized(toMinimized);

    // Animate status card out and minimized button in
    Animated.parallel([
      Animated.timing(statusCardAnimation, {
        toValue: toMinimized ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(minimizedButtonAnimation, {
        toValue: toMinimized ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleActiveTripCard = () => {
    const toMinimized = !isActiveTripMinimized;
    setIsActiveTripMinimized(toMinimized);

    Animated.timing(activeTripCardAnimation, {
      toValue: toMinimized ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleAcceptRequest = async () => {
    if (!currentRequest) return;

    // Prevent double-accept
    if (isAccepting.current) {
      console.log('⚠️ Already accepting a request, ignoring');
      return;
    }

    // Verify the request is still valid in incomingRequests
    const requestStillValid = incomingRequests.some(r => r.id === currentRequest.id);
    if (!requestStillValid) {
      Alert.alert(
        'Request Unavailable',
        'This ride request is no longer available. It may have been cancelled or taken by another driver.',
        [{ text: 'OK' }]
      );
      setShowRequestModal(false);
      setCurrentRequest(null);
      return;
    }

    isAccepting.current = true;
    acceptedRequestId.current = currentRequest.id;

    try {
      // Accept the request in Firebase (this updates status to DRIVER_ARRIVING)
      await acceptRequest(currentRequest.id);

      // Close modal and clear state
      setShowRequestModal(false);
      setCurrentRequest(null);

      // Navigate directly to navigate-to-pickup screen
      router.push('/(driver)/active-ride/navigate-to-pickup');
    } catch (error) {
      console.error('Failed to accept ride:', error);

      // Reset flags on error so driver can try again with a different request
      isAccepting.current = false;
      acceptedRequestId.current = null;

      Alert.alert(
        'Error',
        'Failed to accept ride. It may have been taken by another driver.',
        [{ text: 'OK' }]
      );
      setShowRequestModal(false);
      setCurrentRequest(null);
    }
  };

  const handleDeclineRequest = async () => {
    if (!currentRequest) return;

    try {
      await declineRequest(currentRequest.id, 'Driver declined');
    } catch (error) {
      console.error('Failed to decline request:', error);
    }

    // Close modal - the useEffect will handle showing the next request
    // if there are any unshown requests in the queue
    setShowRequestModal(false);
    setCurrentRequest(null);
  };

  if (loading || !region) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Location Disclosure Modal - Shows BEFORE system permission */}
      <BackgroundLocationDisclosureModal
        visible={showDisclosureModal}
        userType="driver"
        onAccept={onDisclosureAccept}
        onDecline={onDisclosureDecline}
      />

      {/* Full-screen Map Background using DriftMapView */}
      <DriftMapView
        region={region}
        showUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        style={styles.map}
      />

      {/* Overlay Content */}
      <SafeAreaView style={styles.overlay}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/(driver)/tabs/menu')}
          >
            <Ionicons name="menu" size={28} color={Colors.black} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.greetingText}>
              Hello, {user?.name || driver?.firstName || 'Driver'}
            </Text>
            <Text style={styles.statusText}>
              {isOnline ? "You're online" : "You're offline"}
            </Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/(driver)/dashboard/notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={Colors.black} />
              {unreadNotificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/(driver)/settings')}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Trip Card - Shows if driver has an ongoing trip */}
        {activeRide && !isActiveTripMinimized && (
          <Animated.View
            style={[
              styles.activeTripCard,
              {
                opacity: activeTripCardAnimation,
                transform: [
                  {
                    translateY: activeTripCardAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.activeTripMinimizeBtn}
              onPress={toggleActiveTripCard}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-up" size={18} color={Colors.gray[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.activeTripContent}
              onPress={navigateToActiveRide}
              activeOpacity={0.8}
            >
              <View style={styles.activeTripHeader}>
                <View style={styles.activeTripIconContainer}>
                  <Ionicons
                    name={activeRide.status === 'started' || activeRide.status === 'in_progress' ? 'car' : 'navigate'}
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.activeTripInfo}>
                  <Text style={styles.activeTripTitle}>
                    {activeRide.status === 'accepted' && 'Navigate to pickup'}
                    {activeRide.status === 'navigating_to_pickup' && 'Navigate to pickup'}
                    {activeRide.status === 'arrived' && 'Waiting for rider'}
                    {activeRide.status === 'started' && 'Trip in progress'}
                    {activeRide.status === 'in_progress' && 'Trip in progress'}
                  </Text>
                  <Text style={styles.activeTripDestination} numberOfLines={1}>
                    {activeRide.status === 'started' || activeRide.status === 'in_progress'
                      ? `To: ${activeRide.destination.address}`
                      : `Pickup: ${activeRide.pickup.address}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </View>
              <View style={styles.activeTripRider}>
                <View style={styles.activeTripRiderInfo}>
                  <Ionicons name="person-circle" size={20} color={Colors.gray[600]} />
                  <Text style={styles.activeTripRiderName}>{activeRide.riderName}</Text>
                </View>
                <Text style={styles.activeTripEarnings}>
                  CI${activeRide.estimatedEarnings?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Minimized Active Trip Button - Shows when active trip card is collapsed */}
        {activeRide && isActiveTripMinimized && (
          <TouchableOpacity
            style={styles.minimizedActiveTripButton}
            onPress={toggleActiveTripCard}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeRide.status === 'started' || activeRide.status === 'in_progress' ? 'car' : 'navigate'}
              size={22}
              color={Colors.white}
            />
            <Text style={styles.minimizedActiveTripText}>
              {activeRide.status === 'started' || activeRide.status === 'in_progress' ? 'Trip' : 'Pickup'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Status Card - Animated */}
        <Animated.View
          style={[
            styles.statusCard,
            {
              opacity: statusCardAnimation,
              transform: [
                {
                  translateY: statusCardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
                {
                  scale: statusCardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={isStatusCardMinimized ? 'none' : 'auto'}
        >
          {/* Minimize button */}
          <TouchableOpacity
            style={styles.minimizeButton}
            onPress={toggleStatusCard}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-down" size={20} color={Colors.gray[400]} />
          </TouchableOpacity>

          <Text style={styles.statusCardTitle}>
            {isOnline ? 'Ready for Requests' : 'Ready to go?'}
          </Text>

          {isOnline && (
            <View style={styles.earningsRow}>
              <View style={styles.earningsStat}>
                <Text style={styles.earningsAmount}>
                  ${todayEarnings.toFixed(2)}
                </Text>
                <Text style={styles.earningsLabel}>Today's Earnings</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.earningsStat}>
                <Text style={styles.earningsAmount}>{todayTrips}</Text>
                <Text style={styles.earningsLabel}>Trips</Text>
              </View>
            </View>
          )}

          <DriftButton
            title={isOnline ? 'Go Offline' : 'Go Online'}
            onPress={handleToggleOnline}
            variant={isOnline ? 'outline' : 'primary'}
            icon={isOnline ? 'stop-circle' : 'play-circle'}
            fullWidth
            style={styles.toggleButton}
          />
        </Animated.View>

        {/* Earnings Quick View (when online) */}
        {isOnline && (
          <View style={styles.earningsQuickView}>
            <View style={styles.earningsQuickContent}>
              <Ionicons name="wallet" size={20} color={Colors.primary} />
              <Text style={styles.earningsQuickText}>
                ${todayEarnings.toFixed(2)} earned today
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/(driver)/tabs/earnings')}
            >
              <Text style={styles.earningsQuickLink}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={getCurrentLocation}
      >
        <Ionicons name="locate" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Minimized Status Button - Shows when status card is minimized */}
      <Animated.View
        style={[
          styles.minimizedStatusButton,
          {
            opacity: minimizedButtonAnimation,
            transform: [
              {
                scale: minimizedButtonAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents={isStatusCardMinimized ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={[
            styles.minimizedButton,
            isOnline ? styles.minimizedButtonOnline : styles.minimizedButtonOffline,
          ]}
          onPress={toggleStatusCard}
          activeOpacity={0.8}
        >
          <View style={styles.minimizedButtonContent}>
            <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
            <Text style={styles.minimizedButtonText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Ionicons name="chevron-up" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Ride Request Modal */}
      <RideRequestModal
        visible={showRequestModal}
        request={currentRequest}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
        autoExpireSeconds={30}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : 0,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.base,
  },
  
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  
  greetingText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: 2,
  },
  
  headerIcons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.base,
  },
  
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  // Active Trip Card
  activeTripCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.lg,
  },
  activeTripMinimizeBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  activeTripContent: {
    padding: Spacing.base,
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTripIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activeTripInfo: {
    flex: 1,
  },
  activeTripTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: 2,
  },
  activeTripDestination: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  activeTripRider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  activeTripRiderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTripRiderName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginLeft: Spacing.xs,
  },
  minimizedActiveTripButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...Shadows.lg,
  },
  minimizedActiveTripText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  activeTripEarnings: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
  },

  // Status Card
  statusCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  
  statusCardTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
  },
  
  earningsStat: {
    alignItems: 'center',
    flex: 1,
  },
  
  earningsAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  
  earningsLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray[200],
  },
  
  toggleButton: {
    marginTop: Spacing.sm,
  },

  // Earnings Quick View
  earningsQuickView: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },
  
  earningsQuickContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  earningsQuickText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.black,
  },
  
  earningsQuickLink: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
  },
  
  // Location Button
  locationButton: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },

  // Minimize button in status card
  minimizeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Minimized status button (floating pill)
  minimizedStatusButton: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.base,
    zIndex: 100,
  },

  minimizedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.lg,
  },

  minimizedButtonOnline: {
    backgroundColor: Colors.success,
  },

  minimizedButtonOffline: {
    backgroundColor: Colors.gray[700],
  },

  minimizedButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  minimizedButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusDotOnline: {
    backgroundColor: Colors.white,
  },

  statusDotOffline: {
    backgroundColor: Colors.gray[400],
  },
});