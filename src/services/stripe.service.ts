/**
 * STRIPE SERVICE - EXPO SDK 52
 * Production Stripe integration using Firebase Cloud Functions
 * Supports Payment Sheet for card payments
 *
 * REACT NATIVE FIREBASE v23+ MODULAR API
 */

import { firebaseFunctions, firebaseAuth } from '@/src/config/firebase';
import { httpsCallable } from '@react-native-firebase/functions';

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
  currency: string = 'GBP',
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

    // React Native Firebase v23+ modular API
    const createPaymentIntent = httpsCallable(firebaseFunctions, 'createStripePaymentIntent');

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

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    // Force token refresh to prevent auth errors
    await user.getIdToken(true);
    console.log('🔑 Auth token refreshed for payment confirmation');

    // React Native Firebase v23+ modular API
    const confirmPayment = httpsCallable(firebaseFunctions, 'confirmStripePayment');

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

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    // Force token refresh to prevent auth errors
    await user.getIdToken(true);

    const getStatus = httpsCallable(firebaseFunctions, 'getStripePaymentStatus');

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

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    // Force token refresh to prevent auth errors
    await user.getIdToken(true);

    // React Native Firebase v23+ modular API
    const refundPayment = httpsCallable(firebaseFunctions, 'refundStripePayment');

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
 * Verify Card Has Sufficient Funds
 * Creates a small authorization hold to verify the card is valid and has funds,
 * then immediately cancels it. This is used when rider presses "Pay" - we verify
 * the card but don't actually charge until a driver accepts.
 *
 * Flow:
 * 1. Create a small PaymentIntent with manual capture (£0.50)
 * 2. Payment Sheet confirms it (places hold to verify funds)
 * 3. We immediately cancel it (releases hold)
 * 4. If successful, card is valid - actual charge happens when driver accepts
 *
 * @param actualAmount The actual ride amount to store for later charging
 * @param metadata Additional metadata to store for the ride
 */
