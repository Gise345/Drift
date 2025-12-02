import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppUpdate } from '@/src/hooks/useAppUpdate';

/**
 * AutoUpdate Component
 *
 * Automatically checks for updates when the app becomes active
 * and downloads/applies updates when available.
 *
 * This component renders nothing (returns null) and works silently in the background.
 * Add it as a child component in your root layout to enable automatic updates.
 */
export function AutoUpdate(): null {
  const { status, checkForUpdates, downloadAndApplyUpdate } = useAppUpdate();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Handle app state changes to check for updates when app becomes active
  useEffect(() => {
    if (__DEV__) {
      console.log('[EAS Update] AutoUpdate disabled in development mode');
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
      // Check for updates when app comes to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[EAS Update] App became active, checking for updates...');
        checkForUpdates();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkForUpdates]);

  // Automatically download and apply update when available
  useEffect(() => {
    if (__DEV__) {
      return;
    }

    if (status.updateAvailable && !status.isDownloading && !status.error) {
      console.log('[EAS Update] Update available, automatically downloading...');
      downloadAndApplyUpdate();
    }
  }, [status.updateAvailable, status.isDownloading, status.error, downloadAndApplyUpdate]);

  // This component renders nothing
  return null;
}

export default AutoUpdate;
