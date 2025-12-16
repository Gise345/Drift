/**
 * FIREBASE CLOUD FUNCTIONS - STRIPE PAYMENTS
 * Supports: Card payments via Payment Sheet
 *
 * Deploy: firebase deploy --only functions
 *
 * Environment variables needed (use .env file or Firebase secrets):
 * STRIPE_SECRET_KEY="YOUR_SECRET_KEY"
 *
 * Updated: 2025-12-05 - Fixed ephemeral key API version for stripe-react-native compatibility
 */

import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

// Using 'main' database (restored from backup)
const db = getFirestore(admin.app(), 'main');

// Initialize Stripe with secret key from environment (.env file)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Lazy initialization of Stripe client
let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    if (!stripeSecretKey) {
      throw new HttpsError('failed-precondition', 'Stripe secret key not configured');
    }
    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
    });
  }
  return stripeClient;
}

// Type definitions for request data
interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

interface PaymentConfirmRequest {
  paymentIntentId: string;
}

interface RefundRequest {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

interface PaymentMethodRequest {
  paymentMethodId: string;
}

/**
 * Common options for all callable functions
 * invoker: 'public' allows any caller to invoke the function at the Cloud Run level
 * Authentication is still enforced within the function via request.auth
 * This fixes the UNAUTHENTICATED issue with React Native Firebase
 */
const callableOptions = {
  region: 'us-east1' as const,
  invoker: 'public' as const, // Allow public invocation - auth is checked in function
};

/**
 * GET OR CREATE STRIPE CUSTOMER
 * Creates a Stripe customer for the authenticated user or returns existing one
 */
export const getOrCreateStripeCustomer = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const userId = request.auth.uid;
      const userEmail = request.auth.token.email;

      console.log('Getting or creating Stripe customer for user:', userId);

