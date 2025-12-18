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
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/src/stores/user-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Bottom sheet positions
const SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.75; // 75% of screen - shows 25% map
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.92; // Almost full screen
const SHEET_COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.4; // 40% - shows 60% map for pin drop

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
  const insets = useSafeAreaInsets();
  const {
    setPickupLocation,
    setDestination,
    stops: storeStops,
    addStop,
    removeStop: removeStoreStop,
    clearBookingFlow,
  } = useCarpoolStore();

  // Check if in add-stop mode (from select-destination screen)
  const addStopMode = params.mode === 'add-stop' || params.mode === 'stop';

  // Search state
  const [activeInput, setActiveInput] = useState<'pickup' | 'destination' | number>(
    addStopMode ? 0 : 'destination'
  );
  const [pickupQuery, setPickupQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [stopQueries, setStopQueries] = useState<string[]>([]);

  // Route locations
  const [pickupLocation, setPickupLocationState] = useState<RouteLocation | null>(null);
  const [destinationLocation, setDestinationLocationState] = useState<RouteLocation | null>(null);
  const [stopLocations, setStopLocations] = useState<(RouteLocation | null)[]>([]);

  // Predictions and loading
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);

  // Saved data
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Map and region state
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: GRAND_CAYMAN_CENTER.latitude,
    longitude: GRAND_CAYMAN_CENTER.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  // Pin drop mode state
  const [pinMode, setPinMode] = useState<'off' | 'pickup' | 'destination'>('off');
  const [pinAddress, setPinAddress] = useState<string>('');
  const [pinLoading, setPinLoading] = useState(false);

  // Bottom sheet animation
  const sheetHeight = useRef(new Animated.Value(SHEET_MIN_HEIGHT)).current;
  const lastGestureDy = useRef(0);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const pickupInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);
  const mapRef = useRef<MapView>(null);

  // Track the current sheet height for pan calculations
  const currentSheetHeight = useRef(SHEET_MIN_HEIGHT);

  // Pan responder for draggable bottom sheet - SIMPLE AND WORKING
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Store starting height
        // @ts-ignore
        currentSheetHeight.current = sheetHeight._value;
      },
      onPanResponderMove: (_, gestureState) => {
        // Dragging down = positive dy = decrease height
        // Dragging up = negative dy = increase height
        const newHeight = currentSheetHeight.current - gestureState.dy;

        // Clamp between min and max
        const clampedHeight = Math.max(
          SHEET_COLLAPSED_HEIGHT,
          Math.min(SHEET_MAX_HEIGHT, newHeight)
        );

        sheetHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        // @ts-ignore
        const finalHeight = sheetHeight._value;
        const velocity = gestureState.vy;

        let snapTo = finalHeight;

        // Snap based on velocity or position
        if (velocity > 0.5) {
          // Fast swipe down - collapse
          snapTo = SHEET_COLLAPSED_HEIGHT;
        } else if (velocity < -0.5) {
          // Fast swipe up - expand
          snapTo = SHEET_MAX_HEIGHT;
        } else {
          // Slow drag - snap to nearest third
          const midPoint = (SHEET_MIN_HEIGHT + SHEET_COLLAPSED_HEIGHT) / 2;
          if (finalHeight < midPoint) {
            snapTo = SHEET_COLLAPSED_HEIGHT;
          } else if (finalHeight < SHEET_MIN_HEIGHT + 50) {
            snapTo = SHEET_MIN_HEIGHT;
          } else {
            snapTo = SHEET_MAX_HEIGHT;
          }
        }

        // Update ref for next gesture
        currentSheetHeight.current = snapTo;

        Animated.spring(sheetHeight, {
          toValue: snapTo,
          useNativeDriver: false,
          tension: 65,
          friction: 11,
        }).start();
      },
    })
  ).current;
  const stopInputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    initializeScreen();
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Handle pre-filled destination from AllDestinationsScreen
    if (params.destinationLat && params.destinationLng && params.destinationName) {
      const lat = parseFloat(params.destinationLat as string);
      const lng = parseFloat(params.destinationLng as string);
      const name = params.destinationName as string;

      if (!isNaN(lat) && !isNaN(lng)) {
        setDestinationQuery(name);
        setDestinationLocationState({
          name: name,
          address: name,
          latitude: lat,
          longitude: lng,
        });

        // Animate map to show destination
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 500);
        }
      }
    }
  }, []);

  const initializeScreen = async () => {
    await getCurrentLocation();
    await loadSavedAddresses();
    await loadRecentSearches();
  };

  const getCurrentLocation = async () => {
    try {
      // Check permission status (don't request - should be handled by home screen disclosure)
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('📍 No location permission - user should grant via home screen');
        return;
      }

      // FAST PATH: Try to get last known location first (instant if available)
      let quickLocation: Location.LocationObject | null = null;
      try {
        quickLocation = await Location.getLastKnownPositionAsync({
          maxAge: 60000, // Accept locations up to 1 minute old
        });
      } catch (e) {
        // Last known position not available, continue to get fresh
      }

      // If we have a quick location, use it immediately
      if (quickLocation && !addStopMode) {
        const quickCoords = quickLocation.coords;
        setCurrentLocation(quickCoords);

        // Immediately set pickup to "Current Location" without waiting for geocode
        setPickupQuery('Current Location');
        setPickupLocationState({
          name: 'Current Location',
          address: 'Getting address...',
          latitude: quickCoords.latitude,
          longitude: quickCoords.longitude,
        });

        const quickRegion = {
          latitude: quickCoords.latitude,
          longitude: quickCoords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setMapRegion(quickRegion);

        if (mapRef.current) {
          mapRef.current.animateToRegion(quickRegion, 300);
        }

        // Fetch address in background (non-blocking)
        reverseGeocode(quickCoords.latitude, quickCoords.longitude).then(address => {
          if (address) {
            setPickupLocationState({
              name: 'Current Location',
              address: address,
              latitude: quickCoords.latitude,
              longitude: quickCoords.longitude,
            });
          }
        });
      }

      // Get fresh location with balanced accuracy (faster than High)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation(location.coords);

      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      // Update state for pin mode tracking
      setMapRegion(userRegion);

      // Animate map to user's location
      if (mapRef.current) {
        mapRef.current.animateToRegion(userRegion, 500);
      }

      // Auto-fill pickup with current location if not in add-stop mode
      if (!addStopMode) {
        // If we already set quick location, just update the address
        const address = await reverseGeocode(location.coords.latitude, location.coords.longitude);
        if (address) {
          setPickupQuery('Current Location');
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

  // Ref to track current pin mode (avoids stale closure issues)
  const pinModeRef = useRef<'off' | 'pickup' | 'destination'>('off');
  const geocodeTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Start pin drop mode
   */
  const startPinMode = (mode: 'pickup' | 'destination') => {
    // Update both state and ref
    setPinMode(mode);
    pinModeRef.current = mode;
    setPinAddress('');
    setPinLoading(true);

    // Collapse bottom sheet to show more map
    currentSheetHeight.current = SHEET_COLLAPSED_HEIGHT;
    Animated.spring(sheetHeight, {
      toValue: SHEET_COLLAPSED_HEIGHT,
      useNativeDriver: false,
      tension: 65,
      friction: 11,
    }).start();

    // Get address for current map center after a brief delay
    setTimeout(async () => {
      const address = await reverseGeocode(mapRegion.latitude, mapRegion.longitude);
      setPinAddress(address || 'Move map to select location');
      setPinLoading(false);
    }, 100);
  };

  /**
   * Handle map region change during pin drop mode
   * Debounced to prevent excessive API calls and glitches
   */
  const handleMapRegionChange = (region: Region) => {
    setMapRegion(region);

    // Only process if in pin mode (use ref to avoid stale closure)
    if (pinModeRef.current === 'off') return;

    // Clear previous timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setPinLoading(true);

    // Debounce geocoding to prevent glitches during fast pan
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const address = await reverseGeocode(region.latitude, region.longitude);
        setPinAddress(address || 'Unknown location');
      } catch (error) {
        setPinAddress('Unknown location');
      } finally {
        setPinLoading(false);
      }
    }, 300); // 300ms debounce
  };

  /**
   * Confirm the pinned location - PROPERLY UPDATES INPUT FIELDS
   */
  const confirmPinLocation = () => {
    if (!pinAddress || pinModeRef.current === 'off') return;

    const location: RouteLocation = {
      name: pinAddress.split(',')[0]?.trim() || 'Pinned Location',
      address: pinAddress,
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    };

    if (pinModeRef.current === 'pickup') {
      // Clear existing pickup and set new one
      setPickupLocationState(location);
      setPickupQuery(location.name); // Update the input field text
      console.log('📍 Pickup set via pin:', location.name);
    } else if (pinModeRef.current === 'destination') {
      // Clear existing destination and set new one
      setDestinationLocationState(location);
      setDestinationQuery(location.name); // Update the input field text
      console.log('📍 Destination set via pin:', location.name);
    }

    cancelPinMode();
  };

  /**
   * Cancel pin drop mode
   */
  const cancelPinMode = () => {
    // Clear any pending geocode
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setPinMode('off');
    pinModeRef.current = 'off';
    setPinAddress('');
    setPinLoading(false);

    // Expand bottom sheet back
    currentSheetHeight.current = SHEET_MIN_HEIGHT;
    Animated.spring(sheetHeight, {
      toValue: SHEET_MIN_HEIGHT,
      useNativeDriver: false,
      tension: 65,
      friction: 11,
    }).start();
  };

  const loadSavedAddresses = async () => {
    try {
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
          return;
        }
      }

      // Fallback to AsyncStorage
      const [home, work, custom] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HOME_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.WORK_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_ADDRESSES),
      ]);

      if (home) addresses.push(JSON.parse(home));
      if (work) addresses.push(JSON.parse(work));
      if (custom) addresses.push(...JSON.parse(custom));

      setSavedAddresses(addresses);
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const currentUser = useUserStore.getState().user;

      if (currentUser && currentUser.recentSearches && currentUser.recentSearches.length > 0) {
        const searches = currentUser.recentSearches
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setRecentSearches(searches);
        return;
      }

      // Fallback to AsyncStorage
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

  // Debounced search
  useEffect(() => {
    let query = '';
    if (activeInput === 'pickup') {
      query = pickupQuery;
    } else if (activeInput === 'destination') {
      query = destinationQuery;
    } else if (typeof activeInput === 'number') {
      query = stopQueries[activeInput] || '';
    }

    if (query.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(query);
      }, 400);
    } else {
      setPredictions([]);
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
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Search error:', error);
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
        // Check if this stop already exists to prevent duplicates
        const existingStops = storeStops || [];
        const isDuplicate = existingStops.some(
          (stop) =>
            stop.latitude === location.latitude &&
            stop.longitude === location.longitude
        );

        if (!isDuplicate) {
          addStop(location);
        }
        router.back();
        return;
      }

      // NORMAL MODE: Set location for journey
      if (activeInput === 'pickup') {
        setPickupQuery(prediction.structured_formatting.main_text);
        setPickupLocationState(location);
        // Auto-focus destination
        setTimeout(() => {
          setActiveInput('destination');
          destinationInputRef.current?.focus();
        }, 100);
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

      // Save to Firebase
      const { addRecentSearch: addSearchToFirebase } = useUserStore.getState();
      try {
        await addSearchToFirebase({
          name: search.name,
          address: search.address,
          latitude: search.latitude,
          longitude: search.longitude,
        });
      } catch (firebaseError) {
        console.warn('Failed to save to Firebase:', firebaseError);
      }

      // Also save to AsyncStorage
      const existing = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      let searches: RecentSearch[] = existing ? JSON.parse(existing) : [];
      searches = searches.filter(s => s.address !== search.address);
      searches.unshift(newSearch);
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
    } else if (typeof activeInput === 'number') {
      const newQueries = [...stopQueries];
      newQueries[activeInput] = category.query;
      setStopQueries(newQueries);
    }
  };

  const handleAddStop = () => {
    const currentStopCount = stopLocations.filter(s => s !== null).length + stopQueries.filter(q => q.length > 0).length;
    if (currentStopCount >= 2) {
      Alert.alert('Maximum Stops', 'You can only add up to 2 stops');
      return;
    }

    // Add a new stop input
    const newIndex = stopQueries.length;
    setStopQueries([...stopQueries, '']);
    setStopLocations([...stopLocations, null]);

    // Focus the new input after render
    setTimeout(() => {
      setActiveInput(newIndex);
      stopInputRefs.current[newIndex]?.focus();
    }, 100);
  };

  const handleRemoveStop = (index: number) => {
    const newQueries = stopQueries.filter((_, i) => i !== index);
    const newLocations = stopLocations.filter((_, i) => i !== index);

    setStopQueries(newQueries);
    setStopLocations(newLocations);

    // Update refs array
    stopInputRefs.current = stopInputRefs.current.filter((_, i) => i !== index);

    // Reset active input if needed
    if (activeInput === index) {
      setActiveInput('destination');
    } else if (typeof activeInput === 'number' && activeInput > index) {
      setActiveInput(activeInput - 1);
    }
  };

  const handleSelectSavedOrRecent = (item: SavedAddress | RecentSearch) => {
    const itemName = 'name' in item ? item.name : item.label;

    const location: RouteLocation = {
      name: itemName,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    };

    if (activeInput === 'pickup') {
      setPickupQuery(itemName);
      setPickupLocationState(location);
      setTimeout(() => {
        setActiveInput('destination');
        destinationInputRef.current?.focus();
      }, 100);
    } else if (activeInput === 'destination') {
      setDestinationQuery(itemName);
      setDestinationLocationState(location);
    } else if (typeof activeInput === 'number') {
      const newQueries = [...stopQueries];
      newQueries[activeInput] = itemName;
      setStopQueries(newQueries);

      const newLocations = [...stopLocations];
      newLocations[activeInput] = location;
      setStopLocations(newLocations);
    }
    setPredictions([]);
  };

  const handleUseCurrentLocation = async () => {
    if (!currentLocation) return;

    const address = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
    if (address) {
      setPickupQuery('Current Location');
      setPickupLocationState({
        name: 'Current Location',
        address: address,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setTimeout(() => {
        setActiveInput('destination');
        destinationInputRef.current?.focus();
      }, 100);
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

    // Add valid stops to store
    const validStops = stopLocations.filter((stop): stop is RouteLocation => stop !== null);
    validStops.forEach((stop) => {
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

  const canConfirm = pickupLocation && destinationLocation;
  const stopCount = stopLocations.filter(s => s !== null).length;

  // Render the vertical route line with dots
  const renderRouteLine = () => {
    const totalPoints = 2 + stopQueries.length; // pickup + destination + stops
    const lineHeight = (totalPoints - 1) * 56; // 56 is the input container height

    return (
      <View style={styles.routeLineContainer}>
        {/* Pickup dot */}
        <View style={[styles.routeDot, styles.pickupDot]} />

        {/* Connecting line */}
        <View style={[styles.routeLine, { height: lineHeight }]} />

        {/* Stop dots */}
        {stopQueries.map((_, index) => (
          <View
            key={`stop-dot-${index}`}
            style={[
              styles.routeDot,
              styles.stopDot,
              { top: 56 * (index + 1) + 20 }
            ]}
          />
        ))}

        {/* Destination dot */}
        <View style={[styles.routeDot, styles.destinationDot, { top: lineHeight + 20 }]} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
        onRegionChangeComplete={handleMapRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}
        loadingEnabled={true}
        loadingIndicatorColor="#5d1289"
      >
        {/* Show markers for selected locations when not in pin mode */}
        {pinMode === 'off' && pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Pickup"
          >
            <View style={styles.mapMarker}>
              <Ionicons name="location" size={24} color="#10B981" />
            </View>
          </Marker>
        )}
        {pinMode === 'off' && destinationLocation && (
          <Marker
            coordinate={{
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            }}
            title="Destination"
          >
            <View style={styles.mapMarker}>
              <Ionicons name="flag" size={24} color="#EF4444" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Floating Center Pin - Sleek Needle Style (Uber-like) */}
      {pinMode !== 'off' && (
        <View style={styles.centerPinContainer} pointerEvents="none">
          <View style={styles.needlePin}>
            <View style={[
              styles.needlePinHead,
              { backgroundColor: pinMode === 'pickup' ? '#10B981' : '#EF4444' }
            ]}>
              <View style={styles.needlePinDot} />
            </View>
            <View style={[
              styles.needlePinStem,
              { backgroundColor: pinMode === 'pickup' ? '#10B981' : '#EF4444' }
            ]} />
          </View>
          <View style={styles.pinShadow} />
        </View>
      )}

      {/* Pin Mode Control Panel - Shows at top when in pin mode */}
      {pinMode !== 'off' && (
        <SafeAreaView style={styles.pinModeHeader} edges={['top']}>
          <LinearGradient
            colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.9)']}
            style={styles.pinModeHeaderContent}
          >
            <TouchableOpacity onPress={cancelPinMode} style={styles.pinModeBackButton}>
              <Ionicons name="close" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <View style={styles.pinModeInfo}>
              <Text style={styles.pinModeTitle}>
                {pinMode === 'pickup' ? 'Set Pickup' : 'Set Destination'}
              </Text>
              <View style={styles.pinAddressRow}>
                {pinLoading ? (
                  <ActivityIndicator size="small" color="#5d1289" />
                ) : (
                  <Text style={styles.pinAddressText} numberOfLines={1}>
                    {pinAddress || 'Move map to select location'}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.pinConfirmButton,
                { backgroundColor: pinMode === 'pickup' ? '#10B981' : '#EF4444' },
                (!pinAddress || pinLoading) && styles.pinConfirmButtonDisabled
              ]}
              onPress={confirmPinLocation}
              disabled={!pinAddress || pinLoading}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        </SafeAreaView>
      )}

      {/* Draggable Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { height: sheetHeight }
        ]}
      >
        {/* Drag Handle */}
        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {addStopMode ? 'Add Stop' : 'Plan your trip'}
            </Text>
            <View style={styles.headerRight} />
          </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Search Card */}
          {!addStopMode && (
            <>
            <View style={styles.searchCard}>
              {/* Route line visualization */}
              <View style={styles.routeLineWrapper}>
                {renderRouteLine()}
              </View>

              {/* Inputs container */}
              <View style={styles.inputsContainer}>
                {/* Pickup Input */}
                <View style={styles.inputRow}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={pickupInputRef}
                      style={[
                        styles.input,
                        activeInput === 'pickup' && styles.inputActive
                      ]}
                      placeholder="Pickup location"
                      placeholderTextColor="#9ca3af"
                      value={pickupQuery}
                      onChangeText={setPickupQuery}
                      onFocus={() => setActiveInput('pickup')}
                      returnKeyType="next"
                    />
                    {pickupQuery.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                          setPickupQuery('');
                          setPickupLocationState(null);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Stop Inputs */}
                {stopQueries.map((query, index) => (
                  <View key={`stop-${index}`} style={styles.inputRow}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        ref={(ref) => { stopInputRefs.current[index] = ref; }}
                        style={[
                          styles.input,
                          activeInput === index && styles.inputActive
                        ]}
                        placeholder={`Stop ${index + 1}`}
                        placeholderTextColor="#9ca3af"
                        value={query}
                        onChangeText={(text) => {
                          const newQueries = [...stopQueries];
                          newQueries[index] = text;
                          setStopQueries(newQueries);
                        }}
                        onFocus={() => setActiveInput(index)}
                        returnKeyType="next"
                      />
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => handleRemoveStop(index)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Destination Input */}
                <View style={styles.inputRow}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={destinationInputRef}
                      style={[
                        styles.input,
                        activeInput === 'destination' && styles.inputActive
                      ]}
                      placeholder="Where to?"
                      placeholderTextColor="#9ca3af"
                      value={destinationQuery}
                      onChangeText={setDestinationQuery}
                      onFocus={() => setActiveInput('destination')}
                      autoFocus={!addStopMode}
                      returnKeyType="done"
                    />
                    {destinationQuery.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                          setDestinationQuery('');
                          setDestinationLocationState(null);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Add Stop Button */}
                  {stopQueries.length < 2 && (
                    <TouchableOpacity
                      style={styles.addStopButton}
                      onPress={handleAddStop}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="add" size={22} color="#5d1289" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Pin Drop Buttons */}
            <View style={styles.pinDropButtonRow}>
              <TouchableOpacity
                style={styles.pinDropChip}
                onPress={() => startPinMode('pickup')}
              >
                <Ionicons name="location" size={16} color="#10B981" />
                <Text style={styles.pinDropChipText}>Pin Pickup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pinDropChip}
                onPress={() => startPinMode('destination')}
              >
                <Ionicons name="flag" size={16} color="#EF4444" />
                <Text style={styles.pinDropChipText}>Pin Destination</Text>
              </TouchableOpacity>
            </View>
            </>
          )}

          {/* Add Stop Mode - Single Input */}
          {addStopMode && (
            <View style={styles.searchCard}>
              <View style={styles.inputsContainer}>
                <View style={styles.inputRow}>
                  <View style={[styles.inputDotIndicator, { backgroundColor: '#f59e0b' }]} />
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputActive]}
                      placeholder="Search for a stop..."
                      placeholderTextColor="#9ca3af"
                      value={stopQueries[0] || ''}
                      onChangeText={(text) => setStopQueries([text])}
                      autoFocus
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Category Chips */}
          {(activeInput === 'destination' || typeof activeInput === 'number') &&
            predictions.length === 0 && !addStopMode && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
              contentContainerStyle={styles.categoriesContent}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryChip}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={category.icon as any} size={16} color="#5d1289" />
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Results */}
          <ScrollView
            style={styles.resultsContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#5d1289" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}

            {/* Predictions */}
            {predictions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Results</Text>
                {predictions.map((prediction) => (
                  <TouchableOpacity
                    key={prediction.place_id}
                    style={styles.resultItem}
                    onPress={() => handleSelectPrediction(prediction)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.resultIconContainer}>
                      <Ionicons name="location" size={18} color="#5d1289" />
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {prediction.structured_formatting.main_text}
                      </Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {prediction.structured_formatting.secondary_text}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Current Location (Pickup Only) */}
            {activeInput === 'pickup' && predictions.length === 0 && currentLocation && !addStopMode && (
              <TouchableOpacity
                style={styles.currentLocationCard}
                onPress={handleUseCurrentLocation}
                activeOpacity={0.7}
              >
                <View style={styles.currentLocationIcon}>
                  <Ionicons name="navigate" size={20} color="#5d1289" />
                </View>
                <View style={styles.currentLocationInfo}>
                  <Text style={styles.currentLocationTitle}>Use current location</Text>
                  <Text style={styles.currentLocationSubtitle}>Your GPS location</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Saved Addresses */}
            {predictions.length === 0 && savedAddresses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Saved Places</Text>
                {savedAddresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={styles.resultItem}
                    onPress={() => handleSelectSavedOrRecent(address)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.resultIconContainer,
                      address.type === 'home' && styles.homeIcon,
                      address.type === 'work' && styles.workIcon,
                    ]}>
                      <Ionicons
                        name={
                          address.type === 'home' ? 'home' :
                          address.type === 'work' ? 'briefcase' : 'star'
                        }
                        size={18}
                        color={
                          address.type === 'home' ? '#10b981' :
                          address.type === 'work' ? '#3b82f6' : '#5d1289'
                        }
                      />
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{address.label}</Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {address.address}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recent Searches */}
            {predictions.length === 0 && recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent</Text>
                {recentSearches.slice(0, 5).map((search) => (
                  <TouchableOpacity
                    key={search.id}
                    style={styles.resultItem}
                    onPress={() => handleSelectSavedOrRecent(search)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resultIconContainer, styles.recentIcon]}>
                      <Ionicons name="time-outline" size={18} color="#6b7280" />
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{search.name}</Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {search.address}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Bottom spacing */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>

        {/* Confirm Button */}
        {canConfirm && !addStopMode && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                Confirm Route
                {stopCount > 0 && ` (${stopCount} stop${stopCount > 1 ? 's' : ''})`}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Map styles
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  // Bottom sheet styles
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  // Center pin styles (Uber-like needle)
  centerPinContainer: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    marginLeft: -20,
    alignItems: 'center',
    zIndex: 1000,
  },
  needlePin: {
    alignItems: 'center',
  },
  needlePinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  needlePinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  needlePinStem: {
    width: 3,
    height: 20,
    marginTop: -2,
  },
  pinShadow: {
    width: 16,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    marginTop: 4,
  },
  // Pin mode header styles
  pinModeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  pinModeHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
  },
  pinModeBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinModeInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  pinModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pinAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pinAddressText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  pinConfirmButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinConfirmButtonDisabled: {
    opacity: 0.5,
  },
  // Pin drop button styles
  pinDropButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    marginHorizontal: 16,
  },
  pinDropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pinDropChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  searchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  routeLineWrapper: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 18,
  },
  routeLineContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    left: -6,
    zIndex: 2,
  },
  pickupDot: {
    backgroundColor: '#10b981',
    top: 0,
  },
  stopDot: {
    backgroundColor: '#f59e0b',
  },
  destinationDot: {
    backgroundColor: '#5d1289',
  },
  routeLine: {
    width: 2,
    backgroundColor: '#e5e7eb',
    position: 'absolute',
    top: 6,
    left: -1,
    zIndex: 1,
  },
  inputsContainer: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  inputDotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  inputActive: {
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
  },
  addStopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  categoriesScroll: {
    marginTop: 16,
    maxHeight: 44,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  categoryLabel: {
    fontSize: 13,
    color: '#5d1289',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#5d1289',
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  homeIcon: {
    backgroundColor: '#d1fae5',
  },
  workIcon: {
    backgroundColor: '#dbeafe',
  },
  recentIcon: {
    backgroundColor: '#f3f4f6',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  currentLocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  currentLocationInfo: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5d1289',
  },
  currentLocationSubtitle: {
    fontSize: 13,
    color: '#7c3aed',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#5d1289',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
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
