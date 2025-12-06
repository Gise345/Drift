/**
 * FIREBASE CLOUD FUNCTIONS - SAFETY SYSTEM
 * Automated safety monitoring, strike management, and emergency handling
 *
 * Deploy: firebase deploy --only functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Using 'main' database (restored from backup)
const db = getFirestore(admin.app(), 'main');

// Configuration
const STRIKE_EXPIRATION_DAYS = 30; // 1 month of good driving to remove a strike
const TEMP_SUSPENSION_DAYS = 7;
const MAX_STRIKES = 3;
const DISPUTE_WINDOW_HOURS = 24;

// =============================================================================
// STRIKE MANAGEMENT
// =============================================================================

/**
 * Issue a strike to a driver
 */
export const issueStrike = onCall({ region: 'us-east1' }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
      driverId,
      tripId,
      type,
      reason,
      severity,
      violationId,
    } = request.data;

    if (!driverId || !tripId || !type || !reason) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + STRIKE_EXPIRATION_DAYS);

    const strikeId = `strike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const strike = {
      id: strikeId,
      driverId,
      tripId,
      type,
      reason,
      severity: severity || 'medium',
      violationId: violationId || null,
      issuedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      status: 'active',
    };

    await db.collection('strikes').doc(strikeId).set(strike);

    // Check active strikes count
    const activeStrikesSnapshot = await db
      .collection('strikes')
      .where('driverId', '==', driverId)
      .where('status', '==', 'active')
      .get();

    const activeStrikes = activeStrikesSnapshot.docs.filter((doc) => {
      const data = doc.data();
      const expiry = data.expiresAt?.toDate?.() || data.expiresAt;
      return new Date(expiry) > now;
    }).length;

    // Check if suspension needed
    if (activeStrikes >= MAX_STRIKES) {
      await issuePermanentSuspension(driverId, strikeId);
    } else if (activeStrikes === 2) {
      await issueTemporarySuspension(driverId, strikeId);
    }

    // Create notification
    await db.collection('notifications').add({
      userId: driverId,
      type: 'safety_strike',
      title: 'Safety Strike Issued',
      message: `You have received a safety strike: ${reason}`,
      data: { strikeId, type, severity },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Strike issued:', strikeId, 'to driver:', driverId);

    return { success: true, strikeId, activeStrikes };
  } catch (error) {
    console.error('Error issuing strike:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to issue strike');
  }
});

/**
 * Issue temporary suspension
 */
async function issueTemporarySuspension(
  driverId: string,
  strikeId: string
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + TEMP_SUSPENSION_DAYS);

  const suspensionId = `susp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.collection('suspensions').doc(suspensionId).set({
    id: suspensionId,
    driverId,
    type: 'temporary',
    reason: 'Second strike issued',
    strikeIds: [strikeId],
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    status: 'active',
    acknowledgmentRequired: true,
  });

  await db.collection('drivers').doc(driverId).update({
    suspensionStatus: 'suspended_temp',
    currentSuspensionId: suspensionId,
    isOnline: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('notifications').add({
    userId: driverId,
    type: 'suspension',
    title: 'Account Temporarily Suspended',
    message: `Your driver account has been suspended for ${TEMP_SUSPENSION_DAYS} days.`,
    data: { suspensionId, type: 'temporary', expiresAt: expiresAt.toISOString() },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Temporary suspension issued:', suspensionId);
}

/**
 * Issue permanent suspension
 */
async function issuePermanentSuspension(
  driverId: string,
  strikeId: string
): Promise<void> {
  const suspensionId = `susp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.collection('suspensions').doc(suspensionId).set({
    id: suspensionId,
    driverId,
    type: 'permanent',
    reason: 'Three or more strikes accumulated',
    strikeIds: [strikeId],
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: null,
    status: 'active',
    acknowledgmentRequired: true,
  });

  await db.collection('drivers').doc(driverId).update({
    suspensionStatus: 'suspended_perm',
    currentSuspensionId: suspensionId,
    isOnline: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('notifications').add({
    userId: driverId,
    type: 'suspension',
    title: 'Account Permanently Suspended',
    message: 'Your driver account has been permanently suspended due to safety violations.',
    data: { suspensionId, type: 'permanent' },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Permanent suspension issued:', suspensionId);
}

// =============================================================================
// SCHEDULED JOBS
// =============================================================================

/**
 * Expire old strikes - runs daily
 */
export const expireStrikes = onSchedule({ schedule: 'every 24 hours', region: 'us-east1' }, async () => {
  try {
    const now = new Date();
    const snapshot = await db
      .collection('strikes')
      .where('status', '==', 'active')
      .get();

    const batch = db.batch();
    let expiredCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate?.() || data.expiresAt;

      if (expiresAt && new Date(expiresAt) <= now) {
        batch.update(doc.ref, { status: 'expired' });
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
      console.log(`Expired ${expiredCount} strikes`);
    }
  } catch (error) {
    console.error('Error expiring strikes:', error);
  }
});

/**
 * Lift expired temporary suspensions - runs hourly
 */
export const liftExpiredSuspensions = onSchedule({ schedule: 'every 1 hours', region: 'us-east1' }, async () => {
  try {
    const now = new Date();
    const snapshot = await db
      .collection('suspensions')
      .where('status', '==', 'active')
      .where('type', '==', 'temporary')
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate?.() || data.expiresAt;

      if (expiresAt && new Date(expiresAt) <= now) {
        // Lift suspension
        await doc.ref.update({
          status: 'expired',
          liftedAt: admin.firestore.FieldValue.serverTimestamp(),
          liftedReason: 'Suspension period expired',
        });

        // Update driver
        await db.collection('drivers').doc(data.driverId).update({
          suspensionStatus: 'active',
          currentSuspensionId: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Notify driver
        await db.collection('notifications').add({
          userId: data.driverId,
          type: 'suspension_lifted',
          title: 'Suspension Lifted',
          message: 'Your suspension period has ended. You can now go online.',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('Suspension lifted for driver:', data.driverId);
      }
    }
  } catch (error) {
    console.error('Error lifting suspensions:', error);
  }
});

/**
 * Auto-resolve held payments without disputes - runs hourly
 */
export const autoResolveHeldPayments = onSchedule({ schedule: 'every 1 hours', region: 'us-east1' }, async () => {
  try {
    const cutoffTime = new Date(Date.now() - DISPUTE_WINDOW_HOURS * 60 * 60 * 1000);

    const snapshot = await db
      .collection('trips')
      .where('paymentStatus', '==', 'HELD')
      .where('paymentHeldAt', '<', cutoffTime)
      .get();

    for (const doc of snapshot.docs) {
      const tripId = doc.id;
      const tripData = doc.data();

      // Check for active dispute
      const disputeSnapshot = await db
        .collection('payment_disputes')
        .where('tripId', '==', tripId)
        .where('status', 'in', ['pending', 'under_review'])
        .get();

      if (disputeSnapshot.empty) {
        // No dispute - release payment to driver
        if (tripData.escrowId) {
          await db.collection('payment_escrows').doc(tripData.escrowId).update({
            status: 'released_to_driver',
            releasedAt: admin.firestore.FieldValue.serverTimestamp(),
            releaseReason: 'Auto-released: No dispute filed',
          });
        }

        await doc.ref.update({
          paymentStatus: 'COMPLETED',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('Payment auto-released for trip:', tripId);
      }
    }
  } catch (error) {
    console.error('Error auto-resolving payments:', error);
  }
});

// =============================================================================
// DOCUMENT TRIGGERS
// =============================================================================

/**
 * Handle new emergency alert
 */
export const onEmergencyAlertCreated = onDocumentCreated(
  { document: 'emergency_alerts/{alertId}', region: 'us-east1', database: 'main' },
  async (event) => {
    try {
      const alertData = event.data?.data();
      if (!alertData) return;

      // Create high-priority admin alert
      await db.collection('admin_alerts').add({
        type: 'emergency_sos',
        priority: 'critical',
        alertId: event.params.alertId,
        tripId: alertData.tripId,
        userId: alertData.userId,
        userType: alertData.userType,
        location: alertData.location,
        status: 'unread',
        requiresImmediateAction: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // TODO: Send SMS alerts via Twilio
      // TODO: Send push notifications via FCM

      console.log('Emergency alert processed:', event.params.alertId);
    } catch (error) {
      console.error('Error processing emergency alert:', error);
    }
  }
);

/**
 * Handle trip safety violations
 */
export const onTripUpdated = onDocumentUpdated({ document: 'trips/{tripId}', region: 'us-east1', database: 'main' }, async (event) => {
  try {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) return;

    // Check for new speed violations
    const beforeViolations = beforeData.safetyData?.speedViolations?.length || 0;
    const afterViolations = afterData.safetyData?.speedViolations?.length || 0;

    if (afterViolations > beforeViolations && afterViolations >= 3) {
      // Issue strike for excessive speed violations
      const driverId = afterData.driverId;
      if (driverId) {
        await db.collection('strike_queue').add({
          driverId,
          tripId: event.params.tripId,
          type: 'speed_violation',
          reason: `${afterViolations} speed violations during trip`,
          severity: 'medium',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Check for route deviation SOS
    const deviations = afterData.safetyData?.routeDeviations || [];
    const sosDeviations = deviations.filter((d: any) => d.riderResponse === 'sos');

    if (sosDeviations.length > 0 && afterData.driverId) {
      // Flag driver for route deviation with SOS
      await db.collection('driver_flags').add({
        driverId: afterData.driverId,
        tripId: event.params.tripId,
        reason: 'route_deviation_sos',
        status: 'pending_review',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error processing trip update:', error);
  }
});

/**
 * Process strike queue
 */
export const processStrikeQueue = onSchedule({ schedule: 'every 5 minutes', region: 'us-east1' }, async () => {
  try {
    const snapshot = await db
      .collection('strike_queue')
      .orderBy('createdAt')
      .limit(10)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Check if strike already exists for this trip
      const existingStrike = await db
        .collection('strikes')
        .where('tripId', '==', data.tripId)
        .where('type', '==', data.type)
        .get();

      if (existingStrike.empty) {
        // Issue the strike
        const strikeId = `strike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + STRIKE_EXPIRATION_DAYS);

        await db.collection('strikes').doc(strikeId).set({
          id: strikeId,
          driverId: data.driverId,
          tripId: data.tripId,
          type: data.type,
          reason: data.reason,
          severity: data.severity,
          issuedAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          status: 'active',
        });

        console.log('Strike issued from queue:', strikeId);
      }

      // Delete processed item
      await doc.ref.delete();
    }
  } catch (error) {
    console.error('Error processing strike queue:', error);
  }
});

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

