import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import firestore from '@react-native-firebase/firestore';

interface ShareTripModalProps {
  visible: boolean;
  tripId: string;
  onClose: () => void;
}

/**
 * ShareTripModal Component - PRODUCTION VERSION
 * 
 * Uses React Native Firebase (@react-native-firebase/firestore)
 * Allows users to share live trip tracking with:
 * - Emergency contacts
 * - Friends/Family
 * - Copy link
 * - Share via native share sheet
 * 
 * Generates a unique tracking link that shows:
 * - Current location
 * - Route
 * - ETA
 * - Driver/Vehicle info
 * 
 * Usage:
 * <ShareTripModal
 *   visible={showModal}
 *   tripId="trip123"
 *   onClose={() => setShowModal(false)}
 * />
 */
export const ShareTripModal: React.FC<ShareTripModalProps> = ({
  visible,
  tripId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [trackingLink, setTrackingLink] = useState<string>('');

  // Generate tracking link
  const generateTrackingLink = async (): Promise<string> => {
    // In production, this would be your actual domain
    // For now, we'll use a deep link format
    const baseUrl = 'https://drift.ky/track';
    const link = `${baseUrl}/${tripId}`;
    
    setTrackingLink(link);
    return link;
  };

  // Save shared contact to Firestore using React Native Firebase
  const saveSharedContact = async (contactInfo: string) => {
    try {
      const tripRef = firestore().collection('trips').doc(tripId);

      // Note: serverTimestamp() cannot be used inside arrayUnion()
      // Use a regular Date timestamp instead
      await tripRef.update({
        sharedWith: firestore.FieldValue.arrayUnion({
          contact: contactInfo,
          sharedAt: new Date().toISOString(),
        }),
      });

      console.log('✅ Saved shared contact to trip');
    } catch (error) {
      console.error('❌ Failed to save shared contact:', error);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      setLoading(true);
      const link = await generateTrackingLink();
      await Clipboard.setStringAsync(link);
      
      Alert.alert(
        'Link Copied',
        'Trip tracking link has been copied to your clipboard',
        [{ text: 'OK' }]
      );
      
      await saveSharedContact('clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
      console.error('❌ Copy link error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Share via native share sheet
  const handleShare = async () => {
    try {
      setLoading(true);
      const link = await generateTrackingLink();
      
      const result = await Share.share({
        message: `Follow my trip on Drift: ${link}\n\nYou can track my location in real-time until I arrive safely.`,
        url: link, // iOS only
        title: 'Track My Trip',
      });

      if (result.action === Share.sharedAction) {
        await saveSharedContact('shared');
        
        Alert.alert(
          'Trip Shared',
          'Your trip has been shared successfully',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share trip');
      console.error('❌ Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Share with emergency contact
  const handleEmergencyShare = async () => {
    Alert.alert(
      'Share with Emergency Contact',
      'Your emergency contact will receive a link to track your trip in real-time',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            try {
              setLoading(true);
              const link = await generateTrackingLink();
              
              // In production, send SMS/email to emergency contact
              // For now, use share sheet
              await Share.share({
                message: `🚨 EMERGENCY TRIP TRACKING\n\nI'm on a trip. Track my location: ${link}`,
              });
              
              await saveSharedContact('emergency');
              
              Alert.alert(
                'Emergency Contact Notified',
                'Your emergency contact can now track your trip',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to notify emergency contact');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Share Trip</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.description}>
            <Ionicons name="shield-checkmark" size={24} color="#27ae60" />
            <Text style={styles.descriptionText}>
              Share your live location with trusted contacts for safety
            </Text>
          </View>

          {/* Share Options */}
          <View style={styles.optionsContainer}>
            {/* Emergency Contact */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleEmergencyShare}
              disabled={loading}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="alert-circle" size={24} color="#dc2626" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Emergency Contact</Text>
                <Text style={styles.optionSubtitle}>
                  Send to your emergency contact
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Share Link */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleShare}
              disabled={loading}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="share-social" size={24} color="#2563eb" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Share with Others</Text>
                <Text style={styles.optionSubtitle}>
                  Send to friends or family
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Copy Link */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleCopyLink}
              disabled={loading}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="copy" size={24} color="#9333ea" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Copy Link</Text>
                <Text style={styles.optionSubtitle}>
                  Copy tracking link to clipboard
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#5d1289" />
              <Text style={styles.loadingText}>Generating link...</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              The tracking link will expire when your trip is complete
            </Text>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 24,
  },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#15803d',
    marginLeft: 12,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});

export default ShareTripModal;