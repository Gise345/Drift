import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Stripe functions
export {
  getOrCreateStripeCustomer,
  createStripePaymentIntent,
  confirmStripePayment,
  captureStripePayment,
  getStripePaymentStatus,
  refundStripePayment,
  getStripePaymentMethods,
  removeStripePaymentMethod,
  setDefaultStripePaymentMethod,
  createStripeSetupIntent,
  confirmStripeSetupIntent,
  updateDriverEarnings,
  chargeAdditionalAmount,
  // New verification flow functions
  verifyCardForRide,
  cancelVerificationHold,
  chargeCardForRide,
  processTripIssueRefund,
  stripeWebhook,
  cancelStripePaymentAuth,
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

// Export Messaging functions
export {
  sendMessageNotification,
  onNewMessage,
} from './messaging';

// Export Ride Notification functions
export {
  onRideRequested,
  onRideResent,
  onStopRequested,
  onStopDecision,
  onTripCompleted,
  onSafetyAlert,
  onRouteDeviation,
} from './rideNotifications';

// Export Document Verification functions
export {
  onDriverDocumentUpdate,
} from './documentVerification';

// Export Email Test functions
export {
  sendTestEmail,
  sendTestEmailDirect,
} from './emailTest';

// Export Wise Payout functions
export {
  createWiseRecipient,
  processWisePayout,
  processBatchWisePayouts,
  getWiseTransferStatus,
  syncWisePayoutStatus,
  getWiseBalance,
  validateWiseAccount,
} from './wise';

// Export Admin Message functions
export {
  onAdminMessageCreated,
} from './adminMessages';
