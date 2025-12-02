/**
 * DRIFT PAYMENT DISPUTE & ESCROW SERVICE
 * Handles payment holds, disputes, escrow management, and refunds
 */

import {
  PaymentDispute,
  PaymentEscrow,
  DisputeReason,
  DisputeStatus,
  ViolationEvidence,
  SafetyServiceResponse,
} from '@/src/types/safety.types';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

// Configuration
const DISPUTE_WINDOW_HOURS = 24;
const REVIEW_DEADLINE_HOURS = 48;

/**
 * Hold payment for a trip
 */
export async function holdPayment(
  tripId: string,
  reason: DisputeReason,
  autoHold: boolean = false
): Promise<SafetyServiceResponse<PaymentEscrow>> {
  try {
    // Get trip details
    const tripDoc = await firestore()
      .collection('trips')
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return { success: false, error: 'Trip not found' };
    }

    const tripData = tripDoc.data();
    const amount = tripData?.finalCost || tripData?.estimatedCost || 0;

    // Create escrow record
    const escrow: PaymentEscrow = {
      id: `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId,
      disputeId: '', // Will be updated when dispute is created
      amount,
      status: 'held',
      createdAt: new Date(),
    };

    await firestore()
      .collection('payment_escrows')
      .doc(escrow.id)
      .set({
        ...escrow,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    // Update trip payment status
    await firestore()
      .collection('trips')
      .doc(tripId)
      .update({
        paymentStatus: 'HELD',
        escrowId: escrow.id,
        paymentHoldReason: reason,
        paymentHeldAt: firestore.FieldValue.serverTimestamp(),
        autoHold,
      });

    console.log('Payment held for trip:', tripId, 'Escrow:', escrow.id);
    return { success: true, data: escrow };
  } catch (error) {
    console.error('Failed to hold payment:', error);
    return { success: false, error: 'Failed to hold payment' };
  }
}

/**
 * Create a payment dispute
 */
export async function createDispute(
  tripId: string,
  riderId: string,
  reason: DisputeReason,
  description: string,
  evidence: ViolationEvidence[] = []
): Promise<SafetyServiceResponse<PaymentDispute>> {
  try {
    // Check dispute window
    const tripDoc = await firestore()
      .collection('trips')
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return { success: false, error: 'Trip not found' };
    }

    const tripData = tripDoc.data();
    const completedAt = tripData?.completedAt?.toDate?.() || tripData?.completedAt;

    if (completedAt) {
      const hoursSinceCompletion =
        (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60);

      if (hoursSinceCompletion > DISPUTE_WINDOW_HOURS) {
        return {
          success: false,
          error: `Dispute window has expired. Disputes must be filed within ${DISPUTE_WINDOW_HOURS} hours.`,
          code: 'DISPUTE_WINDOW_EXPIRED',
        };
      }
    }

    // Check if dispute already exists
    const existingDispute = await firestore()
      .collection('payment_disputes')
      .where('tripId', '==', tripId)
      .where('status', 'in', ['pending', 'under_review'])
      .get();

    if (!existingDispute.empty) {
      return {
        success: false,
        error: 'A dispute already exists for this trip.',
        code: 'DISPUTE_EXISTS',
      };
    }

    const amount = tripData?.finalCost || tripData?.estimatedCost || 0;
    const driverId = tripData?.driverId || '';

    // Check if payment was auto-held (SOS triggered)
    const autoHold = tripData?.autoHold || false;

    // Create dispute
    const dispute: PaymentDispute = {
      id: `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId,
      riderId,
      driverId,
      amount,
      reason,
      description,
      evidence,
      status: 'pending',
      autoHold,
      strikeIssued: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await firestore()
      .collection('payment_disputes')
      .doc(dispute.id)
      .set({
        ...dispute,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Hold payment if not already held
    if (tripData?.paymentStatus !== 'HELD') {
      const escrowResult = await holdPayment(tripId, reason, false);
      if (escrowResult.success && escrowResult.data) {
        dispute.escrowId = escrowResult.data.id;

        // Update dispute with escrow ID
        await firestore()
          .collection('payment_disputes')
          .doc(dispute.id)
          .update({ escrowId: escrowResult.data.id });

        // Update escrow with dispute ID
        await firestore()
          .collection('payment_escrows')
          .doc(escrowResult.data.id)
          .update({ disputeId: dispute.id });
      }
    }

    // Create admin notification
    await createDisputeAdminAlert(dispute);

    // Notify driver
    await notifyDriverOfDispute(driverId, dispute);

    console.log('Dispute created:', dispute.id);
    return { success: true, data: dispute };
  } catch (error) {
    console.error('Failed to create dispute:', error);
    return { success: false, error: 'Failed to create dispute' };
  }
}

/**
 * Get disputes for a user
 */
export async function getUserDisputes(
  userId: string,
  userType: 'rider' | 'driver'
): Promise<PaymentDispute[]> {
  try {
    const field = userType === 'rider' ? 'riderId' : 'driverId';
    const snapshot = await firestore()
      .collection('payment_disputes')
      .where(field, '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const disputes: PaymentDispute[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      disputes.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        resolvedAt: data.resolvedAt?.toDate?.() || data.resolvedAt,
      } as PaymentDispute);
    });

    return disputes;
  } catch (error) {
    console.error('Failed to get user disputes:', error);
    return [];
  }
}

