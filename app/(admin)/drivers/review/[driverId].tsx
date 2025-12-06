/**
 * ADMIN - DRIVER APPLICATION REVIEW
 * Detailed review screen for approving/rejecting driver applications
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { updateDriverRegistrationStatus } from '@/src/services/driver-registration.service';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

export default function DriverReviewScreen() {
  const router = useRouter();
  const { driverId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [driver, setDriver] = useState<any>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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

      // Check if driver is no longer pending (already approved/rejected)
      if (driverData?.registrationStatus !== 'pending') {
        Alert.alert(
          'Already Reviewed',
          `This driver has already been ${driverData?.registrationStatus || 'processed'}. The list will refresh.`,
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

      // Load document URLs
      const docsRef = doc(db, 'drivers', driverId as string, 'documents', 'urls');
      const docsSnapshot = await getDoc(docsRef);

      if (docsSnapshot.exists()) {
        setDocuments(docsSnapshot.data());
      }

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

  const handleApprove = () => {
    Alert.alert(
      'Approve Driver',
      `Are you sure you want to approve ${driver?.firstName} ${driver?.lastName} as a driver?`,
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
              Alert.alert('Success', 'Driver approved successfully');
              router.back();
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

  const handleReject = () => {
    Alert.prompt(
      'Reject Driver',
      `Please provide a reason for rejecting ${driver?.firstName} ${driver?.lastName}:`,
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
              Alert.alert('Success', 'Driver application rejected');
              router.back();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
          <View style={styles.photosGrid}>
            {driver?.vehicle?.photos?.front && (
              <VehiclePhoto label="Front" uri={driver.vehicle.photos.front} />
            )}
            {driver?.vehicle?.photos?.back && (
              <VehiclePhoto label="Back" uri={driver.vehicle.photos.back} />
            )}
            {driver?.vehicle?.photos?.leftSide && (
              <VehiclePhoto label="Left Side" uri={driver.vehicle.photos.leftSide} />
            )}
            {driver?.vehicle?.photos?.rightSide && (
              <VehiclePhoto label="Right Side" uri={driver.vehicle.photos.rightSide} />
            )}
            {driver?.vehicle?.photos?.interior && (
              <VehiclePhoto label="Interior" uri={driver.vehicle.photos.interior} />
            )}
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>

          {documents?.license && (
            <DocumentCard
              title="Driver's License"
              status={driver?.documents?.driversLicense?.status}
              frontUrl={documents.license.front}
              backUrl={documents.license.back}
            />
          )}

          {documents?.insurance && (
            <DocumentCard
              title="Insurance"
              status={driver?.documents?.insurance?.status}
              frontUrl={documents.insurance}
            />
          )}

          {documents?.registration && (
            <DocumentCard
              title="Registration Certificate"
              status={driver?.documents?.registration?.status}
              frontUrl={documents.registration}
            />
          )}

          {documents?.inspection && (
            <DocumentCard
              title="Safety Inspection"
              status={driver?.documents?.inspection?.status}
              frontUrl={documents.inspection}
            />
          )}
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <View style={styles.card}>
            <InfoRow label="Account Holder" value={driver?.bankDetails?.accountHolderName} />
            <InfoRow label="Bank Name" value={driver?.bankDetails?.bankName} />
            <InfoRow label="Account Number" value={`****${driver?.bankDetails?.accountNumber?.slice(-4)}`} />
          </View>
        </View>

        
      </ScrollView>

      {/* Action Buttons */}
      {driver?.registrationStatus === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleReject}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={Colors.white} />
                <Text style={styles.buttonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={handleApprove}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.buttonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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

const VehiclePhoto = ({ label, uri }: { label: string; uri: string }) => (
  <View style={styles.photoContainer}>
    <Image source={{ uri }} style={styles.photo} />
    <Text style={styles.photoLabel}>{label}</Text>
  </View>
);

const DocumentCard = ({
  title,
  status,
  frontUrl,
  backUrl,
}: {
  title: string;
  status?: string;
  frontUrl?: string;
  backUrl?: string;
}) => (
  <View style={styles.documentCard}>
    <View style={styles.documentHeader}>
      <Text style={styles.documentTitle}>{title}</Text>
      <View style={[styles.statusChip, status === 'approved' && styles.statusApproved]}>
        <Text style={styles.statusChipText}>
          {status === 'approved' ? '✓ Approved' : 'Pending Review'}
        </Text>
      </View>
    </View>
    <View style={styles.documentImages}>
      {frontUrl && <Image source={{ uri: frontUrl }} style={styles.documentImage} />}
      {backUrl && <Image source={{ uri: backUrl }} style={styles.documentImage} />}
    </View>
  </View>
);

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
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  photoContainer: {
    width: '48%',
  },
  photo: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
  },
  photoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
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
  documentTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },
  statusChip: {
    backgroundColor: Colors.warning + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
  },
  statusApproved: {
    backgroundColor: Colors.success + '20',
  },
  statusChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.warning,
  },
  documentImages: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  documentImage: {
    flex: 1,
    height: 180,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
  },
  actionButtons: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
