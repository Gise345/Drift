import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { uploadDocumentImmediately } from '@/src/services/driver-registration.service';

export default function Inspection() {
  const router = useRouter();
  const { registrationData, updateRegistrationData, setRegistrationStep } = useDriverStore();
  const { user } = useAuthStore();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(driver)/registration/registration-cert');
    }
  };

  // Initialize from saved data
  const savedInspection = registrationData?.documents?.inspection;

  const [inspectionImage, setInspectionImage] = useState<string | null>(savedInspection?.image || null);
  const [skipInspection, setSkipInspection] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to upload documents');
      return;
    }

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setSkipInspection(false);
      setIsUploading(true);

      try {
        // Upload immediately to Firebase Storage
        const firebaseUrl = await uploadDocumentImmediately(user.id, 'inspection', localUri);
        setInspectionImage(firebaseUrl);

        // Save to registration data immediately
        updateRegistrationData({
          documents: {
            inspection: {
              image: firebaseUrl,
            },
          },
        });

        console.log('✅ Inspection document uploaded and saved');
      } catch (error) {
        console.error('❌ Error uploading inspection:', error);
        Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
        setInspectionImage(localUri); // Keep local URI as fallback
      } finally {
        setIsUploading(false);
      }
    }
  };

  const showImageOptions = () => {
    Alert.alert('Add Inspection Certificate', 'Choose how to add your photo', [
      { text: 'Take Photo', onPress: () => pickImage(true) },
      { text: 'Choose from Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleContinue = () => {
    if (!inspectionImage && !skipInspection) {
      Alert.alert(
        'Inspection Required',
        'Please upload inspection certificate or indicate if not required for your vehicle',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isUploading) {
      Alert.alert('Please wait', 'Document is still uploading. Please wait for it to finish.');
      return;
    }

    // Document is already saved during upload (if uploaded), just move to next step
    setRegistrationStep(10); // Moving to step 10 (bank-details) - background check removed
    router.push('/(driver)/registration/bank-details');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Inspection</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '57%' }]} />
        </View>
        <Text style={styles.progressText}>Step 8 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Safety Inspection</Text>
        <Text style={styles.subtitle}>
          Upload your vehicle safety inspection certificate (if required)
        </Text>

        {/* Inspection Document */}
        <View style={styles.documentSection}>
          <Text style={styles.sectionLabel}>Inspection Certificate</Text>
          {isUploading ? (
            <View style={styles.uploadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : inspectionImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: inspectionImage }} style={styles.documentImage} />
              <TouchableOpacity style={styles.retakeButton} onPress={showImageOptions}>
                <Ionicons name="camera" size={16} color={Colors.white} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={showImageOptions}>
              <Ionicons name="camera-outline" size={40} color={Colors.gray[400]} />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Skip Option */}
        <TouchableOpacity
          style={styles.skipOption}
          onPress={() => setSkipInspection(!skipInspection)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, skipInspection && styles.checkboxChecked]}>
            {skipInspection && <Ionicons name="checkmark" size={18} color={Colors.white} />}
          </View>
          <Text style={styles.skipText}>
            My vehicle doesn't require inspection (newer vehicles)
          </Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>When is inspection required?</Text>
            <Text style={styles.infoText}>
              • Vehicles older than 5 years{'\n'}
              • Commercial use vehicles{'\n'}
              • Vehicles modified from original specifications{'\n'}
              • As required by Cayman Islands regulations
            </Text>
          </View>
        </View>

        {/* Requirements (if uploading) */}
        {!skipInspection && (
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Inspection Requirements:</Text>
            <View style={styles.requirementRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.requirementText}>Valid Cayman Islands safety inspection</Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.requirementText}>Not expired</Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.requirementText}>All inspection items passed</Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.requirementText}>Clearly legible in photo</Text>
            </View>
          </View>
        )}

        <DriftButton
          title="Continue"
          onPress={handleContinue}
          disabled={!inspectionImage && !skipInspection}
          variant="black"
          icon={<Ionicons name="arrow-forward" size={20} color="white" />}
        />
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
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  documentSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  uploadBox: {
    height: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.gray[300],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
  },
  uploadText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.sm,
  },
  uploadingBox: {
    height: 140,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
  },
  uploadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  imagePreview: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.gray[100],
  },
  documentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  retakeButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black + 'CC',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  retakeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  skipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  skipText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  requirementsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  requirementsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  requirementText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    flex: 1,
  },
});