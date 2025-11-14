import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';
import { useDriverStore } from '@/src/stores/driver-store';
import { useAuthStore } from '@/src/stores/auth-store';
import type { Document as DriverDocument } from '@/src/stores/driver-store';

interface DisplayDocument {
  id: string;
  type: string;
  name: string;
  status: 'approved' | 'pending' | 'expired' | 'rejected';
  uploadDate: Date;
  expiryDate?: string;
  icon: string;
  required: boolean;
  frontImageUrl?: string;
  backImageUrl?: string;
  rejectionReason?: string;
}

export default function DocumentsScreen() {
  const { user } = useAuthStore();
  const { documents: storeDocuments, loadDriverProfile } = useDriverStore();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DisplayDocument[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      if (user?.id) {
        await loadDriverProfile(user.id);
        setLoading(false);
      }
    };
    loadDocuments();
  }, [user?.id]);

  useEffect(() => {
    // Map store documents to display format
    const mappedDocs: DisplayDocument[] = storeDocuments.map((doc) => ({
      id: doc.id,
      type: doc.type,
      name: getDocumentName(doc.type),
      status: doc.status as any,
      uploadDate: doc.uploadedAt,
      expiryDate: doc.expiryDate,
      icon: getDocumentIcon(doc.type),
      required: true,
      frontImageUrl: doc.frontImageUrl,
      backImageUrl: doc.backImageUrl,
      rejectionReason: doc.rejectionReason,
    }));
    setDocuments(mappedDocs);
  }, [storeDocuments]);

  const getDocumentName = (type: string) => {
    switch (type) {
      case 'license':
        return "Driver's License";
      case 'insurance':
        return 'Vehicle Insurance';
      case 'registration':
        return 'Vehicle Registration';
      case 'inspection':
        return 'Safety Inspection';
      default:
        return type;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'license':
        return 'card';
      case 'insurance':
        return 'shield-checkmark';
      case 'registration':
        return 'document-text';
      case 'inspection':
        return 'checkmark-circle';
      default:
        return 'document';
    }
  };

  const getStatusColor = (status: DisplayDocument['status']) => {
    switch (status) {
      case 'approved':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'expired':
      case 'rejected':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: DisplayDocument['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending Review';
      case 'expired':
        return 'Expired';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getActionText = (status: DisplayDocument['status']) => {
    switch (status) {
      case 'expired':
      case 'rejected':
        return 'Update Document';
      case 'pending':
        return 'View Details';
      default:
        return 'View Document';
    }
  };

  const handleDocumentAction = (doc: DisplayDocument) => {
    // Show the document image
    if (doc.frontImageUrl) {
      setSelectedImage(doc.frontImageUrl);
    } else {
      Alert.alert('No Image', 'This document has no uploaded image.');
    }
  };

  const expiredDocs = documents.filter(doc => doc.status === 'expired' || doc.status === 'rejected');
  const pendingDocs = documents.filter(doc => doc.status === 'pending');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Documents</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Documents</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Alerts */}
        {expiredDocs.length > 0 && (
          <View style={styles.alert}>
            <View style={[styles.alertIcon, { backgroundColor: `${Colors.error}15` }]}>
              <Ionicons name="alert-circle" size={24} color={Colors.error} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Action Required</Text>
              <Text style={styles.alertText}>
                {expiredDocs.length} document{expiredDocs.length > 1 ? 's' : ''} need{expiredDocs.length === 1 ? 's' : ''} your attention
              </Text>
            </View>
          </View>
        )}

        {pendingDocs.length > 0 && (
          <View style={[styles.alert, { backgroundColor: `${Colors.warning}10` }]}>
            <View style={[styles.alertIcon, { backgroundColor: `${Colors.warning}15` }]}>
              <Ionicons name="time" size={24} color={Colors.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Under Review</Text>
              <Text style={styles.alertText}>
                {pendingDocs.length} document{pendingDocs.length > 1 ? 's are' : ' is'} being verified
              </Text>
            </View>
          </View>
        )}

        {/* Documents List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          <View style={styles.documentsList}>
            {documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentCard}
                onPress={() => handleDocumentAction(doc)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.documentIcon,
                  { backgroundColor: `${getStatusColor(doc.status)}15` }
                ]}>
                  <Ionicons name={doc.icon as any} size={24} color={getStatusColor(doc.status)} />
                </View>
                
                <View style={styles.documentInfo}>
                  <View style={styles.documentHeader}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    {doc.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.statusRow}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(doc.status)}15` }
                    ]}>
                      <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                        {getStatusText(doc.status)}
                      </Text>
                    </View>
                    {doc.expiryDate && doc.status !== 'expired' && (
                      <Text style={styles.expiryText}>
                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDocumentAction(doc)}
                  >
                    <Text style={styles.actionText}>{getActionText(doc.status)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <View style={styles.helpIcon}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
          </View>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              All documents must be clear, valid, and up-to-date to continue driving
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color={Colors.white} />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  alert: {
    flexDirection: 'row',
    backgroundColor: `${Colors.error}10`,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  documentsList: {
    gap: Spacing.md,
  },
  documentCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  documentIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  documentName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  requiredText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  expiryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  helpSection: {
    flexDirection: 'row',
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
  },
  helpIcon: {
    marginRight: Spacing.sm,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  helpText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: Spacing.sm,
  },
  modalImage: {
    width: '90%',
    height: '80%',
  },
});