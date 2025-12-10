/**
 * Email Test Function
 * Used to test the Firebase Send Email extension
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Using 'main' database
const db = getFirestore(admin.app(), 'main');

interface SendTestEmailRequest {
  recipientEmail: string;
}

/**
 * Send a test email to verify the email extension is working
 */
export const sendTestEmail = onCall(
  {
    region: 'us-east1',
    // Only allow admins or authenticated users for testing
  },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated to send test email');
    }

    const { recipientEmail } = request.data as SendTestEmailRequest;

    if (!recipientEmail) {
      throw new HttpsError('invalid-argument', 'recipientEmail is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new HttpsError('invalid-argument', 'Invalid email format');
    }

    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #5d1289 0%, #8b1db8 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .success-box { background: #d1fae5; border: 1px solid #059669; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Drift Email Test</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2 style="color: #059669; margin: 0 0 10px 0;">✅ Email System Working!</h2>
                <p style="margin: 0;">Your Firebase Send Email extension is configured correctly.</p>
              </div>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li><strong>Sent to:</strong> ${recipientEmail}</li>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                <li><strong>Extension:</strong> firestore-send-email</li>
                <li><strong>SMTP:</strong> smtp.hostinger.com</li>
              </ul>
              <p>If you received this email, your email notifications for driver verification are ready to go!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Drift Global. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
Drift Email Test

✅ Email System Working!
Your Firebase Send Email extension is configured correctly.

Test Details:
- Sent to: ${recipientEmail}
- Timestamp: ${new Date().toISOString()}
- Extension: firestore-send-email
- SMTP: smtp.hostinger.com

If you received this email, your email notifications are ready!

© ${new Date().getFullYear()} Drift Global
      `;

      // Add to mail collection - the extension will send it
      const mailDoc = await db.collection('mail').add({
        to: [recipientEmail],
        message: {
          subject: '✅ Drift Email Test - Configuration Successful',
          text,
          html,
        },
        createdAt: FieldValue.serverTimestamp(),
        type: 'test_email',
        requestedBy: request.auth.uid,
      });

      console.log(`📧 Test email queued: ${mailDoc.id} -> ${recipientEmail}`);

      return {
        success: true,
        mailId: mailDoc.id,
        message: `Test email queued successfully. Check ${recipientEmail} for the email.`,
      };
    } catch (error: any) {
      console.error('Error sending test email:', error);
      throw new HttpsError('internal', `Failed to send test email: ${error.message}`);
    }
  }
);

/**
 * Send a test email directly without authentication (for initial setup testing)
 * WARNING: This should be removed or protected in production
 */
export const sendTestEmailDirect = onCall(
  {
    region: 'us-east1',
  },
  async (request) => {
    const { recipientEmail, adminKey } = request.data as { recipientEmail: string; adminKey?: string };

    // Simple protection - require a key for unauthenticated access
    // In production, remove this function entirely or use proper admin auth
    if (!request.auth && adminKey !== 'drift-test-2024') {
      throw new HttpsError('unauthenticated', 'Invalid admin key');
    }

    if (!recipientEmail) {
      throw new HttpsError('invalid-argument', 'recipientEmail is required');
    }

    try {
      const mailDoc = await db.collection('mail').add({
        to: [recipientEmail],
        message: {
          subject: '✅ Drift Email Test',
          text: 'This is a test email from Drift. Your email system is working!',
          html: `
            <div style="font-family: Arial; padding: 20px; max-width: 500px; margin: 0 auto;">
              <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px;">
                <h1>✅ Email System Working!</h1>
              </div>
              <div style="padding: 20px; background: #f5f5f5; border-radius: 0 0 8px 8px;">
                <p>This is a test email from Drift.</p>
                <p>Your email system is configured correctly!</p>
                <p><small>Sent: ${new Date().toISOString()}</small></p>
              </div>
            </div>
          `,
        },
        createdAt: FieldValue.serverTimestamp(),
        type: 'test_email',
      });

      return {
        success: true,
        mailId: mailDoc.id,
        message: 'Test email queued!',
      };
    } catch (error: any) {
      throw new HttpsError('internal', error.message);
    }
  }
);
