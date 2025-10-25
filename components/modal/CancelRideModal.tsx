import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CancelRideModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const CANCEL_REASONS = [
  'Driver is taking too long',
  'Wrong pickup location',
  'Change of plans',
  'Found alternative transportation',
  'Driver requested cancellation',
  'Other',
];

export const CancelRideModal: React.FC<CancelRideModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (reason) {
      onConfirm(reason);
      setSelectedReason('');
      setCustomReason('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Cancel Ride</Text>
          </View>

          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="close-circle" size={48} color="#EF4444" />
            </View>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            Are you sure you want to cancel this ride?
          </Text>
          <Text style={styles.subMessage}>
            Please let us know why you're canceling
          </Text>

          {/* Reasons */}
          <View style={styles.reasonsContainer}>
            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  selectedReason === reason && styles.reasonButtonSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
                {selectedReason === reason && (
                  <Ionicons name="checkmark-circle" size={20} color="#5d1289ff" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom reason input */}
          {selectedReason === 'Other' && (
            <TextInput
              style={styles.input}
              placeholder="Please specify your reason..."
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}

          {/* Warning Notice */}
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
            <Text style={styles.noticeText}>
              Frequent cancellations may affect your account standing
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.keepButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.keepButtonText}>Keep Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                !selectedReason && styles.cancelButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedReason}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Yes, Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  reasonButtonSelected: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#5d1289ff',
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
  },
  reasonTextSelected: {
    color: '#5d1289ff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#000',
    height: 80,
    marginBottom: 16,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  keepButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  keepButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});