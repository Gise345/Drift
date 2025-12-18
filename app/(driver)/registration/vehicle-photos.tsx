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
import { uploadVehiclePhotoImmediately } from '@/src/services/driver-registration.service';

type PhotoType = 'front' | 'back' | 'leftSide' | 'rightSide' | 'interior';

interface Photo {
  uri: string;
  type: PhotoType;
}

export default function VehiclePhotos() {
  const router = useRouter();
  const { registrationData, updateRegistrationData, setRegistrationStep } = useDriverStore();
  const { user } = useAuthStore();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(driver)/registration/vehicle-info');
    }
  };

  // Initialize from saved data
  const savedPhotos = registrationData?.vehicle?.photos;

  const [photos, setPhotos] = useState<Record<PhotoType, string | null>>({
    front: savedPhotos?.front || null,
    back: savedPhotos?.back || null,
    leftSide: savedPhotos?.leftSide || null,
    rightSide: savedPhotos?.rightSide || null,
    interior: savedPhotos?.interior || null,
  });

  // Track which photos are currently uploading
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<PhotoType, boolean>>({
    front: false,
    back: false,
    leftSide: false,
    rightSide: false,
    interior: false,
  });

  const photoLabels: Record<PhotoType, string> = {
    front: 'Front View',
    back: 'Back View',
    leftSide: 'Left Side',
    rightSide: 'Right Side',
    interior: 'Interior',
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  const pickImage = async (type: PhotoType, useCamera: boolean) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to upload photos');
      return;
    }

    if (useCamera) {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;

      // Show uploading state
      setUploadingPhotos(prev => ({ ...prev, [type]: true }));

      try {
        // Upload immediately to Firebase Storage
        const firebaseUrl = await uploadVehiclePhotoImmediately(user.id, type, localUri);

        // Save the Firebase URL (not local URI) so it persists across sessions
        setPhotos(prev => ({
          ...prev,
          [type]: firebaseUrl,
        }));

        // Also save to registration data immediately
        updateRegistrationData({
          vehicle: {
            ...useDriverStore.getState().registrationData.vehicle!,
            photos: {
              ...useDriverStore.getState().registrationData.vehicle?.photos,
              [type]: firebaseUrl,
            },
          },
        });

        console.log(`✅ Vehicle ${type} photo uploaded and saved`);
      } catch (error) {
        console.error(`❌ Error uploading ${type} photo:`, error);
        Alert.alert('Upload Failed', 'Failed to upload photo. Please try again.');
        // Keep the local URI as fallback so user can see the image
        setPhotos(prev => ({
          ...prev,
          [type]: localUri,
        }));
      } finally {
        setUploadingPhotos(prev => ({ ...prev, [type]: false }));
      }
    }
  };

  const showImageOptions = (type: PhotoType) => {
    Alert.alert(
      'Add Photo',
      'Choose how to add your photo',
      [
        { text: 'Take Photo', onPress: () => pickImage(type, true) },
        { text: 'Choose from Gallery', onPress: () => pickImage(type, false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const allPhotosUploaded = Object.values(photos).every(photo => photo !== null);
  const anyPhotoUploading = Object.values(uploadingPhotos).some(uploading => uploading);

  const handleContinue = () => {
    if (!allPhotosUploaded) {
      Alert.alert('All photos required', 'Please upload all 5 vehicle photos to continue');
      return;
    }

    if (anyPhotoUploading) {
      Alert.alert('Please wait', 'Photos are still uploading. Please wait for them to finish.');
      return;
    }

    // Photos are already saved to registration data during upload, just move to next step
    setRegistrationStep(6); // Moving to step 6 (drivers-license)
    router.push('/(driver)/registration/drivers-license');
  };

  const renderPhotoCard = (type: PhotoType) => (
    <View key={type} style={styles.photoCard}>
      <Text style={styles.photoLabel}>{photoLabels[type]}</Text>

      {uploadingPhotos[type] ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      ) : photos[type] ? (
        <View style={styles.photoPreview}>
          <Image source={{ uri: photos[type]! }} style={styles.photoImage} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => showImageOptions(type)}
          >
            <Ionicons name="camera" size={16} color={Colors.white} />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => showImageOptions(type)}
        >
          <Ionicons name="camera-outline" size={32} color={Colors.gray[400]} />
          <Text style={styles.uploadText}>Add Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Photos</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '28%' }]} />
        </View>
        <Text style={styles.progressText}>Step 4 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Vehicle Photos</Text>
        <Text style={styles.subtitle}>
          Upload clear photos of your vehicle from all angles
        </Text>

        {/* Progress Indicator */}
        <View style={styles.progressIndicator}>
          <Text style={styles.progressLabel}>
            {Object.values(photos).filter(p => p !== null).length} of 5 photos uploaded
          </Text>
        </View>

        {/* Photo Cards */}
        {(Object.keys(photos) as PhotoType[]).map(renderPhotoCard)}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Photo Tips:</Text>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.tipText}>Take photos in good lighting</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.tipText}>Show entire vehicle in frame</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.tipText}>Make sure license plate is visible</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.tipText}>Vehicle should be clean</Text>
          </View>
        </View>

        <DriftButton
          title="Continue"
          onPress={handleContinue}
          disabled={!allPhotosUploaded}
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
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  progressIndicator: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
  },
  photoCard: {
    marginBottom: Spacing.lg,
  },
  photoLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  uploadButton: {
    height: 160,
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
  uploadingContainer: {
    height: 160,
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
  photoPreview: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
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
  tipsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  tipsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    flex: 1,
  },
});