      // Check if user already has a Stripe customer ID
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (userData?.stripeCustomerId) {
        console.log('Existing Stripe customer found:', userData.stripeCustomerId);
        return { customerId: userData.stripeCustomerId };
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail || undefined,
        metadata: {
          firebaseUserId: userId,
        },
      });

      // Save customer ID to Firestore
      await db.collection('users').doc(userId).set(
        { stripeCustomerId: customer.id },
        { merge: true }
      );

      console.log('Created new Stripe customer:', customer.id);

      return { customerId: customer.id };
    } catch (error: unknown) {
      console.error('Error getting/creating Stripe customer:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to get/create customer';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * CREATE STRIPE PAYMENT INTENT
 * Creates a payment intent for the mobile Payment Sheet
 */
export const createStripePaymentIntent = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as PaymentIntentRequest;
      const { amount, currency = 'USD', description, metadata } = data;

      if (!amount || amount <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid amount');
      }

      const userId = request.auth.uid;

      console.log('Creating Stripe payment intent:', { amount, currency, description, userId });

      // Get or create customer
      const userDoc = await db.collection('users').doc(userId).get();
      const paymentUserData = userDoc.data();
      let customerId = paymentUserData?.stripeCustomerId;

      console.log('createStripePaymentIntent - userData:', JSON.stringify({
        exists: userDoc.exists,
        hasStripeCustomerId: !!customerId,
        stripeCustomerId: customerId || 'NOT SET',
        email: paymentUserData?.email || 'NO EMAIL',
      }));

      if (!customerId) {
        console.log('createStripePaymentIntent - Creating new Stripe customer');
        // Create new customer
        const customer = await stripe.customers.create({
          email: request.auth.token.email || undefined,
          metadata: {
            firebaseUserId: userId,
          },
        });
        customerId = customer.id;

        // Save customer ID
        await db.collection('users').doc(userId).set(
          { stripeCustomerId: customerId },
          { merge: true }
        );
      }

      // Create ephemeral key for the customer
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2024-06-20' }
      );

      // Create payment intent
      // Amount should be in cents for USD
      const amountInCents = Math.round(amount * 100);

      // Use capture_method: 'manual' for AUTHORIZATION (hold) instead of immediate capture
      // This allows us to:
      // 1. Hold the funds when rider requests a ride
      // 2. Capture the funds when driver accepts
      // 3. Cancel/release the hold if no driver found
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        customer: customerId,
        description: description || 'Drift Carpool Payment',
        metadata: {
          userId,
          ...metadata,
        },
        // Explicitly enable card, Apple Pay, and Google Pay
        payment_method_types: ['card', 'link'],
        // CRITICAL: Use manual capture to authorize (hold) funds without capturing
        capture_method: 'manual',
        // Note: Apple Pay and Google Pay are handled automatically through 'card'
        // when using the mobile Payment Sheet with applePay/googlePay config
      });

      // Save payment intent to Firestore
      await db.collection('stripe_payments').doc(paymentIntent.id).set({
        userId,
        paymentIntentId: paymentIntent.id,
        amount,
        amountInCents,
        currency,
        description,
        status: paymentIntent.status,
        metadata: metadata || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('Stripe payment intent created:', paymentIntent.id);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customerId,
        amount,
        currency,
      };
    } catch (error: unknown) {
      console.error('Error creating Stripe payment intent:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to create payment intent';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * CONFIRM STRIPE PAYMENT
 * Confirms payment was successful and updates records
 */
export const confirmStripePayment = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as PaymentConfirmRequest;
      const { paymentIntentId } = data;

      if (!paymentIntentId) {
        throw new HttpsError('invalid-argument', 'Payment Intent ID is required');
      }

      console.log('Confirming Stripe payment:', paymentIntentId);

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Update Firestore record
      await db.collection('stripe_payments').doc(paymentIntentId).update({
        status: paymentIntent.status,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('Stripe payment confirmed:', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return {
        paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency.toUpperCase(),
      };
    } catch (error: unknown) {
      console.error('Error confirming Stripe payment:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to confirm payment';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * GET STRIPE PAYMENT STATUS
 * Check payment status without modifying
 */
export const getStripePaymentStatus = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as PaymentConfirmRequest;
      const { paymentIntentId } = data;

      if (!paymentIntentId) {
        throw new HttpsError('invalid-argument', 'Payment Intent ID is required');
      }

      console.log('Getting Stripe payment status:', paymentIntentId);

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      console.log('Stripe payment status:', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return {
        paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
      };
    } catch (error: unknown) {
      console.error('Error getting payment status:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to get payment status';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * REFUND STRIPE PAYMENT
 * Process refund for cancelled carpool
 */
export const refundStripePayment = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as RefundRequest;
      const { paymentIntentId, amount, reason } = data;

      if (!paymentIntentId) {
        throw new HttpsError('invalid-argument', 'Payment Intent ID is required');
      }

      console.log('Processing Stripe refund:', { paymentIntentId, amount });

      // Create refund
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: (reason as Stripe.RefundCreateParams.Reason) || 'requested_by_customer',
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundParams);

      // Update Firestore record
      await db.collection('stripe_payments').doc(paymentIntentId).update({
        refundId: refund.id,
        refundStatus: refund.status,
        refundAmount: refund.amount / 100,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('Stripe refund processed:', {
        refundId: refund.id,
        status: refund.status,
      });

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
      };
    } catch (error: unknown) {
      console.error('Error processing refund:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to process refund';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * CAPTURE STRIPE PAYMENT
 * Captures a previously authorized (held) payment
 * Called when driver accepts a ride - this is when funds are actually charged
 */
export const captureStripePayment = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as { paymentIntentId: string; tripId?: string };
      const { paymentIntentId, tripId } = data;

      if (!paymentIntentId) {
        throw new HttpsError('invalid-argument', 'Payment Intent ID is required');
      }

      console.log('💰 Capturing authorized payment:', paymentIntentId);

      // Retrieve payment intent to check status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'requires_capture') {
        console.log('⚠️ Payment cannot be captured, status:', paymentIntent.status);

        // If already captured, that's ok
        if (paymentIntent.status === 'succeeded') {
          return {
            paymentIntentId,
            status: 'already_captured',
            amount: paymentIntent.amount / 100,
          };
        }

        throw new HttpsError('failed-precondition', `Payment status is ${paymentIntent.status}, cannot capture`);
      }

      // Capture the payment
      const capturedIntent = await stripe.paymentIntents.capture(paymentIntentId);

      // Update Firestore record - use set with merge to avoid errors if doc doesn't exist
      await db.collection('stripe_payments').doc(paymentIntentId).set({
        status: 'captured',
        capturedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Update trip if tripId provided
      if (tripId) {
        await db.collection('trips').doc(tripId).update({
          paymentStatus: 'CAPTURED',
          paymentCapturedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log('✅ Payment captured successfully:', paymentIntentId);

      return {
        paymentIntentId,
        status: 'captured',
        amount: capturedIntent.amount / 100,
      };
    } catch (error: unknown) {
      console.error('❌ Error capturing payment:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      // Log full error for debugging
      if (error instanceof Error) {
        console.error('Capture error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }

      const message = error instanceof Error ? error.message : 'Failed to capture payment';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * CANCEL STRIPE PAYMENT AUTHORIZATION
 * Cancels/voids an authorized payment that was never captured
 * Called when no driver found or trip cancelled before driver accepts
 * This releases the hold on the customer's card - NO funds are charged
 */
export const cancelStripePaymentAuth = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as { paymentIntentId: string; tripId?: string; reason?: string };
      const { paymentIntentId, tripId, reason } = data;

      if (!paymentIntentId) {
        throw new HttpsError('invalid-argument', 'Payment Intent ID is required');
      }

      console.log('🚫 Cancelling payment authorization:', paymentIntentId, 'Reason:', reason);

      // Retrieve payment intent to check status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('💰 Current PaymentIntent status:', paymentIntent.status);

      // Can only cancel if not already captured (succeeded)
      if (paymentIntent.status === 'succeeded') {
        console.log('⚠️ Payment already captured, cannot cancel - use refund instead');
        throw new HttpsError('failed-precondition', 'Payment already captured. Use refund instead.');
      }

      // If already canceled, return success
      if (paymentIntent.status === 'canceled') {
        console.log('ℹ️ Payment already canceled');
        return {
          paymentIntentId,
          status: 'already_canceled',
          message: 'Payment authorization was already released',
        };
      }

      // Valid statuses for cancellation per Stripe docs:
      // requires_payment_method, requires_capture, requires_confirmation, requires_action, processing
      const cancelableStatuses = ['requires_payment_method', 'requires_capture', 'requires_confirmation', 'requires_action', 'processing'];
      if (!cancelableStatuses.includes(paymentIntent.status)) {
        console.log('⚠️ Payment cannot be canceled, status:', paymentIntent.status);
        throw new HttpsError('failed-precondition', `Payment status is ${paymentIntent.status}, cannot cancel`);
      }

      // Cancel the payment intent (releases the hold)
      // Use 'requested_by_customer' for rider cancels, 'abandoned' for system/no-driver
      const cancellationReason = reason?.toLowerCase().includes('rider') ? 'requested_by_customer' : 'abandoned';
      await stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: cancellationReason,
      });

      // Update Firestore record - use set with merge to avoid errors if doc doesn't exist
      await db.collection('stripe_payments').doc(paymentIntentId).set({
        status: 'cancelled',
        cancelledReason: reason || 'Authorization released - no driver found',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Update trip if tripId provided
      if (tripId) {
        await db.collection('trips').doc(tripId).update({
          paymentStatus: 'RELEASED',
          paymentReleasedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentReleasedReason: reason || 'No driver found',
        });
      }

      console.log('✅ Payment authorization released:', paymentIntentId);

      return {
        paymentIntentId,
        status: 'cancelled',
        message: 'Payment authorization released - funds returned to customer',
      };
    } catch (error: unknown) {
      console.error('❌ Error cancelling payment authorization:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to cancel payment authorization';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * GET STRIPE PAYMENT METHODS
 * Get saved payment methods for the customer
 */
export const getStripePaymentMethods = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const userId = request.auth.uid;

      console.log('getStripePaymentMethods - userId:', userId);

      // Get customer ID
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const customerId = userData?.stripeCustomerId;

      console.log('getStripePaymentMethods - userData:', JSON.stringify({
        exists: userDoc.exists,
        hasStripeCustomerId: !!customerId,
        stripeCustomerId: customerId || 'NOT SET',
        email: userData?.email || 'NO EMAIL',
      }));

      if (!customerId) {
        console.log('getStripePaymentMethods - No customer ID, returning empty array');
        return [];
      }

      // Get payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      // Get customer's default payment method
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

      return paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        isDefault: pm.id === defaultPaymentMethodId,
        createdAt: new Date(pm.created * 1000),
      }));
    } catch (error: unknown) {
      console.error('Error getting payment methods:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to get payment methods';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * REMOVE STRIPE PAYMENT METHOD
 * Detach a payment method from the customer
 */
export const removeStripePaymentMethod = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as PaymentMethodRequest;
      const { paymentMethodId } = data;

      if (!paymentMethodId) {
        throw new HttpsError('invalid-argument', 'Payment method ID is required');
      }

      console.log('Removing Stripe payment method:', paymentMethodId);

      await stripe.paymentMethods.detach(paymentMethodId);

      console.log('Payment method removed:', paymentMethodId);

      return { success: true };
    } catch (error: unknown) {
      console.error('Error removing payment method:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to remove payment method';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * CREATE STRIPE SETUP INTENT
 * Creates a SetupIntent for saving a card without charging
 * Used for in-app card form (CardField component)
 */
export const createStripeSetupIntent = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const userId = request.auth.uid;

      console.log('Creating Stripe setup intent for user:', userId);

      // Get or create customer
      const userDoc = await db.collection('users').doc(userId).get();
      let customerId = userDoc.data()?.stripeCustomerId;

      if (!customerId) {
        // Create new customer
        const customer = await stripe.customers.create({
          email: request.auth.token.email || undefined,
          metadata: {
            firebaseUserId: userId,
          },
        });
        customerId = customer.id;

        // Save customer ID
        await db.collection('users').doc(userId).set(
          { stripeCustomerId: customerId },
          { merge: true }
        );
      }

      // Create ephemeral key for the customer
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2024-06-20' }
      );

      // Create setup intent (for saving card without payment)
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId,
        },
      });

      console.log('Stripe setup intent created:', setupIntent.id);

      return {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customerId,
      };
    } catch (error: unknown) {
      console.error('Error creating Stripe setup intent:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to create setup intent';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * CONFIRM STRIPE SETUP INTENT
 * Confirms that a card was successfully saved
 */
export const confirmStripeSetupIntent = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as { setupIntentId: string; setAsDefault?: boolean };
      const { setupIntentId, setAsDefault } = data;
      const userId = request.auth.uid;

      if (!setupIntentId) {
        throw new HttpsError('invalid-argument', 'Setup Intent ID is required');
      }

      console.log('Confirming Stripe setup intent:', setupIntentId);

      // Retrieve setup intent from Stripe
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

      if (setupIntent.status !== 'succeeded') {
        throw new HttpsError('failed-precondition', `Setup intent status: ${setupIntent.status}`);
      }

      // If setAsDefault, update customer's default payment method
      if (setAsDefault && setupIntent.payment_method) {
        const userDoc = await db.collection('users').doc(userId).get();
        const customerId = userDoc.data()?.stripeCustomerId;

        if (customerId) {
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: setupIntent.payment_method as string,
            },
          });
        }
      }

      console.log('Stripe setup intent confirmed:', {
        setupIntentId,
        status: setupIntent.status,
        paymentMethod: setupIntent.payment_method,
      });

      return {
        setupIntentId,
        status: setupIntent.status,
        paymentMethodId: setupIntent.payment_method,
      };
    } catch (error: unknown) {
      console.error('Error confirming Stripe setup intent:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to confirm setup intent';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * SET DEFAULT STRIPE PAYMENT METHOD
 * Set a payment method as the customer's default
 */
export const setDefaultStripePaymentMethod = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as PaymentMethodRequest;
      const { paymentMethodId } = data;
      const userId = request.auth.uid;

      if (!paymentMethodId) {
        throw new HttpsError('invalid-argument', 'Payment method ID is required');
      }

      // Get customer ID
      const userDoc = await db.collection('users').doc(userId).get();
      const customerId = userDoc.data()?.stripeCustomerId;

      if (!customerId) {
        throw new HttpsError('not-found', 'Customer not found');
      }

      console.log('Setting default payment method:', paymentMethodId);

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      console.log('Default payment method set:', paymentMethodId);

      return { success: true };
    } catch (error: unknown) {
      console.error('Error setting default payment method:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to set default payment method';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * UPDATE DRIVER EARNINGS
 * Securely updates driver earnings after trip completion
 * Called by the app when a trip is completed
 */
interface UpdateDriverEarningsRequest {
  driverId: string;
  tripId: string;
  tripEarnings: number;
  tipAmount: number;
}

export const updateDriverEarnings = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const data = request.data as UpdateDriverEarningsRequest;
      const { driverId, tripId, tripEarnings, tipAmount } = data;

      if (!driverId || !tripId) {
        throw new HttpsError('invalid-argument', 'Driver ID and Trip ID are required');
      }

      if (tripEarnings < 0 || tipAmount < 0) {
        throw new HttpsError('invalid-argument', 'Earnings and tip must be non-negative');
      }

      console.log('Updating driver earnings:', { driverId, tripId, tripEarnings, tipAmount });

      // Verify the trip exists and belongs to this driver
      const tripDoc = await db.collection('trips').doc(tripId).get();
      if (!tripDoc.exists) {
        throw new HttpsError('not-found', 'Trip not found');
      }

      const tripData = tripDoc.data();
      if (tripData?.driverId !== driverId) {
        throw new HttpsError('permission-denied', 'Trip does not belong to this driver');
      }

      // Check if earnings were already updated for this trip
      if (tripData?.earningsUpdated) {
        console.log('Earnings already updated for trip:', tripId);
        return { success: true, alreadyUpdated: true };
      }

      // Get current driver data
      const driverRef = db.collection('drivers').doc(driverId);
      const driverDoc = await driverRef.get();

      // If driver document doesn't exist, create it with initial earnings
      // This handles cases where the driver document hasn't been created yet
      if (!driverDoc.exists) {
        console.log('Driver document not found, creating new one for:', driverId);
        await driverRef.set({
          todayEarnings: 0,
          totalEarnings: 0,
          totalTrips: 0,
          totalTips: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const driverData = driverDoc.exists ? driverDoc.data() : {};
      const currentTodayEarnings = driverData?.todayEarnings || 0;
      const currentTotalEarnings = driverData?.totalEarnings || 0;
      const currentTotalTrips = driverData?.totalTrips || 0;
      const currentTotalTips = driverData?.totalTips || 0;

      // Update driver earnings using transaction
      await db.runTransaction(async (transaction) => {
        transaction.update(driverRef, {
          todayEarnings: currentTodayEarnings + tripEarnings + tipAmount,
          totalEarnings: currentTotalEarnings + tripEarnings + tipAmount,
          totalTrips: currentTotalTrips + 1,
          totalTips: currentTotalTips + tipAmount,
          lastTripAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Mark trip as having earnings updated
        transaction.update(db.collection('trips').doc(tripId), {
          earningsUpdated: true,
          earningsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log('Driver earnings updated successfully:', driverId);

      return { success: true };
    } catch (error: unknown) {
      console.error('Error updating driver earnings:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to update driver earnings';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * CHARGE ADDITIONAL AMOUNT
 * Creates and immediately charges a payment for additional costs (extra stops, tips)
 * Uses the customer's default saved payment method
 */
interface ChargeAdditionalRequest {
  amount: number;
  tripId: string;
  type: 'extra_stop' | 'tip';
  description?: string;
}

export const chargeAdditionalAmount = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const data = request.data as ChargeAdditionalRequest;
      const { amount, tripId, type, description } = data;
      const userId = request.auth.uid;

      if (!amount || amount <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid amount');
      }

      if (!tripId) {
        throw new HttpsError('invalid-argument', 'Trip ID is required');
      }

      console.log(`💰 Charging additional ${type} amount:`, { amount, tripId, userId });

      // Get customer ID
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const customerId = userData?.stripeCustomerId;

      if (!customerId) {
        throw new HttpsError('failed-precondition', 'No payment method on file');
      }

      // Get customer's default payment method
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

      if (!defaultPaymentMethodId) {
        // Try to get the first available payment method
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
          limit: 1,
        });

        if (paymentMethods.data.length === 0) {
          throw new HttpsError('failed-precondition', 'No payment method on file');
        }
      }

      const paymentMethodId = defaultPaymentMethodId || (await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 1,
      })).data[0]?.id;

      if (!paymentMethodId) {
        throw new HttpsError('failed-precondition', 'No payment method available');
      }

      // Create and confirm payment intent immediately (off-session payment)
      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId as string,
        description: description || `Drift ${type === 'tip' ? 'Tip' : 'Extra Stop'} - Trip ${tripId}`,
        metadata: {
          userId,
          tripId,
          type,
        },
        // Immediate capture (not manual)
        capture_method: 'automatic',
        // Confirm immediately
        confirm: true,
        // Off-session since customer isn't present
        off_session: true,
      });

      // Save payment record
      await db.collection('stripe_payments').doc(paymentIntent.id).set({
        userId,
        tripId,
        type,
        paymentIntentId: paymentIntent.id,
        amount,
        amountInCents,
        currency: 'USD',
        status: paymentIntent.status,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update trip with payment info
      const tripUpdate: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (type === 'extra_stop') {
        tripUpdate.extraStopPaymentId = paymentIntent.id;
        tripUpdate.extraStopPaymentStatus = paymentIntent.status === 'succeeded' ? 'PAID' : 'PENDING';
        tripUpdate.extraStopPaymentAt = admin.firestore.FieldValue.serverTimestamp();
      } else if (type === 'tip') {
        tripUpdate.tipPaymentId = paymentIntent.id;
        tripUpdate.tipPaymentStatus = paymentIntent.status === 'succeeded' ? 'PAID' : 'PENDING';
        tripUpdate.tipPaymentAt = admin.firestore.FieldValue.serverTimestamp();
      }

      await db.collection('trips').doc(tripId).update(tripUpdate);

      console.log(`✅ ${type} payment ${paymentIntent.status}:`, paymentIntent.id);

      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount,
      };
    } catch (error: unknown) {
      console.error('❌ Error charging additional amount:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      // Handle Stripe card errors specifically
      if (error instanceof Stripe.errors.StripeCardError) {
        throw new HttpsError('failed-precondition', error.message || 'Card was declined');
      }

      const message = error instanceof Error ? error.message : 'Failed to process payment';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * PROCESS TRIP ISSUE REFUND (Admin Only)
 * Processes a refund for a trip issue reported by a rider
 * Called from the admin trip-issues screen
 */
interface ProcessTripIssueRequest {
  issueId: string;
  action: 'refund' | 'reject' | 'suspend' | 'ban';
  adminNotes?: string;
}

export const processTripIssueRefund = onCall(callableOptions, async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const adminId = request.auth.uid;

      // Verify user is an admin
      const adminDoc = await db.collection('users').doc(adminId).get();
      const adminData = adminDoc.data();
      if (!adminData?.roles?.includes('ADMIN')) {
        throw new HttpsError('permission-denied', 'Only admins can process trip issues');
      }

      const data = request.data as ProcessTripIssueRequest;
      const { issueId, action, adminNotes } = data;

      if (!issueId) {
        throw new HttpsError('invalid-argument', 'Issue ID is required');
      }

      console.log('🔧 Processing trip issue:', { issueId, action, adminId });

      // Get the issue
      const issueDoc = await db.collection('tripIssues').doc(issueId).get();
      if (!issueDoc.exists) {
        throw new HttpsError('not-found', 'Trip issue not found');
      }

      const issueData = issueDoc.data();
      if (!issueData) {
        throw new HttpsError('internal', 'Issue data is empty');
      }

      // Check if already processed
      if (issueData.status !== 'pending') {
        throw new HttpsError('failed-precondition', `Issue already processed with status: ${issueData.status}`);
      }

      const tripId = issueData.tripId;
      let newStatus: string = 'reviewed';
      let refundResult: any = null;

      // Get trip data if we need to process a refund
      if (action === 'refund') {
        const tripDoc = await db.collection('trips').doc(tripId).get();
        if (!tripDoc.exists) {
          throw new HttpsError('not-found', 'Trip not found');
        }

        const tripData = tripDoc.data();
        if (!tripData) {
          throw new HttpsError('internal', 'Trip data is empty');
        }

        const paymentIntentId = tripData.paymentIntentId;
        if (!paymentIntentId) {
          throw new HttpsError('failed-precondition', 'No payment intent found for this trip');
        }

        // Check if trip is within 24 hours (extra safety check)
        const completedAt = tripData.completedAt?.toDate();
        if (completedAt) {
          const hoursSinceCompletion = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
          // Allow some buffer beyond 24 hours for admin processing
          if (hoursSinceCompletion > 48) {
            console.warn('⚠️ Trip completed more than 48 hours ago, but admin is forcing refund');
          }
        }

        // Process refund via Stripe
        const stripe = getStripe();
        const refundAmount = tripData.finalCost || tripData.estimatedCost || issueData.tripCost;

        console.log('💰 Processing Stripe refund:', {
          paymentIntentId,
          amount: refundAmount,
          tripId,
        });

        try {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              tripId,
              issueId,
              adminId,
              reason: 'Trip issue refund',
            },
          });

          refundResult = {
            refundId: refund.id,
            status: refund.status,
            amount: refund.amount / 100,
          };

          newStatus = 'refunded';

          // Update trip with refund info
          await db.collection('trips').doc(tripId).update({
            refundStatus: 'REFUNDED',
            refundId: refund.id,
            refundAmount: refund.amount / 100,
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            refundReason: 'Trip issue reported by rider',
          });

          // Update payment record
          await db.collection('stripe_payments').doc(paymentIntentId).update({
            refundId: refund.id,
            refundStatus: refund.status,
            refundAmount: refund.amount / 100,
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            refundReason: 'Trip issue - admin approved',
          });

          console.log('✅ Refund processed successfully:', refund.id);
        } catch (stripeError: any) {
          console.error('❌ Stripe refund error:', stripeError);
          throw new HttpsError('internal', `Stripe refund failed: ${stripeError.message}`);
        }
      } else if (action === 'reject') {
        newStatus = 'rejected';
      } else if (action === 'suspend') {
        newStatus = 'driver_suspended';
        // Update driver status
        if (issueData.driverId) {
          await db.collection('drivers').doc(issueData.driverId).update({
            status: 'suspended',
            suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
            suspensionReason: `Trip issue #${issueId}: ${adminNotes || 'No notes'}`,
          });
        }
      } else if (action === 'ban') {
        newStatus = 'driver_banned';
        // Update driver status
        if (issueData.driverId) {
          await db.collection('drivers').doc(issueData.driverId).update({
            status: 'banned',
            bannedAt: admin.firestore.FieldValue.serverTimestamp(),
            banReason: `Trip issue #${issueId}: ${adminNotes || 'No notes'}`,
          });
        }
      }

      // Update the issue document
      await db.collection('tripIssues').doc(issueId).update({
        status: newStatus,
        adminAction: action,
        adminNotes: adminNotes || null,
        adminId,
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundResult: refundResult || null,
      });

      console.log('✅ Trip issue processed:', { issueId, newStatus, action });

      return {
        success: true,
        status: newStatus,
        refund: refundResult,
      };
    } catch (error: unknown) {
      console.error('❌ Error processing trip issue:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to process trip issue';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * STRIPE WEBHOOK HANDLER
 * Handles events from Stripe for payment status updates
 *
 * Events handled:
 * - payment_intent.succeeded: Payment completed successfully
 * - payment_intent.payment_failed: Payment failed
 * - charge.refunded: Refund processed
 * - charge.dispute.created: Customer disputed a charge
 */
export const stripeWebhook = onRequest(
  {
    region: 'us-east1',
    invoker: 'public', // Stripe needs to call this endpoint
  },
  async (req, res) => {
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('No Stripe signature found');
      res.status(400).send('No signature');
      return;
    }

    if (!stripeWebhookSecret) {
      console.error('Webhook secret not configured');
      res.status(500).send('Webhook secret not configured');
      return;
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    console.log('Stripe webhook received:', event.type);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment succeeded:', paymentIntent.id);

          // Update payment record in Firestore
          await db.collection('stripe_payments').doc(paymentIntent.id).update({
            status: 'succeeded',
            webhookConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // If there's a trip associated, update it
          const tripId = paymentIntent.metadata?.tripId;
          if (tripId) {
            await db.collection('trips').doc(tripId).update({
              paymentStatus: 'paid',
              paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment failed:', paymentIntent.id);

          const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

          // Update payment record in Firestore
          await db.collection('stripe_payments').doc(paymentIntent.id).update({
            status: 'failed',
            failureMessage,
            webhookUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // If there's a trip associated, update it
          const tripId = paymentIntent.metadata?.tripId;
          if (tripId) {
            await db.collection('trips').doc(tripId).update({
              paymentStatus: 'failed',
              paymentFailureReason: failureMessage,
            });
          }
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          console.log('Charge refunded:', charge.id);

          // Find payment by charge's payment_intent
          if (charge.payment_intent) {
            const paymentIntentId = typeof charge.payment_intent === 'string'
              ? charge.payment_intent
              : charge.payment_intent.id;

            await db.collection('stripe_payments').doc(paymentIntentId).update({
              status: 'refunded',
              refundedAmount: charge.amount_refunded / 100,
              webhookRefundedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          break;
        }

        case 'charge.dispute.created': {
          const dispute = event.data.object as Stripe.Dispute;
          console.log('Dispute created:', dispute.id);

          // Find the payment intent from the charge
          if (dispute.payment_intent) {
            const paymentIntentId = typeof dispute.payment_intent === 'string'
              ? dispute.payment_intent
              : dispute.payment_intent.id;

            await db.collection('stripe_payments').doc(paymentIntentId).update({
              disputeId: dispute.id,
              disputeStatus: dispute.status,
              disputeReason: dispute.reason,
              disputeAmount: dispute.amount / 100,
              disputeCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Log dispute for admin review
            await db.collection('stripe_disputes').doc(dispute.id).set({
              disputeId: dispute.id,
              paymentIntentId,
              status: dispute.status,
              reason: dispute.reason,
              amount: dispute.amount / 100,
              currency: dispute.currency,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          break;
        }

        default:
          console.log('Unhandled event type:', event.type);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Webhook processing error');
    }
  }
);
