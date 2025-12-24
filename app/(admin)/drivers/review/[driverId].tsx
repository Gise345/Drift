/**
 * ADMIN - DRIVER APPLICATION REVIEW
 * Detailed review screen for approving/rejecting driver applications
 *
 * Features:
 * - Individual document approval/rejection
 * - Rejection reasons per document
 * - Request resubmission for specific documents
 * - Finalize application only when all documents verified
 *
 * UPGRADED TO React Native Firebase v22+ Modular API
 * Using 'main' database (restored from backup) UPGRADED TO v23.5.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection, getDocs, query, where } from '@react-native-firebase/firestore';
import { updateDriverRegistrationStatus, updateDocumentStatus } from '@/src/services/driver-registration.service';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Document types mapping
type DocumentType = 'driversLicense' | 'insurance' | 'registration' | 'inspection';

interface DocumentStatus {
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
  uploadedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

interface PayoutMethod {
  id: string;
  type: string;
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
  isDefault: boolean;
  bankName?: string;
  createdAt?: Date;
}

export default function DriverReviewScreen() {
  const router = useRouter();
  const { driverId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [driver, setDriver] = useState<any>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingDoc, setProcessingDoc] = useState<string | null>(null);

  // Modal states
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingDocument, setRejectingDocument] = useState<{
    type: DocumentType;
    title: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Image preview modal
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Local document statuses (for optimistic UI updates)
  const [localDocStatuses, setLocalDocStatuses] = useState<Record<DocumentType, DocumentStatus>>({
    driversLicense: { status: 'pending' },
    insurance: { status: 'pending' },
    registration: { status: 'pending' },
    inspection: { status: 'pending' },
  });

  useEffect(() => {
    loadDriverData();
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      if (!driverId) {
        Alert.alert('Error', 'No driver ID provided');
        router.back();
        return;
      }

      console.log('📖 Loading driver data for:', driverId);

      // Load driver profile
      const driverDocRef = doc(db, 'drivers', driverId as string);
      const driverDoc = await getDoc(driverDocRef);

      if (!driverDoc.exists()) {
        Alert.alert('Error', 'Driver not found. They may have been removed or the ID is invalid.');
        router.back();
        return;
      }

      const driverData = driverDoc.data();

      // Allow reviewing: pending, needs_resubmission, pending_reapproval, and approved (for document review)
      const reviewableStatuses = ['pending', 'needs_resubmission', 'pending_reapproval', 'approved'];
      if (!reviewableStatuses.includes(driverData?.registrationStatus)) {
        Alert.alert(
          'Cannot Review',
          `This driver has been ${driverData?.registrationStatus || 'processed'} and cannot be reviewed.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      setDriver({
        ...driverData,
        id: driverDoc.id,
        submittedAt: driverData?.submittedAt?.toDate(),
        createdAt: driverData?.createdAt?.toDate(),
      });

      // Initialize local document statuses from driver data
      if (driverData?.documents) {
        setLocalDocStatuses({
          driversLicense: driverData.documents.driversLicense || { status: 'pending' },
          insurance: driverData.documents.insurance || { status: 'pending' },
          registration: driverData.documents.registration || { status: 'pending' },
          inspection: driverData.documents.inspection || { status: 'pending' },
        });
      }

      // Load document URLs
      const docsRef = doc(db, 'drivers', driverId as string, 'documents', 'urls');
      const docsSnapshot = await getDoc(docsRef);

      if (docsSnapshot.exists()) {
        setDocuments(docsSnapshot.data());
      }

      // Load payout methods (Wise accounts)
      const payoutMethodsRef = collection(db, 'drivers', driverId as string, 'payoutMethods');
      const payoutMethodsQuery = query(payoutMethodsRef, where('type', '==', 'wise'));
      const payoutMethodsSnapshot = await getDocs(payoutMethodsQuery);

      const methods: PayoutMethod[] = payoutMethodsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          type: data.type,
          accountHolderName: data.accountHolderName || '',
          sortCode: data.sortCode || '',
          accountNumber: data.accountNumber || '',
          isDefault: data.isDefault || false,
          bankName: data.bankName,
          createdAt: data.createdAt?.toDate?.() || null,
        };
      });
      setPayoutMethods(methods);

      console.log('✅ Driver data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading driver data:', error);
      Alert.alert(
        'Error',
        `Failed to load driver data: ${error?.message || 'Unknown error'}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if all required documents are approved
  const allDocumentsApproved = (): boolean => {
    const requiredDocs: DocumentType[] = ['driversLicense', 'insurance', 'registration'];
    return requiredDocs.every(docType => localDocStatuses[docType]?.status === 'approved');
  };

  // Check if any documents are rejected
  const hasRejectedDocuments = (): boolean => {
    return Object.values(localDocStatuses).some(doc => doc.status === 'rejected');
  };

  // Get count of approved documents
  const getApprovedCount = (): number => {
    const requiredDocs: DocumentType[] = ['driversLicense', 'insurance', 'registration'];
    return requiredDocs.filter(docType => localDocStatuses[docType]?.status === 'approved').length;
  };

  // Handle individual document approval
  const handleApproveDocument = async (docType: DocumentType, title: string) => {
    setProcessingDoc(docType);
    try {
      await updateDocumentStatus(driverId as string, docType, 'approved');

      // Update local state
      setLocalDocStatuses(prev => ({
        ...prev,
        [docType]: { ...prev[docType], status: 'approved', verifiedAt: new Date() },
      }));

      // Add to verification history
      await updateDoc(doc(db, 'drivers', driverId as string), {
        verificationHistory: arrayUnion({
          documentType: docType,
          action: 'approved',
          adminId: user?.id || 'admin',
          timestamp: new Date(),
        }),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ ${title} approved`);
    } catch (error) {
      console.error(`❌ Error approving ${title}:`, error);
      Alert.alert('Error', `Failed to approve ${title}`);
    } finally {
      setProcessingDoc(null);
    }
  };

  // Open rejection modal
  const openRejectModal = (docType: DocumentType, title: string) => {
    setRejectingDocument({ type: docType, title });
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  // Handle individual document rejection
  const handleRejectDocument = async () => {
    if (!rejectingDocument) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    setProcessingDoc(rejectingDocument.type);
    setRejectModalVisible(false);

    try {
      await updateDocumentStatus(
        driverId as string,
        rejectingDocument.type,
        'rejected',
        rejectionReason.trim()
      );

      // Update local state
      setLocalDocStatuses(prev => ({
        ...prev,
        [rejectingDocument.type]: {
          ...prev[rejectingDocument.type],
          status: 'rejected',
          rejectionReason: rejectionReason.trim(),
          verifiedAt: new Date(),
        },
      }));

      // Add to verification history
      await updateDoc(doc(db, 'drivers', driverId as string), {
        verificationHistory: arrayUnion({
          documentType: rejectingDocument.type,
          action: 'rejected',
          reason: rejectionReason.trim(),
          adminId: user?.id || 'admin',
          timestamp: new Date(),
        }),
        updatedAt: serverTimestamp(),
      });

      console.log(`❌ ${rejectingDocument.title} rejected`);
    } catch (error) {
      console.error(`❌ Error rejecting ${rejectingDocument.title}:`, error);
      Alert.alert('Error', `Failed to reject ${rejectingDocument.title}`);
    } finally {
      setProcessingDoc(null);
      setRejectingDocument(null);
    }
  };

  // Request resubmission - sets status to needs_resubmission
  const handleRequestResubmission = async () => {
    const rejectedDocs = Object.entries(localDocStatuses)
      .filter(([_, status]) => status.status === 'rejected')
      .map(([type]) => type);

    if (rejectedDocs.length === 0) {
      Alert.alert('Error', 'No documents have been rejected. Please reject at least one document before requesting resubmission.');
      return;
    }

    Alert.alert(
      'Request Resubmission',
      `This will notify the driver to resubmit ${rejectedDocs.length} rejected document(s). They will have 14 days to resubmit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            setProcessing(true);
            try {
              // Calculate deadline (14 days from now)
              const deadline = new Date();
              deadline.setDate(deadline.getDate() + 14);

              await updateDoc(doc(db, 'drivers', driverId as string), {
                registrationStatus: 'needs_resubmission',
                documentsNeedingResubmission: rejectedDocs,
                resubmissionDeadline: deadline,
                resubmissionRequestedAt: serverTimestamp(),
                resubmissionRequestedBy: user?.id || 'admin',
                updatedAt: serverTimestamp(),
              });

              Alert.alert(
                'Resubmission Requested',
                'The driver has been notified to resubmit the rejected documents. They have 14 days to complete this.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('❌ Error requesting resubmission:', error);
              Alert.alert('Error', 'Failed to request resubmission');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Finalize and approve the application
  const handleFinalApproval = () => {
    if (!allDocumentsApproved()) {
      Alert.alert('Error', 'All required documents must be approved before final approval.');
      return;
    }

    Alert.alert(
      'Approve Driver Application',
      `Are you sure you want to approve ${driver?.firstName} ${driver?.lastName} as a driver? They will be able to start accepting rides immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setProcessing(true);
            try {
              await updateDriverRegistrationStatus(
                driverId as string,
                'approved',
                user?.id || 'admin'
              );
              Alert.alert('Success', 'Driver approved successfully! They have been notified.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('❌ Error approving driver:', error);
              Alert.alert('Error', 'Failed to approve driver');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Reject entire application
  const handleRejectApplication = () => {
    Alert.prompt(
      'Reject Application',
      `Please provide a reason for rejecting ${driver?.firstName} ${driver?.lastName}'s application:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Please provide a rejection reason');
              return;
            }

            setProcessing(true);
            try {
              await updateDriverRegistrationStatus(
                driverId as string,
                'rejected',
                user?.id || 'admin',
                reason
              );
              Alert.alert('Application Rejected', 'The driver has been notified.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('❌ Error rejecting driver:', error);
              Alert.alert('Error', 'Failed to reject driver');
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Open image preview
  const openImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setImagePreviewVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const approvedCount = getApprovedCount();
  const totalRequired = 3; // license, insurance, registration

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Application</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Banner */}
      <View style={styles.progressBanner}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Document Verification</Text>
          <Text style={styles.progressSubtitle}>
            {approvedCount} of {totalRequired} required documents verified
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressCircleText}>{approvedCount}/{totalRequired}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Driver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <InfoRow label="Name" value={`${driver?.firstName} ${driver?.lastName}`} />
            <InfoRow label="Email" value={driver?.email} />
            <InfoRow label="Phone" value={driver?.phone} />
            <InfoRow label="Date of Birth" value={driver?.dateOfBirth} />
            <InfoRow
              label="Address"
              value={`${driver?.address?.street}, ${driver?.address?.city}, ${driver?.address?.postalCode}`}
            />
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.card}>
            <InfoRow label="Make" value={driver?.vehicle?.make} />
            <InfoRow label="Model" value={driver?.vehicle?.model} />
            <InfoRow label="Year" value={driver?.vehicle?.year?.toString()} />
            <InfoRow label="Color" value={driver?.vehicle?.color} />
            <InfoRow label="License Plate" value={driver?.vehicle?.licensePlate} />
            <InfoRow label="Seats" value={driver?.vehicle?.seats?.toString()} />
          </View>
        </View>

        {/* Vehicle Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Photos</Text>
          <Text style={styles.sectionSubtitle}>
            Tap images to view full size.
          </Text>

          {/* Exterior Photos - Front & Back */}
          {(driver?.vehicle?.photos?.front || driver?.vehicle?.photos?.back) && (
            <View style={styles.vehiclePhotoCard}>
              <Text style={styles.vehiclePhotoCardTitle}>Exterior - Front & Back</Text>
              <View style={styles.vehiclePhotoRow}>
                {driver?.vehicle?.photos?.front && (
                  <TouchableOpacity
                    style={styles.vehiclePhotoWrapper}
                    onPress={() => openImagePreview(driver.vehicle.photos.front)}
                  >
                    <Image source={{ uri: driver.vehicle.photos.front }} style={styles.vehiclePhotoLarge} />
                    <Text style={styles.vehiclePhotoLabel}>Front</Text>
                  </TouchableOpacity>
                )}
                {driver?.vehicle?.photos?.back && (
                  <TouchableOpacity
                    style={styles.vehiclePhotoWrapper}
                    onPress={() => openImagePreview(driver.vehicle.photos.back)}
                  >
                    <Image source={{ uri: driver.vehicle.photos.back }} style={styles.vehiclePhotoLarge} />
                    <Text style={styles.vehiclePhotoLabel}>Back</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Side Photos - Left & Right */}
          {(driver?.vehicle?.photos?.leftSide || driver?.vehicle?.photos?.rightSide) && (
            <View style={styles.vehiclePhotoCard}>
              <Text style={styles.vehiclePhotoCardTitle}>Exterior - Sides</Text>
              <View style={styles.vehiclePhotoRow}>
                {driver?.vehicle?.photos?.leftSide && (
                  <TouchableOpacity
                    style={styles.vehiclePhotoWrapper}
                    onPress={() => openImagePreview(driver.vehicle.photos.leftSide)}
                  >
                    <Image source={{ uri: driver.vehicle.photos.leftSide }} style={styles.vehiclePhotoLarge} />
                    <Text style={styles.vehiclePhotoLabel}>Left Side</Text>
                  </TouchableOpacity>
                )}
                {driver?.vehicle?.photos?.rightSide && (
                  <TouchableOpacity
                    style={styles.vehiclePhotoWrapper}
                    onPress={() => openImagePreview(driver.vehicle.photos.rightSide)}
                  >
                    <Image source={{ uri: driver.vehicle.photos.rightSide }} style={styles.vehiclePhotoLarge} />
                    <Text style={styles.vehiclePhotoLabel}>Right Side</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Interior Photo */}
          {driver?.vehicle?.photos?.interior && (
            <View style={styles.vehiclePhotoCard}>
              <Text style={styles.vehiclePhotoCardTitle}>Interior</Text>
              <TouchableOpacity onPress={() => openImagePreview(driver.vehicle.photos.interior)}>
                <Image source={{ uri: driver.vehicle.photos.interior }} style={styles.vehiclePhotoFull} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Documents - with individual verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <Text style={styles.sectionSubtitle}>
            Verify each document individually. Tap images to view full size.
          </Text>

          {documents?.license && (
            <DocumentVerificationCard
              title="Driver's License"
              docType="driversLicense"
              status={localDocStatuses.driversLicense}
              frontUrl={documents.license.front}
              backUrl={documents.license.back}
              required={true}
              isProcessing={processingDoc === 'driversLicense'}
              onApprove={() => handleApproveDocument('driversLicense', "Driver's License")}
              onReject={() => openRejectModal('driversLicense', "Driver's License")}
              onImagePress={openImagePreview}
            />
          )}

          {documents?.insurance && (
            <DocumentVerificationCard
              title="Vehicle Insurance"
              docType="insurance"
              status={localDocStatuses.insurance}
              frontUrl={documents.insurance}
              required={true}
              isProcessing={processingDoc === 'insurance'}
              onApprove={() => handleApproveDocument('insurance', 'Vehicle Insurance')}
              onReject={() => openRejectModal('insurance', 'Vehicle Insurance')}
              onImagePress={openImagePreview}
            />
          )}

          {documents?.registration && (
            <DocumentVerificationCard
              title="Vehicle Registration"
              docType="registration"
              status={localDocStatuses.registration}
              frontUrl={documents.registration}
              required={true}
              isProcessing={processingDoc === 'registration'}
              onApprove={() => handleApproveDocument('registration', 'Vehicle Registration')}
              onReject={() => openRejectModal('registration', 'Vehicle Registration')}
              onImagePress={openImagePreview}
            />
          )}

          {documents?.inspection && (
            <DocumentVerificationCard
              title="Safety Inspection"
              docType="inspection"
              status={localDocStatuses.inspection}
              frontUrl={documents.inspection}
              required={false}
              isProcessing={processingDoc === 'inspection'}
              onApprove={() => handleApproveDocument('inspection', 'Safety Inspection')}
              onReject={() => openRejectModal('inspection', 'Safety Inspection')}
              onImagePress={openImagePreview}
            />
          )}
        </View>

        {/* Wise Payout Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Methods (Wise)</Text>
          {payoutMethods.length > 0 ? (
            payoutMethods.map((method) => (
              <View key={method.id} style={styles.payoutMethodCard}>
                <View style={styles.payoutMethodHeader}>
                  <View style={styles.wiseLogoSmall}>
                    <Text style={styles.wiseLogoTextSmall}>W</Text>
                  </View>
                  <View style={styles.payoutMethodInfo}>
                    <Text style={styles.payoutMethodName}>{method.accountHolderName}</Text>
                    {method.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.payoutMethodDetails}>
                  <InfoRow label="Sort Code" value={method.sortCode} />
                  <InfoRow label="Account Number" value={method.accountNumber} />
                  {method.bankName && <InfoRow label="Bank" value={method.bankName} />}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noPayoutMethod}>
              <Ionicons name="wallet-outline" size={32} color={Colors.gray[400]} />
              <Text style={styles.noPayoutMethodText}>No payout method added</Text>
              <Text style={styles.noPayoutMethodSubtext}>Driver hasn't set up their Wise account yet</Text>
            </View>
          )}
        </View>

        {/* Spacer for bottom buttons */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons - Only show for pending applications, not for already approved drivers */}
      {driver?.registrationStatus !== 'approved' && (
        <View style={styles.actionButtonsContainer}>
          {hasRejectedDocuments() && (
            <TouchableOpacity
              style={[styles.actionButton, styles.resubmitButton]}
              onPress={handleRequestResubmission}
              disabled={processing}
            >
              <Ionicons name="refresh" size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>Request Resubmission</Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionButtonsRow}>
            {/* Only show Reject All for new pending applications, not for reapproval */}
            {driver?.registrationStatus !== 'pending_reapproval' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleRejectApplication}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Reject All</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.approveButton,
                !allDocumentsApproved() && styles.buttonDisabled,
                driver?.registrationStatus === 'pending_reapproval' && { flex: 1 },
              ]}
              onPress={handleFinalApproval}
              disabled={processing || !allDocumentsApproved()}
            >
              {processing ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  <Text style={styles.actionButtonText}>
                    {driver?.registrationStatus === 'pending_reapproval' ? 'Re-Approve Driver' : 'Approve Driver'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {!allDocumentsApproved() && (
            <Text style={styles.approvalHint}>
              Verify all required documents to enable final approval
            </Text>
          )}
        </View>
      )}

      {/* View-only mode message for already approved drivers */}
      {driver?.registrationStatus === 'approved' && (
        <View style={styles.viewOnlyContainer}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.viewOnlyText}>This driver is already approved. View-only mode.</Text>
        </View>
      )}

      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject {rejectingDocument?.title}</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please provide a clear reason for rejection. This will be shown to the driver.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="e.g., Document is expired, image is blurry, wrong document type..."
              placeholderTextColor={Colors.gray[400]}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalRejectButton]}
                onPress={handleRejectDocument}
              >
                <Text style={styles.modalRejectButtonText}>Reject Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <TouchableOpacity
          style={styles.imagePreviewOverlay}
          activeOpacity={1}
          onPress={() => setImagePreviewVisible(false)}
        >
          <TouchableOpacity
            style={styles.closePreviewButton}
            onPress={() => setImagePreviewVisible(false)}
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Helper Components
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

// Document Verification Card with approve/reject buttons
const DocumentVerificationCard = ({
  title,
  docType,
  status,
  frontUrl,
  backUrl,
  required,
  isProcessing,
  onApprove,
  onReject,
  onImagePress,
}: {
  title: string;
  docType: DocumentType;
  status: DocumentStatus;
  frontUrl?: string;
  backUrl?: string;
  required: boolean;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onImagePress: (url: string) => void;
}) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'approved':
        return Colors.success;
      case 'rejected':
        return Colors.error;
      case 'resubmitted':
        return Colors.info;
      default:
        return Colors.warning;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'approved':
        return '✓ Verified';
      case 'rejected':
        return '✗ Rejected';
      case 'resubmitted':
        return '↻ Resubmitted';
      default:
        return '⏳ Pending';
    }
  };

  const getStatusBgColor = () => {
    switch (status.status) {
      case 'approved':
        return Colors.success + '20';
      case 'rejected':
        return Colors.error + '20';
      case 'resubmitted':
        return Colors.info + '20';
      default:
        return Colors.warning + '20';
    }
  };

  return (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentTitleRow}>
          <Text style={styles.documentTitle}>{title}</Text>
          {required && <Text style={styles.requiredBadge}>Required</Text>}
        </View>
        <View style={[styles.statusChip, { backgroundColor: getStatusBgColor() }]}>
          <Text style={[styles.statusChipText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Rejection reason if rejected */}
      {status.status === 'rejected' && status.rejectionReason && (
        <View style={styles.rejectionReasonBox}>
          <Ionicons name="information-circle" size={16} color={Colors.error} />
          <Text style={styles.rejectionReasonText}>{status.rejectionReason}</Text>
        </View>
      )}

      {/* Document images */}
      <View style={styles.documentImages}>
        {frontUrl && (
          <TouchableOpacity onPress={() => onImagePress(frontUrl)} style={styles.documentImageWrapper}>
            <Image source={{ uri: frontUrl }} style={styles.documentImage} />
            {backUrl && <Text style={styles.imageLabel}>Front</Text>}
          </TouchableOpacity>
        )}
        {backUrl && (
          <TouchableOpacity onPress={() => onImagePress(backUrl)} style={styles.documentImageWrapper}>
            <Image source={{ uri: backUrl }} style={styles.documentImage} />
            <Text style={styles.imageLabel}>Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action buttons - only show if pending or resubmitted */}
      {(status.status === 'pending' || status.status === 'resubmitted') && (
        <View style={styles.documentActions}>
          {isProcessing ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.docActionButton, styles.docRejectButton]}
                onPress={onReject}
              >
                <Ionicons name="close" size={18} color={Colors.error} />
                <Text style={styles.docRejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.docActionButton, styles.docApproveButton]}
                onPress={onApprove}
              >
                <Ionicons name="checkmark" size={18} color={Colors.white} />
                <Text style={styles.docApproveButtonText}>Approve</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  progressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '30',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  progressSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginTop: 2,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    flex: 1,
    textAlign: 'right',
  },
  // Vehicle Photo Card Styles
  vehiclePhotoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  vehiclePhotoCardTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  vehiclePhotoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  vehiclePhotoWrapper: {
    flex: 1,
  },
  vehiclePhotoLarge: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
  },
  vehiclePhotoFull: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
  },
  vehiclePhotoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // Document Card Styles
  documentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  documentTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },
  requiredBadge: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
    backgroundColor: Colors.error + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusChip: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
  },
  statusChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  rejectionReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  rejectionReasonText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
    lineHeight: 20,
  },
  documentImages: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  documentImageWrapper: {
    flex: 1,
  },
  documentImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
  },
  imageLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  docActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  docRejectButton: {
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  docApproveButton: {
    backgroundColor: Colors.success,
  },
  docRejectButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error,
  },
  docApproveButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },

  // Action Buttons
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    ...Shadows.md,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  resubmitButton: {
    backgroundColor: Colors.warning,
    marginBottom: Spacing.md,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  approvalHint: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  viewOnlyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success + '15',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.success + '30',
    gap: Spacing.sm,
  },
  viewOnlyText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.black,
    minHeight: 120,
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: Colors.gray[100],
  },
  modalCancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[700],
  },
  modalRejectButton: {
    backgroundColor: Colors.error,
  },
  modalRejectButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },

  // Image Preview Modal
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreviewButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: Spacing.md,
  },
  previewImage: {
    width: SCREEN_WIDTH - 40,
    height: '80%',
  },

  // Payout Method Styles
  payoutMethodCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  payoutMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  wiseLogoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9FE870',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  wiseLogoTextSmall: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#163300',
  },
  payoutMethodInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  payoutMethodName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },
  defaultBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  payoutMethodDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: Spacing.md,
  },
  noPayoutMethod: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  noPayoutMethodText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
    marginTop: Spacing.md,
  },
  noPayoutMethodSubtext: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[400],
    marginTop: Spacing.xs,
  },
});
