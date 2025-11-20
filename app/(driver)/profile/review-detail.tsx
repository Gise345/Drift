import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { getReviewById, Review } from '@/src/services/rating.service';

export default function ReviewDetailScreen() {
  const { reviewId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReview();
  }, [reviewId]);

  const loadReview = async () => {
    if (!reviewId || typeof reviewId !== 'string') return;

    try {
      setLoading(true);
      const reviewData = await getReviewById(reviewId);
      setReview(reviewData);
    } catch (error) {
      console.error('Error loading review:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.gray[600] }}>
            Loading review...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!review) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: Colors.gray[600] }}>Review not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.black} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Review Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.riderCard}>
            <Text style={styles.riderPhoto}>{review.riderPhoto || '👤'}</Text>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{review.riderName}</Text>
              <Text style={styles.reviewDate}>{review.createdAt.toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={32} color={Colors.warning} />
              ))}
            </View>
            <Text style={styles.ratingText}>{review.rating} out of 5</Text>
          </View>

          {review.comment && (
            <View style={styles.commentCard}>
              <Text style={styles.commentTitle}>Comment</Text>
              <Text style={styles.commentText}>"{review.comment}"</Text>
            </View>
          )}

          {review.tags && review.tags.length > 0 && (
            <View style={styles.commentCard}>
              <Text style={styles.commentTitle}>Tags</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {review.tags.map((tag, index) => (
                  <View key={index} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primary + '20', borderRadius: 16 }}>
                    <Text style={{ fontSize: 12, color: Colors.gray[700] }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.viewTripButton}
            onPress={() => router.push({ pathname: '/(driver)/history/trip-detail', params: { tripId: review.tripId } })}
          >
            <Text style={styles.viewTripText}>View Trip Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.black },
  content: { padding: Spacing.md },
  riderCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.gray[50], borderRadius: 12, marginBottom: Spacing.md },
  riderPhoto: { fontSize: 56, marginRight: Spacing.md },
  riderInfo: { flex: 1 },
  riderName: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.black, marginBottom: 4 },
  reviewDate: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.gray[600] },
  ratingContainer: { alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.gray[50], borderRadius: 12, marginBottom: Spacing.md },
  starsRow: { flexDirection: 'row', gap: 4, marginBottom: Spacing.xs },
  ratingText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semibold, color: Colors.gray[700] },
  commentCard: { backgroundColor: Colors.gray[50], borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md },
  commentTitle: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.black, marginBottom: Spacing.xs },
  commentText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, color: Colors.gray[700], lineHeight: 24, fontStyle: 'italic' },
  viewTripButton: { backgroundColor: Colors.primary, borderRadius: 12, padding: Spacing.md, alignItems: 'center' },
  viewTripText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.black },
});