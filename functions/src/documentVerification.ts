/**
 * Document Verification Cloud Functions
 * Handles notifications for driver document verification status changes
 *
 * Features:
 * - Push notifications when documents are approved/rejected
 * - Push notifications when resubmission is requested
 * - Push notifications when application is fully approved
 * - Email notifications for important status changes
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Using 'main' database
const db = getFirestore(admin.app(), 'main');
const messaging = admin.messaging();

// Document type display names
const DOCUMENT_DISPLAY_NAMES: Record<string, string> = {
  driversLicense: "Driver's License",
  insurance: 'Vehicle Insurance',
  registration: 'Vehicle Registration',
  inspection: 'Safety Inspection',
};

interface DocumentStatus {
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
  rejectionReason?: string;
  verifiedAt?: admin.firestore.Timestamp;
}

interface DriverData {
  firstName: string;
  lastName: string;
  email: string;
  fcmToken?: string;
  pushToken?: string;
  registrationStatus: string;
  documentsNeedingResubmission?: string[];
  resubmissionDeadline?: admin.firestore.Timestamp;
  documents: {
    driversLicense?: DocumentStatus;
    insurance?: DocumentStatus;
    registration?: DocumentStatus;
    inspection?: DocumentStatus;
  };
}

/**
 * Listen for driver document updates and send notifications
 */
export const onDriverDocumentUpdate = onDocumentUpdated(
  {
    document: 'drivers/{driverId}',
    region: 'us-east1',
  },
  async (event) => {
    const beforeData = event.data?.before.data() as DriverData | undefined;
    const afterData = event.data?.after.data() as DriverData | undefined;
    const driverId = event.params.driverId;

    if (!beforeData || !afterData) {
      console.log('Missing before or after data');
      return;
    }

    // Get FCM token
    const fcmToken = afterData.fcmToken || afterData.pushToken;
    if (!fcmToken) {
      console.log(`No FCM token for driver ${driverId}`);
      // Continue anyway for email notifications
    }

    // Check for registration status changes
    if (beforeData.registrationStatus !== afterData.registrationStatus) {
      await handleRegistrationStatusChange(
        driverId,
        beforeData.registrationStatus,
        afterData.registrationStatus,
        afterData,
        fcmToken
      );
    }

    // Check for individual document status changes
    const docTypes = ['driversLicense', 'insurance', 'registration', 'inspection'] as const;

    for (const docType of docTypes) {
      const beforeStatus = beforeData.documents?.[docType]?.status;
      const afterStatus = afterData.documents?.[docType]?.status;

      if (beforeStatus !== afterStatus && afterStatus) {
        await handleDocumentStatusChange(
          driverId,
          docType,
          beforeStatus || 'pending',
          afterStatus,
          afterData.documents?.[docType]?.rejectionReason,
          afterData,
          fcmToken
        );
      }
    }
  }
);

/**
 * Handle registration status changes (approved, rejected, needs_resubmission)
 */
async function handleRegistrationStatusChange(
  driverId: string,
  beforeStatus: string,
  afterStatus: string,
  driverData: DriverData,
  fcmToken: string | undefined
) {
  console.log(`Registration status changed: ${beforeStatus} -> ${afterStatus} for driver ${driverId}`);

  let title = '';
  let body = '';
  let notificationType = '';

  switch (afterStatus) {
    case 'approved':
      title = 'Application Approved!';
      body = `Congratulations ${driverData.firstName}! Your driver application has been approved. You can now start accepting rides.`;
      notificationType = 'APPLICATION_APPROVED';
      break;

    case 'rejected':
      title = 'Application Update';
      body = `We're sorry, but your driver application could not be approved at this time. Please check your email for more details.`;
      notificationType = 'APPLICATION_REJECTED';
      break;

    case 'needs_resubmission':
      const docCount = driverData.documentsNeedingResubmission?.length || 0;
      const deadline = driverData.resubmissionDeadline?.toDate();
      const deadlineStr = deadline ? deadline.toLocaleDateString() : '14 days';

      title = 'Documents Need Attention';
      body = `${docCount} document(s) need to be resubmitted. Please update them by ${deadlineStr} to continue your application.`;
      notificationType = 'RESUBMISSION_REQUESTED';
      break;

    default:
      return; // No notification for other status changes
  }

  // Send push notification
  if (fcmToken) {
    await sendPushNotification(fcmToken, title, body, {
      type: notificationType,
      driverId,
      status: afterStatus,
    });
  }

  // Store notification in database
  await storeNotification(driverId, title, body, notificationType);

  // Send email notification for important status changes
  if (['approved', 'rejected', 'needs_resubmission'].includes(afterStatus)) {
    await sendEmailNotification(
      driverData.email,
      driverData.firstName,
      afterStatus as 'approved' | 'rejected' | 'needs_resubmission'
    );
  }
}

/**
 * Handle individual document status changes
 */
