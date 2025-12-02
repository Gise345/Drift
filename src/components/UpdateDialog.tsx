import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAppUpdate } from '@/src/hooks/useAppUpdate';

interface UpdateDialogProps {
  /** Whether to show the update available dialog */
  showDialog?: boolean;
  /** Callback when update is dismissed */
  onDismiss?: () => void;
  /** Custom title for the update dialog */
  title?: string;
  /** Custom message for the update dialog */
  message?: string;
}

/**
 * UpdateDialog Component
 *
 * Shows an alert dialog when an update is available and displays
 * a loading overlay while the update is being downloaded.
 *
 * Can be used as an alternative to AutoUpdate for more control over the update UX.
 */
export function UpdateDialog({
  showDialog = true,
  onDismiss,
  title = 'Update Available',
  message = 'A new version of the app is available. Would you like to update now?',
}: UpdateDialogProps): React.ReactElement | null {
  const { status, downloadAndApplyUpdate } = useAppUpdate();
  const [dialogShown, setDialogShown] = useState(false);

  // Show alert dialog when update is available
  useEffect(() => {
    if (__DEV__) {
      return;
    }

    if (status.updateAvailable && showDialog && !dialogShown && !status.isDownloading) {
      setDialogShown(true);
      console.log('[EAS Update] Showing update dialog to user');

      Alert.alert(
        title,
        message,
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              console.log('[EAS Update] User dismissed update dialog');
              onDismiss?.();
            },
          },
          {
            text: 'Update Now',
            style: 'default',
            onPress: () => {
              console.log('[EAS Update] User accepted update');
              downloadAndApplyUpdate();
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [status.updateAvailable, showDialog, dialogShown, status.isDownloading, downloadAndApplyUpdate, onDismiss, title, message]);

  // Reset dialog shown state when update is no longer available
  useEffect(() => {
    if (!status.updateAvailable) {
      setDialogShown(false);
    }
  }, [status.updateAvailable]);

  // Show error alert if update fails
  useEffect(() => {
    if (status.error && dialogShown) {
      console.log('[EAS Update] Update error:', status.error);
      Alert.alert(
        'Update Failed',
        `Failed to download update: ${status.error}. Please try again later.`,
        [{ text: 'OK' }]
      );
    }
  }, [status.error, dialogShown]);

  // Show loading overlay while downloading
  if (status.isDownloading) {
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Downloading Update...</Text>
            <Text style={styles.loadingSubtext}>
              The app will restart automatically
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    minWidth: 250,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[800],
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    textAlign: 'center',
  },
});

export default UpdateDialog;
