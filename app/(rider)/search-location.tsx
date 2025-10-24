/**
 * Drift Search Location Screen
 * Figma: 14_Search_Location.png
 * 
 * Location search with Google Places Autocomplete
 * Built for Expo SDK 52
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useLocationStore } from '@/src/stores/location-store';
import { useCarpoolStore } from '@/src/stores/carpool-store';

// Google Places API types
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
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
  const { currentLocation } = useLocationStore();
  const { setDestination, setPickupLocation } = useCarpoolStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SavedLocation[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  // Focus search input on mount
  useEffect(() => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    
    // Load recent searches from storage
    loadRecentSearches();
  }, []);

  // Load recent searches (mock data for now)
  const loadRecentSearches = () => {
    const mockRecent: SavedLocation[] = [
      {
        id: '1',
        name: 'Owen Roberts Airport',
        address: 'Grand Cayman',
        icon: '✈️',
      },
      {
        id: '2',
        name: 'Camana Bay',
        address: 'Grand Cayman',
        icon: '🛍️',
      },
      {
        id: '3',
        name: 'Seven Mile Beach',
        address: 'West Bay Road, Grand Cayman',
        icon: '🏖️',
      },
    ];
    setRecentSearches(mockRecent);
  };

  // Search using Google Places Autocomplete
  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    
    try {
      // Google Places Autocomplete API
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
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

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      searchPlaces(text);
    } else {
      setPredictions([]);
    }
  };

  // Select a location from predictions
  const selectLocation = async (prediction: PlacePrediction) => {
    try {
      // Get place details for coordinates
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${API_KEY}`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();
      
      if (data.result?.geometry?.location) {
        const destination = {
          address: prediction.description,
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
        
        setDestination(destination);
        
        // Save to recent searches
        saveToRecent({
          id: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          address: prediction.structured_formatting.secondary_text,
          icon: '📍',
          coordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        });
        
        // Navigate to vehicle selection
        router.push('/(rider)/select-destination');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location details');
    }
  };

  // Select saved location
  const selectSavedLocation = (location: SavedLocation) => {
    if (location.coordinates) {
      setDestination({
        address: `${location.name}, ${location.address}`,
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
      });
      router.push('/(rider)/select-destination');
    }
  };

  // Save to recent searches
  const saveToRecent = (location: SavedLocation) => {
    // TODO: Implement AsyncStorage save
    console.log('Saving to recent:', location);
  };

  // Set current location as pickup
  const setCurrentAsPickup = () => {
    if (currentLocation) {
      setPickupLocation(currentLocation);
      Alert.alert('Success', 'Pickup location set to current location');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          
          <Text style={styles.title}>Where To?</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search destination"
              placeholderTextColor={Colors.gray[400]}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setPredictions([]);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Search Results */}
          {predictions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SEARCH RESULTS</Text>
              {predictions.map((prediction) => (
                <TouchableOpacity
                  key={prediction.place_id}
                  style={styles.locationItem}
                  onPress={() => selectLocation(prediction)}
                >
                  <Text style={styles.locationIcon}>📍</Text>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>
                      {prediction.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.locationAddress}>
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Current Location */}
          {searchQuery.length === 0 && (
            <>
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.currentLocationButton}
                  onPress={setCurrentAsPickup}
                >
                  <Text style={styles.currentLocationIcon}>📍</Text>
                  <View style={styles.locationInfo}>
                    <Text style={styles.currentLocationText}>
                      Use Current Location
                    </Text>
                    <Text style={styles.currentLocationAddress}>
                      {currentLocation?.address || 'Getting location...'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Saved Places */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SAVED PLACES</Text>
                
                <TouchableOpacity style={styles.savedPlace}>
                  <View style={styles.savedPlaceIcon}>
                    <Text style={styles.savedPlaceEmoji}>🏠</Text>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.savedPlaceName}>Home</Text>
                    <Text style={styles.savedPlaceHint}>Add home address</Text>
                  </View>
                  <Text style={styles.addIcon}>+</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.savedPlace}>
                  <View style={styles.savedPlaceIcon}>
                    <Text style={styles.savedPlaceEmoji}>💼</Text>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.savedPlaceName}>Work</Text>
                    <Text style={styles.savedPlaceHint}>Add work address</Text>
                  </View>
                  <Text style={styles.addIcon}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>RECENT</Text>
                  {recentSearches.map((location) => (
                    <TouchableOpacity
                      key={location.id}
                      style={styles.locationItem}
                      onPress={() => selectSavedLocation(location)}
                    >
                      <Text style={styles.locationIcon}>{location.icon}</Text>
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationName}>{location.name}</Text>
                        <Text style={styles.locationAddress}>
                          {location.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
    backgroundColor: Colors.white,
  },

  container: {
    flex: 1,
  },

  // Header
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
  },

  backIcon: {
    fontSize: 24,
    color: Colors.black,
  },

  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
  },

  headerSpacer: {
    width: 40,
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: 48,
  },

  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },

  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.black,
  },

  clearIcon: {
    fontSize: 18,
    color: Colors.gray[500],
    marginLeft: Spacing.sm,
  },

  // Content
  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },

  loadingText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  // Sections
  section: {
    paddingTop: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.gray[500],
    letterSpacing: 1,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // Location Items
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },

  locationIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },

  locationInfo: {
    flex: 1,
  },

  locationName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },

  locationAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  // Current Location
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    padding: Spacing.md,
  },

  currentLocationIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },

  currentLocationText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },

  currentLocationAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: 2,
  },

  // Saved Places
  savedPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },

  savedPlaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  savedPlaceEmoji: {
    fontSize: 20,
  },

  savedPlaceName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },

  savedPlaceHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
  },

  addIcon: {
    fontSize: 20,
    color: Colors.gray[400],
  },
});