async function handleDocumentStatusChange(
  driverId: string,
  docType: string,
  beforeStatus: string,
  afterStatus: string,
  rejectionReason: string | undefined,
  driverData: DriverData,
  fcmToken: string | undefined
) {
  console.log(`Document ${docType} status changed: ${beforeStatus} -> ${afterStatus} for driver ${driverId}`);

  const docName = DOCUMENT_DISPLAY_NAMES[docType] || docType;
  let title = '';
  let body = '';
  let notificationType = '';

  switch (afterStatus) {
    case 'approved':
      title = 'Document Verified';
      body = `Great news! Your ${docName} has been verified.`;
      notificationType = 'DOCUMENT_APPROVED';
      break;

    case 'rejected':
      title = 'Document Needs Attention';
      body = rejectionReason
        ? `Your ${docName} was not approved: ${rejectionReason}`
        : `Your ${docName} needs to be resubmitted. Please check the app for details.`;
      notificationType = 'DOCUMENT_REJECTED';
      break;

    default:
      return; // No notification for pending or resubmitted (they'll get the main notification)
  }

  // Send push notification
  if (fcmToken) {
    await sendPushNotification(fcmToken, title, body, {
      type: notificationType,
      driverId,
      documentType: docType,
      status: afterStatus,
    });
  }

  // Store notification in database
  await storeNotification(driverId, title, body, notificationType, {
    documentType: docType,
    rejectionReason,
  });
}

/**
 * Send push notification via FCM
 */
async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string>
) {
  try {
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'driver_registration',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          icon: 'ic_notification',
          color: '#5d1289',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log(`Push notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Don't throw - continue with other operations
    return null;
  }
}

/**
 * Store notification in database for in-app display
 */
async function storeNotification(
  driverId: string,
  title: string,
  body: string,
  type: string,
  metadata?: Record<string, any>
) {
  try {
    await db.collection('drivers').doc(driverId).collection('notifications').add({
      title,
      body,
      type,
      metadata: metadata || {},
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`Notification stored for driver ${driverId}`);
  } catch (error) {
    console.error('Error storing notification:', error);
  }
}

/**
 * Send email notification by writing to 'mail' collection
 * This uses the Firebase Trigger Email extension (or can be processed by another function)
 * If you have the extension installed, emails will be sent automatically.
 * Otherwise, you can process this collection with a separate service.
 */
async function sendEmailNotification(
  toEmail: string,
  driverName: string,
  status: 'approved' | 'rejected' | 'needs_resubmission',
  rejectionReason?: string
) {
  try {
    let subject = '';
    let html = '';

    const baseStyles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #5d1289 0%, #8b1db8 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #5d1289; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    `;

    switch (status) {
      case 'approved':
        subject = '🎉 Your Drift Driver Application Has Been Approved!';
        html = `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Welcome to Drift!</h1>
            </div>
            <div class="content">
              <h2 style="color: #059669;">Congratulations, ${driverName}! 🎉</h2>
              <p>Great news! Your driver application has been <strong>approved</strong>.</p>
              <p>You can now start accepting rides and earning money with Drift.</p>
              <h3>What's Next?</h3>
              <ul>
                <li>Open the Drift app and switch to Driver Mode</li>
                <li>Set your availability to start receiving ride requests</li>
                <li>Complete your first trip and start earning!</li>
              </ul>
              <p style="text-align: center; margin-top: 30px;">
                <a href="drift://driver/home" class="button">Open Drift App</a>
              </p>
            </div>
            <div class="footer">
              <p>Questions? Contact our driver support team.</p>
              <p>© ${new Date().getFullYear()} Drift. All rights reserved.</p>
            </div>
          </div>
        `;
        break;

      case 'rejected':
        subject = 'Update on Your Drift Driver Application';
        html = `
          ${baseStyles}
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);">
              <h1 style="margin: 0; font-size: 28px;">Application Update</h1>
            </div>
            <div class="content">
              <h2 style="color: #dc2626;">Hi ${driverName},</h2>
              <p>We've reviewed your driver application, and unfortunately, we're unable to approve it at this time.</p>
              ${rejectionReason ? `
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                  <strong>Reason:</strong> ${rejectionReason}
                </div>
              ` : ''}
              <p>If you believe this was a mistake or have questions, please contact our support team.</p>
              <p>You may also reapply in the future if your circumstances change.</p>
            </div>
            <div class="footer">
              <p>Need help? Contact our support team.</p>
              <p>© ${new Date().getFullYear()} Drift. All rights reserved.</p>
            </div>
          </div>
        `;
        break;

      case 'needs_resubmission':
        subject = 'Action Required: Resubmit Documents for Your Drift Application';
        html = `
          ${baseStyles}
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);">
              <h1 style="margin: 0; font-size: 28px;">Documents Need Attention</h1>
            </div>
            <div class="content">
              <h2 style="color: #d97706;">Hi ${driverName},</h2>
              <p>We've reviewed your driver application and some documents need to be resubmitted.</p>
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <strong>Please resubmit your documents within 14 days to avoid having your application cancelled.</strong>
              </div>
              <p>Open the Drift app to see which documents need attention and upload new versions.</p>
              <p style="text-align: center; margin-top: 30px;">
                <a href="drift://driver/registration/resubmit" class="button" style="background: #d97706;">Update Documents</a>
              </p>
            </div>
            <div class="footer">
              <p>Questions? Contact our driver support team.</p>
              <p>© ${new Date().getFullYear()} Drift. All rights reserved.</p>
            </div>
          </div>
        `;
        break;

      default:
        return;
    }

    // Write to 'mail' collection for Firebase Trigger Email extension
    // Or process this with your own email sending function
    await db.collection('mail').add({
      to: toEmail,
      message: {
        subject,
        html,
      },
      createdAt: FieldValue.serverTimestamp(),
      type: `driver_${status}`,
    });

    console.log(`📧 Email queued for ${toEmail}: ${subject}`);
  } catch (error) {
    console.error('Error queuing email notification:', error);
    // Don't throw - email is non-critical
  }
}
