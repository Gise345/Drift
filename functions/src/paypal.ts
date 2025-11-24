/**
 * FIREBASE CLOUD FUNCTIONS - PAYPAL HOSTED CHECKOUT
 * Supports: Card payments, PayPal login, Apple Pay, Google Pay
 * 
 * Deploy: firebase deploy --only functions
 * 
 * Environment variables needed:
 * firebase functions:config:set paypal.client_id="YOUR_CLIENT_ID"
 * firebase functions:config:set paypal.client_secret="YOUR_CLIENT_SECRET"
 * firebase functions:config:set paypal.mode="sandbox" (or "production")
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (only once in index.ts)
// admin.initializeApp();

const PAYPAL_API_BASE = functions.config().paypal?.mode === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = functions.config().paypal?.client_id;
const PAYPAL_CLIENT_SECRET = functions.config().paypal?.client_secret;

/**
 * Get PayPal OAuth access token
 */
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal auth error:', errorText);
    throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
  }

  const data = await response.json() as any;
  return data.access_token;
}

/**
 * CREATE PAYPAL HOSTED CHECKOUT
 * Creates order with advanced card fields enabled
 * Returns approval URL for browser checkout
 */
export const createPayPalHostedCheckout = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, currency = 'USD', description, metadata, returnUrl, cancelUrl } = data;

    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
    }

    console.log('Creating PayPal hosted checkout:', { amount, currency, description });

    // Get PayPal access token
    const accessToken = await getAccessToken();

    // Create order with advanced checkout enabled
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `drift-${context.auth.uid}-${Date.now()}`, // Idempotency
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: description || 'Drift Carpool Payment',
          custom_id: context.auth.uid,
        }],
        payment_source: {
          // Enable advanced card fields
          paypal: {
            experience_context: {
              payment_method_preference: 'UNRESTRICTED', // Allow cards without PayPal login
              brand_name: 'Drift Carpool',
              locale: 'en-US',
              landing_page: 'LOGIN',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW',
              return_url: returnUrl || 'drift://paypal/success',
              cancel_url: cancelUrl || 'drift://paypal/cancel',
            },
          },
        },
        application_context: {
          brand_name: 'Drift Carpool',
          locale: 'en-US',
          landing_page: 'GUEST_CHECKOUT', // Allow guest checkout with cards
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: returnUrl || 'drift://paypal/success',
          cancel_url: cancelUrl || 'drift://paypal/cancel',
          payment_method: {
            payee_preferred: 'UNRESTRICTED', // Accept cards
          },
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('PayPal order creation failed:', errorData);
      throw new functions.https.HttpsError('internal', `Failed to create order: ${errorData.message || 'Unknown error'}`);
    }

    const orderData = await orderResponse.json() as any;

    // Get approval URL from links
    const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      throw new functions.https.HttpsError('internal', 'No approval URL in PayPal response');
    }

    // Save order to Firestore
    await admin.firestore().collection('paypal_orders').doc(orderData.id).set({
      userId: context.auth.uid,
      orderId: orderData.id,
      amount,
      currency,
      description,
      status: 'CREATED',
      metadata: metadata || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('PayPal hosted checkout created:', orderData.id);

    return {
      orderId: orderData.id,
      approvalUrl,
      status: orderData.status,
    };
  } catch (error: any) {
    console.error('Error creating PayPal hosted checkout:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create hosted checkout');
  }
});

/**
 * CAPTURE PAYPAL ORDER
 * Called after user completes payment in browser
 */
export const capturePayPalOrder = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId } = data;

    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID is required');
    }

    console.log('Capturing PayPal order:', orderId);

    // Get PayPal access token
    const accessToken = await getAccessToken();

    // Capture order
    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `drift-capture-${orderId}-${Date.now()}`,
      },
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('PayPal capture failed:', errorData);
      throw new functions.https.HttpsError('internal', `Failed to capture payment: ${errorData.message || 'Unknown error'}`);
    }

    const captureData = await captureResponse.json() as any;

    // Update order in Firestore
    await admin.firestore().collection('paypal_orders').doc(orderId).update({
      status: captureData.status,
      payer: captureData.payer,
      captureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      capturedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('PayPal order captured:', {
      orderId,
      status: captureData.status,
      captureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    });

    return {
      orderId,
      status: captureData.status,
      payer: captureData.payer,
      captureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    };
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to capture payment');
  }
});

/**
 * GET PAYPAL ORDER STATUS
 * Check order status without capturing
 */
export const getPayPalOrderStatus = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId } = data;

    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID is required');
    }

    console.log('Getting PayPal order status:', orderId);

    // Get PayPal access token
    const accessToken = await getAccessToken();

    // Get order details
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('Failed to get order status:', errorData);
      throw new functions.https.HttpsError('internal', 'Failed to get order status');
    }

    const orderData = await orderResponse.json() as any;

    console.log('PayPal order status:', {
      orderId,
      status: orderData.status,
    });

    return {
      orderId,
      status: orderData.status,
      payer: orderData.payer,
    };
  } catch (error: any) {
    console.error('Error getting order status:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get order status');
  }
});

/**
 * REFUND PAYPAL PAYMENT
 * Process refund for cancelled carpool
 */
export const refundPayPalPayment = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { captureId, amount, note } = data;

    if (!captureId) {
      throw new functions.https.HttpsError('invalid-argument', 'Capture ID is required');
    }

    console.log('Processing PayPal refund:', { captureId, amount });

    // Get PayPal access token
    const accessToken = await getAccessToken();

    // Process refund
    const refundBody: any = {
      note_to_payer: note || 'Drift carpool arrangement cancelled',
    };

    if (amount) {
      refundBody.amount = {
        value: amount.toFixed(2),
        currency_code: 'USD',
      };
    }

    const refundResponse = await fetch(`${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `drift-refund-${captureId}-${Date.now()}`,
      },
      body: JSON.stringify(refundBody),
    });

    if (!refundResponse.ok) {
      const errorData = await refundResponse.json();
      console.error('PayPal refund failed:', errorData);
      throw new functions.https.HttpsError('internal', `Refund failed: ${errorData.message || 'Unknown error'}`);
    }

    const refundData = await refundResponse.json() as any;

    console.log('PayPal refund processed:', {
      refundId: refundData.id,
      status: refundData.status,
    });

    return {
      refundId: refundData.id,
      status: refundData.status,
      amount: refundData.amount,
    };
  } catch (error: any) {
    console.error('Error processing refund:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to process refund');
  }
});