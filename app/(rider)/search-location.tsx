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
  ScrollView,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/src/stores/user-store';

/**
 * DRIFT SEARCH LOCATION SCREEN - WITH MULTI-STOP SUPPORT
 * 
 * Features:
 * ✅ Search pickup and destination
 * ✅ Add up to 2 additional stops
 * ✅ Remove stops functionality
 * ✅ Category chips for quick access
 * ✅ Better loading states
 * ✅ Smooth transitions
 * ✅ Visual feedback
 */

// Google Places API Key
const GOOGLE_PLACES_API_KEY = 
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Grand Cayman coordinates
const GRAND_CAYMAN_CENTER = {
  latitude: 19.3133,
  longitude: -81.2546,
};

const SEARCH_RADIUS = 15000;

// Storage keys
const STORAGE_KEYS = {
  HOME_ADDRESS: '@drift_home_address',
  WORK_ADDRESS: '@drift_work_address',
  CUSTOM_ADDRESSES: '@drift_custom_addresses',
  RECENT_SEARCHES: '@drift_recent_searches',
};

// Quick access categories
const CATEGORIES = [
  { id: 'restaurants', icon: 'restaurant', label: 'Restaurants', query: 'restaurant' },
  { id: 'hotels', icon: 'bed', label: 'Hotels', query: 'hotel' },
  { id: 'beaches', icon: 'water', label: 'Beaches', query: 'beach' },
  { id: 'shopping', icon: 'cart', label: 'Shopping', query: 'shopping mall' },
];

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  distance_meters?: number;
}

