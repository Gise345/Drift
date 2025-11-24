/**
 * PAYPAL SERVICE - CORRECT IMPLEMENTATION
 * Following PayPal Android SDK Documentation
 * 
 * CRITICAL: Must create order SERVER-SIDE via Cloud Functions
 * Then open browser checkout with approval URL
 * 
 * EXPO SDK 52 + React Native Firebase v21
 */

import { firebaseAuth, firebaseFunctions } from '@/src/config/firebase';
import firestore from '@react-native-firebase/firestore';
import { Linking } from 'react-native';

export interface PayPalPaymentMethod {
  id: string;
  userId: string;
  type: 'paypal_account';
  email: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayPalOrder {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'CREATED' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  approvalUrl?: string;
  payerId?: string;
  payerEmail?: string;
  captureId?: string;
  metadata?: any;
  createdAt: Date;
  capturedAt?: Date;
}

export class PayPalService {
  /**
   * STEP 1: Create order via Cloud Function (server-side)
   * This is REQUIRED per PayPal documentation
   */
  static async createOrder(params: {
    amount: number;
    currency?: string;
    description: string;
    metadata?: any;
  }): Promise<{ orderId: string; approvalUrl: string }> {
    try {
      // CRITICAL: Wait for auth state to be ready
      const user = firebaseAuth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Force token refresh to ensure it's valid
      await user.getIdToken(true);

      console.log('🔵 Authenticated user:', user.uid);
      console.log('🔵 Creating PayPal order via Cloud Function:', params);

      // Call Cloud Function to create order SERVER-SIDE
      const createPayPalOrder = firebaseFunctions.httpsCallable('createPayPalOrder');
      
      const result = await createPayPalOrder({
        amount: params.amount,
        currency: params.currency || 'USD',
        description: params.description,
        metadata: params.metadata || {},
      });

      const data = result.data as any;

      if (!data.orderId) {
        throw new Error('No order ID returned from Cloud Function');
      }

      if (!data.approvalUrl) {
        throw new Error('No approval URL returned from Cloud Function');
      }

      console.log('✅ PayPal order created:', {
        orderId: data.orderId,
        approvalUrl: data.approvalUrl,
      });

      return {
        orderId: data.orderId,
        approvalUrl: data.approvalUrl,
      };
    } catch (error: any) {
      console.error('❌ Failed to create PayPal order:', error);
      
      // Check for specific error messages
      if (error.message?.includes('NOT_FOUND')) {
        throw new Error(
          'Cloud Function not found. Please ensure Firebase Functions are deployed. Run: firebase deploy --only functions'
        );
      }
      
      throw new Error(error.message || 'Failed to create PayPal order');
    }
  }

  /**
   * STEP 2: Open PayPal checkout in browser
   * User approves payment in browser, then returns to app
   */
  static async openCheckout(approvalUrl: string): Promise<void> {
    try {
      console.log('🌐 Opening PayPal checkout:', approvalUrl);
      
      const supported = await Linking.canOpenURL(approvalUrl);
      
      if (!supported) {
        throw new Error('Cannot open PayPal checkout URL');
      }

      await Linking.openURL(approvalUrl);
      
      console.log('✅ PayPal checkout opened');
    } catch (error: any) {
      console.error('❌ Failed to open PayPal checkout:', error);
      throw new Error(error.message || 'Failed to open PayPal checkout');
    }
  }

  /**
   * STEP 3: Capture payment after user approval
   * Called when app receives deep link callback
   */
  static async captureOrder(orderId: string): Promise<void> {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('💰 Capturing PayPal order:', orderId);

      // Call Cloud Function to capture payment
      const capturePayPalOrder = firebaseFunctions.httpsCallable('capturePayPalOrder');
      
      const result = await capturePayPalOrder({ orderId });

      const data = result.data as any;

      console.log('✅ PayPal order captured:', data);
    } catch (error: any) {
      console.error('❌ Failed to capture PayPal order:', error);
      throw new Error(error.message || 'Failed to capture payment');
    }
  }

  /**
   * Check order status
   */
  static async getOrderStatus(orderId: string): Promise<string> {
    try {
      const orderDoc = await firestore()
        .collection('paypal_orders')
        .doc(orderId)
        .get();

      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      const data = orderDoc.data()!;
      return data.status || 'UNKNOWN';
    } catch (error: any) {
      console.error('❌ Failed to get order status:', error);
      throw new Error(error.message || 'Failed to get order status');
    }
  }

  /**
   * Process refund for cancelled trip
   */
  static async refundPayment(params: {
    captureId: string;
    amount?: number;
    reason?: string;
  }): Promise<string> {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 Processing PayPal refund:', params);

      const refundPayPalPayment = firebaseFunctions.httpsCallable('refundPayPalPayment');
      
      const result = await refundPayPalPayment({
        captureId: params.captureId,
        amount: params.amount,
        note: params.reason || 'Carpool arrangement cancelled',
      });

      const data = result.data as any;

      if (!data.refundId) {
        throw new Error('No refund ID returned');
      }

      console.log('✅ PayPal refund processed:', data.refundId);

      return data.refundId;
    } catch (error: any) {
      console.error('❌ Failed to process refund:', error);
      throw new Error(error.message || 'Failed to process refund');
    }
  }

  /**
   * Get saved PayPal payment methods for user
   */
  static async getPaymentMethods(userId: string): Promise<PayPalPaymentMethod[]> {
    try {
      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('paypal_methods')
        .where('deletedAt', '==', null)
        .get();

      const methods: PayPalPaymentMethod[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        methods.push({
          id: doc.id,
          userId,
          type: 'paypal_account',
          email: data.email,
          isDefault: data.isDefault || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return methods.sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Add PayPal account as payment method
   */
  static async addPaymentMethod(
    userId: string,
    email: string,
    setAsDefault: boolean = false
  ): Promise<void> {
    try {
      const methodsRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('paypal_methods');

      // If setting as default, remove default from others
      if (setAsDefault) {
        const existingMethods = await methodsRef.get();
        const batch = firestore().batch();
        
        existingMethods.docs.forEach((doc) => {
          batch.update(doc.ref, { isDefault: false });
        });
        
        await batch.commit();
      }

      // Check if email already exists
      const existing = await methodsRef.where('email', '==', email).get();

      if (!existing.empty) {
        // Update existing method
        const docRef = existing.docs[0].ref;
        await docRef.update({
          isDefault: setAsDefault,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('✅ Updated existing PayPal method');
      } else {
        // Add new method
        await methodsRef.add({
          email,
          type: 'paypal_account',
          isDefault: setAsDefault,
          deletedAt: null,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('✅ Added new PayPal method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(userId: string): Promise<PayPalOrder[]> {
    try {
      const snapshot = await firestore()
        .collection('paypal_orders')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const orders: PayPalOrder[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          userId: data.userId,
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          status: data.status,
          approvalUrl: data.approvalUrl,
          payerId: data.payerId,
          payerEmail: data.payerEmail,
          captureId: data.captureId,
          metadata: data.metadata,
          createdAt: data.createdAt?.toDate() || new Date(),
          capturedAt: data.capturedAt?.toDate(),
        });
      });

      return orders;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }
}