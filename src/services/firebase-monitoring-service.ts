/**
 * Firebase Monitoring Service - Analytics, Crashlytics, and Performance
 *
 * Provides centralized access to Firebase monitoring features:
 * - Analytics: Track user events and screen views
 * - Crashlytics: Crash reporting and error logging
 * - Performance: Network and custom trace monitoring
 */

// Lazy load Firebase modules to prevent crashes during bundle evaluation
let analytics: typeof import('@react-native-firebase/analytics').default | null = null;
let crashlytics: typeof import('@react-native-firebase/crashlytics').default | null = null;
let perf: typeof import('@react-native-firebase/perf').default | null = null;

function getAnalytics() {
  if (!analytics) {
    try {
      analytics = require('@react-native-firebase/analytics').default;
    } catch (e) {
      console.warn('Firebase Analytics not available:', e);
    }
  }
  return analytics;
}

function getCrashlytics() {
  if (!crashlytics) {
    try {
      crashlytics = require('@react-native-firebase/crashlytics').default;
    } catch (e) {
      console.warn('Firebase Crashlytics not available:', e);
    }
  }
  return crashlytics;
}

function getPerf() {
  if (!perf) {
    try {
      perf = require('@react-native-firebase/perf').default;
    } catch (e) {
      console.warn('Firebase Performance not available:', e);
    }
  }
  return perf;
}

// ============================================================================
// Initialize Firebase Monitoring
// ============================================================================

/**
 * Initialize all monitoring services
 * Call this early in app startup
 */
export async function initializeMonitoring(): Promise<void> {
  try {
    const analyticsModule = getAnalytics();
    const crashlyticsModule = getCrashlytics();

    // Enable analytics collection
    if (analyticsModule) {
      await analyticsModule().setAnalyticsCollectionEnabled(true);
    }

    // Enable crashlytics collection
    if (crashlyticsModule) {
      await crashlyticsModule().setCrashlyticsCollectionEnabled(true);
    }

    // Performance monitoring is enabled by default
    console.log('✅ Firebase monitoring initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase monitoring:', error);
  }
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Log a custom event
 */
export async function logEvent(
  eventName: string,
  params?: Record<string, any>
): Promise<void> {
  try {
    const analyticsModule = getAnalytics();
    if (analyticsModule) {
      await analyticsModule().logEvent(eventName, params);
    }
  } catch (error) {
    console.error('Analytics logEvent error:', error);
  }
}

/**
 * Log screen view
 */
export async function logScreenView(
  screenName: string,
  screenClass?: string
): Promise<void> {
  try {
    const analyticsModule = getAnalytics();
    if (analyticsModule) {
      await analyticsModule().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    }
  } catch (error) {
    console.error('Analytics logScreenView error:', error);
  }
}

/**
 * Set user ID for analytics
 */
export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  try {
    const analyticsModule = getAnalytics();
    if (analyticsModule) {
      await analyticsModule().setUserId(userId);
    }
  } catch (error) {
    console.error('Analytics setUserId error:', error);
  }
}

/**
 * Set user property
 */
export async function setUserProperty(
  name: string,
  value: string | null
): Promise<void> {
  try {
    const analyticsModule = getAnalytics();
    if (analyticsModule) {
      await analyticsModule().setUserProperty(name, value);
    }
  } catch (error) {
    console.error('Analytics setUserProperty error:', error);
  }
}

// Pre-defined event loggers for common actions
export const AnalyticsEvents = {
  // User events
  signUp: (method: string) => logEvent('sign_up', { method }),
  login: (method: string) => logEvent('login', { method }),
  logout: () => logEvent('logout'),

  // Trip events
  tripRequested: (tripType: string) =>
    logEvent('trip_requested', { trip_type: tripType }),
  tripStarted: (tripId: string) => logEvent('trip_started', { trip_id: tripId }),
  tripCompleted: (tripId: string, fare: number) =>
    logEvent('trip_completed', { trip_id: tripId, fare }),
  tripCancelled: (tripId: string, reason: string) =>
    logEvent('trip_cancelled', { trip_id: tripId, reason }),

  // Driver events
  driverWentOnline: () => logEvent('driver_online'),
  driverWentOffline: () => logEvent('driver_offline'),
  tripAccepted: (tripId: string) =>
    logEvent('trip_accepted', { trip_id: tripId }),

  // Payment events
  paymentMethodAdded: (type: string) =>
    logEvent('payment_method_added', { type }),
  paymentCompleted: (amount: number) =>
    logEvent('payment_completed', { amount }),

  // Safety events
  speedViolation: (excess: number) =>
    logEvent('speed_violation', { excess_mph: excess }),
  emergencyTriggered: () => logEvent('emergency_triggered'),
};

// ============================================================================
// Crashlytics Functions
// ============================================================================

/**
 * Set user ID for crash reports
 */
