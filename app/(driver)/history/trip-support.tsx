import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';

export default function TripSupportScreen() {
  const { tripId } = useLocalSearchParams();
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');

  const issues = [
    { id: 'payment', label: 'Payment Issue', icon: 'card' },
    { id: 'rider', label: 'Rider Behavior', icon: 'person' },
    { id: 'route', label: 'Route Problem', icon: 'navigate' },
    { id: 'accident', label: 'Accident/Incident', icon: 'alert-circle' },
    { id: 'item', label: 'Lost Item', icon: 'briefcase' },
    { id: 'other', label: 'Other Issue', icon: 'help-circle' },
  ];

  const handleSubmit = () => {
    if (!selectedIssue || !description) {
      Alert.alert('Required', 'Please select an issue and provide details');
      return;
    }
    // TODO: Submit to Firebase
    Alert.alert('Submitted', 'Your report has been submitted. We\'ll contact you soon.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Issue</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What happened?</Text>
          <View style={styles.issuesGrid}>
            {issues.map((issue) => (
              <TouchableOpacity
                key={issue.id}
                style={[
                  styles.issueCard,
                  selectedIssue === issue.id && styles.issueCardSelected
                ]}
                onPress={() => setSelectedIssue(issue.id)}
              >
                <Ionicons 
                  name={issue.icon as any} 
                  size={24} 
                  color={selectedIssue === issue.id ? Colors.primary : Colors.gray[600]} 
                />
                <Text style={[
                  styles.issueLabel,
                  selectedIssue === issue.id && styles.issueLabelSelected
                ]}>
                  {issue.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe the issue</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Please provide details about what happened..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: { padding: Spacing.xs },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  placeholder: { width: 40 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  issuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  issueCard: {
    width: '48%',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  issueCardSelected: {
    backgroundColor: `${Colors.primary}15`,
    borderColor: Colors.primary,
  },
  issueLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  issueLabelSelected: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  textArea: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    minHeight: 150,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  submitText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
});