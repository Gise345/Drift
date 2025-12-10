/**
 * Email Service - Firebase Firestore Send Email Extension
 *
 * This service provides helper functions to send emails using the
 * Firebase Firestore Send Email extension.
 *
 * Emails are sent by adding documents to the 'mail' collection.
 * The extension picks them up and sends via Hostinger SMTP.
 */

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

// Email types for driver verification flow
export type DriverEmailType =
  | 'application_received'
  | 'application_approved'
  | 'application_rejected'
  | 'document_rejected'
  | 'document_expiring'
  | 'welcome_driver'
  | 'account_suspended'
  | 'account_reactivated';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType?: string;
}

/**
 * Send a raw email with custom content
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  text: string,
  html?: string
): Promise<string> {
  try {
    const mailRef = collection(db, 'mail');
    const docRef = await addDoc(mailRef, {
      to: Array.isArray(to) ? to : [to],
      message: {
        subject,
        text,
        html: html || text,
      },
      createdAt: serverTimestamp(),
    });

    console.log('📧 Email queued with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send a templated email using pre-defined templates
 */
export async function sendTemplatedEmail(
  to: string | string[],
  templateId: string,
  templateData: Record<string, any>
): Promise<string> {
  try {
    const mailRef = collection(db, 'mail');
    const docRef = await addDoc(mailRef, {
      to: Array.isArray(to) ? to : [to],
      template: {
        name: templateId,
        data: templateData,
      },
      createdAt: serverTimestamp(),
    });

    console.log('📧 Templated email queued with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending templated email:', error);
    throw new Error('Failed to send templated email');
  }
}

// ============================================================================
// Driver Verification Email Functions
// ============================================================================

/**
 * Send email when driver application is received
 */
