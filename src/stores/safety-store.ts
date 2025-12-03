/**
 * DRIFT SAFETY STORE
 * Zustand store for managing safety monitoring state
 */

import { create } from 'zustand';
import {
  SafetyMonitoringState,
  SpeedMonitorState,
  RouteDeviation,
  EarlyCompletion,
  EmergencyAlert,
  Strike,
  DriverSafetyProfile,
} from '@/src/types/safety.types';
import { SpeedMonitor, getSpeedMonitor, resetSpeedMonitor } from '@/src/services/speedLimitService';
import {
  RouteDeviationMonitor,
  getRouteDeviationMonitor,
  resetRouteDeviationMonitor,
  DEVIATION_CONSTANTS,
} from '@/src/services/routeDeviationService';
import {
  triggerSOS,
  callEmergencyServices,
  handleNoResponseAlert,
  getEmergencyContacts,
  saveEmergencyContacts,
} from '@/src/services/emergencyService';
import {
  initializeSafetyNotifications,
  sendRiderSpeedAlertNotification,
  sendRouteDeviationNotification,
  setupNotificationResponseListener,
  subscribeToSafetyAlerts,
  markSafetyAlertResponded,
  NOTIFICATION_ACTIONS,
} from '@/src/services/safety-notification.service';
import {
  getDriverSafetyProfile,
  getDriverStrikes,
  canDriverGoOnline,
  submitAppeal,
} from '@/src/services/strikeService';
import {
  createDispute,
  getUserDisputes,
  holdPayment,
} from '@/src/services/paymentDisputeService';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
}

interface SafetyStore {
  // State
  isMonitoring: boolean;
  tripId: string | null;
  driverId: string | null;
  riderId: string | null;

  // Speed monitoring
  speedState: SpeedMonitorState;
  speedMonitor: SpeedMonitor | null;

  // Route deviation
  routeDeviationActive: boolean;
  currentDeviation: RouteDeviation | null;
  routeDeviationMonitor: RouteDeviationMonitor | null;

  // Alerts
  showDeviationAlert: boolean;
  showEarlyCompletionAlert: boolean;
  earlyCompletion: EarlyCompletion | null;
  alertCountdown: number;
  countdownInterval: ReturnType<typeof setInterval> | null;

  // Rider speeding alert
  showRiderSpeedingAlert: boolean;
  riderSpeedingAlertDismissed: boolean;

  // Emergency
  emergencyMode: boolean;
  emergencyAlert: EmergencyAlert | null;

  // Driver safety profile
  driverProfile: DriverSafetyProfile | null;
  driverStrikes: Strike[];

  // Emergency contacts
  emergencyContacts: EmergencyContact[];

  // Notification subscription
  notificationUnsubscribe: (() => void) | null;
  safetyAlertUnsubscribe: (() => void) | null;

  // Loading states
  loading: boolean;

  // Actions - Monitoring
  startMonitoring: (tripId: string, driverId: string, riderId: string, route: Array<{ latitude: number; longitude: number }>, destination: { latitude: number; longitude: number }) => void;
  stopMonitoring: () => void;
  updateSpeed: (speedMps: number, latitude: number, longitude: number) => Promise<void>;
  checkLocation: (latitude: number, longitude: number) => Promise<void>;

  // Actions - Alerts
  showRouteDeviationAlert: (deviation: RouteDeviation) => void;
  showEarlyCompletionAlertModal: (completion: EarlyCompletion) => void;
  respondToDeviationAlert: (response: 'okay' | 'sos') => Promise<void>;
  respondToEarlyCompletionAlert: (response: 'okay' | 'sos') => Promise<void>;
  dismissAlert: () => void;
  startAlertCountdown: () => void;
  handleAlertTimeout: () => Promise<void>;

  // Actions - Emergency
  triggerEmergencySOS: () => Promise<void>;
  callEmergency: () => Promise<void>;
  resolveEmergency: () => void;

