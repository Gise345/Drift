import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import * as Location from 'expo-location';

// Google Places API Key
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  icon: any;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export default function SearchLocationScreen() {
  const { setDestination, setPickupLocation, pickupLocation } = useCarpoolStore();

  const [pickupQuery, setPickupQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState<'pickup' | 'destination'>('destination');
  const [recentSearches, setRecentSearches] = useState<SavedPlace[]>([]);

  const pickupRef = useRef<TextInput>(null);
  const destinationRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Sample saved places - replace with real data
  const savedPlaces: SavedPlace[] = [
    {
      id: '1',
      name: 'Work',
      address: '3PL',
      icon: 'briefcase',
    },
  ];

  useEffect(() => {
    // Load pickup location if available
    if (pickupLocation) {
      setPickupQuery(pickupLocation.address);
    } else {
      getCurrentLocation();
    }

    // Auto-focus destination field
    setTimeout(() => {
      destinationRef.current?.focus();
    }, 300);
  }, []);

  // Debounced search
  useEffect(() => {
    const query = activeInput === 'pickup' ? pickupQuery : destinationQuery;

    if (query.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(query);
      }, 300);
    } else {
      setPredictions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [pickupQuery, destinationQuery, activeInput]);

  const getCurrentLocation = async () => {
    try {
      const { status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPickupQuery('Current Location');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const [result] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const address = result
        ? [result.street, result.city, result.region].filter(Boolean).join(', ')
        : 'Current Location';

      setPickupQuery(address);

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: address,
      };

      setPickupLocation(locationData);
    } catch (error) {
      console.error('Error getting location:', error);
      setPickupQuery('Current Location');
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) {
      setPredictions([]);
      return;
    }

    try {
      setLoading(true);

      const locationBias = `&location=19.3133,-81.2546&radius=50000`;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
          `input=${encodeURIComponent(query)}` +
          locationBias +
          `&components=country:ky` +
          `&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Failed to search places:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
          `place_id=${placeId}` +
          `&fields=name,formatted_address,geometry` +
          `&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
          address: data.result.formatted_address,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get place details:', error);
      return null;
    }
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    const placeDetails = await getPlaceDetails(prediction.place_id);

    if (!placeDetails) {
      Alert.alert('Error', 'Failed to get place details');
      return;
    }

    if (activeInput === 'pickup') {
      setPickupQuery(prediction.description);
      setPickupLocation(placeDetails);
      setPredictions([]);
      // Switch to destination
      setActiveInput('destination');
      destinationRef.current?.focus();
    } else {
      setDestinationQuery(prediction.description);
      setDestination(placeDetails);
      setPredictions([]);

      // Navigate to vehicle selection
      if (pickupLocation) {
        router.push('/(rider)/vehicle-selection');
      }
    }
  };

  const handleSavedPlaceSelect = (place: SavedPlace) => {
    if (activeInput === 'destination') {
      setDestinationQuery(place.address);
      // Navigate to vehicle selection
      router.push('/(rider)/vehicle-selection');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan your ride</Text>
      </SafeAreaView>

      {/* For Me Dropdown */}
      <View style={styles.content}>
        <TouchableOpacity style={styles.forMeButton}>
          <Ionicons name="person" size={20} color="#fff" />
          <Text style={styles.forMeText}>For me</Text>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Location Input Card */}
        <View style={styles.locationCard}>
          {/* Pickup Location */}
          <TouchableOpacity
            style={styles.locationInputRow}
            onPress={() => {
              setActiveInput('pickup');
              pickupRef.current?.focus();
            }}
            activeOpacity={1}
          >
            <View style={styles.locationIconContainer}>
              <View style={styles.pickupDot} />
              <View style={styles.connectingLine} />
            </View>
            <TextInput
              ref={pickupRef}
              style={[styles.locationInput, activeInput === 'pickup' && styles.activeInput]}
              value={pickupQuery}
              onChangeText={setPickupQuery}
              placeholder="Pickup location"
              placeholderTextColor="#888"
              onFocus={() => setActiveInput('pickup')}
            />
          </TouchableOpacity>

          {/* Destination Location */}
          <TouchableOpacity
            style={styles.locationInputRow}
            onPress={() => {
              setActiveInput('destination');
              destinationRef.current?.focus();
            }}
            activeOpacity={1}
          >
            <View style={styles.locationIconContainer}>
              <View style={styles.destinationSquare} />
            </View>
            <TextInput
              ref={destinationRef}
              style={[styles.locationInput, activeInput === 'destination' && styles.activeInput]}
              value={destinationQuery}
              onChangeText={setDestinationQuery}
              placeholder="Where to?"
              placeholderTextColor="#888"
              onFocus={() => setActiveInput('destination')}
            />
            {destinationQuery.length > 0 && (
              <TouchableOpacity onPress={() => setDestinationQuery('')}>
                <Ionicons name="close-circle" size={24} color="#888" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results or Suggestions */}
        <FlatList
          data={predictions.length > 0 ? predictions : []}
          keyExtractor={(item) => item.place_id}
          ListHeaderComponent={() => (
            <>
              {/* Saved Places */}
              {predictions.length === 0 && activeInput === 'destination' && (
                <View style={styles.section}>
                  <View style={styles.savedPlacesRow}>
                    {savedPlaces.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        style={styles.savedPlaceCard}
                        onPress={() => handleSavedPlaceSelect(place)}
                      >
                        <Ionicons name={place.icon as any} size={20} color="#fff" />
                        <View style={styles.savedPlaceInfo}>
                          <Text style={styles.savedPlaceTitle}>{place.name}</Text>
                          <Text style={styles.savedPlaceAddress}>{place.address}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={styles.savedPlaceCard}>
                      <Ionicons name="star" size={20} color="#fff" />
                      <Text style={styles.savedPlacesTitle}>Saved places</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Recent Searches */}
              {predictions.length === 0 && recentSearches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                </View>
              )}
            </>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.predictionItem}
              onPress={() => handlePlaceSelect(item)}
            >
              <View style={styles.predictionIcon}>
                <Ionicons name="location-outline" size={24} color="#fff" />
              </View>
              <View style={styles.predictionText}>
                <Text style={styles.predictionMain}>{item.structured_formatting.main_text}</Text>
                <Text style={styles.predictionSecondary}>
                  {item.structured_formatting.secondary_text}
                </Text>
              </View>
              {loading && <ActivityIndicator size="small" color="#888" />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <>
              {predictions.length === 0 && (destinationQuery.length > 0 || pickupQuery.length > 0) && !loading && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              )}
            </>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  forMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  forMeText: {
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 8,
  },
  locationCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  locationIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  connectingLine: {
    width: 2,
    height: 24,
    backgroundColor: '#4a4a4a',
    marginTop: 4,
  },
  destinationSquare: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    padding: 0,
  },
  activeInput: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  savedPlacesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savedPlaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 0.48,
  },
  savedPlaceInfo: {
    marginLeft: 12,
  },
  savedPlaceTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  savedPlaceAddress: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  savedPlacesTitle: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  predictionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  predictionSecondary: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  noResults: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
  },
});
