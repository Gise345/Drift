import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useTripStore } from '@/src/stores/trip-store';
import firestore from '@react-native-firebase/firestore';

// Issues that can be selected for low ratings
const RIDER_ISSUES = [
  'Late to pickup',
  'Rude behavior',
  'Changed destination',
  'Left trash',
  'Too many stops',
  'Wrong address',
];

interface RiderInfo {
  name: string;
  photo?: string;
  rating: number;
  totalTrips: number;
}

export default function RateRider() {
  const router = useRouter();
  const { activeRide, clearActiveRide } = useDriverStore();
  const { currentTrip, clearCurrentTrip } = useTripStore();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [riderInfo, setRiderInfo] = useState<RiderInfo>({
    name: 'Rider',
    rating: 5.0,
    totalTrips: 0,
  });

  // Load rider info from active ride or trip
  useEffect(() => {
    loadRiderInfo();
  }, []);

  const loadRiderInfo = async () => {
    try {
      setLoading(true);

      // Try to get rider info from activeRide first
      if (activeRide) {
        setRiderInfo({
          name: activeRide.riderName || 'Rider',
          photo: activeRide.riderPhoto,
          rating: activeRide.riderRating || 5.0,
          totalTrips: activeRide.riderTrips || 0,
        });
        setLoading(false);
        return;
      }

      // Fallback to currentTrip
      if (currentTrip) {
        // Try different fields where rider info might be stored
        let name = 'Rider';
        let photo: string | undefined;
        let ratingVal = 5.0;
        let trips = 0;

        // Check riderInfo object
        const tripData = currentTrip as any;
        if (tripData.riderInfo) {
          name = tripData.riderInfo.name || name;
          photo = tripData.riderInfo.photoUrl || tripData.riderInfo.photo;
          ratingVal = tripData.riderInfo.rating || ratingVal;
          trips = tripData.riderInfo.totalTrips || trips;
        } else {
          // Check individual fields
          name = tripData.riderName || name;
          photo = tripData.riderPhoto;
          ratingVal = tripData.riderProfileRating || tripData.riderRating || ratingVal;
        }

        // If we have riderId, fetch latest rider data from users collection
        if (currentTrip.riderId) {
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(currentTrip.riderId)
              .get();

            if (userDoc.exists) {
              const userData = userDoc.data();
              name = userData?.name || userData?.firstName || name;
              photo = userData?.profilePhotoUrl || userData?.photoUrl || photo;
              ratingVal = userData?.rating || ratingVal;
              trips = userData?.totalTrips || trips;
            }
          } catch (err) {
            console.warn('Could not fetch rider info from users:', err);
          }
        }

        setRiderInfo({ name, photo, rating: ratingVal, totalTrips: trips });
      }
    } catch (error) {
      console.error('Error loading rider info:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIssue = (issue: string) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  /**
   * Submit rider rating to Firebase
   */
  const submitRiderRating = async () => {
    // Get trip ID from activeRide or currentTrip
    const tripId = activeRide?.id || currentTrip?.id;
    const riderId = activeRide?.riderId || currentTrip?.riderId;
    const driverId = useDriverStore.getState().driver?.id;

    if (!tripId || !riderId || !driverId) {
      console.error('Missing required IDs for rating submission');
      return false;
    }

    try {
      // Create the rider review document
      const reviewRef = firestore().collection('riderReviews').doc();
      await reviewRef.set({
        tripId,
        riderId,
        driverId,
        driverName: useDriverStore.getState().driver?.firstName || 'Driver',
        rating,
        comment: comment || null,
        issues: selectedIssues,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update the trip with the rider rating
      await firestore().collection('trips').doc(tripId).update({
        riderRating: rating,
        riderReviewId: reviewRef.id,
        riderRatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update rider's average rating stats
      await updateRiderRatingStats(riderId);

      return true;
    } catch (error) {
      console.error('Error submitting rider rating:', error);
      return false;
    }
  };

  /**
   * Update rider's rating statistics after a new review
   */
  const updateRiderRatingStats = async (riderId: string) => {
    try {
      // Get all reviews for this rider
      const reviewsSnapshot = await firestore()
        .collection('riderReviews')
        .where('riderId', '==', riderId)
        .get();

      const reviews = reviewsSnapshot.docs;
      const totalReviews = reviews.length;

      if (totalReviews === 0) return;

      // Calculate average rating
      let totalRating = 0;
      reviews.forEach((doc) => {
        totalRating += doc.data().rating || 0;
      });

      const averageRating = totalRating / totalReviews;

      // Update user document with new rating
      await firestore().collection('users').doc(riderId).update({
        rating: Number(averageRating.toFixed(2)),
        totalRatings: totalReviews,
        lastRatedAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ Rider rating stats updated:', { averageRating, totalReviews });
    } catch (error) {
      console.error('Error updating rider rating stats:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const success = await submitRiderRating();

      if (success) {
        // Clear active ride/trip state
        clearActiveRide?.();
        clearCurrentTrip?.();

        // Navigate back to driver tabs
        router.replace('/(driver)/tabs');
      } else {
        Alert.alert('Error', 'Failed to submit rating. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Clear active ride/trip state
    clearActiveRide?.();
    clearCurrentTrip?.();

    // Navigate back to driver tabs
    router.replace('/(driver)/tabs');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading rider info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Ionicons name="close" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Rider</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Rider Card */}
        <View style={styles.riderCard}>
          {riderInfo.photo ? (
            <Image source={{ uri: riderInfo.photo }} style={styles.riderPhoto} />
          ) : (
            <Ionicons name="person-circle" size={80} color={Colors.primary} />
          )}
          <Text style={styles.riderName}>{riderInfo.name}</Text>
          {riderInfo.totalTrips > 0 && (
            <Text style={styles.riderStats}>
              {riderInfo.totalTrips} trips • {riderInfo.rating.toFixed(1)} rating
            </Text>
          )}
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} disabled={submitting}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= rating ? Colors.primary : Colors.gray[300]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Issues (if low rating) */}
        {rating > 0 && rating < 4 && (
          <View style={styles.issuesSection}>
            <Text style={styles.sectionTitle}>What went wrong?</Text>
            <View style={styles.issuesList}>
              {RIDER_ISSUES.map((issue) => (
                <TouchableOpacity
                  key={issue}
                  style={[
                    styles.issueChip,
                    selectedIssues.includes(issue) && styles.issueChipSelected,
                  ]}
                  onPress={() => toggleIssue(issue)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.issueText,
                      selectedIssues.includes(issue) && styles.issueTextSelected,
                    ]}
                  >
                    {issue}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Add a comment (optional)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Share more details about your experience..."
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.gray[400]}
            editable={!submitting}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (rating === 0 || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.submitText}>Submit Rating</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={submitting}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  riderCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  riderPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.sm,
  },
  riderName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.md,
  },
  riderStats: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  stars: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  issuesSection: { marginBottom: Spacing.xl },
  issuesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  issueChip: {
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  issueChipSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  issueText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  issueTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  commentSection: { marginBottom: Spacing.xl },
  commentInput: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.sm,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  submitText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  skipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
});
