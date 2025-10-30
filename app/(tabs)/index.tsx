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
 * NATIVE CONTEXT SOLUTION FOR HOME SCREEN
 * 
 * Using expo-location for geocoding (native context)
 * This avoids fetch() web requests that get blocked by Google
 */

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
  const [searchResults, setSearchResults] = useState<SavedPlace[]>([]);
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

  // Debounced search using native geocoding
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchPlacesNative(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
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
   * NATIVE SEARCH using expo-location geocoding
   * This uses native Android/iOS geocoding, not web requests
   */
  const searchPlacesNative = async (query: string) => {
    setSearchLoading(true);
    try {
      console.log('🔍 Searching (NATIVE):', query);

      // Use expo-location's native geocoding
      // This calls Android/iOS native geocoding APIs
      const results = await Location.geocodeAsync(query);

      if (results && results.length > 0) {
        // Convert geocoding results to our format
        const places: SavedPlace[] = await Promise.all(
          results.slice(0, 5).map(async (result, index) => {
            // Get address for each coordinate using reverse geocoding (also native)
            let address = query;
            try {
              const reverseGeo = await Location.reverseGeocodeAsync({
                latitude: result.latitude,
                longitude: result.longitude,
              });
              
              if (reverseGeo && reverseGeo.length > 0) {
                const r = reverseGeo[0];
                address = [
                  r.street,
                  r.city,
                  r.region,
                  r.country
                ].filter(Boolean).join(', ');
              }
            } catch (err) {
              console.error('Reverse geocoding error:', err);
            }

            return {
              label: query,
              address: address,
              coordinates: {
                latitude: result.latitude,
                longitude: result.longitude,
              },
            };
          })
        );

        setSearchResults(places);
        console.log(`✅ Found ${places.length} results (NATIVE)`);
      } else {
        setSearchResults([]);
        console.log('No results found');
      }
    } catch (error) {
      console.error('Error searching places (native):', error);
      setSearchResults([]);
      
      // Show helpful message
      Alert.alert(
        'Search Unavailable',
        'Native geocoding service is unavailable. Please try again later or enter coordinates directly.',
        [{ text: 'OK' }]
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const selectPlace = async (place: SavedPlace) => {
    // Close search modal
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);

    // Show save dialog
    setAddressToSave(place);
    setShowSaveModal(true);
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

          {/* Native Search Info */}
          <View style={styles.nativeSearchInfo}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.nativeSearchText}>
              Using native device search
            </Text>
          </View>

          {searchLoading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#5d1289ff" />
            </View>
          )}

          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => selectPlace(item)}
              >
                <Ionicons name="location" size={20} color="#666" />
                <View style={styles.predictionText}>
                  <Text style={styles.predictionMain}>
                    {item.label}
                  </Text>
                  <Text style={styles.predictionSecondary}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.length > 2 && !searchLoading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>
                    Try searching for a city, street, or landmark
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
  nativeSearchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  nativeSearchText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 8,
    fontWeight: '600',
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
    marginBottom: 8,
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