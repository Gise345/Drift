import { useState, useEffect, useCallback } from 'react';
import * as Updates from 'expo-updates';

export interface UpdateStatus {
  isChecking: boolean;
  isDownloading: boolean;
  updateAvailable: boolean;
  error: string | null;
}

export interface UpdateInfo {
  updateId: string | null;
  createdAt: Date | null;
  channel: string | null;
  runtimeVersion: string | null;
}

export interface UseAppUpdateReturn {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  checkForUpdates: () => Promise<boolean>;
  downloadAndApplyUpdate: () => Promise<void>;
  getCurrentUpdateInfo: () => UpdateInfo;
}

export function useAppUpdate(): UseAppUpdateReturn {
  const [status, setStatus] = useState<UpdateStatus>({
    isChecking: false,
    isDownloading: false,
    updateAvailable: false,
    error: null,
  });

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  /**
   * Get information about the currently running update
   */
  const getCurrentUpdateInfo = useCallback((): UpdateInfo => {
    if (__DEV__) {
      console.log('[EAS Update] Skipping getCurrentUpdateInfo in development mode');
      return {
        updateId: null,
        createdAt: null,
        channel: null,
        runtimeVersion: null,
      };
    }

    try {
      const currentUpdate = Updates.currentlyRunning;
      const info: UpdateInfo = {
        updateId: currentUpdate.updateId || null,
        createdAt: currentUpdate.createdAt || null,
        channel: currentUpdate.channel || null,
        runtimeVersion: currentUpdate.runtimeVersion || null,
      };
      console.log('[EAS Update] Current update info:', info);
      return info;
    } catch (error) {
      console.log('[EAS Update] Error getting current update info:', error);
      return {
        updateId: null,
        createdAt: null,
        channel: null,
        runtimeVersion: null,
      };
    }
  }, []);

  /**
   * Check for available updates
   * @returns true if an update is available, false otherwise
   */
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (__DEV__) {
      console.log('[EAS Update] Skipping update check in development mode');
      return false;
    }

    console.log('[EAS Update] Checking for updates...');
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const checkResult = await Updates.checkForUpdateAsync();

      if (checkResult.isAvailable) {
        console.log('[EAS Update] Update available!');
        setUpdateInfo({
          updateId: checkResult.manifest?.id || null,
          createdAt: checkResult.manifest?.createdAt ? new Date(checkResult.manifest.createdAt) : null,
          channel: null,
          runtimeVersion: checkResult.manifest?.runtimeVersion || null,
        });
        setStatus(prev => ({
          ...prev,
          isChecking: false,
          updateAvailable: true
        }));
        return true;
      } else {
        console.log('[EAS Update] No update available');
        setStatus(prev => ({
          ...prev,
          isChecking: false,
          updateAvailable: false
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log('[EAS Update] Error checking for updates:', errorMessage);
      setStatus(prev => ({
        ...prev,
        isChecking: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  /**
   * Download and apply the available update
   * This will restart the app after applying the update
   */
  const downloadAndApplyUpdate = useCallback(async (): Promise<void> => {
    if (__DEV__) {
      console.log('[EAS Update] Skipping update download in development mode');
      return;
    }

    if (!status.updateAvailable) {
      console.log('[EAS Update] No update available to download');
      return;
    }

    console.log('[EAS Update] Downloading update...');
    setStatus(prev => ({ ...prev, isDownloading: true, error: null }));

    try {
      const fetchResult = await Updates.fetchUpdateAsync();

      if (fetchResult.isNew) {
        console.log('[EAS Update] Update downloaded successfully. Restarting app...');
        await Updates.reloadAsync();
      } else {
        console.log('[EAS Update] Downloaded update is not new');
        setStatus(prev => ({
          ...prev,
          isDownloading: false,
          updateAvailable: false
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log('[EAS Update] Error downloading update:', errorMessage);
      setStatus(prev => ({
        ...prev,
        isDownloading: false,
        error: errorMessage,
      }));
    }
  }, [status.updateAvailable]);

  // Check for updates on mount (only in production)
  useEffect(() => {
    if (__DEV__) {
      console.log('[EAS Update] Development mode detected, skipping automatic update check');
      return;
    }

    console.log('[EAS Update] Initializing and checking for updates on mount...');

    // Get current update info
    const currentInfo = getCurrentUpdateInfo();
    setUpdateInfo(currentInfo);

    // Check for updates
    checkForUpdates();
  }, [checkForUpdates, getCurrentUpdateInfo]);

  return {
    status,
    updateInfo,
    checkForUpdates,
    downloadAndApplyUpdate,
    getCurrentUpdateInfo,
  };
}

export default useAppUpdate;
