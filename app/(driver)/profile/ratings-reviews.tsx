import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';

interface Review {
  id: string;
  riderName: string;
  riderPhoto: string;
  rating: number;
  comment: string;
  date: string;
  tripId: string;
}

export default function RatingsReviewsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | number>('all');
  
  const driverRating = {
    average: 4.9,
    total: 487,
    distribution: {
      5: 420,
      4: 52,
      3: 10,
      2: 3,
      1: 2,
    },
  };

  const reviews: Review[] = [
    {
      id: '1',
      riderName: 'Sarah Johnson',
      riderPhoto: '👩‍💼',
      rating: 5,
      comment: 'Excellent driver! Very professional and friendly. Smooth ride and on time.',
      date: '2024-11-04',
      tripId: 'T123',
    },
    {
      id: '2',
      riderName: 'Michael Chen',
      riderPhoto: '👨‍💻',
      rating: 5,
      comment: 'Great conversation and safe driving. Would recommend!',
      date: '2024-11-03',
      tripId: 'T122',
    },
    {
      id: '3',
      riderName: 'Emma Wilson',
      riderPhoto: '👩',
      rating: 4,
      comment: 'Good driver, arrived on time. Clean vehicle.',
      date: '2024-11-02',
      tripId: 'T121',
    },
  ];

  const filteredReviews = selectedFilter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === selectedFilter);

  const getPercentage = (count: number) => {
    return Math.round((count / driverRating.total) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Ratings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Overall Rating */}
        <View style={styles.overallSection}>
          <Text style={styles.averageRating}>{driverRating.average}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(driverRating.average) ? 'star' : 'star-outline'}
                size={24}
                color={Colors.warning}
              />
            ))}
          </View>
          <Text style={styles.totalRatings}>{driverRating.total} total ratings</Text>
        </View>

        {/* Rating Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Distribution</Text>
          <View style={styles.distributionCard}>
            {[5, 4, 3, 2, 1].map((stars) => (
              <TouchableOpacity
                key={stars}
                style={styles.distributionRow}
                onPress={() => setSelectedFilter(selectedFilter === stars ? 'all' : stars)}
              >
                <View style={styles.starsLabel}>
                  <Text style={styles.starsText}>{stars}</Text>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                </View>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        width: `${getPercentage(driverRating.distribution[stars as keyof typeof driverRating.distribution])}%`,
                        backgroundColor: selectedFilter === stars ? Colors.primary : Colors.success
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.countText}>
                  {driverRating.distribution[stars as keyof typeof driverRating.distribution]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
                All Reviews
              </Text>
            </TouchableOpacity>
            {[5, 4, 3, 2, 1].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[styles.filterChip, selectedFilter === rating && styles.filterChipActive]}
                onPress={() => setSelectedFilter(rating)}
              >
                <Ionicons name="star" size={14} color={selectedFilter === rating ? Colors.white : Colors.warning} />
                <Text style={[styles.filterText, selectedFilter === rating && styles.filterTextActive]}>
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reviews List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === 'all' ? 'Recent Reviews' : `${selectedFilter}-Star Reviews`}
          </Text>
          {filteredReviews.map((review) => (
            <TouchableOpacity
              key={review.id}
              style={styles.reviewCard}
              onPress={() => router.push({
                pathname: '/(driver)/profile/review-detail',
                params: { reviewId: review.id }
              })}
            >
              <View style={styles.reviewHeader}>
                <View style={styles.riderInfo}>
                  <Text style={styles.riderPhoto}>{review.riderPhoto}</Text>
                  <View>
                    <Text style={styles.riderName}>{review.riderName}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.ratingText}>{review.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <TouchableOpacity
                style={styles.viewTripButton}
                onPress={() => router.push({
                  pathname: '/(driver)/history/trip-detail',
                  params: { tripId: review.tripId }
                })}
              >
                <Text style={styles.viewTripText}>View Trip</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  overallSection: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  averageRating: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  totalRatings: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  distributionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  starsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
    gap: 4,
  },
  starsText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  countText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  filterSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginRight: Spacing.xs,
    gap: 4,
    ...Colors.shadow,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.white,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Colors.shadow,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderPhoto: {
    fontSize: 40,
    marginRight: Spacing.sm,
  },
  riderName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  reviewDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.warning}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
  },
  reviewComment: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  viewTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewTripText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
});