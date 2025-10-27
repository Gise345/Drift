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
  KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// CRITICAL: Use separate API keys for different services
// Maps SDK API key is used by native MapView (Android/iOS restricted)
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Places API key for autocomplete searches (Web/JavaScript calls)
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
  const [saveAddressType, setSaveAddressType] = useState<'home' | 'work' | null>(null);
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

  // Debounced search for places
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

  const getCurrentLocation = async () => {
    try {
      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        // Set default to Cayman Islands
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

      // Get current position with high accuracy
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('Location received:', currentLocation.coords);

      setLocation(currentLocation);
      
      // Set initial region centered on user location
      const initialRegion: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setRegion(initialRegion);
      setLoading(false);

      // Animate to user location after map loads
      setTimeout(() => {
        mapRef.current?.animateToRegion(initialRegion, 1000);
      }, 500);

    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Failed to get your location. Please enable location services.');
      
      // Fallback to Cayman Islands
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

  const searchPlaces = async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not found');
      return;
    }

    setSearchLoading(true);
    try {
      // Use Cayman Islands as location bias
      const locationBias = location 
        ? `location=${location.coords.latitude},${location.coords.longitude}&radius=50000`
        : 'location=19.3133,-81.2546&radius=50000'; // Cayman Islands

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&${locationBias}&key=${GOOGLE_PLACES_API_KEY}&components=country:ky`; // Restrict to Cayman Islands

      console.log('Searching places:', query);

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        setPredictions(data.predictions);
      } else {
        console.error('Places API error:', data.status, data.error_message);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setPredictions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectPlace = async (prediction: PlacePrediction) => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not found');
      return;
    }

    try {
      // Get place details to get coordinates
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const coords: LatLng = {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };

        const selectedPlace: SavedPlace = {
          label: prediction.structured_formatting.main_text,
          address: data.result.formatted_address,
          coordinates: coords,
          placeId: prediction.place_id,
        };

        // Close search modal
        setShowSearchModal(false);
        setSearchQuery('');
        setPredictions([]);

        // Navigate to destination selection or save
        // For now, let's show save dialog
        setAddressToSave(selectedPlace);
        setShowSaveModal(true);

      } else {
        Alert.alert('Error', 'Failed to get place details');
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      Alert.alert('Error', 'Failed to get place details');
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
    // For now, empty
  };

  const navigateToDestination = (destination: SavedPlace) => {
    router.push({
      pathname: '/(rider)/select-destination',
      params: {
        pickup: JSON.stringify(location?.coords || region),
        destination: JSON.stringify(destination),
      },
    });
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
              key={`user-location-${Date.now()}`}
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
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>Where would you like to go?</Text>
        </TouchableOpacity>

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessRow}>
          {homeAddress && (
            <TouchableOpacity
              style={styles.quickAccessButton}
              onPress={() => navigateToDestination(homeAddress)}
            >
              <Ionicons name="home" size={20} color="#5d1289ff" />
              <Text style={styles.quickAccessText}>Home</Text>
            </TouchableOpacity>
          )}
          {workAddress && (
            <TouchableOpacity
              style={styles.quickAccessButton}
              onPress={() => navigateToDestination(workAddress)}
            >
              <Ionicons name="briefcase" size={20} color="#5d1289ff" />
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
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowSearchModal(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a place..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

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
                <Ionicons name="location" size={20} color="#666" />
                <View style={styles.predictionText}>
                  <Text style={styles.predictionMain}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.predictionSecondary}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.length > 2 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No results found</Text>
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
    color: '#666',
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