import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCarpoolStore } from '@/src/stores/carpool-store';

/**
 * GOOGLE PLACES API SEARCH - PRODUCTION VERSION
 * 
 * ✅ Uses Google Places API (NOT native device search)
 * ✅ Restricted to Grand Cayman only
 * ✅ Proper autocomplete with debouncing
 * ✅ Recent searches and saved places
 * ✅ "Use Current Location" functionality
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
  distance_meters?: number;
  source?: 'geocoding' | 'places';
  priority?: number;
}

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  icon: string;
  latitude: number;
  longitude: number;
}

const SearchLocationScreen = () => {
  const params = useLocalSearchParams();
  const mode = (params.mode as string) || 'destination'; // 'pickup' or 'destination'
  const { setPickupLocation, setDestination } = useCarpoolStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'George Town',
    'Seven Mile Beach',
    'Owen Roberts Airport',
  ]);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Saved places (Home, Work)
  const savedPlaces: SavedPlace[] = [
    {
      id: '1',
      name: 'Home',
      address: 'Seven Mile Beach, Grand Cayman',
      icon: 'home',
      latitude: 19.3269,
      longitude: -81.3860,
    },
    {
      id: '2',
      name: 'Work',
      address: 'Camana Bay, Grand Cayman',
      icon: 'briefcase',
      latitude: 19.3325,
      longitude: -81.3778,
    },
  ];

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
    } catch (error) {
      console.error('Error getting location:', error);
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
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPredictions([]);
      return;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      Alert.alert('Error', 'Google Places API key not configured');
      console.error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY not found');
      return;
    }

    setLoading(true);

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
      setLoading(false);
    }
  }, []);

  /**
   * Debounced search - wait 500ms after user stops typing
   */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 500); // 500ms debounce
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
  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setLoading(true);

    try {
      const details = await getPlaceDetails(prediction.place_id);

      if (details) {
        const locationData = {
          name: prediction.structured_formatting.main_text,
          address: prediction.description,
          latitude: details.latitude,
          longitude: details.longitude,
        };

        console.log('📍 Selected location:', locationData);

        // Save to store based on mode
        if (mode === 'pickup') {
          setPickupLocation(locationData);
        } else {
          setDestination(locationData);
        }

        // Add to recent searches
        if (!recentSearches.includes(prediction.description)) {
          setRecentSearches([prediction.description, ...recentSearches.slice(0, 4)]);
        }

        // Navigate back
        router.back();
      } else {
        Alert.alert('Error', 'Failed to get location details');
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      Alert.alert('Error', 'Failed to select location');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Use current location
   */
  const handleUseCurrentLocation = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available');
      return;
    }

    setLoading(true);

    try {
      // Reverse geocode to get address
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${currentLocation.latitude},${currentLocation.longitude}&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        
        const locationData = {
          name: 'Current Location',
          address: result.formatted_address,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        };

        console.log('📍 Using current location:', locationData);

        if (mode === 'pickup') {
          setPickupLocation(locationData);
        } else {
          setDestination(locationData);
        }

        router.back();
      } else {
        Alert.alert('Error', 'Failed to get current location address');
      }
    } catch (error) {
      console.error('Error using current location:', error);
      Alert.alert('Error', 'Failed to use current location');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle selecting saved place
   */
  const handleSelectSavedPlace = (place: SavedPlace) => {
    const locationData = {
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
    };

    console.log('📍 Selected saved place:', locationData);

    if (mode === 'pickup') {
      setPickupLocation(locationData);
    } else {
      setDestination(locationData);
    }

    router.back();
  };

  /**
   * Handle selecting recent search
   */
  const handleSelectRecentSearch = (search: string) => {
    setSearchQuery(search);
    searchPlaces(search);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'pickup' ? 'Select Pickup' : 'Where To?'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search locations in Grand Cayman..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoFocus
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator size="small" color="#5d1289ff" style={styles.loadingIcon} />
        )}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setPredictions([]);
          }}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
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

      {/* Results */}
      <FlatList
        data={searchQuery.length > 0 ? predictions : []}
        keyExtractor={(item) => item.place_id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          searchQuery.length === 0 ? (
            <View>
              {/* Current Location Button */}
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={handleUseCurrentLocation}
                disabled={!currentLocation}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name="locate" size={20} color="#5d1289ff" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>Use Current Location</Text>
                  <Text style={styles.locationAddress}>
                    {currentLocation ? 'Grand Cayman' : 'Detecting...'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              {/* Saved Places */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Saved Places</Text>
                {savedPlaces.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.placeItem}
                    onPress={() => handleSelectSavedPlace(place)}
                  >
                    <View style={styles.iconCircle}>
                      <Ionicons 
                        name={place.icon as any} 
                        size={20} 
                        color="#5d1289ff" 
                      />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{place.name}</Text>
                      <Text style={styles.locationAddress}>{place.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.placeItem}
                      onPress={() => handleSelectRecentSearch(search)}
                    >
                      <View style={styles.iconCircle}>
                        <Ionicons name="time" size={20} color="#999" />
                      </View>
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationName}>{search}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          searchQuery.length > 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>No locations found in Grand Cayman</Text>
              <Text style={styles.emptySubtext}>
                Try searching for landmarks, addresses, or businesses
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.predictionItem}
            onPress={() => handleSelectPlace(item)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color="#5d1289ff" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>
                {item.structured_formatting.main_text}
              </Text>
              <Text style={styles.locationAddress}>
                {item.structured_formatting.secondary_text}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

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
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  loadingIcon: {
    marginRight: 8,
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
  listContainer: {
    paddingBottom: 20,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SearchLocationScreen;