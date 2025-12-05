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

// Export Safety functions
export {
  issueStrike,
  expireStrikes,
  liftExpiredSuspensions,
  autoResolveHeldPayments,
  onEmergencyAlertCreated,
  onTripUpdated,
  processStrikeQueue,
  resolveAppeal,
  resolveDispute,
  getSafetyDashboard,
} from './safety';

// Export Live Tracking functions
export {
  createTrackingSession,
  updateTrackingLocation,
  completeTrackingSession,
  getTrackingSession,
  cleanupExpiredSessions,
} from './tracking';
