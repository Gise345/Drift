import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Stripe functions
export {
  getOrCreateStripeCustomer,
  createStripePaymentIntent,
  confirmStripePayment,
  getStripePaymentStatus,
  refundStripePayment,
  getStripePaymentMethods,
  removeStripePaymentMethod,
  setDefaultStripePaymentMethod,
  createStripeSetupIntent,
  confirmStripeSetupIntent
} from './stripe';
