/**
 * Driver Application Status Tracker
 * Real-time status updates for driver registration application
 *
 * Features:
 * - Real-time document verification status
 * - Individual document status indicators
 * - Rejection reasons with resubmit buttons
 * - Progress indicator
 * - Deadline countdown for resubmissions
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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, onSnapshot } from '@react-native-firebase/firestore';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

// Initialize Firebase
const app = getApp();
const db = getFirestore(app, 'main');

// Document type display names
const DOCUMENT_DISPLAY_NAMES: Record<string, string> = {
  driversLicense: "Driver's License",
  insurance: 'Vehicle Insurance',
  registration: 'Vehicle Registration',
  inspection: 'Safety Inspection',
};

interface DocumentStatus {
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
  rejectionReason?: string;
  uploadedAt?: Date;
  verifiedAt?: Date;
}

interface DriverData {
  firstName: string;
  lastName: string;
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'needs_resubmission' | 'incomplete';
  documentsNeedingResubmission?: string[];
  resubmissionDeadline?: Date;
  rejectionReason?: string;
  documents: {
    driversLicense?: DocumentStatus;
    insurance?: DocumentStatus;
    registration?: DocumentStatus;
    inspection?: DocumentStatus;
  };
}

export default function PendingApproval() {
  const router = useRouter();
  const { user, setMode } = useAuthStore();

  // Check if user has RIDER role
  const hasRiderRole = user?.roles?.includes('RIDER') ?? false;
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    console.log('📡 Subscribing to driver document updates...');

    const driverRef = doc(db, 'drivers', user.id);
    const unsubscribe = onSnapshot(
      driverRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as any;
          if (data) {
            setDriverData({
              ...data,
              resubmissionDeadline: data.resubmissionDeadline?.toDate(),
            } as DriverData);
            console.log('📥 Driver data updated:', data.registrationStatus);

            // If approved, redirect to driver tabs
            if (data.registrationStatus === 'approved') {
              console.log('✅ Application approved! Redirecting...');
              router.replace('/(driver)/tabs');
            }
          }
        }
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('❌ Error listening to driver updates:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const handleResubmitDocuments = () => {
    router.push('/(driver)/registration/resubmit-documents');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // The onSnapshot will automatically update
  };

  // Calculate days remaining for resubmission
  const getDaysRemaining = (): number | null => {
    if (!driverData?.resubmissionDeadline) return null;
    const now = new Date();
    const deadline = new Date(driverData.resubmissionDeadline);
    const diff = deadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Get document status counts
  const getStatusCounts = () => {
    const docs = driverData?.documents || {};
    // Count all uploaded documents (include inspection if uploaded)
    const uploadedDocs = ['driversLicense', 'insurance', 'registration'];

    // Add inspection to the count if it was uploaded
    if (docs.inspection) {
      uploadedDocs.push('inspection');
    }

    let approved = 0;
    let rejected = 0;
    let pending = 0;

    uploadedDocs.forEach((docType) => {
      const status = docs[docType as keyof typeof docs]?.status;
      if (status === 'approved') approved++;
      else if (status === 'rejected') rejected++;
      else pending++;
    });

    return { approved, rejected, pending, total: uploadedDocs.length };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading application status...</Text>
      </View>
    );
  }

  const statusCounts = getStatusCounts();
  const daysRemaining = getDaysRemaining();
  const isNeedsResubmission = driverData?.registrationStatus === 'needs_resubmission';
  const isRejected = driverData?.registrationStatus === 'rejected';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Header Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              isRejected && styles.iconCircleRejected,
              isNeedsResubmission && styles.iconCircleWarning,
            ]}
          >
            <Ionicons
              name={
                isRejected
                  ? 'close-circle-outline'
                  : isNeedsResubmission
                  ? 'alert-circle-outline'
                  : 'time-outline'
              }
              size={60}
              color={isRejected ? Colors.error : isNeedsResubmission ? Colors.warning : Colors.primary}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isRejected
            ? 'Application Not Approved'
            : isNeedsResubmission
            ? 'Documents Need Attention'
            : 'Application Submitted!'}
        </Text>
        <Text style={styles.subtitle}>
          {isRejected
            ? 'Unfortunately, your application could not be approved.'
            : isNeedsResubmission
            ? 'Some documents need to be resubmitted'
            : `Thank you for applying to be a Drift driver, ${driverData?.firstName || 'Driver'}!`}
        </Text>

        {/* Rejection Reason */}
        {isRejected && driverData?.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Ionicons name="information-circle" size={24} color={Colors.error} />
            <View style={styles.rejectionContent}>
              <Text style={styles.rejectionTitle}>Reason for Rejection</Text>
              <Text style={styles.rejectionText}>{driverData.rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Resubmission Deadline */}
        {isNeedsResubmission && daysRemaining !== null && (
          <View style={styles.deadlineCard}>
            <Ionicons name="calendar" size={24} color={daysRemaining <= 3 ? Colors.error : Colors.warning} />
            <View style={styles.deadlineContent}>
              <Text style={styles.deadlineTitle}>Resubmission Deadline</Text>
              <Text
                style={[styles.deadlineText, daysRemaining <= 3 && styles.deadlineTextUrgent]}
              >
                {daysRemaining === 0
                  ? 'Due today!'
                  : daysRemaining === 1
                  ? '1 day remaining'
                  : `${daysRemaining} days remaining`}
              </Text>
            </View>
          </View>
        )}

        {/* Document Verification Status */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Document Verification Status</Text>

          {/* Progress Summary */}
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>{statusCounts.approved}</Text>
                <Text style={styles.progressLabel}>Verified</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressItem}>
                <Text style={[styles.progressNumber, { color: Colors.warning }]}>
                  {statusCounts.pending}
                </Text>
                <Text style={styles.progressLabel}>Pending</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressItem}>
                <Text style={[styles.progressNumber, { color: Colors.error }]}>
                  {statusCounts.rejected}
                </Text>
                <Text style={styles.progressLabel}>Rejected</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(statusCounts.approved / statusCounts.total) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {statusCounts.approved} of {statusCounts.total} documents verified
              </Text>
            </View>
          </View>

          {/* Individual Document Status Cards */}
          {['driversLicense', 'insurance', 'registration'].map((docType) => {
            const status = driverData?.documents?.[docType as keyof typeof driverData.documents];
            const needsResubmission = driverData?.documentsNeedingResubmission?.includes(docType);

            return (
              <DocumentStatusCard
                key={docType}
                title={DOCUMENT_DISPLAY_NAMES[docType]}
                status={status?.status || 'pending'}
                rejectionReason={status?.rejectionReason}
                needsResubmission={needsResubmission}
              />
            );
          })}

          {/* Optional: Safety Inspection */}
          {driverData?.documents?.inspection && (
            <DocumentStatusCard
              title={DOCUMENT_DISPLAY_NAMES.inspection}
              status={driverData.documents.inspection.status}
              rejectionReason={driverData.documents.inspection.rejectionReason}
              needsResubmission={driverData?.documentsNeedingResubmission?.includes('inspection')}
              optional
            />
          )}
        </View>

        {/* Resubmit Button */}
        {isNeedsResubmission && (
          <DriftButton
            title="Resubmit Documents"
            onPress={handleResubmitDocuments}
            variant="primary"
            icon={<Ionicons name="cloud-upload" size={20} color="white" />}
          />
        )}

        {/* What happens next - for pending applications */}
        {!isRejected && !isNeedsResubmission && (
          <>
            {/* Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>What happens next:</Text>

              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Application Submitted</Text>
                  <Text style={styles.timelineTime}>Completed</Text>
                </View>
              </View>

              <View style={styles.timelineLine} />

              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    statusCounts.approved > 0 && styles.timelineDotActive,
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Document Verification</Text>
                  <Text style={styles.timelineTime}>
                    {statusCounts.approved === statusCounts.total
                      ? 'Completed'
                      : 'In progress...'}
                  </Text>
                </View>
              </View>

              <View style={styles.timelineLine} />

              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Final Approval</Text>
                  <Text style={styles.timelineTime}>
                    {statusCounts.approved === statusCounts.total
                      ? 'Pending review'
                      : 'Waiting for documents'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Notification Info */}
            <View style={styles.notificationCard}>
              <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>We'll notify you</Text>
                <Text style={styles.notificationText}>
                  You'll receive a push notification and email when your application status changes.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Rider Mode Section */}
        <View style={styles.riderSection}>
          <View style={styles.riderSectionHeader}>
            <Ionicons name="car-outline" size={24} color={Colors.primary} />
            <Text style={styles.riderSectionTitle}>Need a Ride?</Text>
          </View>

          {hasRiderRole ? (
            // User has rider account - show button to switch to rider mode
            <View>
              <Text style={styles.riderSectionText}>
                While waiting for your driver application to be reviewed, you can use Drift as a rider.
              </Text>
              <TouchableOpacity
                style={styles.riderButton}
                onPress={async () => {
                  await setMode('RIDER');
                  router.replace('/(tabs)');
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color={Colors.white} />
                <Text style={styles.riderButtonText}>Switch to Rider Mode</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // User doesn't have rider account - show sign up instructions
            <View>
              <Text style={styles.riderSectionText}>
                You don't have a rider account yet. Sign up as a rider to request rides while your driver application is being reviewed.
              </Text>
              <TouchableOpacity
                style={styles.riderButton}
                onPress={() => router.push('/(auth)/sign-up')}
              >
                <Ionicons name="person-add" size={20} color={Colors.white} />
                <Text style={styles.riderButtonText}>Sign Up as Rider</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Navigation Instructions */}
          <View style={styles.navigationInstructions}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.gray[500]} />
            <Text style={styles.navigationInstructionsText}>
              To return to this driver application screen later: Go to your{' '}
              <Text style={styles.boldText}>Profile tab</Text>, scroll down, and select{' '}
              <Text style={styles.boldText}>"Become a Driver"</Text>.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Questions? Contact us at{' '}
          <Text style={styles.footerLink}>info@drift-global.com</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Document Status Card Component
const DocumentStatusCard = ({
  title,
  status,
  rejectionReason,
  needsResubmission,
  optional,
}: {
  title: string;
  status: string;
  rejectionReason?: string;
  needsResubmission?: boolean;
  optional?: boolean;
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return { name: 'checkmark-circle', color: Colors.success };
      case 'rejected':
        return { name: 'close-circle', color: Colors.error };
      case 'resubmitted':
        return { name: 'refresh-circle', color: Colors.info };
      default:
        return { name: 'time', color: Colors.warning };
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'approved':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'resubmitted':
        return 'Resubmitted - Pending Review';
      default:
        return 'Pending Review';
    }
  };

  const statusIcon = getStatusIcon();

  return (
    <View style={[styles.docStatusCard, status === 'rejected' && styles.docStatusCardRejected]}>
      <View style={styles.docStatusHeader}>
        <View style={styles.docStatusLeft}>
          <Ionicons name={statusIcon.name as any} size={24} color={statusIcon.color} />
          <View>
            <Text style={styles.docStatusTitle}>{title}</Text>
            {optional && <Text style={styles.docStatusOptional}>Optional</Text>}
          </View>
        </View>
        <Text style={[styles.docStatusText, { color: statusIcon.color }]}>{getStatusText()}</Text>
      </View>

      {status === 'rejected' && rejectionReason && (
        <View style={styles.docRejectionReason}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.docRejectionText}>{rejectionReason}</Text>
        </View>
      )}

      {needsResubmission && status === 'rejected' && (
        <View style={styles.resubmitBadge}>
          <Ionicons name="arrow-up-circle" size={16} color={Colors.warning} />
          <Text style={styles.resubmitBadgeText}>Resubmission Required</Text>
        </View>
      )}
    </View>
  );
};

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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: 100,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing['2xl'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRejected: {
    backgroundColor: Colors.error + '20',
  },
  iconCircleWarning: {
    backgroundColor: Colors.warning + '20',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },

  // Rejection Card
  rejectionCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.error + '15',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    gap: Spacing.md,
  },
  rejectionContent: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  rejectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },

  // Deadline Card
  deadlineCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    gap: Spacing.md,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  deadlineText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    fontWeight: '600',
  },
  deadlineTextUrgent: {
    color: Colors.error,
  },

  // Documents Section
  documentsSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },

  // Progress Card
  progressCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.success,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  progressDivider: {
    width: 1,
    backgroundColor: Colors.gray[300],
  },
  progressBarContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Document Status Card
  docStatusCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  docStatusCardRejected: {
    borderColor: Colors.error + '50',
    backgroundColor: Colors.error + '05',
  },
  docStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  docStatusTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  docStatusOptional: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },
  docStatusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  docRejectionReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.error + '20',
    gap: Spacing.sm,
  },
  docRejectionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    lineHeight: 20,
  },
  resubmitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  resubmitBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
  },

  // Timeline
  timelineCard: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.white,
    marginTop: 2,
  },
  timelineDotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.gray[300],
    marginLeft: 9,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.xs,
  },
  timelineLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  timelineTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  // Notification Card
  notificationCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  notificationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },

  // Footer
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Rider Section
  riderSection: {
    width: '100%',
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
  },
  riderSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  riderSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  riderSectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  riderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
  },
  riderButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  navigationInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  navigationInstructionsText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '600',
    color: Colors.gray[700],
  },
});
