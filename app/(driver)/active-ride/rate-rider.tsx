import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function RateRider() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  const issues = [
    'Late to pickup',
    'Rude behavior',
    'Changed destination',
    'Left trash',
    'Too many stops',
    'Wrong address',
  ];

  const toggleIssue = (issue: string) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  const handleSubmit = () => {
    router.replace('/(driver)/tabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Rider</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.riderCard}>
          <Ionicons name="person-circle" size={80} color={Colors.primary} />
          <Text style={styles.riderName}>Sarah Miller</Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
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
              {issues.map((issue) => (
                <TouchableOpacity
                  key={issue}
                  style={[
                    styles.issueChip,
                    selectedIssues.includes(issue) && styles.issueChipSelected,
                  ]}
                  onPress={() => toggleIssue(issue)}
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
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0}
        >
          <Text style={styles.submitText}>Submit Rating</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSubmit}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  riderName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.md,
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