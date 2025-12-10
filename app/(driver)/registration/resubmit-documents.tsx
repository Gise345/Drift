/**
 * Document Resubmission Screen
 * Allows drivers to resubmit rejected documents
 *
 * Features:
 * - Shows only rejected documents that need resubmission
 * - Upload new document images
 * - Clear rejection reasons displayed
 * - Submit for re-review
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

// Initialize Firebase
const app = getApp();
const db = getFirestore(app, 'main');
const storageRef = storage();

// Document type display names and info
const DOCUMENT_INFO: Record<string, { title: string; description: string; hasBack?: boolean }> = {
  driversLicense: {
    title: "Driver's License",
    description: 'Upload front and back of your valid driver\'s license',
    hasBack: true,
  },
  insurance: {
    title: 'Vehicle Insurance',
    description: 'Upload your current vehicle insurance document',
  },
  registration: {
    title: 'Vehicle Registration',
    description: 'Upload your vehicle registration certificate',
  },
  inspection: {
    title: 'Safety Inspection',
    description: 'Upload your vehicle safety inspection certificate',
  },
};

interface DocumentStatus {
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
  rejectionReason?: string;
}

interface DocumentUpload {
  front?: string;
  back?: string;
}

export default function ResubmitDocuments() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documentsNeedingResubmission, setDocumentsNeedingResubmission] = useState<string[]>([]);
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, DocumentStatus>>({});
  const [newUploads, setNewUploads] = useState<Record<string, DocumentUpload>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      const driverRef = doc(db, 'drivers', user.id);
      const driverDoc = await getDoc(driverRef);

      if (!driverDoc.exists()) {
        Alert.alert('Error', 'Driver profile not found');
        router.back();
        return;
      }

      const data = driverDoc.data() as any;
      if (!data) {
        Alert.alert('Error', 'Driver profile data not found');
        router.back();
        return;
      }

      // Get documents needing resubmission
      const needsResubmission = data.documentsNeedingResubmission || [];
      setDocumentsNeedingResubmission(needsResubmission);

      // Get document statuses with rejection reasons
      const statuses: Record<string, DocumentStatus> = {};
      if (data.documents) {
        Object.entries(data.documents).forEach(([key, value]: [string, any]) => {
          if (needsResubmission.includes(key)) {
            statuses[key] = {
              status: value.status,
              rejectionReason: value.rejectionReason,
            };
          }
        });
      }
      setDocumentStatuses(statuses);

      if (needsResubmission.length === 0) {
        Alert.alert('No Documents to Resubmit', 'All your documents are either approved or pending review.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (docType: string, side: 'front' | 'back') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewUploads((prev) => ({
          ...prev,
          [docType]: {
            ...prev[docType],
            [side]: result.assets[0].uri,
          },
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const takePhoto = async (docType: string, side: 'front' | 'back') => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewUploads((prev) => ({
          ...prev,
          [docType]: {
            ...prev[docType],
            [side]: result.assets[0].uri,
          },
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = (docType: string, side: 'front' | 'back') => {
    Alert.alert('Upload Document', 'Choose an option', [
      { text: 'Take Photo', onPress: () => takePhoto(docType, side) },
      { text: 'Choose from Library', onPress: () => pickImage(docType, side) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadDocumentImage = async (userId: string, docType: string, imageUri: string, side?: string): Promise<string> => {
    const filename = side
      ? `${docType}_${side}_resubmit_${Date.now()}.jpg`
      : `${docType}_resubmit_${Date.now()}.jpg`;

    const path = `drivers/${userId}/documents/${filename}`;
    const reference = storageRef.ref(path);

    await reference.putFile(imageUri);
    return await reference.getDownloadURL();
  };

  const isReadyToSubmit = (): boolean => {
    // Check if all required documents have been uploaded
    for (const docType of documentsNeedingResubmission) {
      const info = DOCUMENT_INFO[docType];
      const uploads = newUploads[docType];

      if (!uploads?.front) return false;
      if (info?.hasBack && !uploads?.back) return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isReadyToSubmit()) {
      Alert.alert('Missing Documents', 'Please upload all required documents before submitting.');
      return;
    }

    Alert.alert(
      'Submit Documents',
      'Are you sure you want to submit these documents for review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const userId = user?.id;
              if (!userId) throw new Error('User not found');

              // Upload all new documents
              const uploadedUrls: Record<string, any> = {};
              const documentUpdates: Record<string, any> = {};

              for (const docType of documentsNeedingResubmission) {
                const uploads = newUploads[docType];
                if (!uploads) continue;

                setUploadingDoc(docType);

                if (docType === 'driversLicense') {
                  // License has front and back
                  if (uploads.front) {
                    uploadedUrls[`license.front`] = await uploadDocumentImage(userId, 'license', uploads.front, 'front');
                  }
                  if (uploads.back) {
                    uploadedUrls[`license.back`] = await uploadDocumentImage(userId, 'license', uploads.back, 'back');
                  }
                } else {
                  // Other documents have single image
                  const storageDocType = docType === 'driversLicense' ? 'license' : docType;
                  if (uploads.front) {
                    uploadedUrls[storageDocType] = await uploadDocumentImage(userId, storageDocType, uploads.front);
                  }
                }

                // Update document status to resubmitted
                documentUpdates[`documents.${docType}.status`] = 'resubmitted';
                documentUpdates[`documents.${docType}.resubmittedAt`] = new Date();
                // Clear rejection reason
                documentUpdates[`documents.${docType}.rejectionReason`] = null;
              }

              setUploadingDoc(null);

              // Update driver document
              const driverRef = doc(db, 'drivers', userId);
              await updateDoc(driverRef, {
                ...documentUpdates,
                registrationStatus: 'pending', // Change back to pending for review
                documentsNeedingResubmission: [], // Clear the list
                resubmissionDeadline: null,
                updatedAt: serverTimestamp(),
              });

              // Update document URLs subcollection
              const docsRef = doc(db, 'drivers', userId, 'documents', 'urls');
              const existingDocs = await getDoc(docsRef);
              const existingData = existingDocs.exists() ? existingDocs.data() : {};

              // Merge new URLs with existing
              const updatedUrls: Record<string, any> = { ...existingData };
              for (const [key, value] of Object.entries(uploadedUrls)) {
                if (key.includes('.')) {
                  // Nested path like license.front
                  const [parent, child] = key.split('.');
                  updatedUrls[parent] = {
                    ...(updatedUrls[parent] || {}),
                    [child]: value,
                  };
                } else {
                  updatedUrls[key] = value;
                }
              }

              await updateDoc(docsRef, {
                ...updatedUrls,
                resubmittedAt: serverTimestamp(),
              });

              Alert.alert(
                'Documents Submitted',
                'Your documents have been submitted for review. You will be notified when they are verified.',
                [{ text: 'OK', onPress: () => router.replace('/(driver)/registration/pending-approval') }]
              );
            } catch (error) {
              console.error('Error submitting documents:', error);
              Alert.alert('Error', 'Failed to submit documents. Please try again.');
            } finally {
              setSubmitting(false);
              setUploadingDoc(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resubmit Documents</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            Please upload new versions of the rejected documents below. Make sure they are clear and readable.
          </Text>
        </View>

        {/* Document Upload Cards */}
        {documentsNeedingResubmission.map((docType) => {
          const info = DOCUMENT_INFO[docType];
          const status = documentStatuses[docType];
          const uploads = newUploads[docType];

          return (
            <View key={docType} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentTitle}>{info?.title || docType}</Text>
                <View style={styles.rejectedBadge}>
                  <Ionicons name="close-circle" size={16} color={Colors.error} />
                  <Text style={styles.rejectedBadgeText}>Rejected</Text>
                </View>
              </View>

              {/* Rejection Reason */}
              {status?.rejectionReason && (
                <View style={styles.rejectionReasonBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.rejectionReasonText}>{status.rejectionReason}</Text>
                </View>
              )}

              <Text style={styles.documentDescription}>{info?.description}</Text>

              {/* Upload Areas */}
              <View style={styles.uploadAreas}>
                {/* Front Upload */}
                <TouchableOpacity
                  style={styles.uploadArea}
                  onPress={() => showImageOptions(docType, 'front')}
                >
                  {uploads?.front ? (
                    <Image source={{ uri: uploads.front }} style={styles.uploadedImage} />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Ionicons name="camera" size={32} color={Colors.gray[400]} />
                      <Text style={styles.uploadPlaceholderText}>
                        {info?.hasBack ? 'Front' : 'Upload Document'}
                      </Text>
                    </View>
                  )}
                  {uploads?.front && (
                    <View style={styles.uploadedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Back Upload (if needed) */}
                {info?.hasBack && (
                  <TouchableOpacity
                    style={styles.uploadArea}
                    onPress={() => showImageOptions(docType, 'back')}
                  >
                    {uploads?.back ? (
                      <Image source={{ uri: uploads.back }} style={styles.uploadedImage} />
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Ionicons name="camera" size={32} color={Colors.gray[400]} />
                        <Text style={styles.uploadPlaceholderText}>Back</Text>
                      </View>
                    )}
                    {uploads?.back && (
                      <View style={styles.uploadedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Submit Button */}
        <DriftButton
          title={submitting ? 'Submitting...' : 'Submit Documents'}
          onPress={handleSubmit}
          disabled={!isReadyToSubmit() || submitting}
          variant="black"
          icon={
            submitting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Ionicons name="cloud-upload" size={20} color="white" />
            )
          }
        />

        {/* Uploading Status */}
        {uploadingDoc && (
          <View style={styles.uploadingStatus}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.uploadingText}>
              Uploading {DOCUMENT_INFO[uploadingDoc]?.title || uploadingDoc}...
            </Text>
          </View>
        )}

        {!isReadyToSubmit() && (
          <Text style={styles.hintText}>
            Please upload all required documents to enable submission
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },

  // Document Card
  documentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadows.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  documentTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  rejectedBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.error,
  },
  rejectionReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.error + '10',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  rejectionReasonText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    lineHeight: 20,
  },
  documentDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.lg,
  },

  // Upload Areas
  uploadAreas: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  uploadArea: {
    flex: 1,
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.gray[300],
    overflow: 'hidden',
    position: 'relative',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
  },
  uploadPlaceholderText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 2,
  },

  // Submit
  uploadingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  uploadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  hintText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
