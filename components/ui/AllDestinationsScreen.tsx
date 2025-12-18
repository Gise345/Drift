import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';

interface Destination {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  rating: number;
  latitude: number;
  longitude: number;
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
};

const formatDistance = (miles: number): string => {
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
};

// Complete list of Cayman Islands destinations
const ALL_DESTINATIONS: Destination[] = [
  // Featured (from home screen)
  {
    id: '1',
    name: 'Seven Mile Beach',
    description: 'World-famous pristine white sand beach with crystal clear waters',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/7mile.jpg'),
    icon: 'water',
    rating: 4.9,
    latitude: 19.33393617545512,
    longitude: -81.38168710295884,
  },
  {
    id: '2',
    name: 'Stingray City',
    description: 'Swim with friendly stingrays in crystal clear shallow waters',
    category: 'Marine Adventure',
    imageUrl: require('@/assets/images/destinations/stingray-city.jpg'),
    icon: 'fish',
    rating: 4.8,
    latitude: 19.337969180384626,
    longitude: -81.36708079804148,
  },
  {
    id: '3',
    name: 'Hell Post Office',
    description: 'Unique black limestone formations and iconic tourist spot',
    category: 'Landmarks',
    imageUrl: require('@/assets/images/destinations/hell.jpg'),
    icon: 'flame',
    rating: 4.3,
    latitude: 19.378930980690154,
    longitude: -81.40710397897249,
  },
  {
    id: '4',
    name: 'Cayman Turtle Centre',
    description: 'World\'s only green sea turtle farm and conservation facility',
    category: 'Wildlife',
    imageUrl: require('@/assets/images/destinations/turtlefarm.jpg'),
    icon: 'paw',
    rating: 4.6,
    latitude: 19.380291932035938,
    longitude: -81.41652466101658,
  },
  {
    id: '5',
    name: 'Queen Elizabeth II Botanic Park',
    description: 'Beautiful 65-acre garden with native flora and blue iguanas',
    category: 'Nature & Gardens',
    imageUrl: require('@/assets/images/destinations/botanic.jpg'),
    icon: 'leaf',
    rating: 4.7,
    latitude: 19.31586563665741,
    longitude: -81.16874644033008,
  },
  {
    id: '6',
    name: 'Rum Point',
    description: 'Tranquil beach with hammocks, water sports, and famous mudslides',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/rumpoint.jpg'),
    icon: 'beer',
    rating: 4.7,
    latitude: 19.372783124935932,
    longitude: -81.2711970616566,
  },
  {
    id: '7',
    name: 'Pedro St. James Castle',
    description: 'Historic 18th-century great house and birthplace of democracy',
    category: 'History & Culture',
    imageUrl: require('@/assets/images/destinations/pedro.jpg'),
    icon: 'home',
    rating: 4.5,
    latitude: 19.266571276509374,
    longitude: -81.29085826942116,
  },
  {
    id: '8',
    name: 'Cayman Crystal Caves',
    description: 'Stunning underground limestone caves with crystal formations',
    category: 'Natural Wonders',
    imageUrl: require('@/assets/images/destinations/crystalcaves.jpg'),
    icon: 'diamond',
    rating: 4.8,
    latitude: 19.3453244974135,
    longitude: -81.17726090778349,
  },

  // Additional Beaches
  {
    id: '9',
    name: 'Starfish Point',
    description: 'Shallow waters filled with orange starfish, perfect for families',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/starfish.png'),
    icon: 'star',
    rating: 4.7,
    latitude: 19.35652342968566,
    longitude: -81.28319571148067,
  },
  {
    id: '10',
    name: 'Governor\'s Beach',
    description: 'Secluded beach with excellent snorkeling and calm waters',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/governors-beach.png'),
    icon: 'water',
    rating: 4.6,
    latitude: 19.34133221227731,
    longitude: -81.38141168403403,
  },
  {
    id: '11',
    name: 'Cemetery Beach',
    description: 'Popular snorkeling spot with vibrant coral reefs',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/cemetery-beach.png'),
    icon: 'water',
    rating: 4.5,
    latitude: 19.36565788530454,
    longitude: -81.39523024697236,
  },
  {
    id: '12',
    name: 'Colliers Public Beach',
    description: 'East End beach with rustic charm and local atmosphere',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/colliers-beach.png'),
    icon: 'water',
    rating: 4.4,
    latitude: 19.33272378961449,
    longitude: -81.0850555714593,
  },
  {
    id: '13',
    name: 'Spotts Public Beach',
    description: 'Turtle nesting site and great snorkeling location',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/spotts-beach.png'),
    icon: 'water',
    rating: 4.3,
    latitude: 19.27273381034965,
    longitude: -81.3140243091877,
  },
  {
    id: '14',
    name: 'Cayman Kai Public Beach',
    description: 'North side beach with shallow, calm waters',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/cayman-kai.png'),
    icon: 'water',
    rating: 4.6,
    latitude: 19.36944549776127,
    longitude: -81.2657746647515,
  },
  {
    id: '15',
    name: 'Heritage Beach',
    description: 'Historic beach with cultural significance',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/heritage-beach.png'),
    icon: 'water',
    rating: 4.2,
    latitude: 19.2990858458558,
    longitude: -81.16280094190316,
  },
  {
    id: '16',
    name: 'West Bay Public Beach',
    description: 'Local favorite with easy access and clear waters',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/west-bay-public-beach.png'),
    icon: 'water',
    rating: 4.4,
    latitude: 19.37004545449024,
    longitude: -81.40327798136222,
  },

  // Marine & Wildlife
  {
    id: '17',
    name: 'Dolphin Discovery',
    description: 'Interactive dolphin encounters and educational programs',
    category: 'Marine Adventure',
    imageUrl: require('@/assets/images/destinations/dolphin.png'),
    icon: 'fish',
    rating: 4.7,
    latitude: 19.38089353390587,
    longitude: -81.41669376524635,
  },
  {
    id: '18',
    name: 'Kittiwake Shipwreck & Artificial Reef',
    description: 'Underwater diving attraction and marine habitat',
    category: 'Marine Adventure',
    imageUrl: require('@/assets/images/destinations/kittiwake.png'),
    icon: 'boat',
    rating: 4.8,
    latitude: 19.363287495869947,
    longitude: -81.39935403290465,
  },
  {
    id: '19',
    name: 'Cayman Parrot Sanctuary',
    description: 'Protected habitat for endemic Cayman parrots',
    category: 'Wildlife',
    imageUrl: require('@/assets/images/destinations/parrot.png'),
    icon: 'leaf',
    rating: 4.5,
    latitude: 19.318956120132274,
    longitude: -81.08706871711028,
  },

  // History & Culture
  {
    id: '20',
    name: 'Cayman National Museum',
    description: 'Island history and cultural exhibits',
    category: 'History & Culture',
    imageUrl: require('@/assets/images/destinations/cayman-national-museum.png'),
    icon: 'library',
    rating: 4.4,
    latitude: 19.29422170256735,
    longitude: -81.38271202427607,
  },
  {
    id: '21',
    name: 'The National Gallery of the Cayman Islands',
    description: 'Contemporary and traditional Caymanian art',
    category: 'History & Culture',
    imageUrl: require('@/assets/images/destinations/national-gallery.png'),
    icon: 'color-palette',
    rating: 4.3,
    latitude: 19.315906866999462,
    longitude: -81.37875601601985,
  },
  {
    id: '22',
    name: 'Bodden Town Mission House',
    description: 'Historic mission house showcasing island heritage',
    category: 'History & Culture',
    imageUrl: require('@/assets/images/destinations/bt-mission-house.png'),
    icon: 'home',
    rating: 4.1,
    latitude: 19.2791816683388,
    longitude: -81.25133916160242,
  },
  {
    id: '23',
    name: 'Heroes Square',
    description: 'National monument honoring Caymanian heritage',
    category: 'History & Culture',
    imageUrl: require('@/assets/images/destinations/heroes-square.png'),
    icon: 'flag',
    rating: 4.2,
    latitude: 19.29641803526233,
    longitude: -81.38173548768253,
  },

  // Shopping & Dining
  {
    id: '24',
    name: 'Cayman Spirits Co',
    description: 'Award-winning rum distillery with tours and tastings',
    category: 'Shopping & Dining',
    imageUrl: require('@/assets/images/destinations/cayman-spirits.png'),
    icon: 'wine',
    rating: 4.7,
    latitude: 19.30159977840125,
    longitude: -81.37123521621187,
  },
  {
    id: '25',
    name: 'Camana Bay',
    description: 'Modern waterfront with shopping, dining, and observation tower',
    category: 'Shopping & Dining',
    imageUrl: require('@/assets/images/destinations/camana-bay.png'),
    icon: 'storefront',
    rating: 4.6,
    latitude: 19.322072160291885,
    longitude: -81.37817988585999,
  },
  {
    id: '26',
    name: 'Smith\'s Barcadere',
    description: 'Historic port and local gathering spot',
    category: 'Shopping & Dining',
    imageUrl: require('@/assets/images/destinations/smiths-cove.png'),
    icon: 'restaurant',
    rating: 4.3,
    latitude: 19.27665408799054,
    longitude: -81.39088784651551,
  },

  // Natural Wonders
  {
    id: '27',
    name: 'The Blowholes',
    description: 'Natural rock formations shooting water spray',
    category: 'Natural Wonders',
    imageUrl: require('@/assets/images/destinations/blowholes.png'),
    icon: 'water',
    rating: 4.5,
    latitude: 19.294279930817897,
    longitude: -81.1276440197753,
  },
  {
    id: '28',
    name: 'Mastic Trail Southern Trailhead',
    description: 'Historic hiking trail through native forest',
    category: 'Natural Wonders',
    imageUrl: require('@/assets/images/destinations/mastic-trail.png'),
    icon: 'trail-sign',
    rating: 4.6,
    latitude: 19.31364012108411,
    longitude: -81.19059404356044,
  },
  {
    id: '29',
    name: 'Barkers National Park',
    description: 'Protected coastal and wetland area',
    category: 'Natural Wonders',
    imageUrl: require('@/assets/images/destinations/barkers.png'),
    icon: 'leaf',
    rating: 4.4,
    latitude: 19.385874342139363,
    longitude: -81.36517255144965,
  },
];

