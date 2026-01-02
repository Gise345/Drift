/**
 * Store Update Prompt Component
 *
 * Shows a popup when a new app version is available in the App Store / Google Play.
 * This is for native builds that require store download (not OTA updates).
 *
 * Checks version from Firestore 'appConfig' collection and compares with current app version.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import Constants from 'expo-constants';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';

// App Store URLs
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.drift.global';
const APP_STORE_URL = 'https://apps.apple.com/app/drift/id'; // Add your App Store ID after approval

// Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface VersionConfig {
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  updateMessage?: string;
  iosAppStoreId?: string;
}

interface StoreUpdatePromptProps {
  /** If true, shows update even for optional updates */
  showOptionalUpdates?: boolean;
}

/**
 * Compare semantic versions
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

export function StoreUpdatePrompt({ showOptionalUpdates = true }: StoreUpdatePromptProps) {
  const [visible, setVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [iosAppStoreId, setIosAppStoreId] = useState<string>('');

  useEffect(() => {
    checkForStoreUpdate();
  }, []);

  const checkForStoreUpdate = async () => {
    try {
      // Get current app version
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      console.log('[StoreUpdate] Current app version:', currentVersion);

      // Fetch version config from Firestore
      const configRef = doc(db, 'appConfig', 'version');
      const configSnap = await getDoc(configRef);

      if (!configSnap.exists()) {
        console.log('[StoreUpdate] No version config found in Firestore');
        return;
      }

      const config = configSnap.data() as VersionConfig;
      console.log('[StoreUpdate] Version config:', config);

      setLatestVersion(config.latestVersion);
      setIosAppStoreId(config.iosAppStoreId || '');

      // Check if update is required (below minimum version)
      if (compareVersions(currentVersion, config.minVersion) < 0) {
        console.log('[StoreUpdate] Force update required - below minimum version');
        setForceUpdate(true);
        setUpdateMessage(
          config.updateMessage ||
            'A critical update is required to continue using Drift. Please update the app now.'
        );
        setVisible(true);
        return;
      }

      // Check if optional update is available
      if (showOptionalUpdates && compareVersions(currentVersion, config.latestVersion) < 0) {
        console.log('[StoreUpdate] Optional update available');
        setForceUpdate(false);
        setUpdateMessage(
          config.updateMessage ||
            `A new version of Drift (${config.latestVersion}) is available with improvements and bug fixes.`
        );
        setVisible(true);
      }
    } catch (error) {
      console.error('[StoreUpdate] Error checking for updates:', error);
    }
  };

  const handleUpdate = () => {
    const storeUrl =
      Platform.OS === 'ios'
        ? iosAppStoreId
          ? `https://apps.apple.com/app/id${iosAppStoreId}`
          : APP_STORE_URL
        : GOOGLE_PLAY_URL;

    console.log('[StoreUpdate] Opening store URL:', storeUrl);
    Linking.openURL(storeUrl).catch((err) => {
      console.error('[StoreUpdate] Error opening store:', err);
    });
  };

  const handleLater = () => {
    if (!forceUpdate) {
      setVisible(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : handleLater}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Image
              source={require('@/assets/images/app-icon.png')}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {forceUpdate ? 'Update Required' : 'Update Available'}
          </Text>

          {/* Version info */}
          <Text style={styles.versionText}>Version {latestVersion}</Text>

          {/* Message */}
          <Text style={styles.message}>{updateMessage}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>
                {Platform.OS === 'ios' ? 'Update on App Store' : 'Update on Google Play'}
              </Text>
            </TouchableOpacity>

            {!forceUpdate && (
              <TouchableOpacity
                style={styles.laterButton}
                onPress={handleLater}
                activeOpacity={0.7}
              >
                <Text style={styles.laterButtonText}>Later</Text>
              </TouchableOpacity>
            )}
          </View>

          {forceUpdate && (
            <Text style={styles.forceUpdateNote}>
              This update is required to continue using the app.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  appIcon: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  versionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.purple,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  updateButton: {
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  updateButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  laterButtonText: {
    color: Colors.gray[500],
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  forceUpdateNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});

export default StoreUpdatePrompt;
