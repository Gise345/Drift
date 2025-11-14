import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

export default function ReviewApplication() {
  const router = useRouter();
  const { registrationData, submitRegistration, setRegistrationStep } = useDriverStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personalInfo = registrationData.personalInfo;
  const vehicle = registrationData.vehicle;
  const bankDetails = registrationData.bankDetails;
  const documents = registrationData.documents;

  // Debug log to see what documents we have on mount and when they change
  useEffect(() => {
    console.log('📋 Review screen mounted - Full registration data:', JSON.stringify({
      hasPersonalInfo: !!personalInfo,
      hasVehicle: !!vehicle,
      hasBankDetails: !!bankDetails,
      hasDocuments: !!documents,
      documents: {
        license: documents?.license,
        insurance: documents?.insurance,
        registration: documents?.registration,
        inspection: documents?.inspection,
      },
    }, null, 2));
  }, [documents]);

  const handleEdit = (section: string) => {
    // Navigate back to specific section
    switch (section) {
      case 'personal':
        router.push('/(driver)/registration/personal-info');
        break;
      case 'vehicle':
        router.push('/(driver)/registration/vehicle-info');
        break;
      case 'bank':
        router.push('/(driver)/registration/bank-details');
        break;
    }
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Application',
      'Are you sure all information is correct? You can edit it later if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await submitRegistration();
              setRegistrationStep(12);
              router.push('/(driver)/registration/pending-approval');
            } catch (error: any) {
              console.error('❌ Error submitting registration:', error);

              // Show specific error message
              const errorMessage = error?.message || 'Failed to submit application. Please try again.';

              // If it's a document error, offer to navigate to documents screen
              if (errorMessage.includes('license') || errorMessage.includes('document') || errorMessage.includes('insurance') || errorMessage.includes('registration')) {
                Alert.alert(
                  'Missing Required Documents',
                  errorMessage,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Upload Documents',
                      onPress: () => router.push('/(driver)/registration/drivers-license')
                    }
                  ]
                );
              } else {
                Alert.alert('Error', errorMessage);
              }
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Application</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '79%' }]} />
        </View>
        <Text style={styles.progressText}>Step 11 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Review Your Application</Text>
        <Text style={styles.subtitle}>
          Please review all information before submitting
        </Text>

        {/* Warning for missing documents */}
        {(!documents?.license || !documents?.insurance || !documents?.registration) && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color={Colors.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Missing Required Documents</Text>
              <Text style={styles.warningText}>
                Please upload all required documents before submitting. Tap "Edit" in the Documents section below.
              </Text>
            </View>
          </View>
        )}

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => handleEdit('personal')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {personalInfo?.firstName} {personalInfo?.lastName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{personalInfo?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{personalInfo?.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {personalInfo?.address?.street}, {personalInfo?.address?.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <TouchableOpacity onPress={() => handleEdit('vehicle')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>
                {vehicle?.year} {vehicle?.make} {vehicle?.model}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              <Text style={styles.infoValue}>{vehicle?.color}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>License Plate</Text>
              <Text style={styles.infoValue}>{vehicle?.licensePlate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Seats</Text>
              <Text style={styles.infoValue}>{vehicle?.seats} passengers</Text>
            </View>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documents Uploaded</Text>
            <TouchableOpacity onPress={() => router.push('/(driver)/registration/drivers-license')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.documentsCard}>
            <View style={styles.documentRow}>
              <Ionicons
                name={documents?.license ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={documents?.license ? Colors.success : Colors.error}
              />
              <Text style={styles.documentText}>Driver's License</Text>
            </View>
            <View style={styles.documentRow}>
              <Ionicons
                name={documents?.insurance ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={documents?.insurance ? Colors.success : Colors.error}
              />
              <Text style={styles.documentText}>Vehicle Insurance</Text>
            </View>
            <View style={styles.documentRow}>
              <Ionicons
                name={documents?.registration ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={documents?.registration ? Colors.success : Colors.error}
              />
              <Text style={styles.documentText}>Vehicle Registration</Text>
            </View>
            <View style={styles.documentRow}>
              <Ionicons
                name={registrationData.backgroundCheck?.consented ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={registrationData.backgroundCheck?.consented ? Colors.success : Colors.error}
              />
              <Text style={styles.documentText}>Background Check Consent</Text>
            </View>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            <TouchableOpacity onPress={() => handleEdit('bank')}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Holder</Text>
              <Text style={styles.infoValue}>{bankDetails?.accountHolderName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bank</Text>
              <Text style={styles.infoValue}>{bankDetails?.bankName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Number</Text>
              <Text style={styles.infoValue}>
                ••••{bankDetails?.accountNumber?.slice(-4)}
              </Text>
            </View>
          </View>
        </View>

        {/* Final Declaration */}
        <View style={styles.declarationCard}>
          <Ionicons name="document-text" size={24} color={Colors.primary} />
          <View style={styles.declarationContent}>
            <Text style={styles.declarationTitle}>Declaration</Text>
            <Text style={styles.declarationText}>
              I certify that all information provided is accurate and complete. I understand that 
              false information may result in rejection or termination.
            </Text>
          </View>
        </View>

        <DriftButton
          title={isSubmitting ? "Submitting..." : "Submit Application"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          variant="black"
          icon={<Ionicons name="checkmark" size={20} color="white" />}
        />

        <Text style={styles.footerText}>
          By submitting, you agree to Drift's Terms of Service and Privacy Policy
        </Text>
      </ScrollView>

      {/* Uploading Modal */}
      <Modal
        visible={isSubmitting}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.modalTitle}>Uploading Your Application</Text>
            <Text style={styles.modalMessage}>
              Please wait while we upload your documents and information to Firebase.
              This may take 1-2 minutes.
            </Text>
            <View style={styles.modalWarning}>
              <Ionicons name="information-circle" size={20} color={Colors.warning} />
              <Text style={styles.modalWarningText}>
                Please stay on this page until the upload is complete.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  editButton: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.md,
  },
  documentsCard: {
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  documentText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  declarationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  declarationContent: {
    flex: 1,
  },
  declarationTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  declarationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    gap: Spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing['2xl'],
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  modalWarningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    fontWeight: '600',
    lineHeight: 20,
  },
});