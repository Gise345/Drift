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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

/**
 * DRIVER'S LICENSE UPLOAD
 * Screen 6 of registration
 * 
 * This pattern can be reused for:
 * - Insurance (screen 7)
 * - Registration Certificate (screen 8)
 * - Inspection Certificate (screen 9)
 */

export default function DriversLicense() {
  const router = useRouter();
  const { registrationData, updateRegistrationData, setRegistrationStep } = useDriverStore();

  // Initialize from saved data
  const savedLicense = registrationData?.documents?.license;

  const [frontImage, setFrontImage] = useState<string | null>(savedLicense?.front || null);
  const [backImage, setBackImage] = useState<string | null>(savedLicense?.back || null);

  const pickImage = async (side: 'front' | 'back', useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.9,
        })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.9,
        });

    if (!result.canceled && result.assets[0]) {
      if (side === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
    }
  };

  const showImageOptions = (side: 'front' | 'back') => {
    Alert.alert(
      'Add Document Photo',
      'Choose how to add your photo',
      [
        { text: 'Take Photo', onPress: () => pickImage(side, true) },
        { text: 'Choose from Gallery', onPress: () => pickImage(side, false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleContinue = () => {
    if (!frontImage || !backImage) {
      Alert.alert('Both sides required', 'Please upload both front and back of your license');
      return;
    }

    // Save to store in the correct format
    updateRegistrationData({
      documents: {
        license: {
          front: frontImage,
          back: backImage,
        },
      },
    });

    setRegistrationStep(7); // Moving to step 7 (insurance)
    router.push('/(driver)/registration/insurance');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver's License</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '35%' }]} />
        </View>
        <Text style={styles.progressText}>Step 5 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Driver's License</Text>
        <Text style={styles.subtitle}>
          Upload clear photos of both sides of your driver's license
        </Text>

        {/* Front Side */}
        <View style={styles.documentSection}>
          <Text style={styles.sectionLabel}>Front Side</Text>
          {frontImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: frontImage }} style={styles.documentImage} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => showImageOptions('front')}
              >
                <Ionicons name="camera" size={16} color={Colors.white} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => showImageOptions('front')}
            >
              <Ionicons name="camera-outline" size={40} color={Colors.gray[400]} />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back Side */}
        <View style={styles.documentSection}>
          <Text style={styles.sectionLabel}>Back Side</Text>
          {backImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: backImage }} style={styles.documentImage} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => showImageOptions('back')}
              >
                <Ionicons name="camera" size={16} color={Colors.white} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => showImageOptions('back')}
            >
              <Ionicons name="camera-outline" size={40} color={Colors.gray[400]} />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Requirements */}
        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>Photo Requirements:</Text>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.requirementText}>All text must be clearly readable</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.requirementText}>License must not be expired</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.requirementText}>No glare or shadows</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.requirementText}>Full document in frame</Text>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
          <Text style={styles.securityText}>
            Your documents are encrypted and stored securely. They will only be used for verification purposes.
          </Text>
        </View>

        <DriftButton
          title="Continue"
          onPress={handleContinue}
          disabled={!frontImage || !backImage}
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
    paddingBottom: Spacing['3xl'],
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
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  uploadBox: {
    height: 180,
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
    marginTop: Spacing.md,
  },
  imagePreview: {
    height: 180,
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
  requirementsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
  securityNote: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
});