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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Google Places API Key - Make sure this is in your .env file
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'YOUR_API_KEY_HERE';

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
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
}

const HomeScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
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
  
  // Saved addresses (using localStorage for now - you can replace with Firebase)
  const [homeAddress, setHomeAddress] = useState<SavedPlace | null>(null);
  const [workAddress, setWorkAddress] = useState<SavedPlace | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    getCurrentLocation();
    loadSavedAddresses();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(searchQuery);
      }, 300);
    } else {
      setPredictions([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadSavedAddresses = async () => {
    // TODO: Replace with Firebase fetch
    // For now, using AsyncStorage would work
    // const home = await AsyncStorage.getItem('homeAddress');
    // const work = await AsyncStorage.getItem('workAddress');
    // if (home) setHomeAddress(JSON.parse(home));
    // if (work) setWorkAddress(JSON.parse(work));
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Could not get location');
      setLoading(false);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) {
      setPredictions([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      
      const locationBias = location 
        ? `&location=${location.coords.latitude},${location.coords.longitude}&radius=50000`
        : '';
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(query)}` +
        locationBias +
        `&components=country:ky` + // Cayman Islands
        `&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions);
      } else if (data.status === 'ZERO_RESULTS') {
        setPredictions([]);
      } else {
        console.error('Places API error:', data.status, data.error_message);
        Alert.alert('Error', 'Failed to search places. Please check your API key.');
        setPredictions([]);
      }
    } catch (error) {
      console.error('Failed to search places:', error);
      Alert.alert('Error', 'Failed to search places. Please try again.');
      setPredictions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<SavedPlace | null> => {
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
          label: data.result.name,
          address: data.result.formatted_address,
          coordinates: {
            latitude: data.result.geometry.location.lat,
            longitude: data.result.geometry.location.lng,
          },
          placeId: placeId,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get place details:', error);
      return null;
    }
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    setShowSearchModal(false);
    setSearchQuery('');
    setPredictions([]);
    
    // Get full place details
    const placeDetails = await getPlaceDetails(prediction.place_id);
    
    if (!placeDetails) {
      Alert.alert('Error', 'Failed to get place details');
      return;
    }
    
    // If we're in save address mode, show save modal
    if (saveAddressType) {
      setAddressToSave(placeDetails);
      setShowSaveModal(true);
    } else {
      // Navigate to destination selection with this place
      router.push({
        pathname: '/(rider)/select-destination',
        params: {
          destination: JSON.stringify(placeDetails),
        },
      });
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!location) {
      await getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Could not get your current location');
        return;
      }
    }
    
    try {
      // Reverse geocode to get address
      const [result] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (result) {
        const address = [
          result.street,
          result.city,
          result.region,
          result.country
        ].filter(Boolean).join(', ');
        
        const currentLocationPlace: SavedPlace = {
          label: 'Current Location',
          address: address,
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        };
        
        router.push({
          pathname: '/(rider)/select-destination',
          params: {
            pickup: JSON.stringify(currentLocationPlace),
          },
        });
      } else {
        Alert.alert('Error', 'Could not determine address');
      }
    } catch (error) {
      console.error('Failed to get address:', error);
      Alert.alert('Error', 'Failed to get current location address');
    }
  };

  const handleSavedPlacePress = (type: 'home' | 'work') => {
    const place = type === 'home' ? homeAddress : workAddress;
    
    if (!place) {
      // No saved address - open search to save one
      Alert.alert(
        `Set ${type === 'home' ? 'Home' : 'Work'} Address`,
        `Would you like to set your ${type} address now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Set Address', 
            onPress: () => {
              setSaveAddressType(type);
              setShowSearchModal(true);
            }
          },
        ]
      );
      return;
    }
    
    // Navigate with saved place as destination
    router.push({
      pathname: '/(rider)/select-destination',
      params: {
        destination: JSON.stringify(place),
      },
    });
  };

  const handleLongPressSavedPlace = (type: 'home' | 'work') => {
    const place = type === 'home' ? homeAddress : workAddress;
    
    if (place) {
      // Already have address - ask to update
      Alert.alert(
        `Update ${type === 'home' ? 'Home' : 'Work'} Address`,
        'Do you want to change this address?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Update', 
            onPress: () => {
              setSaveAddressType(type);
              setShowSearchModal(true);
            }
          },
        ]
      );
    } else {
      // No address yet - prompt to add
      setSaveAddressType(type);
      setShowSearchModal(true);
    }
  };

  const confirmSaveAddress = async () => {
    if (!addressToSave || !saveAddressType) return;
    
    try {
      // TODO: Save to Firebase
      // await updateDoc(userRef, {
      //   [`${saveAddressType}Address`]: addressToSave,
      //   updatedAt: serverTimestamp()
      // });
      
      // For now, save to state and AsyncStorage
      if (saveAddressType === 'home') {
        setHomeAddress(addressToSave);
        // await AsyncStorage.setItem('homeAddress', JSON.stringify(addressToSave));
      } else {
        setWorkAddress(addressToSave);
        // await AsyncStorage.setItem('workAddress', JSON.stringify(addressToSave));
      }
      
      Alert.alert(
        'Success', 
        `${saveAddressType === 'home' ? 'Home' : 'Work'} address saved!`
      );
      
      setShowSaveModal(false);
      setSaveAddressType(null);
      setAddressToSave(null);
    } catch (error) {
      console.error('Failed to save address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5d1289" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top']}>
        <Ionicons name="location-outline" size={64} color="#666" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 19.3133,
    longitude: -81.2546,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You are here"
          />
        )}
      </MapView>

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => router.push('/(rider)/profile')}
        >
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <Text style={styles.greeting}>Hey there!</Text>
          <Text style={styles.subtitle}>Where are you going?</Text>
        </View>
      </SafeAreaView>

      {/* Search Card */}
      <View style={styles.searchCard}>
        <TouchableOpacity 
          style={styles.searchInput} 
          onPress={() => {
            setSaveAddressType(null);
            setShowSearchModal(true);
          }}
        >
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Where to?</Text>
        </TouchableOpacity>

        {/* Saved Places */}
        <View style={styles.savedPlaces}>
          <TouchableOpacity 
            style={styles.savedPlace}
            onPress={() => handleSavedPlacePress('home')}
            onLongPress={() => handleLongPressSavedPlace('home')}
          >
            <View style={styles.placeIcon}>
              <Ionicons name="home" size={20} color="#5d1289" />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeLabel}>Home</Text>
              <Text style={styles.placeAddress} numberOfLines={1}>
                {homeAddress?.address || 'Add home address'}
              </Text>
            </View>
            {!homeAddress && (
              <TouchableOpacity onPress={() => handleLongPressSavedPlace('home')}>
                <Ionicons name="add-circle-outline" size={24} color="#5d1289" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <View style={styles.placeDivider} />

          <TouchableOpacity 
            style={styles.savedPlace}
            onPress={() => handleSavedPlacePress('work')}
            onLongPress={() => handleLongPressSavedPlace('work')}
          >
            <View style={styles.placeIcon}>
              <Ionicons name="briefcase" size={20} color="#5d1289" />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeLabel}>Work</Text>
              <Text style={styles.placeAddress} numberOfLines={1}>
                {workAddress?.address || 'Add work address'}
              </Text>
            </View>
            {!workAddress && (
              <TouchableOpacity onPress={() => handleLongPressSavedPlace('work')}>
                <Ionicons name="add-circle-outline" size={24} color="#5d1289" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Current Location Button */}
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
        >
          <Ionicons name="locate" size={20} color="#5d1289" style={{ marginRight: 12 }} />
          <Text style={styles.currentLocationText}>Use Current Location</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Action Button */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            setSaveAddressType(null);
            setShowSearchModal(true);
          }}
        >
          <Ionicons name="car" size={24} color="white" />
          <Text style={styles.actionButtonText}>Request a Carpool</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Location Button */}
      <TouchableOpacity 
        style={styles.locationButton} 
        onPress={getCurrentLocation}
      >
        <Ionicons name="locate" size={24} color="#5d1289" />
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => {
          setShowSearchModal(false);
          setSaveAddressType(null);
        }}
      >
        <SafeAreaView style={styles.searchModal} edges={['top', 'bottom']}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => {
              setShowSearchModal(false);
              setSaveAddressType(null);
              setSearchQuery('');
              setPredictions([]);
            }}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.searchTitle}>
              {saveAddressType 
                ? `Set ${saveAddressType === 'home' ? 'Home' : 'Work'} Address`
                : 'Where to?'
              }
            </Text>
          </View>
          
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search for a place..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchLoading && (
              <ActivityIndicator size="small" color="#5d1289" />
            )}
          </View>
          
          {predictions.length > 0 ? (
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.predictionItem}
                  onPress={() => handlePlaceSelect(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#666" />
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
            />
          ) : searchQuery.length > 2 && !searchLoading ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* Save Address Confirmation Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.saveModal}>
            <Text style={styles.saveModalTitle}>
              Save as {saveAddressType === 'home' ? 'Home' : 'Work'}?
            </Text>
            <Text style={styles.saveModalAddress}>
              {addressToSave?.address}
            </Text>
            <View style={styles.saveModalButtons}>
              <TouchableOpacity
                style={[styles.saveModalButton, styles.saveModalCancelButton]}
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveAddressType(null);
                  setAddressToSave(null);
                }}
              >
                <Text style={styles.saveModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveModalButton, styles.saveModalConfirmButton]}
                onPress={confirmSaveAddress}
              >
                <Text style={styles.saveModalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#5d1289',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  menuButton: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topInfo: {
    flex: 1,
    marginLeft: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 128,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#666',
  },
  savedPlaces: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 16,
  },
  savedPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  placeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeDivider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 8,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  currentLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5d1289',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#5d1289',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Search Modal Styles
  searchModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 12,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  predictionText: {
    flex: 1,
    marginLeft: 12,
  },
  predictionMain: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  predictionSecondary: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noResults: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
  },
  
  // Save Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  saveModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  saveModalAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  saveModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveModalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveModalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveModalConfirmButton: {
    backgroundColor: '#5d1289',
  },
  saveModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default HomeScreen;