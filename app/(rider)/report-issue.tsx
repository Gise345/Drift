/**
 * Report Issue Screen
 * Allows riders to report issues with their trip
 */

import React, { useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { useAuthStore } from '@/src/stores/auth-store';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

const ISSUE_TYPES = {
  driver_behavior: {
    title: 'Driver Behavior',
    icon: 'person-outline',
    description: 'Report issues with driver conduct or behavior',
    options: [
      'Rude or unprofessional behavior',
      'Unsafe driving',
      'Driver was on phone while driving',
      'Driver took wrong route intentionally',
      'Driver made inappropriate comments',
      'Driver refused to follow directions',
    ],
  },
  fare_issue: {
    title: 'Fare Issue',
    icon: 'cash-outline',
    description: 'Report problems with your Trip Contribution',
    options: [
      'Charged more than expected',
      'Charged for a cancelled trip',
      'Tip was incorrect',
      'Charged for tolls incorrectly',
      'Payment method issue',
      'Refund not received',
    ],
  },
  safety_concern: {
    title: 'Safety Concern',
    icon: 'shield-outline',
    description: 'Report safety-related issues',
    options: [
      'Vehicle condition was unsafe',
      'Driver appeared impaired',
      'Felt unsafe during the trip',
      'Accident or incident occurred',
      'Driver identity did not match app',
      'Vehicle did not match app',
    ],
  },
  other: {
    title: 'Other Issue',
    icon: 'help-circle-outline',
    description: 'Report any other issues',
    options: [
      'Lost item in vehicle',
      'Route issue',
      'App malfunction',
      'Driver did not arrive',
      'Long wait time',
      'Other',
    ],
  },
};

export default function ReportIssueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tripId, issueType, driverName } = useLocalSearchParams();
  const { user } = useAuthStore();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualTripId, setManualTripId] = useState((tripId as string) || '');

  const issueConfig = ISSUE_TYPES[issueType as keyof typeof ISSUE_TYPES] || ISSUE_TYPES.other;

  const handleSubmit = async () => {
    if (!selectedOption) {
      Alert.alert('Select an Issue', 'Please select what happened during your trip.');
      return;
    }

    if (!manualTripId.trim()) {
      Alert.alert('Trip ID Required', 'Please enter your Trip ID to submit the report.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save report to Firestore using modular API
      const supportTicketsRef = collection(db, 'support_tickets');
      await addDoc(supportTicketsRef, {
        tripId: manualTripId.trim(),
        riderId: user?.uid,
        riderEmail: user?.email,
        driverName: driverName as string,
        issueType: issueType as string,
        issueCategory: issueConfig.title,
        selectedOption,
        additionalDetails: additionalDetails.trim(),
        status: 'open',
        priority: issueType === 'safety_concern' ? 'high' : 'normal',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our support team will review it and get back to you within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 80 }}
      >
        {/* Issue Type Header */}
        <View style={styles.issueHeader}>
          <View style={styles.issueIconContainer}>
            <Ionicons name={issueConfig.icon as any} size={28} color="#5d1289" />
          </View>
          <View style={styles.issueInfo}>
            <Text style={styles.issueTitle}>{issueConfig.title}</Text>
            <Text style={styles.issueDescription}>{issueConfig.description}</Text>
          </View>
        </View>

        {/* Trip ID Input */}
        <View style={styles.tripIdSection}>
          <View style={styles.tripIdHelpNote}>
            <Ionicons name="information-circle-outline" size={18} color="#5d1289" />
            <Text style={styles.tripIdHelpText}>
              To find your Trip ID: Go to the Activity tab, select the trip, and look for the ID in the top right corner.
            </Text>
          </View>
          <Text style={styles.inputLabel}>Trip ID</Text>
          <TextInput
            style={styles.tripIdInput}
            placeholder="Enter your Trip ID"
            placeholderTextColor="#9CA3AF"
            value={manualTripId}
            onChangeText={setManualTripId}
            autoCapitalize="characters"
          />
          {driverName && (
            <View style={styles.driverInfo}>
              <Text style={styles.driverInfoText}>Driver: {driverName}</Text>
            </View>
          )}
        </View>

        {/* Options */}
        <Text style={styles.sectionTitle}>What happened?</Text>
        <View style={styles.optionsContainer}>
          {issueConfig.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOption === option && styles.optionButtonSelected,
              ]}
              onPress={() => setSelectedOption(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === option && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
              {selectedOption === option && (
                <Ionicons name="checkmark-circle" size={20} color="#5d1289" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Details */}
        <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Please provide any additional information that might help us investigate..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
          textAlignVertical="top"
        />

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color="#6B7280" />
          <Text style={styles.infoNoteText}>
            Your report will be reviewed by our support team. For urgent safety concerns, please contact local authorities.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.submitButton, (!selectedOption || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!selectedOption || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  issueIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  issueInfo: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  issueDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  tripIdSection: {
    marginTop: 16,
  },
  tripIdHelpNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E8FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  tripIdHelpText: {
    flex: 1,
    fontSize: 13,
    color: '#5d1289',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  tripIdInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  driverInfo: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  driverInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 24,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    borderColor: '#5d1289',
    backgroundColor: '#F3E8FF',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  optionTextSelected: {
    color: '#5d1289',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5d1289',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