/**
 * Get pending disputes (for admin)
 */
export async function getPendingDisputes(): Promise<PaymentDispute[]> {
  try {
    const snapshot = await firestore()
      .collection('payment_disputes')
      .where('status', 'in', ['pending', 'under_review'])
      .orderBy('createdAt', 'asc')
      .get();

    const disputes: PaymentDispute[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      disputes.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as PaymentDispute);
    });

    return disputes;
  } catch (error) {
    console.error('Failed to get pending disputes:', error);
    return [];
  }
}

/**
 * Update dispute status (admin)
 */
export async function updateDisputeStatus(
  disputeId: string,
  status: DisputeStatus,
  reviewerId?: string
): Promise<SafetyServiceResponse> {
  try {
    await firestore()
      .collection('payment_disputes')
      .doc(disputeId)
      .update({
        status,
        reviewedBy: reviewerId,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Failed to update dispute status:', error);
    return { success: false, error: 'Failed to update dispute' };
  }
}

/**
 * Resolve dispute (admin)
 */
export async function resolveDispute(
  disputeId: string,
  decision: 'approved' | 'denied',
  resolution: string,
  refundAmount: number | null,
  issueStrike: boolean,
  resolvedBy: string
): Promise<SafetyServiceResponse> {
  try {
    const disputeDoc = await firestore()
      .collection('payment_disputes')
      .doc(disputeId)
      .get();

    if (!disputeDoc.exists) {
      return { success: false, error: 'Dispute not found' };
    }

    const dispute = disputeDoc.data() as PaymentDispute;

    // Update dispute
    await firestore()
      .collection('payment_disputes')
      .doc(disputeId)
      .update({
        status: decision,
        resolution,
        refundAmount: refundAmount || 0,
        strikeIssued: issueStrike,
        resolvedAt: firestore.FieldValue.serverTimestamp(),
        resolvedBy,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Handle escrow based on decision
    if (dispute.escrowId) {
      if (decision === 'approved' && refundAmount !== null && refundAmount > 0) {
        // Refund to rider
        await releaseEscrow(
          dispute.escrowId,
          refundAmount >= dispute.amount ? 'refunded_to_rider' : 'partially_refunded',
          resolution
        );

        // Process actual refund through Stripe
        await processStripeRefund(dispute.tripId, refundAmount);
      } else {
        // Release to driver
        await releaseEscrow(dispute.escrowId, 'released_to_driver', resolution);
      }
    }

    // Issue strike if needed
    if (issueStrike) {
      const { issueStrike: issueDriverStrike } = await import('./strikeService');
      await issueDriverStrike(
        dispute.driverId,
        dispute.tripId,
        'safety_incident',
        `Dispute resolved against driver: ${resolution}`,
        'high'
      );
    }

    // Update trip
    await firestore()
      .collection('trips')
      .doc(dispute.tripId)
      .update({
        paymentStatus: decision === 'approved' ? 'REFUNDED' : 'COMPLETED',
        disputeResolution: resolution,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Notify both parties
    await notifyDisputeResolution(dispute, decision, resolution);

    console.log('Dispute resolved:', disputeId, 'Decision:', decision);
    return { success: true };
  } catch (error) {
    console.error('Failed to resolve dispute:', error);
    return { success: false, error: 'Failed to resolve dispute' };
  }
}

/**
 * Release escrow funds
 */
async function releaseEscrow(
  escrowId: string,
  status: PaymentEscrow['status'],
  reason: string
): Promise<void> {
  try {
    await firestore()
      .collection('payment_escrows')
      .doc(escrowId)
      .update({
        status,
        releasedAt: firestore.FieldValue.serverTimestamp(),
        releaseReason: reason,
      });

    console.log('Escrow released:', escrowId, 'Status:', status);
  } catch (error) {
    console.error('Failed to release escrow:', error);
  }
}

/**
 * Process Stripe refund
 */
async function processStripeRefund(
  tripId: string,
  amount: number
): Promise<void> {
  try {
    // Get payment intent from trip
    const tripDoc = await firestore()
      .collection('trips')
      .doc(tripId)
      .get();

    if (!tripDoc.exists) return;

    const tripData = tripDoc.data();
    const paymentIntentId = tripData?.paymentIntentId;

    if (!paymentIntentId) {
      console.warn('No payment intent found for trip:', tripId);
      return;
    }

    // Call refund function
    const refundFunction = functions().httpsCallable('refundStripePayment');
    await refundFunction({
      paymentIntentId,
      amount,
      reason: 'safety_dispute',
    });

    console.log('Stripe refund processed for trip:', tripId);
  } catch (error) {
    console.error('Failed to process Stripe refund:', error);
  }
}

/**
 * Void payment for safety violations
 */
export async function voidPayment(
  tripId: string,
  reason: string
): Promise<SafetyServiceResponse> {
  try {
    const tripDoc = await firestore()
      .collection('trips')
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return { success: false, error: 'Trip not found' };
    }

    const tripData = tripDoc.data();
    const amount = tripData?.finalCost || tripData?.estimatedCost || 0;

    // Full refund
    await processStripeRefund(tripId, amount);

    // Update trip
    await firestore()
      .collection('trips')
      .doc(tripId)
      .update({
        paymentStatus: 'VOIDED',
        paymentVoidReason: reason,
        paymentVoidedAt: firestore.FieldValue.serverTimestamp(),
      });

    console.log('Payment voided for trip:', tripId);
    return { success: true };
  } catch (error) {
    console.error('Failed to void payment:', error);
    return { success: false, error: 'Failed to void payment' };
  }
}

/**
 * Auto-resolve held payments without disputes
 */
export async function autoResolveHeldPayments(): Promise<void> {
  try {
    const cutoffTime = new Date(Date.now() - DISPUTE_WINDOW_HOURS * 60 * 60 * 1000);

    const snapshot = await firestore()
      .collection('trips')
      .where('paymentStatus', '==', 'HELD')
      .where('paymentHeldAt', '<', cutoffTime)
      .get();

    for (const doc of snapshot.docs) {
      const tripId = doc.id;
      const tripData = doc.data();

      // Check if there's a dispute
      const disputeSnapshot = await firestore()
        .collection('payment_disputes')
        .where('tripId', '==', tripId)
        .where('status', 'in', ['pending', 'under_review'])
        .get();

      if (disputeSnapshot.empty) {
        // No dispute filed - release payment to driver
        if (tripData.escrowId) {
          await releaseEscrow(
            tripData.escrowId,
            'released_to_driver',
            'Auto-released: No dispute filed within window'
          );
        }

        await firestore()
          .collection('trips')
          .doc(tripId)
          .update({
            paymentStatus: 'COMPLETED',
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });

        console.log('Payment auto-released for trip:', tripId);
      }
    }
  } catch (error) {
    console.error('Failed to auto-resolve held payments:', error);
  }
}

/**
 * Add evidence to dispute
 */
export async function addDisputeEvidence(
  disputeId: string,
  evidence: ViolationEvidence
): Promise<SafetyServiceResponse> {
  try {
    await firestore()
      .collection('payment_disputes')
      .doc(disputeId)
      .update({
        evidence: firestore.FieldValue.arrayUnion(evidence),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Failed to add evidence:', error);
    return { success: false, error: 'Failed to add evidence' };
  }
}

// =============================================================================
// NOTIFICATION HELPERS
// =============================================================================

async function createDisputeAdminAlert(dispute: PaymentDispute): Promise<void> {
  try {
    await firestore().collection('admin_alerts').add({
      type: 'payment_dispute',
      priority: dispute.autoHold ? 'high' : 'medium',
      disputeId: dispute.id,
      tripId: dispute.tripId,
      riderId: dispute.riderId,
      driverId: dispute.driverId,
      amount: dispute.amount,
      reason: dispute.reason,
      status: 'unread',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create admin alert:', error);
  }
}

async function notifyDriverOfDispute(
  driverId: string,
  dispute: PaymentDispute
): Promise<void> {
  try {
    await firestore().collection('notifications').add({
      userId: driverId,
      type: 'payment_dispute',
      title: 'Payment Dispute Filed',
      message: `A payment dispute has been filed for your recent trip. Amount: $${dispute.amount.toFixed(2)}`,
      data: {
        disputeId: dispute.id,
        tripId: dispute.tripId,
        amount: dispute.amount,
        reason: dispute.reason,
      },
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to notify driver of dispute:', error);
  }
}

async function notifyDisputeResolution(
  dispute: PaymentDispute,
  decision: 'approved' | 'denied',
  resolution: string
): Promise<void> {
  try {
    // Notify rider
    await firestore().collection('notifications').add({
      userId: dispute.riderId,
      type: 'dispute_resolved',
      title: decision === 'approved' ? 'Dispute Approved' : 'Dispute Denied',
      message: resolution,
      data: {
        disputeId: dispute.id,
        tripId: dispute.tripId,
        decision,
      },
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Notify driver
    await firestore().collection('notifications').add({
      userId: dispute.driverId,
      type: 'dispute_resolved',
      title: decision === 'approved' ? 'Dispute Ruled Against You' : 'Dispute Dismissed',
      message: resolution,
      data: {
        disputeId: dispute.id,
        tripId: dispute.tripId,
        decision,
      },
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to notify dispute resolution:', error);
  }
}

// Export constants
export const DISPUTE_CONSTANTS = {
  DISPUTE_WINDOW_HOURS,
  REVIEW_DEADLINE_HOURS,
};
