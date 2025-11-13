/**
 * DRIVER REGISTRATION STATUS SCREEN
 * Track application progress and document verification
 * 
 * Features:
 * - Visual progress tracker
 * - Document status (Pending, Approved, Rejected)
 * - Overall application status
 * - Action buttons based on status
 * - Timeline view
 * 
 * EXPO SDK 52 Compatible
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverStore } from '@/src/stores/driver-store';
import { DriverService } from '@/src/services/driver.service';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

type DocumentStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

interface Document {
  type: string;
  name: string;
  status: DocumentStatus;
  uploadedAt?: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function RegistrationStatusScreen() {
  const router = useRouter();
  const { driver } = useDriverStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Document checklist
  const [documents, setDocuments] = useState<Document[]>([
    {
      type: 'driversLicense',
      name: "Driver's License",
      status: 'not_started',
      icon: 'card-outline',
    },
    {
      type: 'insurance',
      name: 'Vehicle Insurance',
      status: 'not_started',
      icon: 'shield-checkmark-outline',
    },
    {
      type: 'registration',
      name: 'Vehicle Registration',
      status: 'not_started',
      icon: 'document-text-outline',
    },
    {
      type: 'inspection',
      name: 'Safety Inspection',
      status: 'not_started',
      icon: 'checkmark-done-outline',
    },
    {
      type: 'backgroundCheck',
      name: 'Background Check',
      status: 'not_started',
      icon: 'person-circle-outline',
    },
  ]);

  const [overallStatus, setOverallStatus] = useState<'incomplete' | 'pending' | 'approved' | 'rejected'>('incomplete');

  useEffect(() => {
    loadRegistrationStatus();
  }, []);

  const loadRegistrationStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch from Firebase
      if (driver?.id) {
        const status = await DriverService.getRegistrationStatus(driver.id);
        
        if (status) {
          // Update documents
         setDocuments(prev => prev.map(doc => {
            const docType = doc.type as keyof typeof status.documents;
            const docStatus = status.documents?.[docType];
            
            return {
                ...doc,
                status: docStatus?.status || 'not_started',
                uploadedAt: docStatus?.uploadedAt,
                reviewedAt: docStatus?.reviewedAt,
                rejectionReason: docStatus?.rejectionReason,
            };
            }));
          
          setOverallStatus(status.overall);
        }
      }
    } catch (error) {
      console.error('Error loading registration status:', error);
      Alert.alert('Error', 'Failed to load registration status');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRegistrationStatus();
    setRefreshing(false);
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'rejected':
        return Colors.error;
      default:
        return Colors.gray[400];
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      default:
        return 'ellipse-outline';
    }
  };

  const getStatusText = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Uploaded';
    }
  };

  const calculateProgress = () => {
    const totalDocs = documents.length;
    const completedDocs = documents.filter(doc => 
      doc.status === 'approved' || doc.status === 'pending'
    ).length;
    
    return (completedDocs / totalDocs) * 100;
  };

  const handleDocumentPress = (doc: Document) => {
    if (doc.status === 'rejected' && doc.rejectionReason) {
      Alert.alert(
        'Document Rejected',
        doc.rejectionReason,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Re-upload', onPress: () => router.push(`/(driver)/upload/${doc.type}` as any) },
        ]
      );
    } else if (doc.status === 'not_started') {
      router.push(`/(driver)/upload/${doc.type}` as any);
    } else {
      Alert.alert(
        doc.name,
        `Status: ${getStatusText(doc.status)}\n${doc.uploadedAt ? `Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}` : ''}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleContactSupport = () => {
    router.push('/(driver)/help/contact');
  };

  const progress = calculateProgress();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration Status</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            <Ionicons 
              name={
                overallStatus === 'approved' ? 'checkmark-circle' :
                overallStatus === 'rejected' ? 'close-circle' :
                overallStatus === 'pending' ? 'time' : 'information-circle'
              }
              size={48}
              color={Colors.white}
            />
            <Text style={styles.statusTitle}>
              {overallStatus === 'approved' ? 'Application Approved!' :
               overallStatus === 'rejected' ? 'Application Rejected' :
               overallStatus === 'pending' ? 'Under Review' :
               'Complete Your Application'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {overallStatus === 'approved' ? 'You can start accepting ride requests' :
               overallStatus === 'rejected' ? 'Please contact support for details' :
               overallStatus === 'pending' ? 'We are reviewing your documents' :
               'Upload all required documents to get started'}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress)}% Complete
            </Text>
          </View>
        </LinearGradient>

        {/* Documents Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          
          <View style={styles.documentsContainer}>
            {documents.map((doc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.documentItem}
                onPress={() => handleDocumentPress(doc)}
              >
                <View style={[
                  styles.documentIcon,
                  { backgroundColor: getStatusColor(doc.status) + '20' }
                ]}>
                  <Ionicons
                    name={doc.icon}
                    size={24}
                    color={getStatusColor(doc.status)}
                  />
                </View>

                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <View style={styles.documentStatus}>
                    <Ionicons
                      name={getStatusIcon(doc.status)}
                      size={14}
                      color={getStatusColor(doc.status)}
                    />
                    <Text style={[
                      styles.documentStatusText,
                      { color: getStatusColor(doc.status) }
                    ]}>
                      {getStatusText(doc.status)}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name={doc.status === 'not_started' ? 'cloud-upload-outline' : 'chevron-forward'}
                  size={20}
                  color={Colors.gray[400]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timeline (if status is not incomplete) */}
        {overallStatus !== 'incomplete' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Timeline</Text>
            
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotCompleted]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Application Submitted</Text>
                  <Text style={styles.timelineDate}>Jan 15, 2025</Text>
                </View>
              </View>

              {overallStatus === 'pending' || overallStatus === 'approved' ? (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotCompleted]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Documents Under Review</Text>
                    <Text style={styles.timelineDate}>In Progress</Text>
                  </View>
                </View>
              ) : null}

              {overallStatus === 'approved' && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotCompleted]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Approved</Text>
                    <Text style={styles.timelineDate}>Jan 18, 2025</Text>
                  </View>
                </View>
              )}

              {overallStatus === 'rejected' && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, styles.timelineDotRejected]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Rejected</Text>
                    <Text style={styles.timelineDate}>Jan 18, 2025</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {overallStatus === 'incomplete' && (
            <DriftButton
              title="Upload Documents"
              onPress={() => router.push('/(driver)/registration/vehicle-info')}
              variant="primary"
              icon="cloud-upload-outline"
              fullWidth
            />
          )}

          {overallStatus === 'rejected' && (
            <DriftButton
              title="Resubmit Application"
              onPress={() => router.push('/(driver)/registration/vehicle-info')}
              variant="primary"
              icon="refresh-outline"
              fullWidth
            />
          )}

          <DriftButton
            title="Contact Support"
            onPress={handleContactSupport}
            variant="outline"
            icon="chatbubbles-outline"
            fullWidth
            style={styles.supportButton}
          />
        </View>

        {/* Help Text */}
        <View style={styles.helpCard}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.info} />
          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpDescription}>
              {overallStatus === 'incomplete' 
                ? 'Upload all required documents to complete your application. Our team will review them within 24-48 hours.'
                : overallStatus === 'pending'
                ? 'Your application is under review. We\'ll notify you once the review is complete.'
                : overallStatus === 'approved'
                ? 'Congratulations! You can now start accepting ride requests.'
                : 'Contact our support team to understand why your application was rejected.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    flex: 1,
    textAlign: 'center',
  },
  
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  
  // Status Card
  statusCard: {
    margin: Spacing.base,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  
  statusHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  
  statusTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  
  statusSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: Spacing.sm,
  },
  
  progressContainer: {
    gap: Spacing.sm,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
  },
  
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
    textAlign: 'center',
  },
  
  // Documents Section
  section: {
    margin: Spacing.base,
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  
  documentsContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  
  documentInfo: {
    flex: 1,
  },
  
  documentName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: 4,
  },
  
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  documentStatusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  
  // Timeline
  timeline: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
  },
  
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  
  timelineDotCompleted: {
    backgroundColor: Colors.success,
  },
  
  timelineDotRejected: {
    backgroundColor: Colors.error,
  },
  
  timelineContent: {
    flex: 1,
  },
  
  timelineTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: 2,
  },
  
  timelineDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  
  // Actions
  actionsContainer: {
    marginHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  
  supportButton: {
    marginTop: Spacing.sm,
  },
  
  // Help Card
  helpCard: {
    flexDirection: 'row',
    margin: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.info + '40',
  },
  
  helpText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  
  helpTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.info,
    marginBottom: 4,
  },
  
  helpDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    lineHeight: 20,
  },
});