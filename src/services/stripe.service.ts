/**
 * STRIPE SERVICE - EXPO SDK 52
 * Production Stripe integration using Firebase Cloud Functions
 * Supports Payment Sheet for card payments
 *
 * REACT NATIVE FIREBASE v21 (not Web SDK)
 */

import { firebaseFunctions, firebaseAuth } from '@/src/config/firebase';

export interface StripePaymentMethod {
  id: string;
  brand: string;
  last4: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface StripePaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  amount: number;
  currency: string;
}

export interface StripeCaptureResult {
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
}

export interface StripeSetupIntentResult {
  setupIntentId: string;
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
}

/**
 * Create Stripe Payment Intent
 * Uses React Native Firebase API (not Web SDK)
 */
export async function createStripePaymentIntent(
  amount: number,
  currency: string = 'USD',
  description?: string,
  metadata?: Record<string, any>
): Promise<StripePaymentIntentResult> {
  try {
    console.log('💳 Starting Stripe payment flow...');

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    // Force token refresh
    const token = await user.getIdToken(true);
    console.log('🔑 Auth token refreshed, length:', token.length);

    // React Native Firebase uses httpsCallable directly on functions instance
    const createPaymentIntent = firebaseFunctions.httpsCallable('createStripePaymentIntent');

    const result = await createPaymentIntent({
      amount,
      currency,
      description,
      metadata,
    });

    const data = result.data as StripePaymentIntentResult;

    if (!data.clientSecret || !data.paymentIntentId) {
      throw new Error('Invalid Stripe payment intent response');
    }

    console.log('✅ Stripe payment intent created:', {
      paymentIntentId: data.paymentIntentId,
      customerId: data.customerId,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to create Stripe payment intent:', error);
    throw new Error(error.message || 'Failed to create Stripe payment');
  }
}

/**
 * Confirm Stripe Payment Intent
 * Called after user completes payment in Payment Sheet
 * Uses React Native Firebase API (not Web SDK)
 */
export async function confirmStripePayment(
  paymentIntentId: string
): Promise<StripeCaptureResult> {
  try {
    console.log('💰 Confirming Stripe payment:', paymentIntentId);

    // React Native Firebase uses httpsCallable directly on functions instance
    const confirmPayment = firebaseFunctions.httpsCallable('confirmStripePayment');

    const result = await confirmPayment({ paymentIntentId });

    const data = result.data as StripeCaptureResult;

    console.log('✅ Stripe payment confirmed:', {
      paymentIntentId: data.paymentIntentId,
      status: data.status,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to confirm Stripe payment:', error);
    throw new Error(error.message || 'Failed to confirm payment');
  }
}

/**
 * Get Stripe Payment Intent Status
 * Uses React Native Firebase API (not Web SDK)
 */
export async function getStripePaymentStatus(
  paymentIntentId: string
): Promise<{ paymentIntentId: string; status: string; amount: number }> {
  try {
    console.log('🔍 Getting Stripe payment status:', paymentIntentId);

    const getStatus = firebaseFunctions.httpsCallable('getStripePaymentStatus');

    const result = await getStatus({ paymentIntentId });

    const data = result.data as any;

    console.log('✅ Stripe payment status:', {
      paymentIntentId: data.paymentIntentId,
      status: data.status,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to get Stripe payment status:', error);
    throw new Error(error.message || 'Failed to get payment status');
  }
}

/**
 * Refund Stripe Payment
 * Uses React Native Firebase API (not Web SDK)
 */
export async function refundStripePayment(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<{ refundId: string; status: string; amount: number }> {
  try {
    console.log('🔄 Processing Stripe refund:', paymentIntentId);

    // React Native Firebase uses httpsCallable directly on functions instance
    const refundPayment = firebaseFunctions.httpsCallable('refundStripePayment');

    const result = await refundPayment({
      paymentIntentId,
      amount,
      reason,
    });

    const data = result.data as any;

    console.log('✅ Refund processed:', data.refundId);

    return data;
  } catch (error: any) {
    console.error('❌ Failed to process refund:', error);
    throw new Error(error.message || 'Failed to process refund');
  }
}

/**
 * Get or Create Stripe Customer
 * Creates a Stripe customer for the authenticated user
 */
export async function getOrCreateStripeCustomer(): Promise<{ customerId: string }> {
  try {
    console.log('👤 Getting or creating Stripe customer...');

    const getCustomer = firebaseFunctions.httpsCallable('getOrCreateStripeCustomer');

    const result = await getCustomer({});

    const data = result.data as { customerId: string };

    console.log('✅ Stripe customer:', data.customerId);

    return data;
  } catch (error: any) {
    console.error('❌ Failed to get/create Stripe customer:', error);
    throw new Error(error.message || 'Failed to get customer');
  }
}

/**
 * Create Stripe Setup Intent
 * Used for saving cards without charging (in-app CardField)
 */
export async function createStripeSetupIntent(): Promise<StripeSetupIntentResult> {
  try {
    console.log('💳 Creating Stripe setup intent...');

    const createSetupIntent = firebaseFunctions.httpsCallable('createStripeSetupIntent');

    const result = await createSetupIntent({});

    const data = result.data as StripeSetupIntentResult;

    if (!data.clientSecret || !data.setupIntentId) {
      throw new Error('Invalid Stripe setup intent response');
    }

    console.log('✅ Stripe setup intent created:', {
      setupIntentId: data.setupIntentId,
      customerId: data.customerId,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to create Stripe setup intent:', error);
    throw new Error(error.message || 'Failed to create setup intent');
  }
}

/**
 * Confirm Stripe Setup Intent
 * Called after user enters card details with CardField
 */
export async function confirmStripeSetupIntent(
  setupIntentId: string,
  setAsDefault: boolean = true
): Promise<{ setupIntentId: string; status: string; paymentMethodId: string }> {
  try {
    console.log('💰 Confirming Stripe setup intent:', setupIntentId);

    const confirmSetup = firebaseFunctions.httpsCallable('confirmStripeSetupIntent');

    const result = await confirmSetup({ setupIntentId, setAsDefault });

    const data = result.data as any;

    console.log('✅ Stripe setup intent confirmed:', {
      setupIntentId: data.setupIntentId,
      status: data.status,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to confirm Stripe setup intent:', error);
    throw new Error(error.message || 'Failed to confirm setup intent');
  }
}

/**
 * Helper to ensure user is authenticated before calling functions
 */
async function ensureAuthenticated(): Promise<string> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  // Force token refresh to ensure it's valid
  await user.getIdToken(true);
  console.log('🔑 Auth verified for user:', user.uid);
  return user.uid;
}

/**
 * Stripe Service Class (for convenience)
 */
export class StripeService {
  /**
   * Get saved Stripe payment methods for user
   */
  static async getPaymentMethods(userId: string): Promise<StripePaymentMethod[]> {
    try {
      // Ensure auth is valid before calling
      await ensureAuthenticated();

      const getMethods = firebaseFunctions.httpsCallable('getStripePaymentMethods');
      const result = await getMethods({});
      return (result.data as StripePaymentMethod[]) || [];
    } catch (error) {
      console.error('Error loading payment methods:', error);
      return [];
    }
  }

  /**
   * Remove Stripe payment method
   */
  static async removePaymentMethod(userId: string, methodId: string): Promise<void> {
    try {
      const removeMethod = firebaseFunctions.httpsCallable('removeStripePaymentMethod');
      await removeMethod({ paymentMethodId: methodId });
      console.log('🗑️ Removed Stripe payment method:', methodId);
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  static async setDefaultMethod(userId: string, methodId: string): Promise<void> {
    try {
      const setDefault = firebaseFunctions.httpsCallable('setDefaultStripePaymentMethod');
      await setDefault({ paymentMethodId: methodId });
      console.log('⭐ Set default Stripe payment method:', methodId);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }
}
