/**
 * Activity Logger Service for Drift App
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 *
 * Logs important app events to Firestore for monitoring and debugging
 * in development, preview, and production environments.
 *
 * Events are stored in the 'activity_logs' collection and can be viewed
 * in the Firebase Console or through an admin screen.
 *
 * Usage:
 *   import { ActivityLogger } from '@/services/activity-logger.service';
 *   await ActivityLogger.log('RIDE_REQUESTED', { tripId: '123', pickupAddress: '...' });
 */

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Logger } from './logger.service';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

// Activity event types
export type ActivityEventType =
  // Authentication events
  | 'AUTH_SIGN_UP'
  | 'AUTH_SIGN_IN'
  | 'AUTH_SIGN_OUT'
  | 'AUTH_PASSWORD_RESET'
  | 'AUTH_ERROR'
  // Trip lifecycle events
  | 'RIDE_REQUESTED'
  | 'RIDE_ACCEPTED'
  | 'RIDE_STARTED'
  | 'RIDE_PICKUP_ARRIVED'
  | 'RIDE_IN_PROGRESS'
  | 'RIDE_COMPLETED'
  | 'RIDE_CANCELLED'
  | 'RIDE_ERROR'
  // Payment events
  | 'PAYMENT_METHOD_ADDED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'TIP_ADDED'
  // Driver events
  | 'DRIVER_REGISTRATION_STARTED'
  | 'DRIVER_REGISTRATION_COMPLETED'
  | 'DRIVER_DOCUMENT_UPLOADED'
  | 'DRIVER_APPROVED'
  | 'DRIVER_REJECTED'
  | 'DRIVER_ONLINE'
  | 'DRIVER_OFFLINE'
  // Safety events
  | 'SPEED_VIOLATION'
  | 'ROUTE_DEVIATION'
  | 'EMERGENCY_TRIGGERED'
  | 'STRIKE_ISSUED'
  | 'SAFETY_CONCERN_REPORTED'
  // Navigation events
  | 'NAVIGATION_STARTED'
  | 'NAVIGATION_REROUTED'
  | 'NAVIGATION_COMPLETED'
  // General app events
  | 'APP_OPENED'
  | 'APP_BACKGROUNDED'
  | 'SCREEN_VIEWED'
  | 'FEATURE_USED'
  | 'ERROR_OCCURRED';

// Activity log entry structure
export interface ActivityLogEntry {
  id?: string;
  eventType: ActivityEventType;
  timestamp: FirebaseFirestoreTypes.Timestamp | Date;
  environment: 'development' | 'preview' | 'production';
  userId?: string;
  userType?: 'rider' | 'driver' | 'admin';
  tripId?: string;
  metadata?: Record<string, any>;
  deviceInfo?: {
    platform?: string;
    version?: string;
  };
}

// Query options for fetching logs
export interface ActivityLogQuery {
  userId?: string;
  eventType?: ActivityEventType;
  startDate?: Date;
  endDate?: Date;
  environment?: string;
  limit?: number;
}

class ActivityLoggerService {
  private collectionName = 'activity_logs';
  private isEnabled = true;
  private userId: string | null = null;
  private userType: 'rider' | 'driver' | 'admin' | null = null;
  private environment: 'development' | 'preview' | 'production';

  constructor() {
    this.environment = Logger.getEnvironment();
  }

  /**
   * Set the current user context for logging
   */
  setUserContext(userId: string, userType: 'rider' | 'driver' | 'admin'): void {
    this.userId = userId;
    this.userType = userType;
    Logger.debug('ActivityLogger', 'User context set', { userId, userType });
  }

  /**
   * Clear user context (on sign out)
   */
  clearUserContext(): void {
    this.userId = null;
    this.userType = null;
    Logger.debug('ActivityLogger', 'User context cleared');
  }

  /**
   * Enable/disable activity logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    Logger.info('ActivityLogger', `Activity logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Log an activity event to Firestore
   */
  async log(
    eventType: ActivityEventType,
    metadata?: Record<string, any>,
    tripId?: string
  ): Promise<string | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const entry: Omit<ActivityLogEntry, 'id'> = {
        eventType,
        timestamp: new Date(),
        environment: this.environment,
        userId: this.userId || undefined,
        userType: this.userType || undefined,
        tripId,
        metadata,
        deviceInfo: {
          platform: Platform.OS,
          version: Constants.expoConfig?.version,
        },
      };

      // Log to console via Logger
      Logger.info('Activity', `${eventType}`, { tripId, ...metadata });

      // Save to Firestore
      const collectionRef = collection(db, this.collectionName);
      const docRef = await addDoc(collectionRef, entry);