interface SavedAddress {
  id: string;
  type: 'home' | 'work' | 'custom';
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface RecentSearch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface RouteLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const SearchLocationScreen = () => {
  const params = useLocalSearchParams();
  const { 
    setPickupLocation, 
    setDestination,
    stops: storeStops,
    addStop,
    removeStop: removeStoreStop,
  } = useCarpoolStore();

  // Check if in add-stop mode
  const addStopMode = params.mode === 'add-stop';
  const stopIndex = params.stopIndex ? parseInt(params.stopIndex as string) : null;

  // Search state
  const [activeInput, setActiveInput] = useState<'pickup' | 'destination' | number>(
    addStopMode ? 0 : 'destination'
  );
  const [pickupQuery, setPickupQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [stopQueries, setStopQueries] = useState<string[]>(['', '']);
  
  // Route locations
  const [pickupLocation, setPickupLocationState] = useState<RouteLocation | null>(null);
  const [destinationLocation, setDestinationLocationState] = useState<RouteLocation | null>(null);
  const [stopLocations, setStopLocations] = useState<RouteLocation[]>([]);

  // Predictions and loading
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
  
  // Saved data
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Animation
  const searchBarScale = useRef(new Animated.Value(1)).current;
  const resultsFadeAnim = useRef(new Animated.Value(0)).current;

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeScreen();
    // Animate search bar on mount
    Animated.sequence([
      Animated.spring(searchBarScale, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 50,
      }),
      Animated.spring(searchBarScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
      }),
    ]).start();
  }, []);

  const initializeScreen = async () => {
    await getCurrentLocation();
    await loadSavedAddresses();
    await loadRecentSearches();
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation(location.coords);

      // Auto-fill pickup with current location if not in add-stop mode
      if (!addStopMode) {
        const address = await reverseGeocode(location.coords.latitude, location.coords.longitude);
        if (address) {
          setPickupQuery(address);
          setPickupLocationState({
            name: 'Current Location',
            address: address,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  };

  const loadSavedAddresses = async () => {
    try {
      // Try to load from Firebase first (source of truth)
      const currentUser = useUserStore.getState().user;
      const addresses: SavedAddress[] = [];

      if (currentUser) {
        if (currentUser.homeAddress) {
          addresses.push({
            id: currentUser.homeAddress.id,
            type: 'home',
            label: currentUser.homeAddress.label || 'Home',
            address: currentUser.homeAddress.address,
            latitude: currentUser.homeAddress.coordinates.latitude,
            longitude: currentUser.homeAddress.coordinates.longitude,
          });
        }
        if (currentUser.workAddress) {
          addresses.push({
            id: currentUser.workAddress.id,
            type: 'work',
            label: currentUser.workAddress.label || 'Work',
            address: currentUser.workAddress.address,
            latitude: currentUser.workAddress.coordinates.latitude,
            longitude: currentUser.workAddress.coordinates.longitude,
          });
        }
        if (currentUser.savedPlaces && currentUser.savedPlaces.length > 0) {
          currentUser.savedPlaces.forEach(place => {
            addresses.push({
              id: place.id,
              type: 'custom',
              label: place.label,
              address: place.address,
              latitude: place.coordinates.latitude,
              longitude: place.coordinates.longitude,
            });
          });
        }

        if (addresses.length > 0) {
          setSavedAddresses(addresses);
          console.log('Loaded saved addresses from Firebase');
          return;
        }
      }

      // Fallback to AsyncStorage if not logged in
      const [home, work, custom] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HOME_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.WORK_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_ADDRESSES),
      ]);

      if (home) addresses.push(JSON.parse(home));
      if (work) addresses.push(JSON.parse(work));
      if (custom) addresses.push(...JSON.parse(custom));

      setSavedAddresses(addresses);
      console.log('Loaded saved addresses from local storage');
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      // Try to load from Firebase first (source of truth)
      const currentUser = useUserStore.getState().user;

      if (currentUser && currentUser.recentSearches && currentUser.recentSearches.length > 0) {
        const searches = currentUser.recentSearches
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setRecentSearches(searches);
        console.log('Loaded recent searches from Firebase');
        return;
      }

      // Fallback to AsyncStorage
      const recent = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      if (recent) {
        const searches = JSON.parse(recent);
        searches.sort((a: RecentSearch, b: RecentSearch) => b.timestamp - a.timestamp);
        setRecentSearches(searches.slice(0, 10));
        console.log('Loaded recent searches from local storage');
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Search with animation
  useEffect(() => {
    const query = 
      activeInput === 'pickup' ? pickupQuery : 
      activeInput === 'destination' ? destinationQuery :
      stopQueries[activeInput as number] || '';

    if (query.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(query);
      }, 500);
    } else {
      setPredictions([]);
      Animated.timing(resultsFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [pickupQuery, destinationQuery, stopQueries, activeInput]);

  const searchPlaces = async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      Alert.alert('Error', 'Google Places API key not configured');
      return;
    }

    setLoading(true);

    try {
      const location = currentLocation || GRAND_CAYMAN_CENTER;
      
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&location=${location.latitude},${location.longitude}&radius=${SEARCH_RADIUS}&components=country:KY&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions);
        
        // Animate results appearance
        Animated.timing(resultsFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search locations');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<RouteLocation | null> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const { name, formatted_address, geometry } = data.result;
        
        return {
          name: name || formatted_address,
          address: formatted_address,
          latitude: geometry.location.lat,
          longitude: geometry.location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error('Get place details error:', error);
      return null;
    }
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    const location = await getPlaceDetails(prediction.place_id);
    
    if (location) {
      // ADD STOP MODE: Save stop and go back
      if (addStopMode) {
        addStop(location);
        router.back();
        return;
      }

      // NORMAL MODE: Set location for journey
      if (activeInput === 'pickup') {
        setPickupQuery(prediction.structured_formatting.main_text);
        setPickupLocationState(location);
      } else if (activeInput === 'destination') {
        setDestinationQuery(prediction.structured_formatting.main_text);
        setDestinationLocationState(location);
      } else if (typeof activeInput === 'number') {
        // Stop input
        const newQueries = [...stopQueries];
        newQueries[activeInput] = prediction.structured_formatting.main_text;
        setStopQueries(newQueries);
        
        const newLocations = [...stopLocations];
        newLocations[activeInput] = location;
        setStopLocations(newLocations);
      }
      
      setPredictions([]);
      
      // Save to recent searches
      addRecentSearch({
        name: prediction.structured_formatting.main_text,
        address: prediction.description,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  };

  const addRecentSearch = async (search: { name: string; address: string; latitude: number; longitude: number }) => {
    try {
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        name: search.name,
        address: search.address,
        latitude: search.latitude,
        longitude: search.longitude,
        timestamp: Date.now(),
      };

      // Save to Firebase (primary - persists across reinstalls)
      const { addRecentSearch: addSearchToFirebase } = useUserStore.getState();
      try {
        await addSearchToFirebase({
          name: search.name,
          address: search.address,
          latitude: search.latitude,
          longitude: search.longitude,
        });
        console.log('Recent search saved to Firebase');
      } catch (firebaseError) {
        console.warn('Failed to save to Firebase, using local storage:', firebaseError);
      }

      // Also save to AsyncStorage for offline access
      const existing = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      let searches: RecentSearch[] = existing ? JSON.parse(existing) : [];

      // Remove if already exists
      searches = searches.filter(s => s.address !== search.address);

      // Add to beginning
      searches.unshift(newSearch);

      // Keep only 10
      searches = searches.slice(0, 10);

      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleCategoryPress = (category: typeof CATEGORIES[0]) => {
    if (activeInput === 'destination') {
      setDestinationQuery(category.query);
    }
  };

  const handleAddStop = () => {
    if (stopLocations.length >= 2) {
      Alert.alert('Maximum Stops', 'You can only add up to 2 stops');
      return;
    }
    
    // Set active input to new stop
    setActiveInput(stopLocations.length);
  };

  const handleRemoveStop = (index: number) => {
    const newQueries = stopQueries.filter((_, i) => i !== index);
    const newLocations = stopLocations.filter((_, i) => i !== index);
    
    setStopQueries(newQueries);
    setStopLocations(newLocations);
    
    // Reset active input if needed
    if (activeInput === index) {
      setActiveInput('destination');
    }
  };

  const handleConfirm = () => {
    if (!pickupLocation || !destinationLocation) {
      Alert.alert('Missing Information', 'Please select both pickup and destination');
      return;
    }

    // Set in store
    setPickupLocation(pickupLocation);
    setDestination(destinationLocation);
    
    // Clear existing stops in store and add current ones
    stopLocations.forEach((stop) => {
      addStop(stop);
    });

    // Navigate to select destination screen
    router.push({
      pathname: '/(rider)/select-destination',
      params: {
        pickup: JSON.stringify(pickupLocation),
        destination: JSON.stringify(destinationLocation),
      },
    });
  };

  const handleUseCurrentLocation = async () => {
    if (!currentLocation) return;

    const address = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
    if (address) {
      setPickupQuery(address);
      setPickupLocationState({
        name: 'Current Location',
        address: address,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {addStopMode ? 'Add Stop' : 'Search Location'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Inputs Card */}
        {!addStopMode && (
          <Animated.View style={[styles.routeCard, { transform: [{ scale: searchBarScale }] }]}>
            {/* Pickup Input */}
            <View style={[styles.inputContainer, { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }]}>
              <View style={[styles.inputDot, { backgroundColor: '#10B981' }]} />
              <TextInput
                style={[styles.input, activeInput === 'pickup' && styles.inputActive]}
                placeholder="Pickup location"
                placeholderTextColor="#999"
                value={pickupQuery}
                onChangeText={setPickupQuery}
                onFocus={() => setActiveInput('pickup')}
              />
              {pickupQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.inputAction}
                  onPress={() => setPickupQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Stop Inputs */}
            {stopLocations.map((stop, index) => (
              <View 
                key={index}
                style={[styles.inputContainer, { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }]}
              >
                <View style={[styles.inputDot, { backgroundColor: '#F59E0B' }]} />
                <TextInput
                  style={[styles.input, activeInput === index && styles.inputActive]}
                  placeholder={`Stop ${index + 1}`}
                  placeholderTextColor="#999"
                  value={stopQueries[index]}
                  onChangeText={(text) => {
                    const newQueries = [...stopQueries];
                    newQueries[index] = text;
                    setStopQueries(newQueries);
                  }}
                  onFocus={() => setActiveInput(index)}
                />
                <TouchableOpacity 
                  style={styles.inputAction}
                  onPress={() => handleRemoveStop(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Stop Button */}
            {stopLocations.length < 2 && (
              <TouchableOpacity
                style={styles.addStopContainer}
                onPress={handleAddStop}
              >
                <Ionicons name="add-circle" size={20} color="#5d1289" />
                <Text style={styles.addStopText}>Add stop ({stopLocations.length}/2)</Text>
              </TouchableOpacity>
            )}

            {/* Destination Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputDot, { backgroundColor: '#5d1289' }]} />
              <TextInput
                style={[styles.input, activeInput === 'destination' && styles.inputActive]}
                placeholder="Where to?"
                placeholderTextColor="#999"
                value={destinationQuery}
                onChangeText={setDestinationQuery}
                onFocus={() => setActiveInput('destination')}
                autoFocus={!addStopMode}
              />
              {destinationQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.inputAction}
                  onPress={() => setDestinationQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* ADD STOP MODE - Single Input */}
        {addStopMode && (
          <Animated.View style={[styles.routeCard, { transform: [{ scale: searchBarScale }] }]}>
            <View style={styles.inputContainer}>
              <View style={[styles.inputDot, { backgroundColor: '#F59E0B' }]} />
              <TextInput
                style={[styles.input, styles.inputActive]}
                placeholder={`Stop ${(stopIndex || 0) + 1}`}
                placeholderTextColor="#999"
                value={stopQueries[0]}
                onChangeText={(text) => setStopQueries([text])}
                autoFocus
              />
            </View>
          </Animated.View>
        )}

        {/* Category Chips (When Destination is Active) */}
        {activeInput === 'destination' && predictions.length === 0 && !addStopMode && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryChip}
                onPress={() => handleCategoryPress(category)}
              >
                <Ionicons name={category.icon as any} size={18} color="#5d1289" />
                <Text style={styles.categoryText}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Results */}
        <ScrollView style={styles.results}>
          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#5d1289" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <Animated.View style={[styles.section, { opacity: resultsFadeAnim }]}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {predictions.map((prediction) => (
                <TouchableOpacity
                  key={prediction.place_id}
                  style={styles.predictionItem}
                  onPress={() => handleSelectPrediction(prediction)}
                >
                  <View style={styles.predictionIcon}>
                    <Ionicons name="location" size={20} color="#5d1289" />
                  </View>
                  <View style={styles.predictionInfo}>
                    <Text style={styles.predictionMain}>
                      {prediction.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.predictionSecondary}>
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Saved Addresses */}
          {predictions.length === 0 && savedAddresses.length > 0 && !addStopMode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved Places</Text>
              {savedAddresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={styles.savedItem}
                  onPress={() => {
                    if (activeInput === 'pickup') {
                      setPickupQuery(address.label);
                      setPickupLocationState({
                        name: address.label,
                        address: address.address,
                        latitude: address.latitude,
                        longitude: address.longitude,
                      });
                    } else if (activeInput === 'destination') {
                      setDestinationQuery(address.label);
                      setDestinationLocationState({
                        name: address.label,
                        address: address.address,
                        latitude: address.latitude,
                        longitude: address.longitude,
                      });
                    } else if (typeof activeInput === 'number') {
                      const newQueries = [...stopQueries];
                      newQueries[activeInput] = address.label;
                      setStopQueries(newQueries);
                      
                      const newLocations = [...stopLocations];
                      newLocations[activeInput] = {
                        name: address.label,
                        address: address.address,
                        latitude: address.latitude,
                        longitude: address.longitude,
                      };
                      setStopLocations(newLocations);
                    }
                    setPredictions([]);
                  }}
                >
                  <View style={styles.savedIcon}>
                    <Ionicons 
                      name={address.type === 'home' ? 'home' : address.type === 'work' ? 'briefcase' : 'location'} 
                      size={20} 
                      color="#5d1289" 
                    />
                  </View>
                  <View style={styles.savedInfo}>
                    <Text style={styles.savedName}>{address.label}</Text>
                    <Text style={styles.savedAddress}>{address.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Searches */}
          {predictions.length === 0 && recentSearches.length > 0 && !addStopMode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent</Text>
              {recentSearches.map((search) => (
                <TouchableOpacity
                  key={search.id}
                  style={styles.recentItem}
                  onPress={() => {
                    if (activeInput === 'pickup') {
                      setPickupQuery(search.name);
                      setPickupLocationState({
                        name: search.name,
                        address: search.address,
                        latitude: search.latitude,
                        longitude: search.longitude,
                      });
                    } else if (activeInput === 'destination') {
                      setDestinationQuery(search.name);
                      setDestinationLocationState({
                        name: search.name,
                        address: search.address,
                        latitude: search.latitude,
                        longitude: search.longitude,
                      });
                    }
                    setPredictions([]);
                  }}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{search.name}</Text>
                    <Text style={styles.recentAddress}>{search.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Current Location (Pickup Only) */}
          {activeInput === 'pickup' && predictions.length === 0 && currentLocation && !addStopMode && (
            <TouchableOpacity 
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
            >
              <View style={styles.currentLocationIcon}>
                <Ionicons name="navigate" size={20} color="#5d1289" />
              </View>
              <Text style={styles.currentLocationText}>Use current location</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Confirm Button */}
        {pickupLocation && destinationLocation && !addStopMode && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm route</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  routeCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  inputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  inputActive: {
    fontWeight: '600',
  },
  inputAction: {
    padding: 4,
  },
  addStopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f5f5f5',
  },
  addStopText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#5d1289',
    fontWeight: '600',
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#5d1289',
    fontWeight: '600',
  },
  results: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#5d1289',
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  predictionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 14,
    color: '#666',
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  savedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  savedInfo: {
    flex: 1,
  },
  savedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  savedAddress: {
    fontSize: 14,
    color: '#666',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  recentAddress: {
    fontSize: 14,
    color: '#666',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9F5FF',
    borderRadius: 12,
    marginTop: 12,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5d1289',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  confirmButton: {
    backgroundColor: '#5d1289',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#5d1289',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SearchLocationScreen;