export async function verifyCardAndPreauthorize(
  actualAmount: number,
  currency: string = 'GBP',
  metadata?: Record<string, any>
): Promise<{
  verified: boolean;
  customerId: string;
  verificationIntentId: string;
  clientSecret: string;
  ephemeralKey: string;
  actualAmount: number;
}> {
  try {
    console.log('🔍 Verifying card has sufficient funds...');
    console.log('   Actual ride amount:', actualAmount, currency);

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    await user.getIdToken(true);

    // Call the verification function
    const verifyCard = httpsCallable(firebaseFunctions, 'verifyCardForRide');

    const result = await verifyCard({
      actualAmount,
      currency,
      metadata,
    });

    const data = result.data as {
      verified: boolean;
      customerId: string;
      verificationIntentId: string;
      clientSecret: string;
      ephemeralKey: string;
      actualAmount: number;
    };

    console.log('✅ Card verification result:', {
      verified: data.verified,
      customerId: data.customerId,
      verificationIntentId: data.verificationIntentId,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Card verification failed:', error);
    throw new Error(error.message || 'Card verification failed. Please check your card details.');
  }
}

/**
 * Charge Verified Card for Ride
 * Called when a driver accepts the ride - charges the actual ride amount
 * using the customer's verified payment method
 *
 * @param customerId The Stripe customer ID
 * @param amount The ride amount to charge
 * @param tripId The trip ID for metadata
 */
export async function chargeVerifiedCardForRide(
  customerId: string,
  amount: number,
  tripId: string,
  currency: string = 'GBP'
): Promise<{
  success: boolean;
  paymentIntentId: string;
  status: string;
  amount: number;
}> {
  try {
    console.log('💰 Charging verified card for ride:', { amount, tripId, customerId });

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    await user.getIdToken(true);

    const chargeCard = httpsCallable(firebaseFunctions, 'chargeCardForRide');

    const result = await chargeCard({
      customerId,
      amount,
      tripId,
      currency,
    });

    const data = result.data as {
      success: boolean;
      paymentIntentId: string;
      status: string;
      amount: number;
    };

    console.log('✅ Ride payment result:', {
      success: data.success,
      paymentIntentId: data.paymentIntentId,
      status: data.status,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to charge card for ride:', error);
    throw new Error(error.message || 'Payment failed. Please try again.');
  }
}

/**
 * Cancel Verification Hold
 * Called after Payment Sheet confirms the card verification to release the £1 hold
 */
export async function cancelVerificationHold(
  verificationIntentId: string
): Promise<{ success: boolean; status: string }> {
  try {
    console.log('🚫 Canceling verification hold:', verificationIntentId);

    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    await user.getIdToken(true);

    const cancelHold = httpsCallable(firebaseFunctions, 'cancelVerificationHold');

    const result = await cancelHold({ verificationIntentId });

    const data = result.data as { success: boolean; status: string };

    console.log('✅ Verification hold canceled:', data);

    return data;
  } catch (error: any) {
    console.error('❌ Failed to cancel verification hold:', error);
    throw new Error(error.message || 'Failed to release verification hold');
  }
}

/**
 * Release Payment Authorization (Cancel/Void)
 * Cancels an authorized payment that was never captured
 * Used when: no drivers found, rider cancels before driver accepts
 * This releases the hold on the customer's card - NO funds are charged
 */
export async function releasePaymentAuthorization(
  paymentIntentId: string,
  tripId?: string,
  reason?: string
): Promise<{ paymentIntentId: string; status: string; message: string }> {
  try {
    console.log('🚫 Releasing payment authorization:', paymentIntentId);

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    await user.getIdToken(true);

    const cancelAuth = httpsCallable(firebaseFunctions, 'cancelStripePaymentAuth');

    const result = await cancelAuth({
      paymentIntentId,
      tripId,
      reason,
    });

    const data = result.data as { paymentIntentId: string; status: string; message: string };

    console.log('✅ Payment authorization released:', {
      paymentIntentId: data.paymentIntentId,
      status: data.status,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to release payment authorization:', error);
    throw new Error(error.message || 'Failed to release payment');
  }
}

/**
 * Capture Payment Authorization
 * Captures a previously authorized (held) payment
 * Called when driver accepts a ride
 */
export async function capturePaymentAuthorization(
  paymentIntentId: string,
  tripId?: string
): Promise<{ paymentIntentId: string; status: string; amount: number }> {
  try {
    console.log('💰 Capturing payment authorization:', paymentIntentId);

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    await user.getIdToken(true);

    const capturePayment = httpsCallable(firebaseFunctions, 'captureStripePayment');

    const result = await capturePayment({
      paymentIntentId,
      tripId,
    });

    const data = result.data as { paymentIntentId: string; status: string; amount: number };

    console.log('✅ Payment captured:', {
      paymentIntentId: data.paymentIntentId,
      status: data.status,
      amount: data.amount,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to capture payment:', error);
    throw new Error(error.message || 'Failed to capture payment');
  }
}

/**
 * Get or Create Stripe Customer
 * Creates a Stripe customer for the authenticated user
 */
export async function getOrCreateStripeCustomer(): Promise<{ customerId: string }> {
  try {
    console.log('👤 Getting or creating Stripe customer...');

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    // Force token refresh to prevent auth errors
    await user.getIdToken(true);

    const getCustomer = httpsCallable(firebaseFunctions, 'getOrCreateStripeCustomer');

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

    // Ensure auth is ready and get fresh token
    const { uid, idToken } = await ensureAuthenticated();

    console.log('🔑 Auth ready for setup intent, user:', uid, '| Token length:', idToken.length);

    const createSetupIntent = httpsCallable(firebaseFunctions, 'createStripeSetupIntent');

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

    // Ensure auth is ready and get fresh token
    const { uid, idToken } = await ensureAuthenticated();

    console.log('🔑 Auth ready for confirm setup, user:', uid, '| Token length:', idToken.length);

    const confirmSetup = httpsCallable(firebaseFunctions, 'confirmStripeSetupIntent');

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
 * Helper to ensure user is authenticated and get a fresh ID token
 * Waits for auth state to be ready if needed
 * Returns both the user ID and the fresh ID token for manual attachment if needed
 */
async function ensureAuthenticated(): Promise<{ uid: string; idToken: string }> {
  // First check if we already have a current user
  let user = firebaseAuth.currentUser;

  // If no user, wait a moment for auth state to initialize
  if (!user) {
    console.log('⏳ Waiting for auth state to initialize...');
    // Wait up to 5 seconds for auth state
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      user = firebaseAuth.currentUser;
      if (user) {
        console.log('✅ Auth state initialized after waiting');
        break;
      }
    }
  }

  if (!user) {
    console.error('❌ No authenticated user found after waiting');
    throw new Error('UNAUTHENTICATED');
  }

  // Force token refresh to ensure it's valid
  let idToken: string;
  try {
    idToken = await user.getIdToken(true);
    console.log('🔑 Auth verified for user:', user.uid, '| Token length:', idToken.length);
  } catch (tokenError) {
    console.error('❌ Failed to refresh auth token:', tokenError);
    throw new Error('UNAUTHENTICATED');
  }

  return { uid: user.uid, idToken };
}

/**
 * Workaround for React Native Firebase httpsCallable auth token issue
 * Sometimes the auth token isn't properly attached to callable function requests
 * This helper ensures we have a valid auth state before making the call
 */
async function callAuthenticatedFunction<T>(
  functionName: string,
  data: any = {}
): Promise<T> {
  // Ensure auth is ready and get fresh token
  const { uid, idToken } = await ensureAuthenticated();

  console.log(`📞 Calling ${functionName} for user ${uid}...`);

  // Make the callable function request
  const callable = httpsCallable(firebaseFunctions, functionName);

  try {
    const result = await callable(data);
    return result.data as T;
  } catch (error: any) {
    // If we get UNAUTHENTICATED, log detailed info for debugging
    if (error?.code === 'unauthenticated' || error?.message?.includes('UNAUTHENTICATED')) {
      console.error(`❌ ${functionName} returned UNAUTHENTICATED despite having token`);
      console.error('Token exists:', !!idToken);
      console.error('Token length:', idToken?.length);
      console.error('User UID:', uid);
    }
    throw error;
  }
}

/**
 * Charge Additional Amount
 * Charges for extra stops or tips using saved payment method
 */
export async function chargeAdditionalAmount(
  amount: number,
  tripId: string,
  type: 'extra_stop' | 'tip',
  description?: string
): Promise<{ success: boolean; paymentIntentId: string; status: string; amount: number }> {
  try {
    console.log(`💰 Charging ${type} amount:`, { amount, tripId });

    // Ensure user is authenticated and token is fresh
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    await user.getIdToken(true);

    const chargeAmount = httpsCallable(firebaseFunctions, 'chargeAdditionalAmount');

    const result = await chargeAmount({
      amount,
      tripId,
      type,
      description,
    });

    const data = result.data as { success: boolean; paymentIntentId: string; status: string; amount: number };

    console.log(`✅ ${type} charge result:`, {
      success: data.success,
      paymentIntentId: data.paymentIntentId,
      status: data.status,
    });

    return data;
  } catch (error: any) {
    console.error(`❌ Failed to charge ${type}:`, error);
    throw new Error(error.message || `Failed to process ${type} payment`);
  }
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
      console.log('📋 Fetching Stripe payment methods...');
      const methods = await callAuthenticatedFunction<StripePaymentMethod[]>(
        'getStripePaymentMethods',
        {}
      );
      console.log('✅ Loaded', methods?.length || 0, 'payment methods');
      return methods || [];
    } catch (error: any) {
      // Log the specific error for debugging
      console.error('Error loading payment methods:', error?.message || error);
      console.error('Error code:', error?.code);

      // If it's an auth error, the user might need to re-login
      if (error?.message === 'UNAUTHENTICATED' || error?.code === 'unauthenticated') {
        console.warn('⚠️ User authentication expired - payment methods unavailable');
      }

      return [];
    }
  }

  /**
   * Remove Stripe payment method
   */
  static async removePaymentMethod(userId: string, methodId: string): Promise<void> {
    try {
      // Ensure auth is valid before calling
      await ensureAuthenticated();

      const removeMethod = httpsCallable(firebaseFunctions, 'removeStripePaymentMethod');
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
      // Ensure auth is valid before calling
      await ensureAuthenticated();

      const setDefault = httpsCallable(firebaseFunctions, 'setDefaultStripePaymentMethod');
      await setDefault({ paymentMethodId: methodId });
      console.log('⭐ Set default Stripe payment method:', methodId);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }
}
