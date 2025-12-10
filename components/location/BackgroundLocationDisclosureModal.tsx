/**
 * BACKGROUND LOCATION DISCLOSURE MODAL
 *
 * Google Play requires a PROMINENT in-app disclosure BEFORE requesting
 * background location permission. This full-screen modal satisfies that requirement.
 *
 * Requirements met:
 * 1. Full-screen modal that cannot be dismissed by tapping outside
 * 2. Explains WHY background location is needed
 * 3. Explains WHAT data is collected
 * 4. Explains WHEN collection occurs
 * 5. User must explicitly tap a button to proceed
 * 6. Uses required keywords: "location", "background", "when the app is closed"
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BackgroundLocationDisclosureModalProps {
  visible: boolean;
  userType: 'rider' | 'driver';
  onAccept: () => void;
  onDecline: () => void;
}

const DISCLOSURE_CONTENT = {
  rider: {
    title: 'Background Location Access',
    subtitle: 'Required for Trip Safety Features',
    icon: 'location' as const,
    reasons: [
      {
        icon: 'people' as const,
        title: 'Share Your Trip',
        description: 'Allow friends and family to track your ride in real-time for safety',
      },
      {
        icon: 'shield-checkmark' as const,
        title: 'Emergency Alerts',
        description: 'Enable automatic alerts to emergency contacts if something seems wrong',
      },
      {
        icon: 'time' as const,
        title: 'Accurate ETAs',
        description: 'Keep your trip tracking accurate even when your screen is off',
      },
    ],
    dataCollection: 'Your location is ONLY collected during active trips. Tracking automatically stops when your trip ends.',
    keywords: 'This app collects location data in the background, even when the app is closed or not in use, to enable trip sharing and safety features.',
  },
  driver: {
    title: 'Background Location Required',
    subtitle: 'Essential for Driver Operations',
    icon: 'car' as const,
    reasons: [
      {
        icon: 'navigate' as const,
        title: 'Turn-by-Turn Navigation',
        description: 'Keep navigation working even when your screen turns off',
      },
      {
        icon: 'people' as const,
        title: 'Rider Updates',
        description: 'Provide accurate arrival times to riders waiting for pickup',
      },
      {
        icon: 'document-text' as const,
        title: 'Trip Records',
        description: 'Record trip routes for earnings and safety documentation',
      },
    ],
    dataCollection: 'Your location is ONLY collected when you are online or during active trips. Tracking automatically stops when you go offline.',
    keywords: 'This app collects location data in the background, even when the app is closed or not in use, to provide navigation and rider updates.',
  },
};

export function BackgroundLocationDisclosureModal({
  visible,
  userType,
  onAccept,
  onDecline,
}: BackgroundLocationDisclosureModalProps) {
  const content = DISCLOSURE_CONTENT[userType];

  // Prevent back button from dismissing on Android
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Don't dismiss - user must make a choice
      return true;
    });

    return () => backHandler.remove();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Prevent closing - user must make a choice
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name={content.icon} size={48} color={Colors.primary} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>

            {/* Google Play Required Disclosure Text */}
            <View style={styles.disclosureBox}>
              <Ionicons name="information-circle" size={20} color="#FFA500" />
              <Text style={styles.disclosureText}>{content.keywords}</Text>
            </View>

            {/* Reasons List */}
            <View style={styles.reasonsContainer}>
              <Text style={styles.sectionTitle}>Why we need this:</Text>
              {content.reasons.map((reason, index) => (
                <View key={index} style={styles.reasonItem}>
                  <View style={styles.reasonIcon}>
                    <Ionicons name={reason.icon} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.reasonText}>
                    <Text style={styles.reasonTitle}>{reason.title}</Text>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Data Collection Info */}
            <View style={styles.dataBox}>
              <Text style={styles.dataTitle}>When is location collected?</Text>
              <Text style={styles.dataText}>{content.dataCollection}</Text>
            </View>

            {/* Privacy Assurance */}
            <View style={styles.privacyBox}>
              <Ionicons name="lock-closed" size={18} color="#10B981" />
              <Text style={styles.privacyText}>
                Your location is never sold or shared with advertisers.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={onAccept}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Allow Background Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.declineButton}
                onPress={onDecline}
                activeOpacity={0.8}
              >
                <Text style={styles.declineButtonText}>Not Now</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              You can change this permission anytime in your device settings.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: 60, // Push modal down from top
    paddingBottom: 120, // Extra padding for phone navigation bar
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'], // Extra bottom padding inside scroll for buttons
    alignItems: 'center',
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  disclosureBox: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  disclosureText: {
    flex: 1,
    fontSize: 13,
    color: '#FFA500',
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  reasonsContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  reasonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  reasonText: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  reasonDescription: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 18,
  },
  dataBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  dataText: {
    fontSize: 13,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  privacyText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  declineButtonText: {
    color: '#999999',
    fontSize: 15,
    fontWeight: '500',
  },
  footerNote: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});

export default BackgroundLocationDisclosureModal;
