/**
 * APPEAL STRIKE SCREEN
 * Allows drivers to submit appeals for strikes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';
import { useSafetyStore } from '@/src/stores/safety-store';
import { useDriverStore } from '@/src/stores/driver-store';
import { getDriverStrikes, STRIKE_CONSTANTS } from '@/src/services/strikeService';
import { Strike } from '@/src/types/safety.types';

export default function AppealStrikeScreen() {
  const router = useRouter();
  const { strikeId } = useLocalSearchParams<{ strikeId: string }>();
  const { submitStrikeAppeal } = useSafetyStore();
  const { driver } = useDriverStore();

  const [strike, setStrike] = useState<Strike | null>(null);
  const [reason, setReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStrike();
  }, [strikeId, driver?.id]);

  const loadStrike = async () => {
    if (!driver?.id || !strikeId) return;

    setLoading(true);
    try {
      const strikes = await getDriverStrikes(driver.id, true);
      const foundStrike = strikes.find((s) => s.id === strikeId);
      setStrike(foundStrike || null);
    } catch (error) {
      console.error('Failed to load strike:', error);
    }
    setLoading(false);
  };

  const pickImage = async () => {
    if (evidenceImages.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - evidenceImages.length,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setEvidenceImages([...evidenceImages, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setEvidenceImages(evidenceImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please select a reason for your appeal.');
      return;
    }

    if (!additionalInfo.trim() || additionalInfo.length < 50) {
      Alert.alert('Required', 'Please provide a detailed explanation (at least 50 characters).');
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Upload images to Firebase Storage and get URLs
      const evidenceUrls: string[] = []; // Would contain uploaded image URLs

      const result = await submitStrikeAppeal(
        strikeId || '',
        `${reason}: ${additionalInfo}`,
        evidenceUrls
      );

      if (result.success) {
        Alert.alert(
          'Appeal Submitted',
          'Your appeal has been submitted and will be reviewed within 48 hours. You will be notified of the decision.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit appeal. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit appeal:', error);
      Alert.alert('Error', 'Failed to submit appeal. Please try again.');
    }

    setSubmitting(false);
  };

  const getDaysUntilExpiry = (expiresAt: Date): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const appealReasons = [
    { id: 'incorrect', label: 'The violation was recorded incorrectly' },
    { id: 'circumstances', label: 'There were extenuating circumstances' },
    { id: 'safety', label: 'I took action for safety reasons' },
    { id: 'technical', label: 'Technical/GPS error' },
    { id: 'other', label: 'Other reason' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!strike) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Strike not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appeal Strike</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Strike Info */}
        <View style={styles.strikeCard}>
          <View style={styles.strikeHeader}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text style={styles.strikeType}>
              {strike.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
          </View>
          <Text style={styles.strikeReason}>{strike.reason}</Text>
          <View style={styles.strikeDetails}>
            <Text style={styles.strikeDetail}>
              Issued: {new Date(strike.issuedAt).toLocaleDateString()}
            </Text>
            <Text style={styles.strikeDetail}>
              Expires in {getDaysUntilExpiry(strike.expiresAt)} days
            </Text>
          </View>
        </View>

        {/* Appeal Window Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="time-outline" size={20} color="#F59E0B" />
          <Text style={styles.noticeText}>
            Appeals must be submitted within {STRIKE_CONSTANTS.APPEAL_WINDOW_DAYS} days of the strike being issued.
            Your appeal will be reviewed within 48 hours.
          </Text>
        </View>

        {/* Reason Selection */}
        <Text style={styles.sectionTitle}>Reason for Appeal *</Text>
        <View style={styles.reasonsContainer}>
          {appealReasons.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.reasonOption,
                reason === item.label && styles.reasonOptionSelected,
              ]}
              onPress={() => setReason(item.label)}
            >
              <Ionicons
                name={reason === item.label ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={reason === item.label ? Colors.primary : '#666666'}
              />
              <Text
                style={[
                  styles.reasonText,
                  reason === item.label && styles.reasonTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Information */}
        <Text style={styles.sectionTitle}>Explain Your Situation *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Provide a detailed explanation of why you believe this strike should be removed..."
          placeholderTextColor="#666666"
          value={additionalInfo}
          onChangeText={setAdditionalInfo}
          multiline
          numberOfLines={6}
          maxLength={1000}
        />
        <Text style={styles.charCount}>{additionalInfo.length}/1000 characters (min 50)</Text>

        {/* Evidence Upload */}
        <Text style={styles.sectionTitle}>Supporting Evidence (Optional)</Text>
        <Text style={styles.sectionSubtitle}>
          Upload screenshots, photos, or other evidence to support your appeal
        </Text>

        <View style={styles.imagesContainer}>
          {evidenceImages.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.evidenceImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          {evidenceImages.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="add" size={32} color="#666666" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Appeal Guidelines</Text>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.guidelineText}>Be honest and provide accurate information</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.guidelineText}>Include relevant details about the incident</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.guidelineText}>Provide evidence if available</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={styles.guidelineText}>False information may result in additional penalties</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Appeal</Text>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  strikeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  strikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  strikeType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  strikeReason: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  strikeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strikeDetail: {
    color: '#666666',
    fontSize: 12,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    color: '#999999',
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  reasonsContainer: {
    marginBottom: Spacing.lg,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  reasonOptionSelected: {
    backgroundColor: 'rgba(93, 18, 137, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reasonText: {
    color: '#CCCCCC',
    fontSize: 14,
    flex: 1,
  },
  reasonTextSelected: {
    color: '#FFFFFF',
  },
  textArea: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: Spacing.xs,
  },
  charCount: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: Spacing.lg,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  imageWrapper: {
    position: 'relative',
  },
  evidenceImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },
  guidelinesCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  guidelinesTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  guidelineText: {
    color: '#CCCCCC',
    fontSize: 13,
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
