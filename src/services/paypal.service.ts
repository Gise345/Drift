/**
 * PAYPAL SERVICE - EXPO SDK 52
 * Production PayPal integration using Firebase Cloud Functions
 * Supports browser-based checkout flow
 * 
 * REACT NATIVE FIREBASE v21 (not Web SDK)
 */

import { firebaseFunctions } from '@/src/config/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export interface PayPalPaymentMethod {
  id: string;
  email: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface PayPalOrderResult {
  orderId: string;
  approvalUrl: string;
  status: string;
}

export interface PayPalCaptureResult {
  orderId: string;
  captureId: string;
  status: string;
  payerId: string;
}

/**
 * Create PayPal order and get approval URL
 * Uses React Native Firebase API (not Web SDK)
 */
export async function createPayPalOrder(
  amount: number,
  currency: string = 'USD',
  description?: string,
  metadata?: Record<string, any>
): Promise<PayPalOrderResult> {
  try {
    console.log('💳 Starting PayPal payment flow...');

    // React Native Firebase uses httpsCallable directly on functions instance
    const createOrder = firebaseFunctions.httpsCallable('createPayPalOrder');

    const result = await createOrder({
      amount,
      currency,
      description,
      metadata,
    });

    const data = result.data as PayPalOrderResult;

    if (!data.orderId || !data.approvalUrl) {
      throw new Error('Invalid PayPal order response');
    }

    console.log('✅ PayPal order created:', {
      orderId: data.orderId,
      approvalUrl: data.approvalUrl,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to create PayPal order:', error);
    throw new Error(error.message || 'Failed to create PayPal payment');
  }
}

/**
 * Capture PayPal payment after user approval
 * Uses React Native Firebase API (not Web SDK)
 */
export async function capturePayPalPayment(
  orderId: string
): Promise<PayPalCaptureResult> {
  try {
    console.log('💰 Capturing PayPal payment:', orderId);

    // React Native Firebase uses httpsCallable directly on functions instance
    const captureOrder = firebaseFunctions.httpsCallable('capturePayPalOrder');

    const result = await captureOrder({ orderId });

    const data = result.data as PayPalCaptureResult;

    if (!data.captureId) {
      throw new Error('Invalid capture response');
    }

    console.log('✅ PayPal payment captured:', {
      orderId: data.orderId,
      captureId: data.captureId,
    });

    return data;
  } catch (error: any) {
    console.error('❌ Failed to capture PayPal payment:', error);
    throw new Error(error.message || 'Failed to capture payment');
  }
}

/**
 * Open PayPal checkout in browser
 * Handles deep linking back to app
 */
export async function openPayPalCheckout(
  approvalUrl: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    console.log('🌐 Opening PayPal checkout:', approvalUrl);

    // Open browser for PayPal checkout
    const result = await WebBrowser.openAuthSessionAsync(
      approvalUrl,
      'drift://paypal'
    );

    console.log('🌐 Browser result:', result);

    if (result.type === 'success') {
      // Extract order ID from redirect URL
      const url = result.url;
      const orderId = extractOrderIdFromUrl(url);

      if (orderId && url.includes('/success')) {
        return { success: true, orderId };
      } else if (url.includes('/cancel')) {
        return { success: false, error: 'User cancelled payment' };
      }
    } else if (result.type === 'cancel') {
      return { success: false, error: 'User cancelled payment' };
    }

    return { success: false, error: 'Payment flow interrupted' };
  } catch (error: any) {
    console.error('❌ PayPal checkout error:', error);
    return { success: false, error: error.message || 'Failed to open PayPal checkout' };
  }
}

/**
 * Extract order ID from redirect URL
 */
function extractOrderIdFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    return parsed.queryParams?.token as string || null;
  } catch (error) {
    console.error('Failed to parse URL:', error);
    return null;
  }
}

/**
 * Refund PayPal payment
 * Uses React Native Firebase API (not Web SDK)
 */
export async function refundPayPalPayment(
  captureId: string,
  amount?: number,
  note?: string
): Promise<{ refundId: string; status: string }> {
  try {
    console.log('🔄 Processing PayPal refund:', captureId);

    // React Native Firebase uses httpsCallable directly on functions instance
    const refundPayment = firebaseFunctions.httpsCallable('refundPayPalPayment');

    const result = await refundPayment({
      captureId,
      amount,
      note,
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
 * PayPal Service Class (for convenience)
 */
export class PayPalService {
  /**
   * Get saved PayPal payment methods for user
   */
  static async getPaymentMethods(userId: string): Promise<PayPalPaymentMethod[]> {
    // TODO: Implement Firestore query to get saved methods
    return [];
  }

  /**
   * Add PayPal payment method
   */
  static async addPaymentMethod(
    userId: string,
    email: string,
    isDefault: boolean = false
  ): Promise<void> {
    // TODO: Implement Firestore save
    console.log('💾 Saving PayPal method:', { userId, email, isDefault });
  }

  /**
   * Remove PayPal payment method
   */
  static async removePaymentMethod(userId: string, methodId: string): Promise<void> {
    // TODO: Implement Firestore delete
    console.log('🗑️ Removing PayPal method:', { userId, methodId });
  }

  /**
   * Set default payment method
   */
  static async setDefaultMethod(userId: string, methodId: string): Promise<void> {
    // TODO: Implement Firestore update
    console.log('⭐ Setting default PayPal method:', { userId, methodId });
  }
}