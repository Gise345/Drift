/**
 * Add Stop Screen - Rider View
 * Allows riders to request adding a stop during an active trip
 * The driver must approve the stop request before it's added
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

export default function RiderAddStop() {
  const router = useRouter();
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
   * Uses Google Directions API to get accurate routing distance
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
      // Get driver's current location or use pickup as origin
      const origin = driverLocation || currentTrip?.driverLocation || currentTrip?.pickup?.coordinates;
      if (!origin) {
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
   * Based on: base fee + (detour distance * price per km)
   */
  const calculateAdditionalCost = (detourKm: number): number => {
    const distanceCost = detourKm * PRICE_PER_KM;
    const totalAdditional = STOP_BASE_FEE + distanceCost;
    // Round to 2 decimal places
    return Math.round(totalAdditional * 100) / 100;
  };

  const handleSelectStop = async (place: PlaceResult) => {
    if (!currentTrip) {
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
      let estimatedAdditionalCost = STOP_BASE_FEE; // Default minimum
      let detourInfo: { detourKm: number; detourMinutes: number } | null = null;

      if (currentTrip.destination?.coordinates) {
        detourInfo = await calculateDetourDistance(
          currentTrip.destination.coordinates,
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
      confirmMessage += 'Your driver will need to approve this request.';

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
                  requestedBy: 'rider',
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
                  'Your driver has been notified of your stop request. They will confirm shortly.',
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
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add a Stop</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#5d1289" />
          <Text style={styles.infoText}>
            Your driver will need to approve the stop. Additional charges may apply.
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={stopAddress}
            onChangeText={setStopAddress}
            placeholder="Search for a place..."
            placeholderTextColor="#9CA3AF"
            autoFocus
            editable={!isSubmitting}
          />
          {stopAddress.length > 0 && !isSubmitting && (
            <TouchableOpacity onPress={() => setStopAddress('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          {isSearching && <ActivityIndicator size="small" color="#5d1289" />}
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
                <Ionicons name="location" size={20} color="#5d1289" />
              </View>
              <View style={styles.resultText}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {result.structured_formatting.main_text}
                </Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>
                  {result.structured_formatting.secondary_text}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}

          {stopAddress.length >= 3 && searchResults.length === 0 && !isSearching && (
            <View style={styles.noResults}>
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text style={styles.noResultsText}>No places found</Text>
              <Text style={styles.noResultsSubtext}>
                Try a different search term
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5d1289" />
            <Text style={styles.loadingText}>Sending request...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#5d1289',
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  results: {
    flex: 1,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 12,
  },
});