export async function setCrashlyticsUserId(userId: string): Promise<void> {
  try {
    const crashlyticsModule = getCrashlytics();
    if (crashlyticsModule) {
      await crashlyticsModule().setUserId(userId);
    }
  } catch (error) {
    console.error('Crashlytics setUserId error:', error);
  }
}

/**
 * Set custom attribute for crash reports
 */
export async function setCrashlyticsAttribute(
  key: string,
  value: string
): Promise<void> {
  try {
    const crashlyticsModule = getCrashlytics();
    if (crashlyticsModule) {
      await crashlyticsModule().setAttribute(key, value);
    }
  } catch (error) {
    console.error('Crashlytics setAttribute error:', error);
  }
}

/**
 * Log a message for crash reports
 */
export function logCrashlyticsMessage(message: string): void {
  try {
    const crashlyticsModule = getCrashlytics();
    if (crashlyticsModule) {
      crashlyticsModule().log(message);
    }
  } catch (error) {
    console.error('Crashlytics log error:', error);
  }
}

/**
 * Record a non-fatal error
 */
export function recordError(error: Error, context?: string): void {
  try {
    const crashlyticsModule = getCrashlytics();
    if (crashlyticsModule) {
      if (context) {
        crashlyticsModule().log(`Context: ${context}`);
      }
      crashlyticsModule().recordError(error);
    }
  } catch (e) {
    console.error('Crashlytics recordError error:', e);
  }
}

/**
 * Force a crash (for testing only!)
 */
export function testCrash(): void {
  const crashlyticsModule = getCrashlytics();
  if (crashlyticsModule) {
    crashlyticsModule().crash();
  }
}

// ============================================================================
// Performance Monitoring Functions
// ============================================================================

/**
 * Start a custom trace
 */
export async function startTrace(traceName: string) {
  try {
    const perfModule = getPerf();
    if (perfModule) {
      const trace = await perfModule().startTrace(traceName);
      return trace;
    }
    return null;
  } catch (error) {
    console.error('Performance startTrace error:', error);
    return null;
  }
}

/**
 * Create an HTTP metric for network request monitoring
 */
export function newHttpMetric(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') {
  try {
    const perfModule = getPerf();
    if (perfModule) {
      return perfModule().newHttpMetric(url, method);
    }
    return null;
  } catch (error) {
    console.error('Performance newHttpMetric error:', error);
    return null;
  }
}

// Pre-built performance traces
export const PerformanceTraces = {
  /**
   * Trace trip matching time
   */
  tripMatching: async () => {
    const trace = await startTrace('trip_matching');
    return {
      stop: async (matchedDriverId?: string) => {
        if (trace) {
          if (matchedDriverId) {
            await trace.putAttribute('driver_id', matchedDriverId);
          }
          await trace.stop();
        }
      },
    };
  },

  /**
   * Trace location update processing
   */
  locationUpdate: async () => {
    const trace = await startTrace('location_update');
    return {
      stop: async () => {
        if (trace) {
          await trace.stop();
        }
      },
    };
  },

  /**
   * Trace speed limit lookup
   */
  speedLimitLookup: async () => {
    const trace = await startTrace('speed_limit_lookup');
    return {
      stop: async (cached: boolean) => {
        if (trace) {
          await trace.putAttribute('cached', cached ? 'true' : 'false');
          await trace.stop();
        }
      },
    };
  },

  /**
   * Trace payment processing
   */
  paymentProcessing: async () => {
    const trace = await startTrace('payment_processing');
    return {
      stop: async (success: boolean) => {
        if (trace) {
          await trace.putAttribute('success', success ? 'true' : 'false');
          await trace.stop();
        }
      },
    };
  },
};

// ============================================================================
// Combined User Setup
// ============================================================================

/**
 * Set up user across all monitoring services
 * Call this after user login
 */
export async function setMonitoringUser(
  userId: string,
  role: string,
  email?: string
): Promise<void> {
  try {
    // Analytics
    await setAnalyticsUserId(userId);
    await setUserProperty('user_role', role);

    // Crashlytics
    await setCrashlyticsUserId(userId);
    await setCrashlyticsAttribute('role', role);
    if (email) {
      await setCrashlyticsAttribute('email', email);
    }

    console.log('✅ Monitoring user set:', userId);
  } catch (error) {
    console.error('Failed to set monitoring user:', error);
  }
}

/**
 * Clear user from monitoring services
 * Call this after user logout
 */
export async function clearMonitoringUser(): Promise<void> {
  try {
    await setAnalyticsUserId(null);
    console.log('✅ Monitoring user cleared');
  } catch (error) {
    console.error('Failed to clear monitoring user:', error);
  }
}

export default {
  initializeMonitoring,
  logEvent,
  logScreenView,
  setAnalyticsUserId,
  setUserProperty,
  AnalyticsEvents,
  setCrashlyticsUserId,
  setCrashlyticsAttribute,
  logCrashlyticsMessage,
  recordError,
  startTrace,
  newHttpMetric,
  PerformanceTraces,
  setMonitoringUser,
  clearMonitoringUser,
};
