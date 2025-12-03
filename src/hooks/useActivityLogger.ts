/**
 * useActivityLogger Hook
 *
 * Automatically sets up activity logging context when a user is authenticated.
 * Use this in your root layout or app component.
 *
 * Usage:
 *   import { useActivityLogger } from '@/hooks/useActivityLogger';
 *
 *   export default function RootLayout() {
 *     useActivityLogger();
 *     // ...
 *   }
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { ActivityLogger } from '../services/activity-logger.service';
import { Logger } from '../services/logger.service';

export function useActivityLogger() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Determine user type based on roles
      let userType: 'rider' | 'driver' | 'admin' = 'rider';
      if (user.roles?.includes('ADMIN')) {
        userType = 'admin';
      } else if (user.roles?.includes('DRIVER')) {
        userType = 'driver';
      }

      // Set user context for activity logging
      ActivityLogger.setUserContext(user.id, userType);
      Logger.info('App', 'Activity logger context set', { userId: user.id, userType });

      // Log app opened event
      ActivityLogger.log('APP_OPENED', {
        userId: user.id,
        userType,
      });
    } else {
      // Clear context on sign out
      ActivityLogger.clearUserContext();
    }
  }, [isAuthenticated, user?.id]);

  return {
    // Expose methods for manual logging from components
    logScreenView: (screenName: string, metadata?: Record<string, any>) => {
      ActivityLogger.logScreenView(screenName, metadata);
    },
    logAction: (action: string, metadata?: Record<string, any>) => {
      ActivityLogger.log('FEATURE_USED', { action, ...metadata });
    },
    logError: (error: Error | string, context?: Record<string, any>) => {
      ActivityLogger.logError(error, context);
    },
  };
}

export default useActivityLogger;
