import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/src/constants/theme';
import { useTripStore } from '@/src/stores/trip-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { submitDriverRating } from '@/src/services/rating.service';
import { canRateOrTipTrip } from '@/src/services/ride-request.service';
import firestore from '@react-native-firebase/firestore';

export default function RateDriverScreen() {
  const router = useRouter();
  const { tripId, driverId: paramDriverId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { currentTrip } = useTripStore();

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);
  const [ratingStatus, setRatingStatus] = useState<{
    canRate: boolean;
    remainingTime?: string;
  }>({ canRate: true });

  const feedbackTags = [
    'Great conversation',
    'Safe driver',
    'Clean vehicle',
    'On time',
    'Friendly',
    'Professional',
    'Smooth ride',
    'Helpful',
  ];

  // Load trip data if we have a tripId param (coming from trip history)
  useEffect(() => {
    const loadTripData = async () => {
      const actualTripId = typeof tripId === 'string' ? tripId : currentTrip?.id;

      if (actualTripId && !currentTrip) {
        try {
          const tripDoc = await firestore().collection('trips').doc(actualTripId).get();
          if (tripDoc.exists) {
            const data = tripDoc.data();
            setTripData(data);

            // Check if rating window is still open
            const status = canRateOrTipTrip({
              completedAt: data?.completedAt,
              ratingDeadline: data?.ratingDeadline,
              driverRating: data?.driverRating,
              tip: data?.tip,
              status: data?.status,
            });

            setRatingStatus({
              canRate: status.canRate,
              remainingTime: status.remainingTime,
            });

            if (!status.canRate) {
              if (status.hasRated) {
                Alert.alert(
                  'Already Rated',
                  'You have already rated this trip.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                Alert.alert(
                  'Rating Window Expired',
                  'The 3-day rating window for this trip has expired.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }
            }
          }
        } catch (error) {
          console.error('Error loading trip data:', error);
        }
      } else if (currentTrip) {
        setTripData(currentTrip);
      }
      setInitialLoading(false);
    };

    loadTripData();
  }, [tripId, currentTrip]);

  // Get driver info from trip data or params
  const driver = {
    id: tripData?.driverId || tripData?.driverInfo?.id || (typeof paramDriverId === 'string' ? paramDriverId : '') || currentTrip?.driverId || '',
    name: tripData?.driverInfo?.name || tripData?.driverName || currentTrip?.driverName || 'Driver',
    photo: tripData?.driverInfo?.photo || tripData?.driverPhoto || currentTrip?.driverPhoto || '👤',
  };

  const actualTripId = (typeof tripId === 'string' ? tripId : currentTrip?.id) || '';

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate your driver');
      return;
    }

    if (!actualTripId || !driver.id || !user?.id) {
      Alert.alert('Error', 'Missing trip or driver information');
      return;
    }

    setLoading(true);

    try {
      // Submit rating to Firebase
      await submitDriverRating(
        actualTripId,
        driver.id,
        user.id,
        user.name || 'Rider',
        rating,
        feedback.trim() || undefined,
        selectedTags.length > 0 ? selectedTags : undefined
      );

      Alert.alert('Thank You!', 'Your feedback has been submitted', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)'),
        },
      ]);
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(tabs)');
  };

  // Show loading while fetching trip data
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Rate Your Driver</Text>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Remaining time banner */}
        {ratingStatus.remainingTime && (
          <View style={styles.remainingTimeBanner}>
            <Text style={styles.remainingTimeText}>
              {ratingStatus.remainingTime} to rate this trip
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Driver Info */}
          <View style={styles.driverContainer}>
            <View style={styles.driverPhoto}>
              <Text style={styles.driverPhotoText}>{driver.photo}</Text>
            </View>
            <Text style={styles.driverName}>{driver.name}</Text>
          </View>

          {/* Star Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingTitle}>How was your ride?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  style={styles.starButton}
                >
                  <Text style={[
                    styles.star,
                    star <= rating && styles.starFilled,
                  ]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            )}
          </View>

          {/* Feedback Tags */}
          {rating > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsTitle}>What went well?</Text>
              <View style={styles.tags}>
                {feedbackTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && styles.tagSelected,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Written Feedback */}
          {rating > 0 && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackTitle}>
                Additional Comments (Optional)
              </Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Share more details about your experience..."
                placeholderTextColor={Colors.gray[400]}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        {rating > 0 && (
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerSpacer: {
    width: 60,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  driverContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  driverPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverPhotoText: {
    fontSize: 40,
  },
  driverName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 20,
  },
  stars: {
    flexDirection: 'row',
    gap: 12,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 48,
    color: Colors.gray[300],
  },
  starFilled: {
    color: Colors.warning,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: 12,
  },
  tagsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.white,
  },
  tagSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  tagTextSelected: {
    color: Colors.black,
  },
  feedbackContainer: {
    paddingHorizontal: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  feedbackInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.black,
    minHeight: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    padding: 16,
  },
  submitButton: {
    backgroundColor: Colors.black,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.gray[600],
  },
  remainingTimeBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  remainingTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
});