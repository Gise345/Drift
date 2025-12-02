/**
 * FIREBASE CLOUD FUNCTIONS - STRIPE PAYMENTS
 * Supports: Card payments via Payment Sheet
 *
 * Deploy: firebase deploy --only functions
 *
 * Environment variables needed (use .env file or Firebase secrets):
 * STRIPE_SECRET_KEY="YOUR_SECRET_KEY"
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with secret key from environment (.env file)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

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
 * GET OR CREATE STRIPE CUSTOMER
 * Creates a Stripe customer for the authenticated user or returns existing one
 */
export const getOrCreateStripeCustomer = onCall(async (request) => {
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
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
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
      await admin.firestore().collection('users').doc(userId).set(
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
export const createStripePaymentIntent = onCall(async (request) => {
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

      console.log('Creating Stripe payment intent:', { amount, currency, description });

      // Get or create customer
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
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
        await admin.firestore().collection('users').doc(userId).set(
          { stripeCustomerId: customerId },
          { merge: true }
        );
      }

      // Create ephemeral key for the customer
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2025-11-17.clover' }
      );

      // Create payment intent
      // Amount should be in cents for USD
      const amountInCents = Math.round(amount * 100);

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
        // Note: Apple Pay and Google Pay are handled automatically through 'card'
        // when using the mobile Payment Sheet with applePay/googlePay config
      });

      // Save payment intent to Firestore
      await admin.firestore().collection('stripe_payments').doc(paymentIntent.id).set({
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
export const confirmStripePayment = onCall(async (request) => {
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
      await admin.firestore().collection('stripe_payments').doc(paymentIntentId).update({
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
export const getStripePaymentStatus = onCall(async (request) => {
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
export const refundStripePayment = onCall(async (request) => {
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
      await admin.firestore().collection('stripe_payments').doc(paymentIntentId).update({
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
 * GET STRIPE PAYMENT METHODS
 * Get saved payment methods for the customer
 */
export const getStripePaymentMethods = onCall(async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const userId = request.auth.uid;

      // Get customer ID
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const customerId = userDoc.data()?.stripeCustomerId;

      if (!customerId) {
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
export const removeStripePaymentMethod = onCall(async (request) => {
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
export const createStripeSetupIntent = onCall(async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const stripe = getStripe();
      const userId = request.auth.uid;

      console.log('Creating Stripe setup intent for user:', userId);

      // Get or create customer
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
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
        await admin.firestore().collection('users').doc(userId).set(
          { stripeCustomerId: customerId },
          { merge: true }
        );
      }

      // Create ephemeral key for the customer
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2025-11-17.clover' }
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
export const confirmStripeSetupIntent = onCall(async (request) => {
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
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
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
export const setDefaultStripePaymentMethod = onCall(async (request) => {
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
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
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

export const updateDriverEarnings = onCall(async (request) => {
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
      const tripDoc = await admin.firestore().collection('trips').doc(tripId).get();
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
      const driverRef = admin.firestore().collection('drivers').doc(driverId);
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
      await admin.firestore().runTransaction(async (transaction) => {
        transaction.update(driverRef, {
          todayEarnings: currentTodayEarnings + tripEarnings + tipAmount,
          totalEarnings: currentTotalEarnings + tripEarnings + tipAmount,
          totalTrips: currentTotalTrips + 1,
          totalTips: currentTotalTips + tipAmount,
          lastTripAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Mark trip as having earnings updated
        transaction.update(admin.firestore().collection('trips').doc(tripId), {
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
