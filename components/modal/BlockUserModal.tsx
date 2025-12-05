/**
 * Block User Modal
 *
 * A reusable modal for blocking users after trips or from safety alerts.
 *
 * Features:
 * - Clear explanation of what blocking does
 * - Reason selection for safety tracking
 * - Optional additional details
 * - Confirmation before blocking
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';
import {
  blockUser,
  BlockReason,
  BLOCK_REASON_LABELS,
  UserType,
} from '@/src/services/blocking.service';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  onBlocked?: () => void;
  // User performing the block
  blockerId: string;
  blockerName?: string;
  blockerType: UserType;
  // User being blocked
  blockedId: string;
  blockedName: string;
  blockedType: UserType;
  // Optional trip context
  tripId?: string;
}

const BLOCK_REASONS: { value: BlockReason; label: string; icon: string }[] = [
  { value: 'safety_concern', label: 'Safety concern', icon: 'shield-outline' },
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior', icon: 'warning-outline' },
  { value: 'harassment', label: 'Harassment', icon: 'alert-circle-outline' },
  { value: 'uncomfortable', label: 'Made me feel uncomfortable', icon: 'sad-outline' },
  { value: 'gender_violation', label: 'Gender safety violation', icon: 'person-outline' },
  { value: 'other', label: 'Other reason', icon: 'ellipsis-horizontal-outline' },
];

export function BlockUserModal({
  visible,
  onClose,
  onBlocked,
  blockerId,
  blockerName,
  blockerType,
  blockedId,
  blockedName,
  blockedType,
  tripId,
}: BlockUserModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<BlockReason | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleClose = () => {
    // Reset state
    setSelectedReason(null);
    setAdditionalDetails('');
    setShowConfirmation(false);
    onClose();
  };

  const handleProceedToConfirm = () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason for blocking this user.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmBlock = async () => {
    if (!selectedReason) return;

    setLoading(true);

    try {
      const reason = additionalDetails.trim()
        ? `${BLOCK_REASON_LABELS[selectedReason]}: ${additionalDetails.trim()}`
        : BLOCK_REASON_LABELS[selectedReason];

      await blockUser({
        blockerId,
        blockedId,
        blockerType,
        blockedType,
        blockerName,
        blockedName,
        reason,
        reasonType: selectedReason,
        tripId,
      });

      Alert.alert(
        'User Blocked',
        `${blockedName} has been blocked. You will no longer be matched with this ${blockedType}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onBlocked?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Handle */}
          <View style={styles.handle}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.gray[600]} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {showConfirmation ? 'Confirm Block' : 'Block User'}
            </Text>
            <View style={styles.closeButton} />
          </View>

          {!showConfirmation ? (
            // Reason Selection Screen
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* User Info */}
              <View style={styles.userInfoCard}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={32} color={Colors.error} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{blockedName}</Text>
                  <Text style={styles.userType}>
                    {blockedType === 'driver' ? 'Driver' : 'Rider'}
                  </Text>
                </View>
              </View>

              {/* Warning */}
              <View style={styles.warningCard}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.error} />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Blocking this user will:</Text>
                  <Text style={styles.warningText}>
                    {'\u2022'} Prevent you from being matched in future rides
                  </Text>
                  <Text style={styles.warningText}>
                    {'\u2022'} Hide your profile from them
                  </Text>
                  <Text style={styles.warningText}>
                    {'\u2022'} This action can be undone from Settings
                  </Text>
                </View>
              </View>

              {/* Reason Selection */}
              <Text style={styles.sectionTitle}>Why are you blocking this user?</Text>
              <View style={styles.reasonsList}>
                {BLOCK_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonOption,
                      selectedReason === reason.value && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setSelectedReason(reason.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={reason.icon as any}
                      size={22}
                      color={selectedReason === reason.value ? Colors.error : Colors.gray[600]}
                    />
                    <Text
                      style={[
                        styles.reasonText,
                        selectedReason === reason.value && styles.reasonTextSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                    {selectedReason === reason.value && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.error} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Additional Details */}
              {selectedReason && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Additional details (optional)</Text>
                  <TextInput
                    style={styles.detailsInput}
                    placeholder="Provide any additional context..."
                    placeholderTextColor={Colors.gray[400]}
                    value={additionalDetails}
                    onChangeText={setAdditionalDetails}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>{additionalDetails.length}/500</Text>
                </View>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !selectedReason && styles.continueButtonDisabled,
                ]}
                onPress={handleProceedToConfirm}
                disabled={!selectedReason}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            // Confirmation Screen
            <View style={styles.content}>
              <View style={styles.confirmationContent}>
                <View style={styles.confirmIcon}>
                  <Ionicons name="ban" size={48} color={Colors.error} />
                </View>

                <Text style={styles.confirmTitle}>
                  Block {blockedName}?
                </Text>

                <Text style={styles.confirmDescription}>
                  You will no longer be matched with this {blockedType}.
                  They will not be notified of this block.
                </Text>

                <View style={styles.confirmReasonCard}>
                  <Text style={styles.confirmReasonLabel}>Reason:</Text>
                  <Text style={styles.confirmReasonText}>
                    {selectedReason ? BLOCK_REASON_LABELS[selectedReason] : ''}
                  </Text>
                </View>

                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowConfirmation(false)}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Go Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.blockButton, loading && styles.blockButtonDisabled]}
                    onPress={handleConfirmBlock}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="ban" size={18} color={Colors.white} />
                        <Text style={styles.blockButtonText}>Block User</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: 2,
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // User Info Card
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  userType: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: 2,
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  warningContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  warningTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    lineHeight: 18,
    marginTop: 2,
  },

  // Reason Selection
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  reasonsList: {
    gap: Spacing.sm,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: Spacing.md,
  },
  reasonOptionSelected: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error,
  },
  reasonText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  reasonTextSelected: {
    color: Colors.error,
    fontFamily: Typography.fontFamily.bold,
  },

  // Additional Details
  detailsSection: {
    marginTop: Spacing.lg,
  },
  detailsLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  detailsInput: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  // Continue Button
  continueButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  continueButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  // Confirmation Screen
  confirmationContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  confirmIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  confirmTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  confirmDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  confirmReasonCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  confirmReasonLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  confirmReasonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[700],
  },
  blockButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  blockButtonDisabled: {
    opacity: 0.6,
  },
  blockButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});

export default BlockUserModal;
