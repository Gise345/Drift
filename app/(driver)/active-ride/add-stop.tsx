/**
 * Add Stop Screen - Driver View
 * Allows drivers to add a stop during an active trip
 * The rider must approve the stop request before it's added
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useTripStore } from '@/src/stores/trip-store';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const GOOGLE_DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

// Pricing constants for additional stop calculation
const STOP_BASE_FEE = 2.0; // CI$ base fee for adding a stop
const PRICE_PER_KM = 0.75; // CI$ per km for the detour

interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  name: string;
}

export default function DriverAddStop() {
  const router = useRouter();
  const { activeRide } = useDriverStore();
  const { currentTrip, updateTrip } = useTripStore();
  const [stopAddress, setStopAddress] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced search
  useEffect(() => {
    if (stopAddress.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchPlaces(stopAddress);
    }, 300);

    return () => clearTimeout(timer);
  }, [stopAddress]);

  const searchPlaces = async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not configured');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&components=country:ky&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        setSearchResults(data.predictions);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    if (!GOOGLE_PLACES_API_KEY) return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,name&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          address: data.result.formatted_address,
          coordinates: {
            latitude: data.result.geometry.location.lat,
            longitude: data.result.geometry.location.lng,
          },
          name: data.result.name,
        };
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    }
    return null;
  };

  /**
   * Calculate the additional distance for the detour via the stop
   */
  const calculateDetourDistance = async (
    currentDestination: { latitude: number; longitude: number },
    stopLocation: { latitude: number; longitude: number },
    driverLocation?: { latitude: number; longitude: number }
  ): Promise<{ detourKm: number; detourMinutes: number } | null> => {
    if (!GOOGLE_DIRECTIONS_API_KEY) {
      console.error('Google Directions API key not configured');
      return null;
    }

    try {
      // Get driver's current location or use active ride pickup
      const origin = driverLocation || {
        latitude: activeRide?.pickup?.lat,
        longitude: activeRide?.pickup?.lng,
      };

      if (!origin.latitude || !origin.longitude) {
        console.error('No origin location available');
        return null;
      }

      // Calculate direct route: origin -> destination
      const directUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${currentDestination.latitude},${currentDestination.longitude}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      // Calculate route via stop: origin -> stop -> destination
      const viaStopUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${currentDestination.latitude},${currentDestination.longitude}&waypoints=${stopLocation.latitude},${stopLocation.longitude}&mode=driving&key=${GOOGLE_DIRECTIONS_API_KEY}`;

      const [directResponse, viaStopResponse] = await Promise.all([
        fetch(directUrl),
        fetch(viaStopUrl),
      ]);

      const directData = await directResponse.json();
      const viaStopData = await viaStopResponse.json();

      if (directData.status !== 'OK' || viaStopData.status !== 'OK') {
        console.error('Directions API error:', directData.status, viaStopData.status);
        return null;
      }

      // Get total distance and duration for both routes
      const directDistanceMeters = directData.routes[0]?.legs?.reduce(
        (sum: number, leg: any) => sum + leg.distance.value, 0
      ) || 0;
      const directDurationSeconds = directData.routes[0]?.legs?.reduce(
        (sum: number, leg: any) => sum + leg.duration.value, 0
      ) || 0;

      const viaStopDistanceMeters = viaStopData.routes[0]?.legs?.reduce(
        (sum: number, leg: any) => sum + leg.distance.value, 0
      ) || 0;
      const viaStopDurationSeconds = viaStopData.routes[0]?.legs?.reduce(
        (sum: number, leg: any) => sum + leg.duration.value, 0
      ) || 0;

      // Calculate the detour (additional distance/time)
      const detourMeters = Math.max(0, viaStopDistanceMeters - directDistanceMeters);
      const detourSeconds = Math.max(0, viaStopDurationSeconds - directDurationSeconds);

      return {
        detourKm: detourMeters / 1000,
        detourMinutes: Math.ceil(detourSeconds / 60),
      };
    } catch (error) {
      console.error('Failed to calculate detour distance:', error);
      return null;
    }
  };

  /**
   * Calculate the additional cost for adding a stop
   */
  const calculateAdditionalCost = (detourKm: number): number => {
    const distanceCost = detourKm * PRICE_PER_KM;
    const totalAdditional = STOP_BASE_FEE + distanceCost;
    return Math.round(totalAdditional * 100) / 100;
  };

  const handleSelectStop = async (place: PlaceResult) => {
    if (!activeRide || !currentTrip) {
      Alert.alert('Error', 'No active trip found');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get place details
      const details = await getPlaceDetails(place.place_id);
      if (!details) {
        Alert.alert('Error', 'Could not get location details. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Calculate the actual detour distance and cost
      let estimatedAdditionalCost = STOP_BASE_FEE;
      let detourInfo: { detourKm: number; detourMinutes: number } | null = null;

      const destination = currentTrip.destination?.coordinates || {
        latitude: activeRide.destination?.lat,
        longitude: activeRide.destination?.lng,
      };

      if (destination.latitude && destination.longitude) {
        detourInfo = await calculateDetourDistance(
          destination,
          details.coordinates,
          currentTrip.driverLocation ? {
            latitude: currentTrip.driverLocation.latitude,
            longitude: currentTrip.driverLocation.longitude,
          } : undefined
        );

        if (detourInfo) {
          estimatedAdditionalCost = calculateAdditionalCost(detourInfo.detourKm);
        }
      }

      // Build confirmation message with detour info
      let confirmMessage = `Add a stop at ${details.name || details.address}?\n\n`;
      if (detourInfo && detourInfo.detourKm > 0) {
        confirmMessage += `Detour: +${detourInfo.detourKm.toFixed(1)} km (~${detourInfo.detourMinutes} min)\n`;
      }
      confirmMessage += `Estimated additional cost: CI$${estimatedAdditionalCost.toFixed(2)}\n\n`;
      confirmMessage += 'The rider will need to approve this request before the stop is added.';

      // Show confirmation dialog
      Alert.alert(
        'Request Stop',
        confirmMessage,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsSubmitting(false),
          },
          {
            text: 'Request Stop',
            onPress: async () => {
              try {
                // Create stop request with detailed info
                const stopRequest = {
                  address: details.address,
                  coordinates: details.coordinates,
                  placeName: details.name,
                  requestedBy: 'driver',
                  status: 'pending',
                  estimatedAdditionalCost,
                  detourKm: detourInfo?.detourKm || 0,
                  detourMinutes: detourInfo?.detourMinutes || 0,
                  requestedAt: new Date(),
                };

                // Update trip with pending stop request
                await updateTrip(currentTrip.id, {
                  pendingStopRequest: stopRequest,
                });

                Alert.alert(
                  'Stop Requested',
                  'The rider has been notified of your stop request. They will confirm shortly.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } catch (error) {
                console.error('Failed to request stop:', error);
                Alert.alert('Error', 'Failed to send stop request. Please try again.');
              } finally {
                setIsSubmitting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error selecting stop:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Stop</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            The rider will need to approve the stop. Additional charges will apply.
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            value={stopAddress}
            onChangeText={setStopAddress}
            placeholder="Search for a place..."
            placeholderTextColor={Colors.gray[400]}
            autoFocus
            editable={!isSubmitting}
          />
          {stopAddress.length > 0 && !isSubmitting && (
            <TouchableOpacity onPress={() => setStopAddress('')}>
              <Ionicons name="close-circle" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
          {isSearching && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>

        {/* Search Results */}
        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
          {searchResults.map((result) => (
            <TouchableOpacity
              key={result.place_id}
              style={styles.resultCard}
              onPress={() => handleSelectStop(result)}
              disabled={isSubmitting}
            >
              <View style={styles.resultIcon}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={styles.resultText}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {result.structured_formatting.main_text}
                </Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>
                  {result.structured_formatting.secondary_text}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          ))}

          {stopAddress.length >= 3 && searchResults.length === 0 && !isSearching && (
            <View style={styles.noResults}>
              <Ionicons name="search" size={48} color={Colors.gray[300]} />
              <Text style={styles.noResultsText}>No places found</Text>
              <Text style={styles.noResultsSubtext}>
                Try a different search term
              </Text>
            </View>
          )}

          {stopAddress.length < 3 && (
            <View style={styles.searchPrompt}>
              <Ionicons name="location-outline" size={48} color={Colors.gray[300]} />
              <Text style={styles.searchPromptText}>
                Search for a stop location
              </Text>
              <Text style={styles.searchPromptSubtext}>
                Enter at least 3 characters to search
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Sending request to rider...</Text>
          </View>
        </View>
      )}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.black,
  },
  results: {
    flex: 1,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 4,
  },
  searchPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  searchPromptText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: 16,
  },
  searchPromptSubtext: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[700],
    marginTop: 12,
  },
});