export async function sendApplicationReceivedEmail(
  driverEmail: string,
  driverName: string
): Promise<string> {
  const subject = 'Drift - Application Received';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { color: #4CAF50; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 Drift</h1>
        </div>
        <div class="content">
          <h2>Hi ${driverName},</h2>
          <p>Thank you for applying to become a Drift driver!</p>
          <p>We've received your application and our team is now reviewing your documents. This usually takes <span class="highlight">1-3 business days</span>.</p>
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our team will verify your documents</li>
            <li>We'll check your vehicle information</li>
            <li>You'll receive an email once your application is reviewed</li>
          </ul>
          <p>If we need any additional information, we'll reach out to you.</p>
          <p>Thank you for choosing Drift!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Drift Global. All rights reserved.</p>
          <p>Questions? Contact us at support@drift-global.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${driverName},

Thank you for applying to become a Drift driver!

We've received your application and our team is now reviewing your documents. This usually takes 1-3 business days.

What happens next?
- Our team will verify your documents
- We'll check your vehicle information
- You'll receive an email once your application is reviewed

If we need any additional information, we'll reach out to you.

Thank you for choosing Drift!

© ${new Date().getFullYear()} Drift Global
  `;

  return sendEmail(driverEmail, subject, text, html);
}

/**
 * Send email when driver application is approved
 */
export async function sendApplicationApprovedEmail(
  driverEmail: string,
  driverName: string
): Promise<string> {
  const subject = 'Drift - Congratulations! Your Application is Approved';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { color: #4CAF50; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        .checklist { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Drift!</h1>
        </div>
        <div class="content">
          <h2>Congratulations, ${driverName}!</h2>
          <p>Great news! Your driver application has been <span class="highlight">APPROVED</span>!</p>
          <p>You're now officially part of the Drift driver community.</p>

          <div class="checklist">
            <h3>🚀 Getting Started:</h3>
            <ul>
              <li>Open the Drift app and go to Driver mode</li>
              <li>Set your availability to start receiving ride requests</li>
              <li>Keep your phone charged and GPS enabled</li>
              <li>Drive safely and provide excellent service</li>
            </ul>
          </div>

          <p><strong>Tips for success:</strong></p>
          <ul>
            <li>Maintain a clean vehicle</li>
            <li>Be courteous and professional</li>
            <li>Follow all traffic laws</li>
            <li>Keep your documents up to date</li>
          </ul>

          <p>We're excited to have you on board!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Drift Global. All rights reserved.</p>
          <p>Questions? Contact us at support@drift-global.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Congratulations, ${driverName}!

Great news! Your driver application has been APPROVED!

You're now officially part of the Drift driver community.

Getting Started:
- Open the Drift app and go to Driver mode
- Set your availability to start receiving ride requests
- Keep your phone charged and GPS enabled
- Drive safely and provide excellent service

Tips for success:
- Maintain a clean vehicle
- Be courteous and professional
- Follow all traffic laws
- Keep your documents up to date

We're excited to have you on board!

© ${new Date().getFullYear()} Drift Global
  `;

  return sendEmail(driverEmail, subject, text, html);
}

/**
 * Send email when driver application is rejected
 */
export async function sendApplicationRejectedEmail(
  driverEmail: string,
  driverName: string,
  rejectionReason: string
): Promise<string> {
  const subject = 'Drift - Application Status Update';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 Drift</h1>
        </div>
        <div class="content">
          <h2>Hi ${driverName},</h2>
          <p>Thank you for your interest in becoming a Drift driver.</p>
          <p>After reviewing your application, we were unable to approve it at this time.</p>

          <div class="reason-box">
            <strong>Reason:</strong>
            <p>${rejectionReason}</p>
          </div>

          <p><strong>What can you do?</strong></p>
          <ul>
            <li>Review the reason above</li>
            <li>Update or resubmit the required documents</li>
            <li>Apply again once the issues are resolved</li>
          </ul>

          <p>If you believe this was a mistake or need clarification, please contact our support team.</p>

          <p>We hope to welcome you to Drift soon!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Drift Global. All rights reserved.</p>
          <p>Questions? Contact us at support@drift-global.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${driverName},

Thank you for your interest in becoming a Drift driver.

After reviewing your application, we were unable to approve it at this time.

Reason: ${rejectionReason}

What can you do?
- Review the reason above
- Update or resubmit the required documents
- Apply again once the issues are resolved

If you believe this was a mistake or need clarification, please contact our support team.

We hope to welcome you to Drift soon!

© ${new Date().getFullYear()} Drift Global
  `;

  return sendEmail(driverEmail, subject, text, html);
}

/**
 * Send email when a specific document is rejected
 */
export async function sendDocumentRejectedEmail(
  driverEmail: string,
  driverName: string,
  documentType: string,
  rejectionReason: string
): Promise<string> {
  const documentNames: Record<string, string> = {
    driversLicense: "Driver's License",
    insurance: 'Insurance Certificate',
    registration: 'Vehicle Registration',
    inspection: 'Vehicle Inspection',
  };

  const docName = documentNames[documentType] || documentType;
  const subject = `Drift - ${docName} Requires Attention`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 Drift</h1>
        </div>
        <div class="content">
          <h2>Hi ${driverName},</h2>
          <p>We need you to resubmit your <strong>${docName}</strong>.</p>

          <div class="alert-box">
            <strong>Issue:</strong>
            <p>${rejectionReason}</p>
          </div>

          <p><strong>How to fix this:</strong></p>
          <ol>
            <li>Open the Drift app</li>
            <li>Go to your Driver Profile</li>
            <li>Navigate to Documents</li>
            <li>Upload a new ${docName}</li>
          </ol>

          <p>Please ensure your document is:</p>
          <ul>
            <li>Clear and readable</li>
            <li>Not expired</li>
            <li>Shows all required information</li>
          </ul>

          <p>Once you resubmit, we'll review it promptly.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Drift Global. All rights reserved.</p>
          <p>Questions? Contact us at support@drift-global.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${driverName},

We need you to resubmit your ${docName}.

Issue: ${rejectionReason}

How to fix this:
1. Open the Drift app
2. Go to your Driver Profile
3. Navigate to Documents
4. Upload a new ${docName}

Please ensure your document is:
- Clear and readable
- Not expired
- Shows all required information

Once you resubmit, we'll review it promptly.

© ${new Date().getFullYear()} Drift Global
  `;

  return sendEmail(driverEmail, subject, text, html);
}

/**
 * Send email when document is about to expire
 */
export async function sendDocumentExpiringEmail(
  driverEmail: string,
  driverName: string,
  documentType: string,
  expiryDate: string,
  daysUntilExpiry: number
): Promise<string> {
  const documentNames: Record<string, string> = {
    driversLicense: "Driver's License",
    insurance: 'Insurance Certificate',
    registration: 'Vehicle Registration',
    inspection: 'Vehicle Inspection',
  };

  const docName = documentNames[documentType] || documentType;
  const subject = `Drift - Your ${docName} Expires Soon`;
  const urgency = daysUntilExpiry <= 7 ? 'urgent' : 'warning';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${urgency === 'urgent' ? '#dc3545' : '#ffc107'}; color: ${urgency === 'urgent' ? 'white' : '#333'}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .expiry-box { background: ${urgency === 'urgent' ? '#f8d7da' : '#fff3cd'}; border-left: 4px solid ${urgency === 'urgent' ? '#dc3545' : '#ffc107'}; padding: 15px; margin: 15px 0; text-align: center; }
        .days { font-size: 48px; font-weight: bold; color: ${urgency === 'urgent' ? '#dc3545' : '#856404'}; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Document Expiring Soon</h1>
        </div>
        <div class="content">
          <h2>Hi ${driverName},</h2>
          <p>Your <strong>${docName}</strong> is expiring soon.</p>

          <div class="expiry-box">
            <div class="days">${daysUntilExpiry}</div>
            <div>days until expiry</div>
            <div style="margin-top: 10px;"><strong>Expires:</strong> ${expiryDate}</div>
          </div>

          <p><strong>Important:</strong> You won't be able to accept rides if your document expires.</p>

          <p>Please update your document in the Drift app as soon as possible to avoid any interruption to your driving.</p>

          <p>Steps to update:</p>
          <ol>
            <li>Open the Drift app</li>
            <li>Go to Driver Profile → Documents</li>
            <li>Upload your new ${docName}</li>
          </ol>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Drift Global. All rights reserved.</p>
          <p>Questions? Contact us at support@drift-global.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${driverName},

Your ${docName} is expiring soon.

Days until expiry: ${daysUntilExpiry}
Expires: ${expiryDate}

Important: You won't be able to accept rides if your document expires.

Please update your document in the Drift app as soon as possible.

Steps to update:
1. Open the Drift app
2. Go to Driver Profile → Documents
3. Upload your new ${docName}

© ${new Date().getFullYear()} Drift Global
  `;

  return sendEmail(driverEmail, subject, text, html);
}

/**
 * Send test email (for testing the extension)
 */
export async function sendTestEmail(
  recipientEmail: string
): Promise<string> {
  const subject = 'Drift - Test Email';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Email System Working!</h1>
        </div>
        <div class="content">
          <p>This is a test email from Drift.</p>
          <p>If you received this, your email system is configured correctly!</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
This is a test email from Drift.

If you received this, your email system is configured correctly!

Timestamp: ${new Date().toISOString()}
  `;

  return sendEmail(recipientEmail, subject, text, html);
}

export default {
  sendEmail,
  sendTemplatedEmail,
  sendApplicationReceivedEmail,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
  sendDocumentRejectedEmail,
  sendDocumentExpiringEmail,
  sendTestEmail,
};