  // Actions - Driver Profile
  loadDriverProfile: (driverId: string) => Promise<void>;
  loadDriverStrikes: (driverId: string) => Promise<void>;
  checkCanGoOnline: (driverId: string) => Promise<{ canGoOnline: boolean; reason?: string }>;

  // Actions - Appeals
  submitStrikeAppeal: (strikeId: string, reason: string, evidenceUrls: string[]) => Promise<{ success: boolean; error?: string }>;

  // Actions - Disputes
  fileDispute: (tripId: string, reason: string, description: string) => Promise<{ success: boolean; error?: string }>;
  loadDisputes: (userId: string, userType: 'rider' | 'driver') => Promise<void>;

  // Actions - Emergency Contacts
  loadEmergencyContacts: (userId: string) => Promise<void>;
  saveContacts: (userId: string, contacts: Omit<EmergencyContact, 'id'>[]) => Promise<{ success: boolean }>;

  // Actions - Notifications
  initializeNotifications: () => Promise<void>;
  showRiderSpeedAlert: () => void;
  dismissRiderSpeedAlert: () => void;

  // Reset
  reset: () => void;
}

const initialSpeedState: SpeedMonitorState = {
  currentSpeed: 0,
  currentSpeedLimit: null,
  alertLevel: 'normal',
  isViolating: false,
  violationStartTime: null,
  consecutiveViolationSeconds: 0,
};

