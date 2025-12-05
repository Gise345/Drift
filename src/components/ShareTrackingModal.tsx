/**
 * Share Tracking Modal
 *
 * A beautiful modal for sharing live trip tracking links with contacts.
 * Matches the Drift design system and provides multiple sharing options.
 *
 * Features:
 * - Contact selection from device contacts
 * - Quick share to favorite contacts
 * - Copy link to clipboard
 * - SMS sending integration
 * - Trip info display
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';
import { shareTrackingViaSMS } from '@/src/services/trackingService';
import type { TrackingContact, NamedLocation, VehicleInfo } from '@/src/types/tracking';

// ============================================================================
// Types
// ============================================================================

interface RideInfo {
  riderName: string;
  driverName: string;
  pickup: NamedLocation;
  dropoff: NamedLocation;
  vehicle?: VehicleInfo;
}

interface ShareTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  trackingUrl: string | null;
  rideInfo: RideInfo | null;
  onShared?: (contact: TrackingContact) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ShareTrackingModal({
  visible,
  onClose,
  trackingUrl,
  rideInfo,
  onShared,
}: ShareTrackingModalProps) {
  const insets = useSafeAreaInsets();

  // State
  const [contacts, setContacts] = useState<TrackingContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<TrackingContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [favorites, setFavorites] = useState<TrackingContact[]>([]);

  // Load contacts on mount
  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  // Filter contacts when search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phoneNumber.includes(query)
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  /**
   * Load contacts from device
   */
  const loadContacts = async () => {
    try {
      setLoading(true);

      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setLoading(false);
        return;
      }

      setPermissionGranted(true);

      // Fetch contacts with phone numbers
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      // Transform to our contact format
      const transformedContacts: TrackingContact[] = [];

      data.forEach((contact) => {
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          // Use the first mobile number, or first number if no mobile
          const phoneNumber =
            contact.phoneNumbers.find((p) => p.label === 'mobile')?.number ||
            contact.phoneNumbers[0].number;

          if (phoneNumber) {
            transformedContacts.push({
              id: contact.id || `${contact.name}-${phoneNumber}`,
              name: contact.name || 'Unknown',
              phoneNumber: phoneNumber.replace(/\s/g, ''),
              photoUri: contact.image?.uri,
              isFavorite: false,
            });
          }
        }
      });

      setContacts(transformedContacts);
      setFilteredContacts(transformedContacts);

      // Set first 5 contacts as "quick" favorites for demo
      // In production, this would be from user preferences/history
      setFavorites(transformedContacts.slice(0, 5));
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle sharing to a contact via SMS
   */
  const handleShareToContact = async (contact: TrackingContact) => {
    if (!trackingUrl) {
      Alert.alert('Error', 'No tracking link available');
      return;
    }

    try {
      setSharing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const success = await shareTrackingViaSMS(contact.phoneNumber, contact.name);

      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onShared?.(contact);
        Alert.alert(
          'Link Shared!',
          `Tracking link sent to ${contact.name}`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('Could not send', 'Please try copying the link instead');
      }
    } catch (error) {
      console.error('❌ Error sharing:', error);
      Alert.alert('Error', 'Failed to share tracking link');
    } finally {
      setSharing(false);
    }
  };

  /**
   * Copy link to clipboard
   */
  const handleCopyLink = async () => {
    if (!trackingUrl) {
      Alert.alert('Error', 'No tracking link available');
      return;
    }

    try {
      await Clipboard.setStringAsync(trackingUrl);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('❌ Error copying:', error);
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  /**
   * Open settings to enable contacts permission
   */
  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  /**
   * Handle close
   */
  const handleClose = () => {
    setSearchQuery('');
    setCopied(false);
    onClose();
  };

  /**
   * Render a contact item
   */
  const renderContactItem = useCallback(
    ({ item }: { item: TrackingContact }) => (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleShareToContact(item)}
        activeOpacity={0.7}
        disabled={sharing}
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.contactInitial}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.contactPhone} numberOfLines={1}>
            {item.phoneNumber}
          </Text>
        </View>
        <Ionicons name="send-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
    ),
    [sharing]
  );

  /**
   * Render quick share button
   */
  const renderQuickShareButton = (contact: TrackingContact) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.quickShareButton}
      onPress={() => handleShareToContact(contact)}
      activeOpacity={0.7}
      disabled={sharing}
    >
      <View style={styles.quickShareAvatar}>
        <Text style={styles.quickShareInitial}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.quickShareName} numberOfLines={1}>
        {contact.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );

  // ============================================================================
  // Render
  // ============================================================================

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
            <Text style={styles.title}>Share Trip</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Trip Info Card */}
          {rideInfo && (
            <View style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.tripTitle}>
                  {rideInfo.riderName}'s Trip
                </Text>
              </View>
              <View style={styles.tripRoute}>
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, styles.pickupDot]} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {rideInfo.pickup.name}
                  </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, styles.dropoffDot]} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {rideInfo.dropoff.name}
                  </Text>
                </View>
              </View>
              {rideInfo.vehicle && (
                <View style={styles.vehicleInfo}>
                  <Ionicons name="car" size={16} color={Colors.gray[500]} />
                  <Text style={styles.vehicleText}>
                    {rideInfo.vehicle.color} {rideInfo.vehicle.make} {rideInfo.vehicle.model}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Copy Link Button */}
          <TouchableOpacity
            style={[styles.copyButton, copied && styles.copyButtonSuccess]}
            onPress={handleCopyLink}
            activeOpacity={0.7}
          >
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color={copied ? Colors.success : Colors.primary}
            />
            <Text style={[styles.copyButtonText, copied && styles.copyButtonTextSuccess]}>
              {copied ? 'Link Copied!' : 'Copy Tracking Link'}
            </Text>
          </TouchableOpacity>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : !permissionGranted ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.gray[400]} />
              <Text style={styles.permissionTitle}>Contacts Access Needed</Text>
              <Text style={styles.permissionText}>
                Allow access to your contacts to quickly share your trip with friends and family.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={handleOpenSettings}
              >
                <Text style={styles.permissionButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Quick Share */}
              {favorites.length > 0 && (
                <View style={styles.quickShareSection}>
                  <Text style={styles.sectionTitle}>Quick Share</Text>
                  <View style={styles.quickShareList}>
                    {favorites.map(renderQuickShareButton)}
                  </View>
                </View>
              )}

              {/* Search */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.gray[400]} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search contacts..."
                  placeholderTextColor={Colors.gray[400]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={Colors.gray[400]} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Contacts List */}
              <Text style={styles.sectionTitle}>All Contacts</Text>
              <FlatList
                data={filteredContacts}
                renderItem={renderContactItem}
                keyExtractor={(item) => item.id}
                style={styles.contactsList}
                contentContainerStyle={styles.contactsContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {searchQuery
                        ? 'No contacts found'
                        : 'No contacts with phone numbers'}
                    </Text>
                  </View>
                }
              />
            </>
          )}

          {/* Loading Overlay */}
          {sharing && (
            <View style={styles.sharingOverlay}>
              <ActivityIndicator size="large" color={Colors.white} />
              <Text style={styles.sharingText}>Sending...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

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
    minHeight: '60%',
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

  // Trip Card
  tripCard: {
    margin: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tripTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginLeft: Spacing.sm,
  },
  tripRoute: {
    paddingLeft: Spacing.sm,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  pickupDot: {
    backgroundColor: Colors.success,
  },
  dropoffDot: {
    backgroundColor: Colors.error,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.gray[300],
    marginLeft: 4,
    marginVertical: 2,
  },
  routeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
    flex: 1,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  vehicleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginLeft: Spacing.xs,
  },

  // Copy Button
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  copyButtonSuccess: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success + '30',
  },
  copyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  copyButtonTextSuccess: {
    color: Colors.success,
  },

  // Quick Share
  quickShareSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  quickShareList: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  quickShareButton: {
    alignItems: 'center',
    marginRight: Spacing.lg,
    width: 60,
  },
  quickShareAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickShareInitial: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  quickShareName: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    marginLeft: Spacing.sm,
    height: '100%',
  },

  // Contacts List
  contactsList: {
    flex: 1,
  },
  contactsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
  },
  contactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.black,
  },
  contactPhone: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: Spacing.md,
  },

  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl * 2,
  },
  permissionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  permissionButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },

  // Sharing Overlay
  sharingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sharingText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginTop: Spacing.md,
  },
});

export default ShareTrackingModal;
