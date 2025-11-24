import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export PayPal functions
export {
  createPayPalHostedCheckout,
  capturePayPalOrder,
  getPayPalOrderStatus,
  refundPayPalPayment
} from './paypal';