export const useSafetyStore = create<SafetyStore>((set, get) => ({
  // Initial state
  isMonitoring: false,
  tripId: null,
  driverId: null,
  riderId: null,
  speedState: initialSpeedState,
  speedMonitor: null,
  routeDeviationActive: false,
  currentDeviation: null,
  routeDeviationMonitor: null,
  showDeviationAlert: false,
  showEarlyCompletionAlert: false,
  earlyCompletion: null,
  alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
  countdownInterval: null,
  showRiderSpeedingAlert: false,
  riderSpeedingAlertDismissed: false,
  emergencyMode: false,
  emergencyAlert: null,
  driverProfile: null,
  driverStrikes: [],
  emergencyContacts: [],
  notificationUnsubscribe: null,
  safetyAlertUnsubscribe: null,
  loading: false,

  // Start safety monitoring for a trip
  startMonitoring: (tripId, driverId, riderId, route, destination) => {
    console.log('Starting safety monitoring for trip:', tripId);

    // Initialize speed monitor
    const speedMonitor = getSpeedMonitor(tripId, driverId);

    // Initialize route deviation monitor
    const routeMonitor = getRouteDeviationMonitor(tripId);
    routeMonitor.setPlannedRoute(route);
    routeMonitor.setDestination(destination);

    // Set up deviation alert callback
    routeMonitor.onDeviationAlert((deviation) => {
      get().showRouteDeviationAlert(deviation);
      // Send notification to rider
      sendRouteDeviationNotification(tripId, riderId, 'rider', deviation.deviationDistance);
    });

    // Set up early completion callback
    routeMonitor.onEarlyCompletionAlert((completion) => {
      get().showEarlyCompletionAlertModal(completion);
    });

    // Subscribe to safety alerts from Firebase (for cross-device sync)
    const safetyUnsubscribe = subscribeToSafetyAlerts(tripId, (alert) => {
      console.log('Safety alert received from Firebase:', alert);

      if (alert.type === 'safety_message' && alert.messageType === 'slow_down_request') {
        // Driver received a slow-down request from rider
        console.log('Rider requested driver to slow down');
      }
    });

    set({
      isMonitoring: true,
      tripId,
      driverId,
      riderId,
      speedMonitor,
      routeDeviationMonitor: routeMonitor,
      speedState: initialSpeedState,
      routeDeviationActive: false,
      currentDeviation: null,
      safetyAlertUnsubscribe: safetyUnsubscribe,
    });
  },

  // Stop monitoring
  stopMonitoring: () => {
    const { countdownInterval, safetyAlertUnsubscribe } = get();

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    if (safetyAlertUnsubscribe) {
      safetyAlertUnsubscribe();
    }

    resetSpeedMonitor();
    resetRouteDeviationMonitor();

    set({
      isMonitoring: false,
      tripId: null,
      driverId: null,
      riderId: null,
      speedMonitor: null,
      routeDeviationMonitor: null,
      speedState: initialSpeedState,
      routeDeviationActive: false,
      currentDeviation: null,
      showDeviationAlert: false,
      showEarlyCompletionAlert: false,
      earlyCompletion: null,
      alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
      countdownInterval: null,
      showRiderSpeedingAlert: false,
      riderSpeedingAlertDismissed: false,
      safetyAlertUnsubscribe: null,
    });

    console.log('Safety monitoring stopped');
  },

  // Update speed reading
  updateSpeed: async (speedMps, latitude, longitude) => {
    const { speedMonitor, isMonitoring } = get();

    if (!isMonitoring || !speedMonitor) return;

    const newState = await speedMonitor.processSpeedUpdate(speedMps, latitude, longitude);
    set({ speedState: newState });
  },

  // Check location for route deviation
  checkLocation: async (latitude, longitude) => {
    const { routeDeviationMonitor, isMonitoring } = get();

    if (!isMonitoring || !routeDeviationMonitor) return;

    const result = await routeDeviationMonitor.checkLocation({ latitude, longitude });

    set({
      routeDeviationActive: result.isDeviating,
      currentDeviation: result.deviation,
    });
  },

  // Show route deviation alert
  showRouteDeviationAlert: (deviation) => {
    console.log('Showing route deviation alert:', deviation.id);

    set({
      showDeviationAlert: true,
      currentDeviation: deviation,
      alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
    });

    get().startAlertCountdown();
  },

  // Show early completion alert
  showEarlyCompletionAlertModal: (completion) => {
    console.log('Showing early completion alert:', completion.id);

    set({
      showEarlyCompletionAlert: true,
      earlyCompletion: completion,
      alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
    });

    get().startAlertCountdown();
  },

  // Respond to deviation alert
  respondToDeviationAlert: async (response) => {
    const { routeDeviationMonitor, currentDeviation, countdownInterval } = get();

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    if (routeDeviationMonitor && currentDeviation) {
      await routeDeviationMonitor.handleDeviationResponse(currentDeviation.id, response);
    }

    if (response === 'sos') {
      await get().triggerEmergencySOS();
    }

    set({
      showDeviationAlert: false,
      alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
      countdownInterval: null,
    });
  },

  // Respond to early completion alert
  respondToEarlyCompletionAlert: async (response) => {
    const { routeDeviationMonitor, earlyCompletion, countdownInterval } = get();

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    if (routeDeviationMonitor && earlyCompletion) {
      await routeDeviationMonitor.handleEarlyCompletionResponse(earlyCompletion.id, response);
    }

    if (response === 'sos') {
      await get().triggerEmergencySOS();
    }

    set({
      showEarlyCompletionAlert: false,
      earlyCompletion: null,
      alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
      countdownInterval: null,
    });
  },

  // Dismiss alert
  dismissAlert: () => {
    const { countdownInterval } = get();

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    set({
      showDeviationAlert: false,
      showEarlyCompletionAlert: false,
      alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
      countdownInterval: null,
    });
  },

  // Start countdown timer for alert
  startAlertCountdown: () => {
    const { countdownInterval: existingInterval } = get();

    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      const { alertCountdown, showDeviationAlert, showEarlyCompletionAlert } = get();

      if (!showDeviationAlert && !showEarlyCompletionAlert) {
        clearInterval(interval);
        set({ countdownInterval: null });
        return;
      }

      if (alertCountdown <= 1) {
        clearInterval(interval);
        get().handleAlertTimeout();
        return;
      }

      set({ alertCountdown: alertCountdown - 1 });
    }, 1000);

    set({ countdownInterval: interval });
  },

  // Handle alert timeout (no response)
  handleAlertTimeout: async () => {
    const { tripId, riderId, showDeviationAlert, showEarlyCompletionAlert, routeDeviationMonitor } = get();

    console.log('Alert timeout - no response from user');

    if (tripId && riderId) {
      const alertType = showDeviationAlert ? 'route_deviation' : 'early_completion';
      await handleNoResponseAlert(tripId, riderId, 'rider', alertType);
    }

    if (routeDeviationMonitor) {
      await routeDeviationMonitor.handleNoResponse(
        showDeviationAlert ? 'deviation' : 'early_completion'
      );
    }

    set({
      showDeviationAlert: false,
      showEarlyCompletionAlert: false,
      earlyCompletion: null,
      alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
      countdownInterval: null,
    });
  },

  // Trigger emergency SOS
  triggerEmergencySOS: async () => {
    const { tripId, driverId, riderId, currentDeviation } = get();

    if (!tripId || !riderId) {
      console.error('Cannot trigger SOS: missing trip or rider info');
      return;
    }

    set({ emergencyMode: true });

    // Get current location from deviation or default
    const location = currentDeviation?.actualLocation || { latitude: 0, longitude: 0 };

    const result = await triggerSOS(
      riderId,
      'rider',
      {
        tripId,
        driverId: driverId || '',
        riderId,
        currentLocation: location,
      }
    );

    if (result.success && result.data) {
      set({ emergencyAlert: result.data });
    }

    // Call emergency services
    await callEmergencyServices();
  },

  // Call emergency services directly
  callEmergency: async () => {
    await callEmergencyServices();
  },

  // Resolve emergency
  resolveEmergency: () => {
    set({
      emergencyMode: false,
      emergencyAlert: null,
    });
  },

  // Load driver safety profile
  loadDriverProfile: async (driverId) => {
    set({ loading: true });

    try {
      const profile = await getDriverSafetyProfile(driverId);
      set({ driverProfile: profile, loading: false });
    } catch (error) {
      console.error('Failed to load driver profile:', error);
      set({ loading: false });
    }
  },

  // Load driver strikes
  loadDriverStrikes: async (driverId) => {
    try {
      const strikes = await getDriverStrikes(driverId, false);
      set({ driverStrikes: strikes });
    } catch (error) {
      console.error('Failed to load driver strikes:', error);
    }
  },

  // Check if driver can go online
  checkCanGoOnline: async (driverId) => {
    return await canDriverGoOnline(driverId);
  },

  // Submit appeal for a strike
  submitStrikeAppeal: async (strikeId, reason, evidenceUrls) => {
    const { driverId } = get();

    if (!driverId) {
      return { success: false, error: 'Driver ID not set' };
    }

    const result = await submitAppeal(driverId, strikeId, undefined, reason, evidenceUrls);

    if (result.success) {
      // Reload strikes to reflect updated status
      await get().loadDriverStrikes(driverId);
    }

    return result;
  },

  // File a payment dispute
  fileDispute: async (tripId, reason, description) => {
    const { riderId } = get();

    if (!riderId) {
      return { success: false, error: 'Rider ID not set' };
    }

    const result = await createDispute(
      tripId,
      riderId,
      reason as any,
      description
    );

    return result;
  },

  // Load disputes for user
  loadDisputes: async (userId, userType) => {
    try {
      const disputes = await getUserDisputes(userId, userType);
      // You could store these in state if needed
      console.log(`Loaded ${disputes.length} disputes for ${userType}`);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    }
  },

  // Load emergency contacts
  loadEmergencyContacts: async (userId) => {
    try {
      const contacts = await getEmergencyContacts(userId);
      set({ emergencyContacts: contacts });
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
    }
  },

  // Save emergency contacts
  saveContacts: async (userId, contacts) => {
    const result = await saveEmergencyContacts(userId, contacts);

    if (result.success) {
      await get().loadEmergencyContacts(userId);
    }

    return result;
  },

  // Initialize safety notifications
  initializeNotifications: async () => {
    try {
      // Initialize notification categories and permissions
      await initializeSafetyNotifications();

      // Set up notification response listener
      const notificationSubscription = setupNotificationResponseListener((response) => {
        const actionId = response.actionIdentifier;
        const data = response.notification.request.content.data as any;
        const { tripId } = get();

        console.log('Notification response received:', actionId, data);

        // Handle notification actions
        switch (actionId) {
          case NOTIFICATION_ACTIONS.IM_OK:
            // User pressed "I'm OK" from notification
            if (data?.tripId && tripId === data.tripId) {
              get().dismissAlert();
              markSafetyAlertResponded(data.tripId, 'ok', data.userType || 'rider');
            }
            break;

          case NOTIFICATION_ACTIONS.SLOW_DOWN:
          case NOTIFICATION_ACTIONS.ACKNOWLEDGE_SPEED:
            // Driver acknowledged speed warning from notification
            if (data?.tripId) {
              markSafetyAlertResponded(data.tripId, 'acknowledged', 'driver');
            }
            break;

          case NOTIFICATION_ACTIONS.WARN_DRIVER:
            // Rider wants to warn driver - show in-app alert
            set({ showRiderSpeedingAlert: true });
            break;

          case NOTIFICATION_ACTIONS.END_RIDE:
            // Rider wants to end ride - handled by app when foregrounded
            set({ showRiderSpeedingAlert: true });
            break;

          case NOTIFICATION_ACTIONS.CALL_EMERGENCY:
            // User wants to call emergency services
            get().callEmergency();
            break;
        }
      });

      set({
        notificationUnsubscribe: () => notificationSubscription.remove(),
      });

      console.log('Safety notifications initialized');
    } catch (error) {
      console.error('Failed to initialize safety notifications:', error);
    }
  },

  // Show rider speeding alert
  showRiderSpeedAlert: () => {
    const { riderSpeedingAlertDismissed } = get();
    if (!riderSpeedingAlertDismissed) {
      set({ showRiderSpeedingAlert: true });
    }
  },

  // Dismiss rider speeding alert
  dismissRiderSpeedAlert: () => {
    set({
      showRiderSpeedingAlert: false,
      riderSpeedingAlertDismissed: true,
    });

    // Reset dismissed flag after 60 seconds so alert can show again
    setTimeout(() => {
      set({ riderSpeedingAlertDismissed: false });
    }, 60000);
  },

  // Reset store
  reset: () => {
    const { countdownInterval, notificationUnsubscribe, safetyAlertUnsubscribe } = get();

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    if (notificationUnsubscribe) {
      notificationUnsubscribe();
    }

    if (safetyAlertUnsubscribe) {
      safetyAlertUnsubscribe();
    }

    resetSpeedMonitor();
    resetRouteDeviationMonitor();

    set({
      isMonitoring: false,
      tripId: null,
      driverId: null,
      riderId: null,
      speedState: initialSpeedState,
      speedMonitor: null,
      routeDeviationActive: false,
      currentDeviation: null,
      routeDeviationMonitor: null,
      showDeviationAlert: false,
      showEarlyCompletionAlert: false,
      earlyCompletion: null,
      alertCountdown: DEVIATION_CONSTANTS.ALERT_RESPONSE_TIMEOUT,
      countdownInterval: null,
      showRiderSpeedingAlert: false,
      riderSpeedingAlertDismissed: false,
      emergencyMode: false,
      emergencyAlert: null,
      driverProfile: null,
      driverStrikes: [],
      emergencyContacts: [],
      notificationUnsubscribe: null,
      safetyAlertUnsubscribe: null,
      loading: false,
    });
  },
}));
