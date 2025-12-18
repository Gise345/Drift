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
import { useUserStore, SavedPlace, RecentSearch as UserRecentSearch } from '@/src/stores/user-store';
import { useTripStore, Trip } from '@/src/stores/trip-store';
import { getActiveRiderTrip } from '@/src/services/ride-request.service';
import { useBackgroundLocationPermission } from '@/src/hooks/useBackgroundLocationPermission';
import { BackgroundLocationDisclosureModal } from '@/components/location/BackgroundLocationDisclosureModal';

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
  // User store - Firebase synced data
  const {
    user,
    fetchUserData,
    saveHomeAddress: saveHomeToFirebase,
    saveWorkAddress: saveWorkToFirebase,
    addSavedPlace: addPlaceToFirebase,
    removeSavedPlace: removePlaceFromFirebase,
    addRecentSearch: addSearchToFirebase,
    getRecentSearches,
    syncLocalDataToFirebase,
  } = useUserStore();

  // Trip store - for active trip management
  const { currentTrip, setCurrentTrip } = useTripStore();

  // Location state
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  // Map visibility toggle
  const [showMap, setShowMap] = useState(false);

  // Saved data - now synced with Firebase
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
    userType: 'rider',
    onPermissionGranted: () => {
      // Refresh location after permission granted
      getCurrentLocation();
    },
    onPermissionDenied: () => {
      // Location permission denied - trip sharing may be limited
    },
  });

  useEffect(() => {
    initializeScreen();
  }, []);

  // NOTE: The modal now shows automatically from the hook on first app open
  // No need to manually trigger it here

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

    // Fetch user data from Firebase first
    await fetchUserData();

    // Try to sync any local data to Firebase (one-time migration)
    await syncLocalDataToFirebase();

    // Load saved addresses from Firebase (with AsyncStorage fallback)
    await loadSavedAddresses();
    await loadRecentSearches();

    // Check for active trip (persists across app restart/logout)
    await checkForActiveTrip();
  };

  /**
   * Check if rider has an active trip and restore it
   * Only restore trips that are IN_PROGRESS (paid and actively happening)
   */
  const checkForActiveTrip = async () => {
    try {
      const currentUser = useUserStore.getState().user;
      if (!currentUser?.id) {
        return;
      }

      const activeTrip = await getActiveRiderTrip(currentUser.id);

      if (activeTrip) {
        // Only restore trips that are IN_PROGRESS (paid and active)
        // Other statuses (REQUESTED, DRIVER_ARRIVING, etc.) are handled by their respective screens
        if (activeTrip.status === 'IN_PROGRESS') {
          setCurrentTrip(activeTrip as Trip);
        } else {
          // Don't show on home screen - user will be on the appropriate screen already
          setCurrentTrip(null);
        }
      } else {
        // No active trip found - clear any stale state
        setCurrentTrip(null);
      }
    } catch (error) {
      console.error('Error checking for active trip:', error);
    }
  };

  /**
   * Navigate to the appropriate screen based on trip status
   * Only for trips that are IN_PROGRESS (paid and actively happening)
   */
  const navigateToActiveTrip = () => {
    if (!currentTrip) return;

    // Only navigate for trips that are in progress (paid)
    if (currentTrip.status === 'IN_PROGRESS') {
      router.push('/(rider)/trip-in-progress');
    }
  };

  /**
   * Get current location
   * Only CHECKS permission status - doesn't request it
   * Permission requesting is handled by the disclosure modal flow
   */
  const getCurrentLocation = async () => {
    // Default Cayman region for fallback
    const caymanRegion: Region = {
      latitude: 19.3133,
      longitude: -81.2546,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };

    try {
      // CHECK permission status (don't request - let disclosure modal handle that)
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
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
      setRegion(caymanRegion);
      setLoading(false);
    }
  };

  /**
   * Load saved addresses from Firebase (with AsyncStorage fallback for offline)
   * Firebase is the source of truth - data persists across app reinstalls
   */
  const loadSavedAddresses = async () => {
    try {
      // Get current user from store (already fetched in initializeScreen)
      const currentUser = useUserStore.getState().user;

      if (currentUser) {
        // Load from Firebase (source of truth)
        if (currentUser.homeAddress) {
          setHomeAddress({
            id: currentUser.homeAddress.id,
            type: 'home',
            label: currentUser.homeAddress.label || 'Home',
            address: currentUser.homeAddress.address,
            latitude: currentUser.homeAddress.coordinates.latitude,
            longitude: currentUser.homeAddress.coordinates.longitude,
          });
          // Also update local cache for offline access
          await AsyncStorage.setItem(STORAGE_KEYS.HOME_ADDRESS, JSON.stringify({
            id: currentUser.homeAddress.id,
            type: 'home',
            label: currentUser.homeAddress.label || 'Home',
            address: currentUser.homeAddress.address,
            latitude: currentUser.homeAddress.coordinates.latitude,
            longitude: currentUser.homeAddress.coordinates.longitude,
          }));
        }

        if (currentUser.workAddress) {
          setWorkAddress({
            id: currentUser.workAddress.id,
            type: 'work',
            label: currentUser.workAddress.label || 'Work',
            address: currentUser.workAddress.address,
            latitude: currentUser.workAddress.coordinates.latitude,
            longitude: currentUser.workAddress.coordinates.longitude,
          });
          // Also update local cache for offline access
          await AsyncStorage.setItem(STORAGE_KEYS.WORK_ADDRESS, JSON.stringify({
            id: currentUser.workAddress.id,
            type: 'work',
            label: currentUser.workAddress.label || 'Work',
            address: currentUser.workAddress.address,
            latitude: currentUser.workAddress.coordinates.latitude,
            longitude: currentUser.workAddress.coordinates.longitude,
          }));
        }

        if (currentUser.savedPlaces && currentUser.savedPlaces.length > 0) {
          const customAddrs = currentUser.savedPlaces.map(place => ({
            id: place.id,
            type: 'custom' as const,
            label: place.label,
            address: place.address,
            latitude: place.coordinates.latitude,
            longitude: place.coordinates.longitude,
          }));
          setCustomAddresses(customAddrs);
          // Also update local cache for offline access
          await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ADDRESSES, JSON.stringify(customAddrs));
        }
      } else {
        // Fallback: Load from AsyncStorage if not logged in or no user data
        const [home, work, custom] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HOME_ADDRESS),
          AsyncStorage.getItem(STORAGE_KEYS.WORK_ADDRESS),
          AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_ADDRESSES),
        ]);

        if (home) setHomeAddress(JSON.parse(home));
        if (work) setWorkAddress(JSON.parse(work));
        if (custom) setCustomAddresses(JSON.parse(custom));
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  /**
   * Load recent searches from Firebase (with AsyncStorage fallback)
   * Firebase is the source of truth - data persists across app reinstalls
   */
  const loadRecentSearches = async () => {
    try {
      // Get current user from store
      const currentUser = useUserStore.getState().user;

      if (currentUser && currentUser.recentSearches && currentUser.recentSearches.length > 0) {
        // Load from Firebase (source of truth)
        const searches = currentUser.recentSearches
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setRecentSearches(searches);

        // Also update local cache for offline access
        await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
      } else {
        // Fallback: Load from AsyncStorage if not logged in or no user data
        const recent = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
        if (recent) {
          const searches = JSON.parse(recent);
          searches.sort((a: RecentSearch, b: RecentSearch) => b.timestamp - a.timestamp);
          setRecentSearches(searches.slice(0, 10));
        }
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

    try {
      const allResults: any[] = [];

      // STEP 1: GEOCODING API (PRIMARY - for addresses)
      const geocodingQuery = `${query}, Grand Cayman, Cayman Islands`;
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geocodingQuery)}&components=country:KY&key=${GOOGLE_PLACES_API_KEY}`;

      try {
        const geocodingResponse = await fetch(geocodingUrl);
        const geocodingData = await geocodingResponse.json();

        if (geocodingData.status === 'OK' && geocodingData.results) {
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
        }
      } catch (error) {
        console.error('Geocoding API error:', error);
      }

      // STEP 2: PLACES API (SECONDARY - for businesses/landmarks)
      const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&location=${GRAND_CAYMAN_CENTER.latitude},${GRAND_CAYMAN_CENTER.longitude}&radius=${SEARCH_RADIUS}&components=country:ky&key=${GOOGLE_PLACES_API_KEY}`;

      try {
        const placesResponse = await fetch(placesUrl);
        const placesData = await placesResponse.json();

        if (placesData.status === 'OK' && placesData.predictions) {
          placesData.predictions.forEach((prediction: any) => {
            allResults.push({
              ...prediction,
              priority: 2, // LOWER PRIORITY - businesses come after addresses
              source: 'places',
            });
          });
        }
      } catch (error) {
        console.error('Places API error:', error);
      }

      // STEP 3: DEDUPLICATE & SORT (addresses first!)
      const uniqueResults = deduplicateResults(allResults);

      // Sort by priority: addresses (1) before businesses (2)
      uniqueResults.sort((a, b) => a.priority - b.priority);

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
   * Save address to Firebase AND AsyncStorage (for offline access)
   * Firebase is the source of truth - data persists across app reinstalls
   */
  const saveAddress = async (address: SavedAddress) => {
    try {
      if (address.type === 'home') {
        // Save to Firebase (primary)
        await saveHomeToFirebase({
          label: address.label,
          address: address.address,
          coordinates: {
            latitude: address.latitude,
            longitude: address.longitude,
          },
        });

        // Also save to AsyncStorage for offline access
        await AsyncStorage.setItem(STORAGE_KEYS.HOME_ADDRESS, JSON.stringify(address));
        setHomeAddress(address);
        Alert.alert('Success', 'Home address saved!');
      } else if (address.type === 'work') {
        // Save to Firebase (primary)
        await saveWorkToFirebase({
          label: address.label,
          address: address.address,
          coordinates: {
            latitude: address.latitude,
            longitude: address.longitude,
          },
        });

        // Also save to AsyncStorage for offline access
        await AsyncStorage.setItem(STORAGE_KEYS.WORK_ADDRESS, JSON.stringify(address));
        setWorkAddress(address);
        Alert.alert('Success', 'Work address saved!');
      } else if (address.type === 'custom') {
        let updated: SavedAddress[];

        // Check if editing existing address
        if (editingAddressId) {
          // For editing, we need to update the existing place
          // First remove the old one, then add the new one
          await removePlaceFromFirebase(editingAddressId);
          await addPlaceToFirebase({
            type: 'custom',
            label: address.label,
            address: address.address,
            coordinates: {
              latitude: address.latitude,
              longitude: address.longitude,
            },
          });

          // Replace the existing address in local state
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

          // Save to Firebase (primary)
          await addPlaceToFirebase({
            type: 'custom',
            label: address.label,
            address: address.address,
            coordinates: {
              latitude: address.latitude,
              longitude: address.longitude,
            },
          });

          updated = [...customAddresses, address];
          Alert.alert('Success', `${address.label} saved!`);
        }

        // Also save to AsyncStorage for offline access
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
   * Deletes from Firebase AND AsyncStorage
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
              const { updateUser } = useUserStore.getState();

              if (type === 'home') {
                // Delete from Firebase (set to undefined/null)
                await updateUser({ homeAddress: undefined });
                // Delete from AsyncStorage
                await AsyncStorage.removeItem(STORAGE_KEYS.HOME_ADDRESS);
                setHomeAddress(null);
              } else if (type === 'work') {
                // Delete from Firebase (set to undefined/null)
                await updateUser({ workAddress: undefined });
                // Delete from AsyncStorage
                await AsyncStorage.removeItem(STORAGE_KEYS.WORK_ADDRESS);
                setWorkAddress(null);
              } else if (type === 'custom' && addressId) {
                // Delete from Firebase
                await removePlaceFromFirebase(addressId);
                // Delete from AsyncStorage
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
   * If no permission, the disclosure modal should already be showing
   */
  const openSearch = async () => {
    // Check if we have location permission
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      // Show disclosure modal if not already showing
      if (!showDisclosureModal) {
        requestBackgroundPermission();
      }
      return;
    }
    router.push('/(rider)/search-location');
  };

  /**
   * Navigate to saved address - FIXED FOR COORDINATES
   */
  const navigateToAddress = async (address: SavedAddress) => {
    // Check if we have location permission
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      // Show disclosure modal if not already showing
      if (!showDisclosureModal) {
        requestBackgroundPermission();
      }
      return;
    }

    // Ensure we have current location
    let currentLoc = location;
    if (!currentLoc) {
      try {
        currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLoc);
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
    // Check if we have location permission
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      // Show disclosure modal if not already showing
      if (!showDisclosureModal) {
        requestBackgroundPermission();
      }
      return;
    }

    // Ensure we have current location
    let currentLoc = location;
    if (!currentLoc) {
      try {
        currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLoc);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }

    // Navigate to search with destination coordinates pre-filled
    router.push({
      pathname: '/(rider)/search-location',
      params: {
        searchQuery: destination.name,
        destinationLat: destination.latitude?.toString(),
        destinationLng: destination.longitude?.toString(),
        destinationName: destination.name,
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
      {/* Background Location Disclosure Modal - Shows BEFORE system permission */}
      <BackgroundLocationDisclosureModal
        visible={showDisclosureModal}
        userType="rider"
        onAccept={onDisclosureAccept}
        onDecline={onDisclosureDecline}
      />

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
              <Text style={styles.searchBarText}>Where yah goin?</Text>
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
              <Text style={styles.searchBarText}>Where yah goin?</Text>
              <View style={styles.laterBadge}>
                <Text style={styles.laterText}>Later</Text>
              </View>
            </TouchableOpacity>

            {/* Active Trip Card - Shows only if rider has a trip IN_PROGRESS (paid and active) */}
            {currentTrip && currentTrip.status === 'IN_PROGRESS' && (
              <TouchableOpacity
                style={styles.activeTripCard}
                onPress={navigateToActiveTrip}
                activeOpacity={0.8}
              >
                <View style={styles.activeTripHeader}>
                  <View style={styles.activeTripIconContainer}>
                    <Ionicons name="car" size={24} color="#5d1289" />
                  </View>
                  <View style={styles.activeTripInfo}>
                    <Text style={styles.activeTripTitle}>Trip in progress</Text>
                    <Text style={styles.activeTripDestination} numberOfLines={1}>
                      To: {currentTrip.destination?.address || 'Destination'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#5d1289" />
                </View>
                {currentTrip.driverInfo && (
                  <View style={styles.activeTripDriver}>
                    <View style={styles.activeTripDriverInfo}>
                      <Ionicons name="person-circle" size={20} color="#666" />
                      <Text style={styles.activeTripDriverName}>{currentTrip.driverInfo.name}</Text>
                    </View>
                    <Text style={styles.activeTripVehicle}>
                      {currentTrip.driverInfo.vehicle?.color} {currentTrip.driverInfo.vehicle?.make}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

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
  // Active Trip Card Styles
  activeTripCard: {
    backgroundColor: '#f0e6f6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#5d1289',
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTripIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeTripInfo: {
    flex: 1,
  },
  activeTripTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  activeTripDestination: {
    fontSize: 14,
    color: '#666',
  },
  activeTripDriver: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d4c4e0',
  },
  activeTripDriverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTripDriverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  activeTripVehicle: {
    fontSize: 13,
    color: '#666',
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