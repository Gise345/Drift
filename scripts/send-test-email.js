/**
 * Send Test Email Script
 *
 * Run this script to send a test email via the Firebase Send Email extension.
 *
 * Usage: node scripts/send-test-email.js
 *
 * This adds a document to the 'mail' collection which triggers the extension.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
// Make sure you have GOOGLE_APPLICATION_CREDENTIALS environment variable set
// Or provide the service account key path directly

// Initialize with default credentials
admin.initializeApp({
  projectId: 'drift-global',
});

// Get Firestore instance (using 'main' database)
const db = admin.firestore();
db.settings({ databaseId: 'main' });

async function sendTestEmail() {
  const recipientEmail = process.argv[2] || 'info@drift-global.com';

  console.log(`\n📧 Sending test email to: ${recipientEmail}\n`);

  const emailDoc = {
    to: [recipientEmail],
    message: {
      subject: '✅ Drift Email Test - Configuration Successful',
      text: `
This is a test email from Drift.

If you received this email, your Firebase Send Email extension is working correctly!

Test Details:
- Recipient: ${recipientEmail}
- Timestamp: ${new Date().toISOString()}
- Project: drift-global
- Extension: firestore-send-email
- SMTP: smtp.hostinger.com

Your driver verification emails are ready to go!

© ${new Date().getFullYear()} Drift Global
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #5d1289 0%, #8b1db8 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .success-box { background: #d1fae5; border: 1px solid #059669; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🚗 Drift Email Test</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2 style="color: #059669; margin: 0 0 10px 0;">✅ Email System Working!</h2>
                <p style="margin: 0;">Your Firebase Send Email extension is configured correctly.</p>
              </div>

              <div class="details">
                <h3 style="margin-top: 0;">Test Details:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li><strong>Recipient:</strong> ${recipientEmail}</li>
                  <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                  <li><strong>Project:</strong> drift-global</li>
                  <li><strong>Extension:</strong> firestore-send-email</li>
                  <li><strong>SMTP:</strong> smtp.hostinger.com:465</li>
                </ul>
              </div>

              <p>If you received this email, your driver verification notification system is ready!</p>

              <p><strong>Email types that will be sent automatically:</strong></p>
              <ul>
                <li>Application Received</li>
                <li>Application Approved</li>
                <li>Application Rejected</li>
                <li>Document Rejected</li>
                <li>Document Expiring Soon</li>
              </ul>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Drift Global. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    type: 'test_email',
  };

  try {
    const docRef = await db.collection('mail').add(emailDoc);
    console.log('✅ Test email document created!');
    console.log(`   Document ID: ${docRef.id}`);
    console.log(`   Recipient: ${recipientEmail}`);
    console.log('\n📬 The email extension will process this document and send the email.');
    console.log('   Check your inbox (and spam folder) in a few moments.\n');

    // Wait a moment then check the document status
    console.log('⏳ Waiting 5 seconds to check delivery status...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const docSnapshot = await docRef.get();
    const data = docSnapshot.data();

    if (data.delivery) {
      console.log('📊 Delivery Status:');
      console.log(`   State: ${data.delivery.state}`);
      if (data.delivery.error) {
        console.log(`   Error: ${data.delivery.error}`);
      }
      if (data.delivery.endTime) {
        console.log(`   Completed: ${data.delivery.endTime.toDate()}`);
      }
    } else {
      console.log('📊 Delivery status not yet available. Check Firestore for updates.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

sendTestEmail();
