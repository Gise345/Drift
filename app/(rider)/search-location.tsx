import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useLocationStore } from '@/src/stores/location-store';
import { Location } from '@/src/types/carpool';

const Colors = {
  primary: '#D4E700',
  purple: '#5d1289ff',
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#10B981',
  error: '#EF4444',
};

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  distance_meters?: number;
}

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  icon: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export default function SearchLocationScreen() {
  const router = useRouter();
  const { setDestination, setPickupLocation, pickupLocation } = useCarpoolStore();
  const { currentLocation } = useLocationStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPickupMode, setIsPickupMode] = useState(false); // false = destination, true = pickup

  // Sample saved places (replace with real data from AsyncStorage)
  const savedPlaces: SavedLocation[] = [
    {
      id: '1',
      name: 'Home',
      address: 'West Bay, Grand Cayman',
      icon: '🏠',
    },
    {
      id: '2',
      name: 'Work',
      address: 'George Town, Grand Cayman',
      icon: '💼',
    },
  ];

  // Sample recent searches
  const recentSearches: SavedLocation[] = [
    {
      id: 'r1',
      name: 'Camana Bay',
      address: 'Grand Cayman',
      icon: '📍',
    },
    {
      id: 'r2',
      name: 'Seven Mile Beach',
      address: 'Grand Cayman',
      icon: '📍',
    },
  ];

  // Debounced search
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        searchPlaces(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPredictions([]);
    }
  }, [searchQuery]);

  // Search places using Google Places API
  const searchPlaces = async (query: string) => {
    setLoading(true);
    try {
      // Use Google Places Autocomplete API with dedicated Places API key
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&components=country:ky&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Places search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get place details (coordinates)
  const getPlaceDetails = async (placeId: string): Promise<Location | null> => {
    try {
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${API_KEY}`;

      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.result?.geometry?.location) {
        return {
          address: data.result.formatted_address,
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
    return null;
  };

  // Select a location from predictions
  const selectLocation = async (prediction: PlacePrediction) => {
    const location = await getPlaceDetails(prediction.place_id);
    
    if (location) {
      if (isPickupMode) {
        setPickupLocation(location);
        Alert.alert('Success', 'Pickup location updated');
        router.back();
      } else {
        setDestination(location);
        router.push('/(rider)/select-destination');
      }
    } else {
      Alert.alert('Error', 'Failed to get location details');
    }
  };

  // Select saved location
  const selectSavedLocation = (location: SavedLocation) => {
    if (location.coordinates) {
      const loc: Location = {
        address: `${location.name}, ${location.address}`,
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
      };
      
      if (isPickupMode) {
        setPickupLocation(loc);
        router.back();
      } else {
        setDestination(loc);
        router.push('/(rider)/select-destination');
      }
    } else {
      Alert.alert('Info', 'Please search for this location to get exact coordinates');
    }
  };

  // Set current location
  const setCurrentAsLocation = () => {
    if (currentLocation) {
      if (isPickupMode) {
        setPickupLocation(currentLocation);
        Alert.alert('Success', 'Pickup set to current location');
        router.back();
      } else {
        setDestination(currentLocation);
        router.push('/(rider)/select-destination');
      }
    } else {
      Alert.alert('Error', 'Current location not available');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Location Inputs Card */}
        <View style={styles.inputCard}>
          {/* Pickup (From) */}
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => {
              setIsPickupMode(true);
              // Could navigate to another screen or just set mode
            }}
          >
            <View style={styles.locationDot} />
            <View style={styles.locationInput}>
              <Text style={styles.inputLabel}>From</Text>
              <Text style={styles.inputValue}>
                {pickupLocation?.address || currentLocation?.address || 'Current Location'}
              </Text>
            </View>
            {!isPickupMode && (
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Destination (Where To) */}
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.locationDotRed]} />
            <View style={styles.locationInput}>
              <Text style={styles.inputLabel}>Where To</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Search destination"
                placeholderTextColor={Colors.gray[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
            </View>
          </View>
        </View>

        {/* Results */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}

          {/* Search Results */}
          {predictions.length > 0 && (
            <View style={styles.section}>
              {predictions.map((prediction) => (
                <TouchableOpacity
                  key={prediction.place_id}
                  style={styles.locationItem}
                  onPress={() => selectLocation(prediction)}
                >
                  <View style={styles.locationIconContainer}>
                    <Text style={styles.locationIcon}>📍</Text>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>
                      {prediction.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.locationAddress}>
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  </View>
                  {prediction.distance_meters && (
                    <Text style={styles.distance}>
                      {Math.round(prediction.distance_meters / 1000)} km
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Current Location (when no search) */}
          {searchQuery.length === 0 && (
            <>
              {/* Current Location Button */}
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={setCurrentAsLocation}
              >
                <View style={styles.currentLocationIcon}>
                  <Text style={styles.currentLocationIconText}>📍</Text>
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.currentLocationText}>
                    Use Current Location
                  </Text>
                  <Text style={styles.currentLocationAddress}>
                    {currentLocation?.address || 'Getting location...'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Saved Places */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SAVED PLACES</Text>
                
                {savedPlaces.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.savedPlace}
                    onPress={() => selectSavedLocation(place)}
                  >
                    <View style={styles.savedPlaceIcon}>
                      <Text style={styles.savedPlaceIconText}>{place.icon}</Text>
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{place.name}</Text>
                      <Text style={styles.locationAddress}>{place.address}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Recent Searches */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>RECENT</Text>
                
                {recentSearches.map((search) => (
                  <TouchableOpacity
                    key={search.id}
                    style={styles.locationItem}
                    onPress={() => selectSavedLocation(search)}
                  >
                    <View style={styles.locationIconContainer}>
                      <Text style={styles.locationIcon}>{search.icon}</Text>
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{search.name}</Text>
                      <Text style={styles.locationAddress}>{search.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.black,
  },
  inputCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    marginRight: 12,
  },
  locationDotRed: {
    backgroundColor: Colors.error,
  },
  locationInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  inputValue: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  textInput: {
    fontSize: 14,
    color: Colors.gray[900],
    padding: 0,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 20,
    color: Colors.black,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[500],
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentLocationIconText: {
    fontSize: 20,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  currentLocationAddress: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  distance: {
    fontSize: 13,
    color: Colors.gray[500],
    marginLeft: 8,
  },
  savedPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  savedPlaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedPlaceIconText: {
    fontSize: 20,
  },
  chevron: {
    fontSize: 24,
    color: Colors.gray[400],
    marginLeft: 8,
  },
});