const CATEGORIES = [
  'All',
  'Beaches',
  'Marine Adventure',
  'History & Culture',
  'Natural Wonders',
  'Wildlife',
  'Shopping & Dining',
  'Landmarks',
  'Nature & Gardens',
];

interface AllDestinationsScreenProps {
  onDestinationPress?: (destination: Destination) => void;
}

const AllDestinationsScreen: React.FC<AllDestinationsScreenProps> = ({ onDestinationPress }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user's current location on mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log('Could not get user location for distance calculation');
      }
    };

    getUserLocation();
  }, []);

  // Get distance string for a destination
  const getDistanceString = (destination: Destination): string | null => {
    if (!userLocation) return null;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      destination.latitude,
      destination.longitude
    );
    return formatDistance(distance);
  };

  const filteredDestinations = ALL_DESTINATIONS
    .filter((dest) => {
      const matchesCategory = selectedCategory === 'All' || dest.category === selectedCategory;
      const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           dest.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by distance if user location is available
      if (userLocation) {
        const distA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.latitude,
          a.longitude
        );
        const distB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.latitude,
          b.longitude
        );
        return distA - distB;
      }
      return 0; // Keep original order if no user location
    });

  const handleDestinationPress = (destination: Destination) => {
    if (onDestinationPress) {
      onDestinationPress(destination);
    } else {
      // Navigate to search with destination coordinates and name pre-filled
      router.push({
        pathname: '/(rider)/search-location',
        params: {
          searchQuery: destination.name,
          destinationLat: destination.latitude.toString(),
          destinationLng: destination.longitude.toString(),
          destinationName: destination.name,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Destinations</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredDestinations.length} {filteredDestinations.length === 1 ? 'destination' : 'destinations'}
        </Text>
      </View>

      {/* Destinations List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredDestinations.map((destination) => (
          <TouchableOpacity
            key={destination.id}
            style={styles.listItem}
            onPress={() => handleDestinationPress(destination)}
            activeOpacity={0.7}
          >
            {/* Image */}
            <Image
              source={
                typeof destination.imageUrl === 'string'
                  ? { uri: destination.imageUrl }
                  : destination.imageUrl
              }
              style={styles.listItemImage}
              resizeMode="cover"
            />
            
            {/* Content */}
            <View style={styles.listItemContent}>
              <View style={styles.listItemTop}>
                <Text style={styles.listItemTitle} numberOfLines={1}>
                  {destination.name}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{destination.rating}</Text>
                </View>
              </View>
              
              <View style={styles.categoryBadgeSmall}>
                <Ionicons name={destination.icon} size={12} color="#5d1289" />
                <Text style={styles.categoryBadgeText}>{destination.category}</Text>
              </View>
              
              <Text style={styles.listItemDescription} numberOfLines={2}>
                {destination.description}
              </Text>

              {getDistanceString(destination) && (
                <View style={styles.distanceRow}>
                  <Ionicons name="location" size={14} color="#5d1289" />
                  <Text style={styles.distanceText}>{getDistanceString(destination)} away</Text>
                </View>
              )}
            </View>

            {/* Arrow */}
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  categoryContainer: {
    maxHeight: 50,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#5d1289',
    borderColor: '#5d1289',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  categoryBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f0e6f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5d1289',
  },
  listItemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5d1289',
  },
});

export default AllDestinationsScreen;