/**
 * Review and resolve appeal (admin only)
 */
export const resolveAppeal = onCall({ region: 'us-east1' }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin role
    const adminDoc = await db.collection('admins').doc(request.auth.uid).get();
    if (!adminDoc.exists) {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    const { appealId, decision, resolution } = request.data;

    if (!appealId || !decision || !resolution) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    const appealDoc = await db.collection('appeals').doc(appealId).get();
    if (!appealDoc.exists) {
      throw new HttpsError('not-found', 'Appeal not found');
    }

    const appeal = appealDoc.data();

    // Update appeal
    await appealDoc.ref.update({
      status: decision,
      reviewedBy: request.auth.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolution,
    });

    // Handle decision
    if (decision === 'approved') {
      // Remove strike if applicable
      if (appeal?.strikeId) {
        await db.collection('strikes').doc(appeal.strikeId).update({
          status: 'removed',
          removedAt: admin.firestore.FieldValue.serverTimestamp(),
          removedReason: `Appeal approved: ${resolution}`,
        });
      }

      // Lift suspension if applicable
      if (appeal?.suspensionId) {
        await db.collection('suspensions').doc(appeal.suspensionId).update({
          status: 'lifted',
          liftedAt: admin.firestore.FieldValue.serverTimestamp(),
          liftedReason: `Appeal approved: ${resolution}`,
        });

        // Reactivate driver
        const suspensionDoc = await db.collection('suspensions').doc(appeal.suspensionId).get();
        const suspensionData = suspensionDoc.data();
        if (suspensionData?.driverId) {
          await db.collection('drivers').doc(suspensionData.driverId).update({
            suspensionStatus: 'active',
            currentSuspensionId: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }

    // Notify driver
    await db.collection('notifications').add({
      userId: appeal?.driverId,
      type: 'appeal_result',
      title: decision === 'approved' ? 'Appeal Approved' : 'Appeal Denied',
      message: resolution,
      data: { appealId, decision },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Appeal resolved:', appealId, 'Decision:', decision);

    return { success: true };
  } catch (error) {
    console.error('Error resolving appeal:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to resolve appeal');
  }
});

/**
 * Resolve payment dispute (admin only)
 */
export const resolveDispute = onCall({ region: 'us-east1' }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin role
    const adminDoc = await db.collection('admins').doc(request.auth.uid).get();
    if (!adminDoc.exists) {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    const {
      disputeId,
      decision,
      resolution,
      refundAmount,
      issueStrike,
    } = request.data;

    if (!disputeId || !decision || !resolution) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    const disputeDoc = await db.collection('payment_disputes').doc(disputeId).get();
    if (!disputeDoc.exists) {
      throw new HttpsError('not-found', 'Dispute not found');
    }

    const dispute = disputeDoc.data();

    // Update dispute
    await disputeDoc.ref.update({
      status: decision,
      resolution,
      refundAmount: refundAmount || 0,
      strikeIssued: issueStrike || false,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedBy: request.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Handle escrow
    if (dispute?.escrowId) {
      const escrowStatus = decision === 'approved' && refundAmount > 0
        ? refundAmount >= dispute.amount ? 'refunded_to_rider' : 'partially_refunded'
        : 'released_to_driver';

      await db.collection('payment_escrows').doc(dispute.escrowId).update({
        status: escrowStatus,
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
        releaseReason: resolution,
      });
    }

    // Issue strike if needed
    if (issueStrike && dispute?.driverId) {
      const strikeId = `strike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + STRIKE_EXPIRATION_DAYS);

      await db.collection('strikes').doc(strikeId).set({
        id: strikeId,
        driverId: dispute.driverId,
        tripId: dispute.tripId,
        type: 'safety_incident',
        reason: `Dispute resolved against driver: ${resolution}`,
        severity: 'high',
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        status: 'active',
      });

      await disputeDoc.ref.update({ strikeId });
    }

    // Update trip
    await db.collection('trips').doc(dispute?.tripId).update({
      paymentStatus: decision === 'approved' ? 'REFUNDED' : 'COMPLETED',
      disputeResolution: resolution,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify both parties
    await db.collection('notifications').add({
      userId: dispute?.riderId,
      type: 'dispute_resolved',
      title: decision === 'approved' ? 'Dispute Approved' : 'Dispute Denied',
      message: resolution,
      data: { disputeId, decision },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('notifications').add({
      userId: dispute?.driverId,
      type: 'dispute_resolved',
      title: decision === 'approved' ? 'Dispute Ruled Against You' : 'Dispute Dismissed',
      message: resolution,
      data: { disputeId, decision },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Dispute resolved:', disputeId, 'Decision:', decision);

    return { success: true };
  } catch (error) {
    console.error('Error resolving dispute:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to resolve dispute');
  }
});

/**
 * Get safety dashboard data (admin only)
 */
export const getSafetyDashboard = onCall({ region: 'us-east1' }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin role
    const adminDoc = await db.collection('admins').doc(request.auth.uid).get();
    if (!adminDoc.exists) {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    // Get counts
    const [
      pendingDisputes,
      pendingAppeals,
      activeEmergencies,
      activeStrikes,
      activeSuspensions,
    ] = await Promise.all([
      db.collection('payment_disputes')
        .where('status', 'in', ['pending', 'under_review'])
        .count()
        .get(),
      db.collection('appeals')
        .where('status', 'in', ['pending', 'under_review'])
        .count()
        .get(),
      db.collection('emergency_alerts')
        .where('resolved', '==', false)
        .count()
        .get(),
      db.collection('strikes')
        .where('status', '==', 'active')
        .count()
        .get(),
      db.collection('suspensions')
        .where('status', '==', 'active')
        .count()
        .get(),
    ]);

    return {
      pendingDisputes: pendingDisputes.data().count,
      pendingAppeals: pendingAppeals.data().count,
      activeEmergencies: activeEmergencies.data().count,
      activeStrikes: activeStrikes.data().count,
      activeSuspensions: activeSuspensions.data().count,
    };
  } catch (error) {
    console.error('Error getting safety dashboard:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to get dashboard data');
  }
});
