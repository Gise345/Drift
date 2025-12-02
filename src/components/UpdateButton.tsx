import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAppUpdate } from '@/src/hooks/useAppUpdate';

interface UpdateButtonProps {
  /** Custom styles for the container */
  containerStyle?: object;
  /** Custom styles for the button */
  buttonStyle?: object;
  /** Show the current version info */
  showVersion?: boolean;
  /** Callback when update check completes */
  onCheckComplete?: (hasUpdate: boolean) => void;
}

/**
 * UpdateButton Component
 *
 * A settings button that displays the current app version and allows
 * users to manually check for and apply updates.
 *
 * Features:
 * - Shows current app version
 * - Check for updates button
 * - Update available button (when update is detected)
 * - Loading states during check/download
 */
export function UpdateButton({
  containerStyle,
  buttonStyle,
  showVersion = true,
  onCheckComplete,
}: UpdateButtonProps): React.ReactElement {
  const { status, checkForUpdates, downloadAndApplyUpdate } = useAppUpdate();

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleCheckForUpdates = async (): Promise<void> => {
    console.log('[EAS Update] Manual update check initiated');
    const hasUpdate = await checkForUpdates();
    onCheckComplete?.(hasUpdate);
  };

  const handleApplyUpdate = async (): Promise<void> => {
    console.log('[EAS Update] Manual update apply initiated');
    await downloadAndApplyUpdate();
  };

  const renderButton = (): React.ReactElement => {
    // Checking for updates
    if (status.isChecking) {
      return (
        <View style={[styles.button, styles.buttonDisabled, buttonStyle]}>
          <ActivityIndicator size="small" color={Colors.gray[400]} />
          <Text style={styles.buttonTextDisabled}>Checking...</Text>
        </View>
      );
    }

    // Downloading update
    if (status.isDownloading) {
      return (
        <View style={[styles.button, styles.buttonDisabled, buttonStyle]}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.buttonTextDisabled}>Downloading...</Text>
        </View>
      );
    }

    // Update available
    if (status.updateAvailable) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.buttonUpdate, buttonStyle]}
          onPress={handleApplyUpdate}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonTextUpdate}>Update Available</Text>
        </TouchableOpacity>
      );
    }

    // Error state
    if (status.error) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.buttonError, buttonStyle]}
          onPress={handleCheckForUpdates}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonTextError}>Retry Check</Text>
        </TouchableOpacity>
      );
    }

    // Default: Check for updates
    return (
      <TouchableOpacity
        style={[styles.button, styles.buttonDefault, buttonStyle]}
        onPress={handleCheckForUpdates}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonTextDefault}>Check for Updates</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {showVersion && (
        <View style={styles.versionContainer}>
          <Text style={styles.versionLabel}>App Version</Text>
          <Text style={styles.versionNumber}>{appVersion}</Text>
        </View>
      )}
      {renderButton()}
      {status.error && (
        <Text style={styles.errorText}>{status.error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
  },
  versionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  versionLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  versionNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[800],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  buttonDefault: {
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  buttonUpdate: {
    backgroundColor: Colors.primary,
  },
  buttonError: {
    backgroundColor: Colors.error,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray[100],
  },
  buttonTextDefault: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  buttonTextUpdate: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  buttonTextError: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  buttonTextDisabled: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[400],
  },
  errorText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    textAlign: 'center',
  },
});

export default UpdateButton;
