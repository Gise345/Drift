import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Region } from 'react-native-maps';
import DriftMapView from '@/components/ui/DriftMapView';
import SavedAddressItem, { SavedAddress } from '@/components/ui/SavedAddressItem';
import DestinationCards from '@/components/ui/DestinationCards';

/**
 * DRIFT HOME SCREEN - PROPER IMPLEMENTATION
 * 
 * Features:
 * ✅ Solid background by default (NO map)
 * ✅ "View Map" toggle with user location
 * ✅ Saved address modal on HOME SCREEN (not search)
 * ✅ Home, Work + 3 Custom addresses with custom names
 * ✅ "View More/Less" toggle for custom addresses
 * ✅ All addresses saved to AsyncStorage
 * ✅ Saved places navigate directly to select-destination
 */

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

interface RecentSearch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const HomeScreen = () => {
  // Location state
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  // Map visibility toggle
  const [showMap, setShowMap] = useState(false);

  // Saved data
  const [homeAddress, setHomeAddress] = useState<SavedAddress | null>(null);
  const [workAddress, setWorkAddress] = useState<SavedAddress | null>(null);
  const [customAddresses, setCustomAddresses] = useState<SavedAddress[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  
  // View more toggle
  const [showAllSavedPlaces, setShowAllSavedPlaces] = useState(false);

  // Save Address Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalType, setSaveModalType] = useState<'home' | 'work' | 'custom'>('home');
  const [customAddressName, setCustomAddressName] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null); // ← NEW: Track which address is being edited
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const mapRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeScreen();
  }, []);

  // Debounced search for modal
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(searchQuery);
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

  /**
   * Initialize screen
   */
  const initializeScreen = async () => {
    await getCurrentLocation();
    await loadSavedAddresses();
    await loadRecentSearches();
  };

  /**
   * Get current location
   */
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const caymanRegion: Region = {
          latitude: 19.3133,
          longitude: -81.2546,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        };
        setRegion(caymanRegion);
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
      
      const initialRegion: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setRegion(initialRegion);
      setLoading(false);

    } catch (error) {
      console.error('Error getting location:', error);
      const caymanRegion: Region = {
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
   * Load saved addresses from AsyncStorage
   */
  const loadSavedAddresses = async () => {
    try {
      const [home, work, custom] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HOME_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.WORK_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_ADDRESSES),
      ]);

      if (home) setHomeAddress(JSON.parse(home));
      if (work) setWorkAddress(JSON.parse(work));
      if (custom) setCustomAddresses(JSON.parse(custom));
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  /**
   * Load recent searches
   */
  const loadRecentSearches = async () => {
    try {
      const recent = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      if (recent) {
        const searches = JSON.parse(recent);
        searches.sort((a: RecentSearch, b: RecentSearch) => b.timestamp - a.timestamp);
        setRecentSearches(searches.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  /**
   * 🏠 ADDRESS-FIRST SEARCH STRATEGY
   * 
   * Priority Order:
   * 1. Geocoding API FIRST (residential addresses) - Priority 1
   * 2. Places API SECOND (businesses/landmarks) - Priority 2
   * 3. Merge & deduplicate with addresses prioritized
   */
  const searchPlaces = async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      Alert.alert('Error', 'Google API key not configured');
      return;
    }

    setSearchLoading(true);
    console.log('🏠 ADDRESS-FIRST SEARCH: Prioritizing residential addresses');

    try {
      const allResults: any[] = [];

      // STEP 1: GEOCODING API (PRIMARY - for addresses) ✅
      console.log('🔍 Step 1: Geocoding API (Primary - for addresses)...');
      const geocodingQuery = `${query}, Grand Cayman, Cayman Islands`;
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geocodingQuery)}&components=country:KY&key=${GOOGLE_PLACES_API_KEY}`;
      
      try {
        const geocodingResponse = await fetch(geocodingUrl);
        const geocodingData = await geocodingResponse.json();
        
        console.log('📊 Geocoding API Status:', geocodingData.status);

        if (geocodingData.status === 'OK' && geocodingData.results) {
          console.log(`✅ Geocoding API found ${geocodingData.results.length} addresses`);
          
          geocodingData.results.forEach((result: any) => {
            const location = result.geometry.location;
            allResults.push({
              place_id: result.place_id || `geo_${Date.now()}_${Math.random()}`,
              description: result.formatted_address,
              structured_formatting: {
                main_text: result.address_components?.[0]?.long_name || result.formatted_address.split(',')[0],
                secondary_text: result.formatted_address.split(',').slice(1).join(',').trim(),
              },
              latitude: location.lat,
              longitude: location.lng,
              priority: 1, // HIGHEST PRIORITY - addresses come first!
              source: 'geocoding',
            });
          });
        } else {
          console.log('⚠️ Geocoding API:', geocodingData.status);
        }
      } catch (error) {
        console.error('Geocoding API error:', error);
      }

      // STEP 2: PLACES API (SECONDARY - for businesses/landmarks)
      console.log('🔍 Step 2: Places API (Secondary - for businesses/landmarks)...');
      const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&location=${GRAND_CAYMAN_CENTER.latitude},${GRAND_CAYMAN_CENTER.longitude}&radius=${SEARCH_RADIUS}&components=country:ky&key=${GOOGLE_PLACES_API_KEY}`;
      
      try {
        const placesResponse = await fetch(placesUrl);
        const placesData = await placesResponse.json();
        
        console.log('📊 Places API Status:', placesData.status);

        if (placesData.status === 'OK' && placesData.predictions) {
          console.log(`✅ Places API found ${placesData.predictions.length} results`);
          
          placesData.predictions.forEach((prediction: any) => {
            allResults.push({
              ...prediction,
              priority: 2, // LOWER PRIORITY - businesses come after addresses
              source: 'places',
            });
          });
        } else {
          console.log('⚠️ Places API:', placesData.status);
        }
      } catch (error) {
        console.error('Places API error:', error);
      }

      // STEP 3: DEDUPLICATE & SORT (addresses first!)
      const uniqueResults = deduplicateResults(allResults);
      
      // Sort by priority: addresses (1) before businesses (2)
      uniqueResults.sort((a, b) => a.priority - b.priority);
      
      console.log(`📍 Final results: ${uniqueResults.length} unique locations (addresses prioritized)`);
      
      setPredictions(uniqueResults.slice(0, 10)); // Limit to 10 results

    } catch (error) {
      console.error('Error searching locations:', error);
      setPredictions([]);
      Alert.alert('Error', 'Failed to search locations. Please check your internet connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * Deduplicate results based on similarity
   */
  const deduplicateResults = (results: any[]): any[] => {
    const seen = new Map<string, any>();

    results.forEach(result => {
      const normalizedDesc = result.description.toLowerCase().trim();
      
      // Check if we've seen a similar address
      let isDuplicate = false;
      for (const [key, existing] of seen.entries()) {
        if (normalizedDesc === key || normalizedDesc.includes(key) || key.includes(normalizedDesc)) {
          // Keep the one with higher priority (lower number = higher priority)
          if (result.priority < existing.priority) {
            seen.set(key, result);
          }
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.set(normalizedDesc, result);
      }
    });

    return Array.from(seen.values());
  };

  /**
   * Get place details (coordinates)
   */
  const getPlaceDetails = async (placeId: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('Place details response:', data);

      if (data.status === 'OK' && data.result) {
        return {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
      } else {
        console.error('Place details error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  };

  /**
   * Handle selecting a place from search predictions
   */
  const handleSelectPlace = async (prediction: any) => {
    // Check if coordinates are already available (from Geocoding API)
    let coordinates = null;
    if (prediction.latitude && prediction.longitude) {
      coordinates = {
        latitude: prediction.latitude,
        longitude: prediction.longitude,
      };
    } else {
      // Get coordinates from Places Details API
      coordinates = await getPlaceDetails(prediction.place_id);
    }
    
    if (!coordinates) {
      Alert.alert('Error', 'Failed to get location coordinates');
      return;
    }

    // Validate custom address name if needed
    if (saveModalType === 'custom') {
      if (!customAddressName.trim()) {
        Alert.alert('Name Required', 'Please enter a name for this saved place');
        return;
      }
      
      if (customAddressName.trim().length < 2) {
        Alert.alert('Invalid Name', 'Name must be at least 2 characters');
        return;
      }
    }

    // Create saved address object
    const address: SavedAddress = {
      id: editingAddressId || Date.now().toString(), // ← Use existing ID if editing
      type: saveModalType,
      label: saveModalType === 'custom' 
        ? customAddressName.trim()
        : saveModalType.charAt(0).toUpperCase() + saveModalType.slice(1),
      address: prediction.description,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };

    // Save to AsyncStorage
    await saveAddress(address);
  };

  /**
   * Save address to AsyncStorage
   */
  const saveAddress = async (address: SavedAddress) => {
    try {
      if (address.type === 'home') {
        await AsyncStorage.setItem(STORAGE_KEYS.HOME_ADDRESS, JSON.stringify(address));
        setHomeAddress(address);
        Alert.alert('Success', 'Home address saved!');
      } else if (address.type === 'work') {
        await AsyncStorage.setItem(STORAGE_KEYS.WORK_ADDRESS, JSON.stringify(address));
        setWorkAddress(address);
        Alert.alert('Success', 'Work address saved!');
      } else if (address.type === 'custom') {
        let updated: SavedAddress[];
        
        // Check if editing existing address
        if (editingAddressId) {
          // Replace the existing address
          updated = customAddresses.map(a => 
            a.id === editingAddressId ? address : a
          );
          Alert.alert('Success', `${address.label} updated!`);
        } else {
          // Adding new address - check limit
          if (customAddresses.length >= 3) {
            Alert.alert('Limit Reached', 'You can only save up to 3 custom addresses');
            return;
          }
          updated = [...customAddresses, address];
          Alert.alert('Success', `${address.label} saved!`);
        }

        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ADDRESSES, JSON.stringify(updated));
        setCustomAddresses(updated);
      }

      // Close modal and reset
      closeSaveModal();
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    }
  };

  /**
   * Open save address modal
   */
  /**
   * Open save address modal
   */
  const openSaveModal = (type: 'home' | 'work' | 'custom', addressId?: string) => {
    setSaveModalType(type);
    setSearchQuery('');
    setPredictions([]);
    
    // If editing a custom address, pre-fill the name
    if (type === 'custom' && addressId) {
      const addressToEdit = customAddresses.find(a => a.id === addressId);
      if (addressToEdit) {
        setCustomAddressName(addressToEdit.label);
        setEditingAddressId(addressId);
      }
    } else {
      setCustomAddressName('');
      setEditingAddressId(null);
    }
    
    setShowSaveModal(true);
  };

  /**
   * Close save address modal
   */
  const closeSaveModal = () => {
    setShowSaveModal(false);
    setSearchQuery('');
    setPredictions([]);
    setCustomAddressName('');
    setEditingAddressId(null); // ← NEW: Clear editing state
  };

  /**
   * DELETE ADDRESS FUNCTIONALITY
   */
  const handleDeleteAddress = async (type: 'home' | 'work' | 'custom', addressId?: string) => {
    const addressLabel = type === 'custom' 
      ? customAddresses.find(a => a.id === addressId)?.label || 'saved place'
      : type;

    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete your ${addressLabel} address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'home') {
                await AsyncStorage.removeItem(STORAGE_KEYS.HOME_ADDRESS);
                setHomeAddress(null);
              } else if (type === 'work') {
                await AsyncStorage.removeItem(STORAGE_KEYS.WORK_ADDRESS);
                setWorkAddress(null);
              } else if (type === 'custom' && addressId) {
                const updated = customAddresses.filter(addr => addr.id !== addressId);
                await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ADDRESSES, JSON.stringify(updated));
                setCustomAddresses(updated);
              }
              
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  /**
   * Toggle map visibility
   */
  const toggleMapView = () => {
    setShowMap(!showMap);
    
    if (!showMap && location && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }, 300);
    }
  };

  /**
   * Open search screen
   */
  const openSearch = () => {
    router.push('/(rider)/search-location');
  };

  /**
   * Navigate to saved address - FIXED FOR COORDINATES
   */
  const navigateToAddress = async (address: SavedAddress) => {
    // Ensure we have current location
    let currentLoc = location;
    if (!currentLoc) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          currentLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation(currentLoc);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }

    const pickup = currentLoc ? {
      name: 'Current Location',
      address: 'Your current location',
      latitude: currentLoc.coords.latitude,
      longitude: currentLoc.coords.longitude,
    } : {
      name: 'Grand Cayman',
      address: 'Grand Cayman, Cayman Islands',
      latitude: 19.3133,
      longitude: -81.2546,
    };

    const dest = {
      name: address.label,
      address: address.address,
      latitude: address.latitude,
      longitude: address.longitude,
    };

    console.log('🚗 Navigating from home to destination:');
    console.log('  Pickup:', pickup);
    console.log('  Destination:', dest);

    // Navigate with params
    router.push({
      pathname: '/(rider)/select-destination',
      params: {
        pickup: JSON.stringify(pickup),
        destination: JSON.stringify(dest),
      },
    });
  };

  /**
   * Navigate to recent search
   */
  const navigateToRecent = (search: RecentSearch) => {
    const pickup = location ? {
      name: 'Current Location',
      address: 'Your current location',
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    } : {
      name: 'Grand Cayman',
      address: 'Grand Cayman, Cayman Islands',
      latitude: 19.3133,
      longitude: -81.2546,
    };

    router.push({
      pathname: '/(rider)/select-destination',
      params: {
        pickup: JSON.stringify(pickup),
        destination: JSON.stringify({
          name: search.name,
          address: search.address,
          latitude: search.latitude,
          longitude: search.longitude,
        }),
      },
    });
  };

  /**
   * Navigate to tourist destination
   */
  const handleDestinationPress = async (destination: any) => {
    // Ensure we have current location
    let currentLoc = location;
    if (!currentLoc) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          currentLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation(currentLoc);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }

    const pickup = currentLoc ? {
      name: 'Current Location',
      address: 'Your current location',
      latitude: currentLoc.coords.latitude,
      longitude: currentLoc.coords.longitude,
    } : {
      name: 'Grand Cayman',
      address: 'Grand Cayman, Cayman Islands',
      latitude: 19.3133,
      longitude: -81.2546,
    };

    // For destinations, we'll need to geocode the name to get coordinates
    // For now, let's just open search with the destination name pre-filled
    router.push({
      pathname: '/(rider)/search-location',
      params: {
        searchQuery: destination.name,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5d1289" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View - Full Screen When Active */}
      {showMap && region && (
        <View style={styles.fullScreenMap}>
          <DriftMapView
            region={region}
            showUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            mapRef={mapRef}
          />
          
          {/* Map Overlay */}
          <View style={styles.mapOverlay}>
            <View style={styles.mapTopBar}>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => router.push('/(rider)/profile')}
              >
                <Ionicons name="menu" size={24} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.hideMapButton}
                onPress={toggleMapView}
              >
                <Ionicons name="close" size={20} color="#5d1289" />
                <Text style={styles.hideMapText}>Hide Map</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.searchBarOverMap}
              onPress={openSearch}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={24} color="#666" />
              <Text style={styles.searchBarText}>Where to?</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      {!showMap && (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => router.push('/(rider)/profile')}
            >
              <Ionicons name="menu" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.viewMapButton}
              onPress={toggleMapView}
            >
              <Ionicons name="map" size={20} color="#5d1289" />
              <Text style={styles.viewMapText}>View Map</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Search Bar */}
            <TouchableOpacity 
              style={styles.searchBar}
              onPress={openSearch}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={24} color="#666" />
              <Text style={styles.searchBarText}>Where to?</Text>
              <View style={styles.laterBadge}>
                <Text style={styles.laterText}>Later</Text>
              </View>
            </TouchableOpacity>


            {/* Saved Places Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved places</Text>

              {/* Home Address */}
              <SavedAddressItem
                icon="home"
                label="Home"
                address={homeAddress?.address}
                onPress={() => {
                  if (homeAddress) {
                    navigateToAddress(homeAddress);
                  } else {
                    openSaveModal('home');
                  }
                }}
                onEdit={() => homeAddress && openSaveModal('home')}
                onDelete={() => homeAddress && handleDeleteAddress('home')}
                showAddIcon={!homeAddress}
              />

              {/* Work Address */}
              <SavedAddressItem
                icon="briefcase"
                label="Work"
                address={workAddress?.address}
                onPress={() => {
                  if (workAddress) {
                    navigateToAddress(workAddress);
                  } else {
                    openSaveModal('work');
                  }
                }}
                onEdit={() => workAddress && openSaveModal('work')}
                onDelete={() => workAddress && handleDeleteAddress('work')}
                showAddIcon={!workAddress}
              />

              {/* Custom Addresses - Collapsible */}
              {customAddresses.length > 0 && (
                <>
                  {showAllSavedPlaces && (
                    <>
                      {customAddresses.map((address) => (
                        <SavedAddressItem
                          key={address.id}
                          icon="location"
                          label={address.label}
                          address={address.address}
                          onPress={() => navigateToAddress(address)}
                          onEdit={() => openSaveModal('custom', address.id)}
                          onDelete={() => handleDeleteAddress('custom', address.id)}
                        />
                      ))}
                    </>
                  )}
                  
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => setShowAllSavedPlaces(!showAllSavedPlaces)}
                  >
                    <Text style={styles.viewMoreText}>
                      {showAllSavedPlaces 
                        ? 'View less' 
                        : `View ${customAddresses.length} more`}
                    </Text>
                    <Ionicons 
                      name={showAllSavedPlaces ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#5d1289" 
                    />
                  </TouchableOpacity>
                </>
              )}

              {/* Add Saved Place Button (max 3 custom) */}
              {customAddresses.length < 3 && (
                <TouchableOpacity
                  style={styles.addPlaceButton}
                  onPress={() => openSaveModal('custom')}
                >
                  <View style={styles.addPlaceIconContainer}>
                    <Ionicons name="add-circle" size={24} color="#5d1289" />
                  </View>
                  <Text style={styles.addPlaceText}>Add saved place</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent</Text>
                {recentSearches.slice(0, 5).map((search) => (
                  <TouchableOpacity
                    key={search.id}
                    style={styles.recentItem}
                    onPress={() => navigateToRecent(search)}
                  >
                    <View style={styles.recentIconContainer}>
                      <Ionicons name="time" size={20} color="#666" />
                    </View>
                    <View style={styles.recentTextContainer}>
                      <Text style={styles.recentName}>{search.name}</Text>
                      <Text style={styles.recentAddress}>{search.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Suggestions Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              <View style={styles.suggestionCard}>
                <Ionicons name="calendar" size={24} color="#5d1289" />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionTitle}>Plan your journey</Text>
                  <Text style={styles.suggestionDescription}>
                    Schedule carpool trips in advance
                  </Text>
                </View>
              </View>
            </View>

            {/* Tourist Destinations Carousel */}
            <DestinationCards onDestinationPress={handleDestinationPress} />
          </ScrollView>
        </SafeAreaView>
      )}

      {/* Save Address Modal */}
      <Modal
        visible={showSaveModal}
        animationType="slide"
        transparent={false}
        onRequestClose={closeSaveModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={closeSaveModal}
              >
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {saveModalType === 'home' && (editingAddressId ? 'Edit Home Address' : 'Save Home Address')}
                {saveModalType === 'work' && (editingAddressId ? 'Edit Work Address' : 'Save Work Address')}
                {saveModalType === 'custom' && (editingAddressId ? 'Edit Custom Place' : 'Save Custom Place')}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Custom Name Input (for custom addresses only) */}
            {saveModalType === 'custom' && (
              <View style={styles.customNameContainer}>
                <Text style={styles.customNameLabel}>Name this place:</Text>
                <TextInput
                  style={styles.customNameInput}
                  placeholder="e.g., Gym, Mom's House, Favorite Beach"
                  value={customAddressName}
                  onChangeText={setCustomAddressName}
                  maxLength={30}
                  autoCapitalize="words"
                />
                <Text style={styles.customNameHint}>
                  {customAddressName.length}/30 characters
                </Text>
              </View>
            )}

            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search for address in Grand Cayman..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={saveModalType !== 'custom'}
              />
              {searchLoading && (
                <ActivityIndicator size="small" color="#5d1289" />
              )}
            </View>

            {/* Search Results */}
            <ScrollView style={styles.modalResults}>
              {predictions.map((prediction, index) => (
                <TouchableOpacity
                  key={`${prediction.place_id}-${index}`}
                  style={styles.modalResultItem}
                  onPress={() => handleSelectPlace(prediction)}
                >
                  <Ionicons name="location" size={20} color="#5d1289" />
                  <View style={styles.modalResultText}>
                    <Text style={styles.modalResultMain}>
                      {prediction.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.modalResultSecondary}>
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}

              {searchQuery.length > 0 && predictions.length === 0 && !searchLoading && (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search" size={48} color="#ccc" />
                  <Text style={styles.noResultsText}>No results found</Text>
                  <Text style={styles.noResultsHint}>
                    Try searching for a different location
                  </Text>
                </View>
              )}

              {searchQuery.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="location" size={48} color="#ccc" />
                  <Text style={styles.noResultsText}>
                    Search for an address
                  </Text>
                  <Text style={styles.noResultsHint}>
                    Start typing to see suggestions
                  </Text>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  fullScreenMap: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  mapTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  hideMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hideMapText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#5d1289',
  },
  searchBarOverMap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0e6f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewMapText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#5d1289',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  searchBarText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  laterBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  laterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5d1289',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5d1289',
  },
  addPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  addPlaceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0e6f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addPlaceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5d1289',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  recentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentTextContainer: {
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
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0e6f6',
    padding: 16,
    borderRadius: 12,
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  customNameContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  customNameLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  customNameInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  customNameHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  modalResults: {
    flex: 1,
  },
  modalResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalResultText: {
    flex: 1,
    marginLeft: 12,
  },
  modalResultMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  modalResultSecondary: {
    fontSize: 14,
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  noResultsHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default HomeScreen;