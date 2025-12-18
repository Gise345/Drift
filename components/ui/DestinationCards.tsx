import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_SPACING = 16;

interface Destination {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | number; // string for URLs, number for require()
  icon: keyof typeof Ionicons.glyphMap;
  rating: number;
  latitude: number;
  longitude: number;
}

// 🖼️ IMAGE MANAGEMENT OPTIONS:
// 
// Option 1: Use Unsplash URLs (current - free, no setup needed)
// Option 2: Use local assets - require('@/assets/images/destinations/image.jpg')
// Option 3: Use Firebase Storage URLs - 'https://firebasestorage.googleapis.com/...'
//
// For local images: 
// 1. Create folder: assets/images/destinations/
// 2. Add your images (e.g., seven-mile-beach.jpg)
// 3. Replace URLs below with: require('@/assets/images/destinations/seven-mile-beach.jpg')

const CAYMAN_DESTINATIONS: Destination[] = [
  {
    id: '1',
    name: 'Seven Mile Beach',
    description: 'World-famous pristine white sand beach with crystal clear waters',
    category: 'Beach Paradise',
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
    category: 'Landmark',
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
    category: 'Beach & Dining',
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
    category: 'Natural Wonder',
    imageUrl: require('@/assets/images/destinations/crystalcaves.jpg'),
    icon: 'diamond',
    rating: 4.8,
    latitude: 19.3453244974135,
    longitude: -81.17726090778349,
  },
];

interface DestinationCardsProps {
  onDestinationPress?: (destination: Destination) => void;
}

const DestinationCards: React.FC<DestinationCardsProps> = ({ onDestinationPress }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / (CARD_WIDTH + CARD_SPACING));
    setActiveIndex(currentIndex);
  };

  const handleCardPress = (destination: Destination) => {
    if (onDestinationPress) {
      onDestinationPress(destination);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore Cayman Islands</Text>
          <Text style={styles.headerSubtitle}>Popular destinations near you</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton}
         onPress={() => router.push('/(rider)/all-destinations')}>
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={16} color="#5d1289" />
        </TouchableOpacity>
      </View>

      {/* Cards Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
        contentInset={{
          top: 0,
          left: 20,
          bottom: 0,
          right: 20,
        }}
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {CAYMAN_DESTINATIONS.map((destination, index) => (
          <TouchableOpacity
            key={destination.id}
            activeOpacity={0.9}
            onPress={() => handleCardPress(destination)}
          >
            <View
              style={[
                styles.card,
                index === activeIndex && styles.activeCard,
              ]}
            >
              {/* Image with Gradient Overlay */}
              <View style={styles.imageContainer}>
                <Image
                  source={
                    typeof destination.imageUrl === 'string' 
                      ? { uri: destination.imageUrl } 
                      : destination.imageUrl
                  }
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                {/* Dark overlay for text readability */}
                <View style={styles.gradient} />
                
                {/* Category Badge */}
                <View style={styles.categoryBadge}>
                  <Ionicons name={destination.icon} size={14} color="#FFFFFF" />
                  <Text style={styles.categoryText}>{destination.category}</Text>
                </View>

                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{destination.rating}</Text>
                </View>
              </View>

              {/* Card Content */}
              <View style={styles.cardContent}>
                <View style={styles.contentTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {destination.name}
                  </Text>
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {destination.description}
                </Text>

                {/* Action Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCardPress(destination)}
                >
                  <Text style={styles.actionButtonText}>Get directions</Text>
                  <Ionicons name="arrow-forward" size={16} color="#5d1289" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {CAYMAN_DESTINATIONS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5d1289',
  },
  scrollContainer: {
    paddingHorizontal: Platform.OS === 'android' ? 20 : 0,
    gap: CARD_SPACING,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 0.95 }],
  },
  activeCard: {
    transform: [{ scale: 1 }],
    shadowOpacity: 0.25,
    elevation: 12,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent overlay for text readability
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 18, 137, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 16,
  },
  contentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginRight: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5d1289',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0e6f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5d1289',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D1D1',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#5d1289',
  },
});

export default DestinationCards;