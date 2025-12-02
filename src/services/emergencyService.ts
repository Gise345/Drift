/**
 * DRIFT EMERGENCY SOS SERVICE
 * Handles emergency alerts, 911 calls, contact notifications, and emergency response
 */

import {
  EmergencyAlert,
  EmergencyAlertType,
  SafetyServiceResponse,
} from '@/src/types/safety.types';
import firestore from '@react-native-firebase/firestore';
import { Linking, Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

// Emergency Configuration
const EMERGENCY_NUMBER = '911'; // US default
const ALERT_RESPONSE_TIMEOUT = 60; // seconds
const VIBRATION_PATTERN = [0, 500, 200, 500, 200, 500]; // Long vibration pattern

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
}

interface TripContext {
  tripId: string;
  driverId: string;
  riderId: string;
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: string;
  licensePlate?: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  pickup?: string;
  destination?: string;
}

/**
 * Trigger SOS emergency alert
 */
export async function triggerSOS(
  userId: string,
  userType: 'rider' | 'driver',
  tripContext: TripContext,
  alertType: EmergencyAlertType = 'sos_pressed'
): Promise<SafetyServiceResponse<EmergencyAlert>> {
  try {
    console.log('SOS TRIGGERED by', userType, userId);

    // Create emergency alert record
    const alert: EmergencyAlert = {
      id: `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId: tripContext.tripId,
      userId,
      userType,
      type: alertType,
      timestamp: new Date(),
      location: tripContext.currentLocation,
      context: {
        driverInfo: {
          id: tripContext.driverId,
          name: tripContext.driverName,
          phone: tripContext.driverPhone,
          vehicle: tripContext.vehicleInfo,
          plate: tripContext.licensePlate,
        },
        riderInfo: {
          id: tripContext.riderId,
        },
      },
      contactsNotified: [],
      authoritiesContacted: false,
      resolved: false,
    };

    // 1. Trigger haptic feedback
    await triggerEmergencyHaptics();

    // 2. Save alert to Firestore immediately
    await firestore()
      .collection('emergency_alerts')
      .doc(alert.id)
      .set({
        ...alert,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

    // 3. Update trip with emergency alert
    await firestore()
      .collection('trips')
      .doc(tripContext.tripId)
      .update({
        'safetyData.emergencyAlerts': firestore.FieldValue.arrayUnion(alert),
        emergencyActive: true,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // 4. Get user's emergency contacts
    const contacts = await getEmergencyContacts(userId);

    // 5. Notify all emergency contacts
    const notifiedContacts = await notifyEmergencyContacts(
      contacts,
      alert,
      tripContext
    );
    alert.contactsNotified = notifiedContacts;

    // 6. Hold payment
    await holdTripPayment(tripContext.tripId, 'sos_triggered');

    // 7. Flag driver's account
    if (userType === 'rider') {
      await flagDriverAccount(tripContext.driverId, tripContext.tripId, alertType);
    }

    // 8. Create admin alert for review
    await createAdminAlert(alert, tripContext);

    // Update alert with notified contacts
    await firestore()
      .collection('emergency_alerts')
      .doc(alert.id)
      .update({
        contactsNotified: notifiedContacts,
      });

    console.log('SOS alert created:', alert.id);
    return { success: true, data: alert };
  } catch (error) {
    console.error('Failed to trigger SOS:', error);
    return {
      success: false,
      error: 'Failed to trigger emergency alert',
      code: 'SOS_TRIGGER_FAILED',
    };
  }
}

/**
 * Call emergency services (911)
 */
export async function callEmergencyServices(): Promise<boolean> {
  try {
    const phoneUrl = Platform.OS === 'android'
      ? `tel:${EMERGENCY_NUMBER}`
      : `telprompt:${EMERGENCY_NUMBER}`;

    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      await Linking.openURL(phoneUrl);
      console.log('Emergency call initiated to', EMERGENCY_NUMBER);
      return true;
    } else {
      console.error('Cannot open phone dialer');
      return false;
    }
  } catch (error) {
    console.error('Failed to call emergency services:', error);
    return false;
  }
}

/**
 * Trigger emergency haptic feedback
 */
export async function triggerEmergencyHaptics(): Promise<void> {
  try {
    // Heavy impact for emergency
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Vibration pattern for attention
    if (Platform.OS === 'android') {
      Vibration.vibrate(VIBRATION_PATTERN);
    } else {
      // iOS uses haptics
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch (error) {
    console.error('Failed to trigger haptics:', error);
    // Don't throw - haptics are not critical
  }
}

/**
 * Get user's emergency contacts
 */
export async function getEmergencyContacts(
  userId: string
): Promise<EmergencyContact[]> {
  try {
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) return [];

    const userData = userDoc.data();
    return userData?.emergencyContacts || [];
  } catch (error) {
    console.error('Failed to get emergency contacts:', error);
    return [];
  }
}

/**
 * Save emergency contacts for user
 */
export async function saveEmergencyContacts(
  userId: string,
  contacts: Omit<EmergencyContact, 'id'>[]
): Promise<SafetyServiceResponse> {
  try {
    const contactsWithIds = contacts.map((c) => ({
      ...c,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));

    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        emergencyContacts: contactsWithIds,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Failed to save emergency contacts:', error);
    return { success: false, error: 'Failed to save contacts' };
  }
}

/**
 * Notify emergency contacts
 */
async function notifyEmergencyContacts(
  contacts: EmergencyContact[],
  alert: EmergencyAlert,
  tripContext: TripContext
): Promise<string[]> {
  const notified: string[] = [];

  for (const contact of contacts) {
    try {
      // Create notification record
      await firestore().collection('emergency_notifications').add({
        alertId: alert.id,
        contactId: contact.id,
        contactName: contact.name,
        contactPhone: contact.phone,
        contactEmail: contact.email,
        userId: alert.userId,
        tripId: tripContext.tripId,
        location: tripContext.currentLocation,
        driverInfo: {
          name: tripContext.driverName,
          vehicle: tripContext.vehicleInfo,
          plate: tripContext.licensePlate,
        },
        message: buildEmergencyMessage(contact, alert, tripContext),
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      notified.push(contact.id);

      // TODO: Integrate with SMS service (Twilio) to send actual SMS
      console.log(`Emergency notification queued for ${contact.name} (${contact.phone})`);
    } catch (error) {
      console.error(`Failed to notify contact ${contact.name}:`, error);
    }
  }

  return notified;
}

/**
 * Build emergency message for contacts
 */
function buildEmergencyMessage(
  contact: EmergencyContact,
  alert: EmergencyAlert,
  tripContext: TripContext
): string {
  const mapsUrl = `https://maps.google.com/?q=${tripContext.currentLocation.latitude},${tripContext.currentLocation.longitude}`;

  return `EMERGENCY ALERT from Drift

${contact.name}, this is an automated emergency alert.

Your contact has triggered an SOS during their carpool ride.

Current Location: ${mapsUrl}

Trip Details:
- From: ${tripContext.pickup || 'Unknown'}
- To: ${tripContext.destination || 'Unknown'}
- Driver: ${tripContext.driverName || 'Unknown'}
- Vehicle: ${tripContext.vehicleInfo || 'Unknown'}
- Plate: ${tripContext.licensePlate || 'Unknown'}

Please check on them immediately. If you cannot reach them, consider contacting local authorities.

- Drift Safety Team`;
}

/**
 * Hold trip payment due to emergency
 */
async function holdTripPayment(
  tripId: string,
  reason: string
): Promise<void> {
  try {
    await firestore()
      .collection('trips')
      .doc(tripId)
      .update({
        paymentStatus: 'HELD',
        paymentHoldReason: reason,
        paymentHeldAt: firestore.FieldValue.serverTimestamp(),
      });

    // Create payment hold record
    await firestore().collection('payment_holds').add({
      tripId,
      reason,
      status: 'active',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    console.log('Payment held for trip:', tripId);
  } catch (error) {
    console.error('Failed to hold payment:', error);
  }
}

/**
 * Flag driver account for review
 */
async function flagDriverAccount(
  driverId: string,
  tripId: string,
  alertType: EmergencyAlertType
): Promise<void> {
  try {
    await firestore()
      .collection('driver_flags')
      .add({
        driverId,
        tripId,
        reason: alertType,
        status: 'pending_review',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    // Update driver document
    await firestore()
      .collection('drivers')
      .doc(driverId)
      .update({
        flagged: true,
        flagReason: alertType,
        flaggedAt: firestore.FieldValue.serverTimestamp(),
      });

    console.log('Driver flagged:', driverId);
  } catch (error) {
    console.error('Failed to flag driver:', error);
  }
}

/**
 * Create admin alert for immediate review
 */
async function createAdminAlert(
  alert: EmergencyAlert,
  tripContext: TripContext
): Promise<void> {
  try {
    await firestore().collection('admin_alerts').add({
      type: 'emergency_sos',
      priority: 'critical',
      alertId: alert.id,
      tripId: tripContext.tripId,
      userId: alert.userId,
      userType: alert.userType,
      driverId: tripContext.driverId,
      location: tripContext.currentLocation,
      status: 'unread',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    console.log('Admin alert created for SOS:', alert.id);
  } catch (error) {
    console.error('Failed to create admin alert:', error);
  }
}

/**
 * Handle no response to safety alert
 */
export async function handleNoResponseAlert(
  tripId: string,
  userId: string,
  userType: 'rider' | 'driver',
  alertType: 'route_deviation' | 'early_completion'
): Promise<SafetyServiceResponse> {
  try {
    // Get trip context
    const tripDoc = await firestore()
      .collection('trips')
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return { success: false, error: 'Trip not found' };
    }

    const tripData = tripDoc.data();

    const tripContext: TripContext = {
      tripId,
      driverId: tripData?.driverId || '',
      riderId: tripData?.riderId || '',
      driverName: tripData?.driverInfo?.name,
      driverPhone: tripData?.driverInfo?.phone,
      vehicleInfo: `${tripData?.driverInfo?.vehicle?.year} ${tripData?.driverInfo?.vehicle?.make} ${tripData?.driverInfo?.vehicle?.model} (${tripData?.driverInfo?.vehicle?.color})`,
      licensePlate: tripData?.driverInfo?.vehicle?.plate,
      currentLocation: tripData?.driverLocation || tripData?.riderLocation || { latitude: 0, longitude: 0 },
      pickup: tripData?.pickup?.address,
      destination: tripData?.destination?.address,
    };

    // Create auto-alert
    const alert: EmergencyAlert = {
      id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId,
      userId,
      userType,
      type: 'no_response_alert',
      timestamp: new Date(),
      location: tripContext.currentLocation,
      context: {
        originalAlertType: alertType,
        driverInfo: tripContext.driverName,
        riderInfo: tripContext.riderId,
      },
      contactsNotified: [],
      authoritiesContacted: false,
      resolved: false,
    };

    // Save alert
    await firestore()
      .collection('emergency_alerts')
      .doc(alert.id)
      .set({
        ...alert,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

    // Notify emergency contacts
    const contacts = await getEmergencyContacts(userId);
    const notified = await notifyEmergencyContacts(contacts, alert, tripContext);

    // Update alert
    await firestore()
      .collection('emergency_alerts')
      .doc(alert.id)
      .update({ contactsNotified: notified });

    // Hold payment
    await holdTripPayment(tripId, 'no_response_to_safety_alert');

    // Flag driver
    if (userType === 'rider') {
      await flagDriverAccount(tripContext.driverId, tripId, 'no_response_alert');
    }

    console.log('No-response auto-alert created:', alert.id);
    return { success: true };
  } catch (error) {
    console.error('Failed to handle no-response alert:', error);
    return { success: false, error: 'Failed to create auto-alert' };
  }
}

/**
 * Resolve emergency alert
 */
export async function resolveEmergencyAlert(
  alertId: string,
  resolution: string,
  resolvedBy: string
): Promise<SafetyServiceResponse> {
  try {
    await firestore()
      .collection('emergency_alerts')
      .doc(alertId)
      .update({
        resolved: true,
        resolvedAt: firestore.FieldValue.serverTimestamp(),
        resolution,
        resolvedBy,
      });

    // Get alert to update trip
    const alertDoc = await firestore()
      .collection('emergency_alerts')
      .doc(alertId)
      .get();

    if (alertDoc.exists) {
      const alertData = alertDoc.data();
      await firestore()
        .collection('trips')
        .doc(alertData?.tripId)
        .update({
          emergencyActive: false,
        });
    }

    console.log('Emergency alert resolved:', alertId);
    return { success: true };
  } catch (error) {
    console.error('Failed to resolve emergency alert:', error);
    return { success: false, error: 'Failed to resolve alert' };
  }
}

/**
 * Get active emergency alerts (for admin)
 */
export async function getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
  try {
    const snapshot = await firestore()
      .collection('emergency_alerts')
      .where('resolved', '==', false)
      .orderBy('timestamp', 'desc')
      .get();

    const alerts: EmergencyAlert[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      alerts.push({
        ...data,
        id: doc.id,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        resolvedAt: data.resolvedAt?.toDate?.() || data.resolvedAt,
      } as EmergencyAlert);
    });

    return alerts;
  } catch (error) {
    console.error('Failed to get active emergency alerts:', error);
    return [];
  }
}

/**
 * Share live trip with emergency contacts
 */
export async function shareTripWithEmergencyContacts(
  userId: string,
  tripId: string
): Promise<SafetyServiceResponse<string[]>> {
  try {
    const contacts = await getEmergencyContacts(userId);

    if (contacts.length === 0) {
      return { success: true, data: [] };
    }

    const shareTokens: string[] = [];

    for (const contact of contacts) {
      const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await firestore().collection('trip_shares').add({
        tripId,
        userId,
        contactId: contact.id,
        contactName: contact.name,
        contactPhone: contact.phone,
        shareToken,
        createdAt: firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      shareTokens.push(shareToken);

      // TODO: Send SMS with tracking link
      console.log(`Trip shared with ${contact.name}: https://drift-global.com/track/${shareToken}`);
    }

    return { success: true, data: shareTokens };
  } catch (error) {
    console.error('Failed to share trip:', error);
    return { success: false, error: 'Failed to share trip' };
  }
}

// Export constants
export const EMERGENCY_CONSTANTS = {
  EMERGENCY_NUMBER,
  ALERT_RESPONSE_TIMEOUT,
  VIBRATION_PATTERN,
};
