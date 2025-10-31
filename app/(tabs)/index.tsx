import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * HOME SCREEN WITH GOOGLE PLACES API
 * 
 * ✅ Uses Google Places API (NOT native device search)
 * ✅ Restricted to Grand Cayman only
 * ✅ Professional autocomplete
 * ✅ Saved places (Home, Work)
 * ✅ Current location detection
 * 
 * GRAND CAYMAN RESTRICTIONS:
 * - locationbias: 19.3133,-81.2546 (George Town center)
 * - radius: 15000 meters (covers entire island)
 * - components: country:ky (Cayman Islands)
 * - strictbounds: true (only results within bounds)
 */

// Google Places API Key
const GOOGLE_PLACES_API_KEY = 
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Grand Cayman coordinates (George Town center)
const GRAND_CAYMAN_CENTER = {
  latitude: 19.3133,
  longitude: -81.2546,
};

// Radius that covers entire Grand Cayman (15km = 15000 meters)
const SEARCH_RADIUS = 15000;

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  source?: 'geocoding' | 'places';
  priority?: number;
}

interface SavedPlace {
  label: string;
  address: string;
  coordinates: LatLng;
  placeId?: string;
}

const HomeScreen = () => {
  // Location state
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Save address modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [addressToSave, setAddressToSave] = useState<SavedPlace | null>(null);

  // Saved addresses
  const [homeAddress, setHomeAddress] = useState<SavedPlace | null>(null);
  const [workAddress, setWorkAddress] = useState<SavedPlace | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getCurrentLocation();
    loadSavedAddresses();
  }, []);

  // Debounced search using Google Places API
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchPlacesAPI(searchQuery);
      }, 500);
    } else {
      setPredictions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        const caymanRegion = {
          latitude: 19.3133,
          longitude: -81.2546,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        };
        setRegion(caymanRegion);
        setLoading(false);
        return;
      }

      console.log('Getting current location...');

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('Location received:', currentLocation.coords);

      setLocation(currentLocation);
      
      const initialRegion: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setRegion(initialRegion);
      setLoading(false);

      setTimeout(() => {
        mapRef.current?.animateToRegion(initialRegion, 1000);
      }, 500);

    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Failed to get your location. Please enable location services.');
      
      const caymanRegion = {
        latitude: 19.3133,
        longitude: -81.2546,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };
      setRegion(caymanRegion);
      setLoading(false);
    }
  };

  /**
   * Extract main text from full address
   * Example: "Capts Joe and Osbert Rd, West Bay, Grand Cayman" → "Capts Joe and Osbert Rd"
   */
  const extractMainText = (fullAddress: string): string => {
    const parts = fullAddress.split(',');
    return parts[0].trim();
  };

  /**
   * Extract secondary text from full address
   * Example: "Capts Joe and Osbert Rd, West Bay, Grand Cayman" → "West Bay, Grand Cayman"
   */
  const extractSecondaryText = (fullAddress: string): string => {
    const parts = fullAddress.split(',');
    return parts.slice(1).join(',').trim();
  };

  /**
   * ADDRESS-FIRST SEARCH for Carpooling App
   * 
   * PRIORITY: Find residential addresses (where people live)
   * SECONDARY: Popular places/businesses
   * 
   * Strategy:
   * 1. Use Geocoding API FIRST (comprehensive address database)
   * 2. Merge with Places API results (for additional context)
   * 3. Prioritize street addresses over businesses
   */
  const searchPlacesAPI = async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      Alert.alert('Error', 'Google Places API key not configured');
      console.error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY not found');
      return;
    }

    setSearchLoading(true);

    try {
      console.log('🏠 ADDRESS-FIRST SEARCH: Prioritizing residential addresses');
      
      // STEP 1: Geocoding API FIRST (Primary - finds all addresses)
      console.log('🔍 Step 1: Geocoding API (Primary - for addresses)...');
      
      const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      geocodeUrl.searchParams.append('address', `${query}, Grand Cayman, Cayman Islands`);
      geocodeUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
      geocodeUrl.searchParams.append('components', 'country:KY');
      geocodeUrl.searchParams.append('bounds', '19.2,-81.5|19.4,-81.0'); // Grand Cayman bounds

      const geocodeResponse = await fetch(geocodeUrl.toString());
      const geocodeData = await geocodeResponse.json();

      console.log('📊 Geocoding API Status:', geocodeData.status);

      const allResults: PlacePrediction[] = [];

      if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
        console.log(`✅ Geocoding API found ${geocodeData.results.length} addresses`);
        
        // Convert Geocoding results to unified format
        const geocodingResults = geocodeData.results.map((result: any) => ({
          place_id: result.place_id,
          description: result.formatted_address,
          structured_formatting: {
            main_text: extractMainText(result.formatted_address),
            secondary_text: extractSecondaryText(result.formatted_address),
          },
          source: 'geocoding',
          priority: 1, // Highest priority for addresses
        }));

        allResults.push(...geocodingResults);
      } else {
        console.log('⚠️ Geocoding API: No addresses found');
      }

      // STEP 2: Places API (Secondary - for additional context)
      console.log('🔍 Step 2: Places API (Secondary - for businesses/landmarks)...');
      
      const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      placesUrl.searchParams.append('input', query);
      placesUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);
      placesUrl.searchParams.append('components', 'country:ky');
      placesUrl.searchParams.append('location', `${GRAND_CAYMAN_CENTER.latitude},${GRAND_CAYMAN_CENTER.longitude}`);
      placesUrl.searchParams.append('radius', '20000');
      placesUrl.searchParams.append('types', 'geocode');

      const placesResponse = await fetch(placesUrl.toString());
      const placesData = await placesResponse.json();

      console.log('📊 Places API Status:', placesData.status);

      if (placesData.status === 'OK' && placesData.predictions && placesData.predictions.length > 0) {
        console.log(`✅ Places API found ${placesData.predictions.length} results`);
        
        // Add Places results with lower priority
        const placesResults = placesData.predictions.map((pred: any) => ({
          ...pred,
          source: 'places',
          priority: 2, // Lower priority than geocoding
        }));

        allResults.push(...placesResults);
      } else {
        console.log('⚠️ Places API: No results');
      }

      // STEP 3: Deduplicate and sort (addresses first)
      const uniqueResults = new Map();
      
      allResults.forEach(result => {
        const key = result.place_id || result.description;
        if (!uniqueResults.has(key)) {
          uniqueResults.set(key, result);
        } else {
          // Keep the one with higher priority (lower number = higher priority)
          const existing = uniqueResults.get(key);
          if ((result.priority ?? 999) < (existing.priority ?? 999)) {
            uniqueResults.set(key, result);
          }
        }
      });

      const finalResults = Array.from(uniqueResults.values())
        .sort((a, b) => a.priority - b.priority) // Addresses first
        .slice(0, 10); // Limit to 10 results

      console.log(`📍 Final results: ${finalResults.length} unique locations (addresses prioritized)`);

      if (finalResults.length > 0) {
        setPredictions(finalResults);
      } else {
        console.log('❌ No results found in Grand Cayman');
        setPredictions([]);
      }

    } catch (error) {
      console.error('❌ Error searching:', error);
      Alert.alert('Error', 'Failed to search locations');
      setPredictions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * Get place details from place_id
   */
  const getPlaceDetails = async (placeId: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      Alert.alert('Error', 'Google Places API key not configured');
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry&key=${GOOGLE_PLACES_API_KEY}`;

      console.log('🔍 Fetching place details for:', placeId);

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        console.log('✅ Place details retrieved');
        return {
          name: data.result.name,
          address: data.result.formatted_address,
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
      } else {
        console.error('❌ Place details error:', data.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting place details:', error);
      return null;
    }
  };

  /**
   * Handle selecting a place from predictions
   */
  const selectPlace = async (prediction: PlacePrediction) => {
    setSearchLoading(true);

    try {
      const details = await getPlaceDetails(prediction.place_id);

      if (details) {
        const place: SavedPlace = {
          label: prediction.structured_formatting.main_text,
          address: prediction.description,
          coordinates: {
            latitude: details.latitude,
            longitude: details.longitude,
          },
          placeId: prediction.place_id,
        };

        console.log('📍 Selected location:', place);

        // Close search modal
        setShowSearchModal(false);
        setSearchQuery('');
        setPredictions([]);

        // Show save dialog
        setAddressToSave(place);
        setShowSaveModal(true);
      } else {
        Alert.alert('Error', 'Failed to get location details');
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      Alert.alert('Error', 'Failed to select location');
    } finally {
      setSearchLoading(false);
    }
  };

  const saveAddress = (type: 'home' | 'work') => {
    if (addressToSave) {
      if (type === 'home') {
        setHomeAddress(addressToSave);
        // TODO: Save to AsyncStorage or Firebase
      } else {
        setWorkAddress(addressToSave);
        // TODO: Save to AsyncStorage or Firebase
      }
      setShowSaveModal(false);
      setAddressToSave(null);
      Alert.alert('Success', `Address saved as ${type}`);
    }
  };

  const loadSavedAddresses = async () => {
    // TODO: Load from AsyncStorage or Firebase
  };

  const navigateToDestination = (destination: SavedPlace) => {
    router.push({
      pathname: '/(rider)/select-destination',
      params: {
        pickup: JSON.stringify(location?.coords || region),
        destination: JSON.stringify(destination.coordinates),
      },
    });
  };

  const openSearchModal = () => {
    setShowSearchModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5d1289ff" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map View */}
      {region && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          loadingEnabled={true}
          loadingIndicatorColor="#5d1289ff"
          loadingBackgroundColor="#FFFFFF"
          onMapReady={() => console.log('Map is ready!')}
        >
          {/* Current location marker */}
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
              description="You are here"
              pinColor="#5d1289ff"
            />
          )}
        </MapView>
      )}

      {/* Error Message */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Search Card */}
      <View style={styles.searchCard}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={openSearchModal}
        >
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>Where to?</Text>
        </TouchableOpacity>

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessRow}>
          {homeAddress && (
            <TouchableOpacity
              style={styles.quickAccessButton}
              onPress={() => navigateToDestination(homeAddress)}
            >
              <Ionicons name="home" size={18} color="#5d1289ff" />
              <Text style={styles.quickAccessText}>Home</Text>
            </TouchableOpacity>
          )}
          {workAddress && (
            <TouchableOpacity
              style={styles.quickAccessButton}
              onPress={() => navigateToDestination(workAddress)}
            >
              <Ionicons name="briefcase" size={18} color="#5d1289ff" />
              <Text style={styles.quickAccessText}>Work</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setPredictions([]);
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Grand Cayman..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
          </View>

          {/* API Status Indicator */}
          <View style={styles.apiStatusContainer}>
            <Ionicons 
              name={GOOGLE_PLACES_API_KEY ? "checkmark-circle" : "warning"} 
              size={14} 
              color={GOOGLE_PLACES_API_KEY ? "#10B981" : "#F59E0B"} 
            />
            <Text style={styles.apiStatusText}>
              {GOOGLE_PLACES_API_KEY 
                ? "Using Google Places API • Grand Cayman only" 
                : "⚠️ Places API key not configured"}
            </Text>
          </View>

          {/* Search Results */}
          {searchLoading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#5d1289ff" />
            </View>
          )}

          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => selectPlace(item)}
              >
                <Ionicons name="location" size={20} color="#5d1289ff" />
                <View style={styles.predictionText}>
                  <Text style={styles.predictionMain}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.predictionSecondary}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.length > 2 && !searchLoading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>No results found in Grand Cayman</Text>
                  <Text style={styles.emptySubtext}>
                    Try searching for landmarks, addresses, or businesses
                  </Text>
                </View>
              ) : searchQuery.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color="#999" />
                  <Text style={styles.emptyText}>Search locations in Grand Cayman</Text>
                  <Text style={styles.emptySubtext}>
                    Try "George Town", "Seven Mile Beach", or "Camana Bay"
                  </Text>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Save Address Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.saveModalOverlay}>
          <View style={styles.saveModalContent}>
            <Text style={styles.saveModalTitle}>Save this address?</Text>
            <Text style={styles.saveModalAddress}>
              {addressToSave?.address}
            </Text>

            <View style={styles.saveModalButtons}>
              <TouchableOpacity
                style={[styles.saveModalButton, styles.homeButton]}
                onPress={() => saveAddress('home')}
              >
                <Ionicons name="home" size={24} color="#FFFFFF" />
                <Text style={styles.saveModalButtonText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveModalButton, styles.workButton]}
                onPress={() => saveAddress('work')}
              >
                <Ionicons name="briefcase" size={24} color="#FFFFFF" />
                <Text style={styles.saveModalButtonText}>Work</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveModalCancel}
              onPress={() => setShowSaveModal(false)}
            >
              <Text style={styles.saveModalCancelText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  searchCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickAccessButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  quickAccessText: {
    fontSize: 14,
    color: '#5d1289ff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  apiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  apiStatusText: {
    fontSize: 12,
    color: '#666',
  },
  loadingIndicator: {
    padding: 20,
    alignItems: 'center',
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  predictionSecondary: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  saveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  saveModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  saveModalAddress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  saveModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  saveModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  homeButton: {
    backgroundColor: '#5d1289ff',
  },
  workButton: {
    backgroundColor: '#3B82F6',
  },
  saveModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveModalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveModalCancelText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen;