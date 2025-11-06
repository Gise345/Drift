import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function ReviewDetailScreen() {
  const { reviewId } = useLocalSearchParams();

  const review = {
    id: reviewId,
    riderName: 'Sarah Johnson',
    riderPhoto: '👩‍💼',
    rating: 5,
    comment: 'Excellent driver! Very professional and friendly. The car was clean and the ride was smooth. Would definitely recommend!',
    date: '2024-11-04',
    tripId: 'T123',
  };

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
            <Text style={styles.riderPhoto}>{review.riderPhoto}</Text>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{review.riderName}</Text>
              <Text style={styles.reviewDate}>{new Date(review.date).toLocaleDateString()}</Text>
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

          <View style={styles.commentCard}>
            <Text style={styles.commentTitle}>Comment</Text>
            <Text style={styles.commentText}>"{review.comment}"</Text>
          </View>

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