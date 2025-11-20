import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import {
  getDriverRatingStats,
  getDriverReviews,
  DriverRatingStats,
  Review,
} from '@/src/services/rating.service';

export default function Feedback() {
  const router = useRouter();
  const { driver } = useDriverStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<DriverRatingStats>({
    average: 5.0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  useEffect(() => {
    loadFeedback();
  }, [driver?.id]);

  const loadFeedback = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const [stats, reviews] = await Promise.all([
        getDriverRatingStats(driver.id),
        getDriverReviews(driver.id, undefined, 20),
      ]);

      setRatingStats(stats);
      setFeedbackList(reviews);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedback();
    setRefreshing(false);
  };

  const averageRating = ratingStats.average.toFixed(1);
  const ratingDistribution = ratingStats.distribution;

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? Colors.primary : Colors.gray[300]}
          />
        ))}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rider Feedback</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.gray[600] }}>
            Loading feedback...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rider Feedback</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Rating Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.averageSection}>
            <Text style={styles.averageRating}>{averageRating}</Text>
            <View style={styles.averageStars}>
              {renderStars(parseFloat(averageRating))}
            </View>
            <Text style={styles.totalReviews}>{ratingStats.total} reviews</Text>
          </View>

          <View style={styles.distributionSection}>
            {[5, 4, 3, 2, 1].map((stars) => (
              <View key={stars} style={styles.distributionRow}>
                <Text style={styles.distributionLabel}>{stars}</Text>
                <Ionicons name="star" size={14} color={Colors.gray[600]} />
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionFill,
                      {
                        width: ratingStats.total > 0
                          ? `${(ratingDistribution[stars as keyof typeof ratingDistribution] / ratingStats.total) * 100}%`
                          : '0%',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distributionCount}>
                  {ratingDistribution[stars as keyof typeof ratingDistribution]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips for Better Ratings */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color={Colors.primary} />
            <Text style={styles.tipsTitle}>Tips for Better Ratings</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.tipText}>Keep your vehicle clean</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.tipText}>Arrive on time</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.tipText}>Be professional and friendly</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.tipText}>Follow the best routes</Text>
            </View>
          </View>
        </View>

        {/* Recent Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Feedback</Text>

          {feedbackList.map((feedback) => (
            <TouchableOpacity
              key={feedback.id}
              style={styles.feedbackCard}
              onPress={() => router.push(`/(driver)/history/trip-detail?id=${feedback.tripId}`)}
            >
              <View style={styles.feedbackHeader}>
                <View style={styles.riderInfo}>
                  <Ionicons name="person-circle" size={40} color={Colors.primary} />
                  <View style={styles.riderDetails}>
                    <Text style={styles.riderName}>{feedback.riderName}</Text>
                    <Text style={styles.feedbackDate}>
                      {feedback.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.ratingBox}>
                  {renderStars(feedback.rating)}
                  <Text style={styles.ratingNumber}>{feedback.rating}.0</Text>
                </View>
              </View>

              {feedback.comment && (
                <View style={styles.commentBox}>
                  <Ionicons name="chatbox-ellipses-outline" size={16} color={Colors.gray[600]} />
                  <Text style={styles.commentText}>{feedback.comment}</Text>
                </View>
              )}

              <View style={styles.feedbackFooter}>
                <Text style={styles.tripId}>Trip ID: {feedback.tripId}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />
              </View>
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
    backgroundColor: Colors.white,
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
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.xl,
    margin: Spacing.xl,
  },
  averageSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.gray[200],
    paddingRight: Spacing.lg,
  },
  averageRating: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  averageStars: {
    marginBottom: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  totalReviews: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  distributionSection: {
    flex: 1,
    paddingLeft: Spacing.lg,
    justifyContent: 'center',
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  distributionLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    width: 12,
    marginRight: 4,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    width: 20,
    textAlign: 'right',
  },
  tipsCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 16,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  tipsList: {},
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  section: {
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  feedbackCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderDetails: {
    marginLeft: Spacing.md,
  },
  riderName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  feedbackDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  ratingBox: {
    alignItems: 'flex-end',
  },
  ratingNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 2,
  },
  commentBox: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  commentText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripId: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
});