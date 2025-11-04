import React, { useState } from 'react';
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

interface Destination {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  rating: number;
  distance?: string;
}

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
    distance: '3.2 km',
  },
  {
    id: '2',
    name: 'Stingray City',
    description: 'Swim with friendly stingrays in crystal clear shallow waters',
    category: 'Marine Adventure',
    imageUrl: require('@/assets/images/destinations/stingray-city.jpg'),
    icon: 'fish',
    rating: 4.8,
    distance: '8.5 km',
  },
  {
    id: '3',
    name: 'Hell Post Office',
    description: 'Unique black limestone formations and iconic tourist spot',
    category: 'Landmarks',
    imageUrl: require('@/assets/images/destinations/hell.jpg'),
    icon: 'flame',
    rating: 4.3,
    distance: '5.7 km',
  },
  {
    id: '4',
    name: 'Cayman Turtle Centre',
    description: 'World\'s only green sea turtle farm and conservation facility',
    category: 'Wildlife',
    imageUrl: require('@/assets/images/destinations/turtlefarm.jpg'),
    icon: 'paw',
    rating: 4.6,
    distance: '6.1 km',
  },
  {
    id: '5',
    name: 'Queen Elizabeth II Botanic Park',
    description: 'Beautiful 65-acre garden with native flora and blue iguanas',
    category: 'Nature & Gardens',
    imageUrl: require('@/assets/images/destinations/botanic.jpg'),
    icon: 'leaf',
    rating: 4.7,
    distance: '12.3 km',
  },
  {
    id: '6',
    name: 'Rum Point',
    description: 'Tranquil beach with hammocks, water sports, and famous mudslides',
    category: 'Beaches',
    imageUrl: require('@/assets/images/destinations/rumpoint.jpg'),
    icon: 'beer',
    rating: 4.7,
    distance: '18.4 km',
  },
  {
    id: '7',
    name: 'Pedro St. James Castle',
    description: 'Historic 18th-century great house and birthplace of democracy',
    category: 'History & Culture',
    imageUrl: require('@/assets/images/destinations/pedro.jpg'),
    icon: 'home',
    rating: 4.5,
    distance: '14.2 km',
  },
  {
    id: '8',
    name: 'Cayman Crystal Caves',
    description: 'Stunning underground limestone caves with crystal formations',
    category: 'Natural Wonders',
    imageUrl: require('@/assets/images/destinations/crystalcaves.jpg'),
    icon: 'diamond',
    rating: 4.8,
    distance: '9.2 km',
  },

  // Additional Beaches
  {
    id: '9',
    name: 'Starfish Point',
    description: 'Shallow waters filled with orange starfish, perfect for families',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: 'star',
    rating: 4.7,
    distance: '19.5 km',
  },
  {
    id: '10',
    name: 'Governor\'s Beach',
    description: 'Secluded beach with excellent snorkeling and calm waters',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: 'water',
    rating: 4.6,
    distance: '2.8 km',
  },
  {
    id: '11',
    name: 'Cemetery Beach',
    description: 'Popular snorkeling spot with vibrant coral reefs',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: 'water',
    rating: 4.5,
    distance: '4.1 km',
  },
  {
    id: '12',
    name: 'Colliers Public Beach',
    description: 'East End beach with rustic charm and local atmosphere',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: 'water',
    rating: 4.4,
    distance: '21.3 km',
  },
  {
    id: '13',
    name: 'Spotts Public Beach',
    description: 'Turtle nesting site and great snorkeling location',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: 'water',
    rating: 4.3,
    distance: '8.7 km',
  },
  {
    id: '14',
    name: 'Cayman Kai Public Beach',
    description: 'North side beach with shallow, calm waters',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: 'water',
    rating: 4.6,
    distance: '20.1 km',
  },
  {
    id: '15',
    name: 'Heritage Beach',
    description: 'Historic beach with cultural significance',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: 'water',
    rating: 4.2,
    distance: '10.5 km',
  },
  {
    id: '16',
    name: 'West Bay Public Beach',
    description: 'Local favorite with easy access and clear waters',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: 'water',
    rating: 4.4,
    distance: '5.2 km',
  },

  // Marine & Wildlife
  {
    id: '17',
    name: 'Dolphin Discovery',
    description: 'Interactive dolphin encounters and educational programs',
    category: 'Marine Adventure',
    imageUrl: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=800&q=80',
    icon: 'fish',
    rating: 4.7,
    distance: '7.3 km',
  },
  {
    id: '18',
    name: 'Kittiwake Shipwreck & Artificial Reef',
    description: 'Underwater diving attraction and marine habitat',
    category: 'Marine Adventure',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    icon: 'boat',
    rating: 4.8,
    distance: '3.5 km',
  },
  {
    id: '19',
    name: 'Cayman Parrot Sanctuary',
    description: 'Protected habitat for endemic Cayman parrots',
    category: 'Wildlife',
    imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&q=80',
    icon: 'leaf',
    rating: 4.5,
    distance: '15.8 km',
  },

  // History & Culture
  {
    id: '20',
    name: 'Cayman National Museum',
    description: 'Island history and cultural exhibits',
    category: 'History & Culture',
    imageUrl: 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800&q=80',
    icon: 'library',
    rating: 4.4,
    distance: '1.2 km',
  },
  {
    id: '21',
    name: 'The National Gallery of the Cayman Islands',
    description: 'Contemporary and traditional Caymanian art',
    category: 'History & Culture',
    imageUrl: 'https://images.unsplash.com/photo-1577720643272-265f7b0e7874?w=800&q=80',
    icon: 'color-palette',
    rating: 4.3,
    distance: '2.1 km',
  },
  {
    id: '22',
    name: 'Bodden Town Mission House',
    description: 'Historic mission house showcasing island heritage',
    category: 'History & Culture',
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
    icon: 'home',
    rating: 4.1,
    distance: '13.4 km',
  },
  {
    id: '23',
    name: 'Heroes Square',
    description: 'National monument honoring Caymanian heritage',
    category: 'History & Culture',
    imageUrl: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&q=80',
    icon: 'flag',
    rating: 4.2,
    distance: '0.8 km',
  },

  // Shopping & Dining
  {
    id: '24',
    name: 'Cayman Spirits Co',
    description: 'Award-winning rum distillery with tours and tastings',
    category: 'Shopping & Dining',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    icon: 'wine',
    rating: 4.7,
    distance: '6.9 km',
  },
  {
    id: '25',
    name: 'Camana Bay',
    description: 'Modern waterfront with shopping, dining, and observation tower',
    category: 'Shopping & Dining',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    icon: 'storefront',
    rating: 4.6,
    distance: '4.8 km',
  },
  {
    id: '26',
    name: 'Smith\'s Barcadere',
    description: 'Historic port and local gathering spot',
    category: 'Shopping & Dining',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    icon: 'restaurant',
    rating: 4.3,
    distance: '11.2 km',
  },

  // Natural Wonders
  {
    id: '27',
    name: 'The Blowholes',
    description: 'Natural rock formations shooting water spray',
    category: 'Natural Wonders',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    icon: 'water',
    rating: 4.5,
    distance: '16.7 km',
  },
  {
    id: '28',
    name: 'Mastic Trail Southern Trailhead',
    description: 'Historic hiking trail through native forest',
    category: 'Natural Wonders',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
    icon: 'trail-sign',
    rating: 4.6,
    distance: '17.9 km',
  },
  {
    id: '29',
    name: 'Barkers National Park',
    description: 'Protected coastal and wetland area',
    category: 'Natural Wonders',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    icon: 'leaf',
    rating: 4.4,
    distance: '11.8 km',
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

  const filteredDestinations = ALL_DESTINATIONS.filter((dest) => {
    const matchesCategory = selectedCategory === 'All' || dest.category === selectedCategory;
    const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dest.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDestinationPress = (destination: Destination) => {
    if (onDestinationPress) {
      onDestinationPress(destination);
    } else {
      // Navigate to search with destination pre-filled
      router.push({
        pathname: '/(rider)/search-location',
        params: {
          searchQuery: destination.name,
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
              
              {destination.distance && (
                <View style={styles.distanceRow}>
                  <Ionicons name="location" size={14} color="#5d1289" />
                  <Text style={styles.distanceText}>{destination.distance} away</Text>
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