      return docRef.id;
    } catch (error) {
      Logger.error('ActivityLogger', 'Failed to log activity', { eventType, error });
      return null;
    }
  }

  /**
   * Fetch activity logs with optional filters
   */
  async getLogs(queryParams: ActivityLogQuery = {}): Promise<ActivityLogEntry[]> {
    try {
      const collectionRef = collection(db, this.collectionName);
      const constraints: any[] = [];

      // Apply filters
      if (queryParams.userId) {
        constraints.push(where('userId', '==', queryParams.userId));
      }

      if (queryParams.eventType) {
        constraints.push(where('eventType', '==', queryParams.eventType));
      }

      if (queryParams.environment) {
        constraints.push(where('environment', '==', queryParams.environment));
      }

      if (queryParams.startDate) {
        constraints.push(where('timestamp', '>=', queryParams.startDate));
      }

      if (queryParams.endDate) {
        constraints.push(where('timestamp', '<=', queryParams.endDate));
      }

      // Order by timestamp descending (most recent first)
      constraints.push(orderBy('timestamp', 'desc'));

      // Apply limit
      constraints.push(limit(queryParams.limit || 100));

      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as ActivityLogEntry));
    } catch (error) {
      Logger.error('ActivityLogger', 'Failed to fetch logs', error);
      return [];
    }
  }

  /**
   * Get logs for a specific trip
   */
  async getTripLogs(tripId: string): Promise<ActivityLogEntry[]> {
    try {
      const collectionRef = collection(db, this.collectionName);
      const q = query(
        collectionRef,
        where('tripId', '==', tripId),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as ActivityLogEntry));
    } catch (error) {
      Logger.error('ActivityLogger', 'Failed to fetch trip logs', error);
      return [];
    }
  }

  /**
   * Get logs for the current user
   */
  async getCurrentUserLogs(limit = 50): Promise<ActivityLogEntry[]> {
    if (!this.userId) {
      Logger.warn('ActivityLogger', 'No user context set for getCurrentUserLogs');
      return [];
    }

    return this.getLogs({ userId: this.userId, limit });
  }

  /**
   * Subscribe to real-time log updates (useful for admin monitoring)
   */
  subscribeToLogs(
    callback: (logs: ActivityLogEntry[]) => void,
    queryParams: ActivityLogQuery = {}
  ): () => void {
    const collectionRef = collection(db, this.collectionName);
    const constraints: any[] = [];

    if (queryParams.environment) {
      constraints.push(where('environment', '==', queryParams.environment));
    }

    constraints.push(orderBy('timestamp', 'desc'));
    constraints.push(limit(queryParams.limit || 50));

    const q = query(collectionRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const logs = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as ActivityLogEntry));
        callback(logs);
      },
      error => {
        Logger.error('ActivityLogger', 'Subscription error', error);
      }
    );

    return unsubscribe;
  }

  // Convenience methods for common events

  async logAuth(event: 'SIGN_UP' | 'SIGN_IN' | 'SIGN_OUT' | 'PASSWORD_RESET' | 'ERROR', metadata?: Record<string, any>): Promise<void> {
    await this.log(`AUTH_${event}` as ActivityEventType, metadata);
  }

  async logRide(
    event: 'REQUESTED' | 'ACCEPTED' | 'STARTED' | 'PICKUP_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ERROR',
    tripId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(`RIDE_${event}` as ActivityEventType, metadata, tripId);
  }

  async logPayment(
    event: 'METHOD_ADDED' | 'INITIATED' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
    metadata?: Record<string, any>,
    tripId?: string
  ): Promise<void> {
    await this.log(`PAYMENT_${event}` as ActivityEventType, metadata, tripId);
  }

  async logSafety(
    event: 'SPEED_VIOLATION' | 'ROUTE_DEVIATION' | 'EMERGENCY_TRIGGERED' | 'STRIKE_ISSUED' | 'SAFETY_CONCERN_REPORTED',
    metadata?: Record<string, any>,
    tripId?: string
  ): Promise<void> {
    await this.log(event, metadata, tripId);
  }

  async logNavigation(
    event: 'STARTED' | 'REROUTED' | 'COMPLETED',
    tripId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(`NAVIGATION_${event}` as ActivityEventType, metadata, tripId);
  }

  async logDriver(
    event: 'REGISTRATION_STARTED' | 'REGISTRATION_COMPLETED' | 'DOCUMENT_UPLOADED' | 'APPROVED' | 'REJECTED' | 'ONLINE' | 'OFFLINE',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(`DRIVER_${event}` as ActivityEventType, metadata);
  }

  async logScreenView(screenName: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('SCREEN_VIEWED', { screenName, ...metadata });
  }

  async logError(error: Error | string, context?: Record<string, any>): Promise<void> {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: error };

    await this.log('ERROR_OCCURRED', { ...errorData, ...context });
  }
}

// Export singleton instance
export const ActivityLogger = new ActivityLoggerService();

// Export class for testing
export { ActivityLoggerService };
