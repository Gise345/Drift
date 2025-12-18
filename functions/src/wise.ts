/**
 * FIREBASE CLOUD FUNCTIONS - WISE PAYOUTS
 * Handles driver payouts via Wise (TransferWise) API
 *
 * Deploy: firebase deploy --only functions
 *
 * Environment variables needed (use .env file or Firebase secrets):
 * WISE_API_TOKEN="YOUR_API_TOKEN"
 * WISE_PROFILE_ID="YOUR_BUSINESS_PROFILE_ID"
 * WISE_ENVIRONMENT="sandbox" or "production"
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Using 'main' database
const db = getFirestore(admin.app(), 'main');

// Wise API configuration
const WISE_API_TOKEN = process.env.WISE_API_TOKEN || '';
const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID || '';
const WISE_ENVIRONMENT = process.env.WISE_ENVIRONMENT || 'sandbox';

// Wise API base URLs
const WISE_API_URL = WISE_ENVIRONMENT === 'production'
  ? 'https://api.wise.com'
  : 'https://api.sandbox.wise.com';

/**
 * Common options for all callable functions
 */
const callableOptions = {
  region: 'us-east1' as const,
  invoker: 'public' as const,
};

/**
 * Helper function to make Wise API requests
 */
async function wiseApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, any>
): Promise<any> {
  if (!WISE_API_TOKEN) {
    throw new HttpsError('failed-precondition', 'Wise API token not configured');
  }

  const url = `${WISE_API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${WISE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`Wise API ${method} ${endpoint}`);

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error('Wise API error:', data);
    throw new HttpsError(
      'internal',
      data.message || `Wise API error: ${response.status}`
    );
  }

  return data;
}

/**
 * Type definitions
 */
interface WiseRecipient {
  id: number;
  profile: number;
  accountHolderName: string;
  currency: string;
  country: string;
  type: string;
  details: {
    sortCode: string;
    accountNumber: string;
  };
}

interface WiseQuote {
  id: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  fee: number;
  payOut: string;
}

interface WiseTransfer {
  id: number;
  targetAccount: number;
  quoteUuid: string;
  status: string;
  reference: string;
  rate: number;
  created: string;
  sourceCurrency: string;
  sourceValue: number;
  targetCurrency: string;
  targetValue: number;
}

/**
 * CREATE WISE RECIPIENT
 * Creates a recipient account in Wise for a driver's bank details
 * This is called once when a driver adds their payout method
 */
interface CreateRecipientRequest {
  driverId: string;
  payoutMethodId: string;
}

export const createWiseRecipient = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin role
    const adminId = request.auth.uid;
    const adminDoc = await db.collection('users').doc(adminId).get();
    const adminData = adminDoc.data();
    if (!adminData?.roles?.includes('ADMIN')) {
      throw new HttpsError('permission-denied', 'Only admins can create Wise recipients');
    }

    const data = request.data as CreateRecipientRequest;
    const { driverId, payoutMethodId } = data;

    if (!driverId || !payoutMethodId) {
      throw new HttpsError('invalid-argument', 'Driver ID and payout method ID are required');
    }

    console.log('Creating Wise recipient for driver:', driverId);

    // Get payout method details
    const payoutMethodRef = db.collection('drivers').doc(driverId).collection('payoutMethods').doc(payoutMethodId);
    const payoutMethodDoc = await payoutMethodRef.get();

    if (!payoutMethodDoc.exists) {
      throw new HttpsError('not-found', 'Payout method not found');
    }

    const payoutMethod = payoutMethodDoc.data()!;

    // Check if recipient already exists
    if (payoutMethod.wiseRecipientId) {
      console.log('Wise recipient already exists:', payoutMethod.wiseRecipientId);
      return { recipientId: payoutMethod.wiseRecipientId };
    }

    // Create recipient in Wise
    // UK bank account requires sort code and account number
    const recipientData = {
      profile: parseInt(WISE_PROFILE_ID),
      accountHolderName: payoutMethod.accountHolderName,
      currency: 'GBP',
      type: 'sort_code',
      details: {
        sortCode: payoutMethod.sortCode.replace(/-/g, ''),
        accountNumber: payoutMethod.accountNumber,
      },
    };

    const recipient = await wiseApiRequest('/v1/accounts', 'POST', recipientData) as WiseRecipient;

    console.log('Wise recipient created:', recipient.id);

    // Save recipient ID to payout method
    await payoutMethodRef.update({
      wiseRecipientId: recipient.id,
      verificationStatus: 'verified',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      recipientId: recipient.id,
    };
  } catch (error: unknown) {
    console.error('Error creating Wise recipient:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to create Wise recipient';
    throw new HttpsError('internal', message);
  }
});

/**
 * PROCESS WISE PAYOUT
 * Creates a quote and transfer for a single driver payout
 */
interface ProcessPayoutRequest {
  driverId: string;
  amount: number;
  reference?: string;
}

export const processWisePayout = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin role
    const adminId = request.auth.uid;
    const adminDoc = await db.collection('users').doc(adminId).get();
    const adminData = adminDoc.data();
    if (!adminData?.roles?.includes('ADMIN')) {
      throw new HttpsError('permission-denied', 'Only admins can process payouts');
    }

    const data = request.data as ProcessPayoutRequest;
    const { driverId, amount, reference } = data;

    if (!driverId || !amount || amount <= 0) {
      throw new HttpsError('invalid-argument', 'Driver ID and valid amount are required');
    }

    console.log('Processing Wise payout:', { driverId, amount });

    // Get driver's default payout method
    const payoutMethodsRef = db.collection('drivers').doc(driverId).collection('payoutMethods');
    const defaultMethodQuery = await payoutMethodsRef
      .where('type', '==', 'wise')
      .where('isDefault', '==', true)
      .limit(1)
      .get();

    if (defaultMethodQuery.empty) {
      throw new HttpsError('failed-precondition', 'Driver has no default Wise payout method');
    }

    const payoutMethod = defaultMethodQuery.docs[0].data();
    const wiseRecipientId = payoutMethod.wiseRecipientId;

    if (!wiseRecipientId) {
      throw new HttpsError('failed-precondition', 'Payout method not verified with Wise');
    }

    // Get driver info for reference
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    const driverData = driverDoc.data();
    const driverName = driverData ? `${driverData.firstName} ${driverData.lastName}` : 'Driver';

    // Step 1: Create a quote
    // Converting from USD (source) to GBP (target)
    const quoteData = {
      profile: parseInt(WISE_PROFILE_ID),
      sourceCurrency: 'USD',
      targetCurrency: 'GBP',
      sourceAmount: amount,
      targetAccount: wiseRecipientId,
    };

    const quote = await wiseApiRequest('/v2/quotes', 'POST', quoteData) as WiseQuote;
    console.log('Wise quote created:', quote.id);

    // Step 2: Create the transfer
    const transferReference = reference || `Drift Payout - ${driverName} - ${new Date().toISOString().split('T')[0]}`;

    const transferData = {
      targetAccount: wiseRecipientId,
      quoteUuid: quote.id,
      customerTransactionId: `drift-payout-${driverId}-${Date.now()}`,
      details: {
        reference: transferReference.substring(0, 35), // Wise has 35 char limit
      },
    };

    const transfer = await wiseApiRequest('/v1/transfers', 'POST', transferData) as WiseTransfer;
    console.log('Wise transfer created:', transfer.id);

    // Step 3: Fund the transfer (from Wise balance)
    const fundData = {
      type: 'BALANCE',
    };

    await wiseApiRequest(`/v3/profiles/${WISE_PROFILE_ID}/transfers/${transfer.id}/payments`, 'POST', fundData);
    console.log('Wise transfer funded:', transfer.id);

    // Create payout record in Firestore
    const payoutRef = await db.collection('payouts').add({
      driverId,
      driverName,
      amount,
      targetAmount: quote.targetAmount,
      sourceCurrency: 'USD',
      targetCurrency: 'GBP',
      exchangeRate: quote.rate,
      wiseFee: quote.fee,
      wiseQuoteId: quote.id,
      wiseTransferId: transfer.id,
      status: 'processing',
      method: 'wise',
      processedBy: adminId,
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update driver's pending payout
    const earningsSummaryRef = db.collection('drivers').doc(driverId).collection('earnings').doc('summary');
    await earningsSummaryRef.update({
      pendingPayout: admin.firestore.FieldValue.increment(-amount),
      lastPayoutAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPayoutAmount: amount,
    });

    // Create transaction record
    await db.collection('transactions').add({
      driverId,
      type: 'cashout',
      amount: -amount,
      description: `Wise payout - ${transferReference}`,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        payoutId: payoutRef.id,
        wiseTransferId: transfer.id,
        wiseQuoteId: quote.id,
        targetAmount: quote.targetAmount,
        targetCurrency: 'GBP',
        exchangeRate: quote.rate,
      },
    });

    console.log('Payout processed successfully:', payoutRef.id);

    return {
      success: true,
      payoutId: payoutRef.id,
      wiseTransferId: transfer.id,
      sourceAmount: amount,
      targetAmount: quote.targetAmount,
      exchangeRate: quote.rate,
      fee: quote.fee,
    };
  } catch (error: unknown) {
    console.error('Error processing Wise payout:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to process payout';
    throw new HttpsError('internal', message);
  }
});

/**
 * PROCESS BATCH PAYOUTS
 * Process multiple driver payouts in a single batch
 */
interface BatchPayoutItem {
  driverId: string;
  amount: number;
}

interface BatchPayoutRequest {
  payouts: BatchPayoutItem[];
}

export const processBatchWisePayouts = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin role
    const adminId = request.auth.uid;
    const adminDoc = await db.collection('users').doc(adminId).get();
    const adminData = adminDoc.data();
    if (!adminData?.roles?.includes('ADMIN')) {
      throw new HttpsError('permission-denied', 'Only admins can process batch payouts');
    }

    const data = request.data as BatchPayoutRequest;
    const { payouts } = data;

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      throw new HttpsError('invalid-argument', 'Payouts array is required');
    }

    console.log(`Processing batch of ${payouts.length} payouts`);

    const results: Array<{
      driverId: string;
      success: boolean;
      payoutId?: string;
      wiseTransferId?: number;
      error?: string;
    }> = [];

    // Create a batch record
    const batchRef = await db.collection('payoutBatches').add({
      totalPayouts: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
      status: 'processing',
      processedBy: adminId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Process each payout sequentially to avoid rate limits
    for (const payout of payouts) {
      try {
        // Get driver's default payout method
        const payoutMethodsRef = db.collection('drivers').doc(payout.driverId).collection('payoutMethods');
        const defaultMethodQuery = await payoutMethodsRef
          .where('type', '==', 'wise')
          .where('isDefault', '==', true)
          .limit(1)
          .get();

        if (defaultMethodQuery.empty) {
          results.push({
            driverId: payout.driverId,
            success: false,
            error: 'No default Wise payout method',
          });
          continue;
        }

        const payoutMethod = defaultMethodQuery.docs[0].data();
        const wiseRecipientId = payoutMethod.wiseRecipientId;

        if (!wiseRecipientId) {
          results.push({
            driverId: payout.driverId,
            success: false,
            error: 'Payout method not verified with Wise',
          });
          continue;
        }

        // Get driver info
        const driverDoc = await db.collection('drivers').doc(payout.driverId).get();
        const driverData = driverDoc.data();
        const driverName = driverData ? `${driverData.firstName} ${driverData.lastName}` : 'Driver';

        // Create quote
        const quoteData = {
          profile: parseInt(WISE_PROFILE_ID),
          sourceCurrency: 'USD',
          targetCurrency: 'GBP',
          sourceAmount: payout.amount,
          targetAccount: wiseRecipientId,
        };

        const quote = await wiseApiRequest('/v2/quotes', 'POST', quoteData) as WiseQuote;

        // Create transfer
        const transferData = {
          targetAccount: wiseRecipientId,
          quoteUuid: quote.id,
          customerTransactionId: `drift-batch-${batchRef.id}-${payout.driverId}-${Date.now()}`,
          details: {
            reference: `Drift Payout - ${driverName}`.substring(0, 35),
          },
        };

        const transfer = await wiseApiRequest('/v1/transfers', 'POST', transferData) as WiseTransfer;

        // Fund transfer
        await wiseApiRequest(`/v3/profiles/${WISE_PROFILE_ID}/transfers/${transfer.id}/payments`, 'POST', { type: 'BALANCE' });

        // Create payout record
        const payoutRecordRef = await db.collection('payouts').add({
          driverId: payout.driverId,
          driverName,
          amount: payout.amount,
          targetAmount: quote.targetAmount,
          sourceCurrency: 'USD',
          targetCurrency: 'GBP',
          exchangeRate: quote.rate,
          wiseFee: quote.fee,
          wiseQuoteId: quote.id,
          wiseTransferId: transfer.id,
          batchId: batchRef.id,
          status: 'processing',
          method: 'wise',
          processedBy: adminId,
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update driver earnings
        const earningsSummaryRef = db.collection('drivers').doc(payout.driverId).collection('earnings').doc('summary');
        await earningsSummaryRef.update({
          pendingPayout: admin.firestore.FieldValue.increment(-payout.amount),
          lastPayoutAt: admin.firestore.FieldValue.serverTimestamp(),
          lastPayoutAmount: payout.amount,
        });

        results.push({
          driverId: payout.driverId,
          success: true,
          payoutId: payoutRecordRef.id,
          wiseTransferId: transfer.id,
        });

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (payoutError: unknown) {
        const errorMessage = payoutError instanceof Error ? payoutError.message : 'Unknown error';
        console.error(`Error processing payout for ${payout.driverId}:`, errorMessage);
        results.push({
          driverId: payout.driverId,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Update batch status
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    await batchRef.update({
      status: failedCount === 0 ? 'completed' : failedCount === results.length ? 'failed' : 'partial',
      successCount,
      failedCount,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      results,
    });

    console.log(`Batch payout completed: ${successCount} success, ${failedCount} failed`);

    return {
      success: true,
      batchId: batchRef.id,
      successCount,
      failedCount,
      results,
    };
  } catch (error: unknown) {
    console.error('Error processing batch payouts:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to process batch payouts';
    throw new HttpsError('internal', message);
  }
});

/**
 * GET WISE TRANSFER STATUS
 * Check the status of a Wise transfer
 */
interface GetTransferStatusRequest {
  wiseTransferId: number;
}

export const getWiseTransferStatus = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as GetTransferStatusRequest;
    const { wiseTransferId } = data;

    if (!wiseTransferId) {
      throw new HttpsError('invalid-argument', 'Wise transfer ID is required');
    }

    const transfer = await wiseApiRequest(`/v1/transfers/${wiseTransferId}`) as WiseTransfer;

    return {
      transferId: transfer.id,
      status: transfer.status,
      sourceAmount: transfer.sourceValue,
      sourceCurrency: transfer.sourceCurrency,
      targetAmount: transfer.targetValue,
      targetCurrency: transfer.targetCurrency,
      created: transfer.created,
    };
  } catch (error: unknown) {
    console.error('Error getting transfer status:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to get transfer status';
    throw new HttpsError('internal', message);
  }
});

/**
 * UPDATE PAYOUT STATUS (Webhook handler or manual sync)
 * Updates payout status based on Wise transfer status
 */
interface UpdatePayoutStatusRequest {
  payoutId: string;
}

export const syncWisePayoutStatus = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as UpdatePayoutStatusRequest;
    const { payoutId } = data;

    if (!payoutId) {
      throw new HttpsError('invalid-argument', 'Payout ID is required');
    }

    // Get payout record
    const payoutDoc = await db.collection('payouts').doc(payoutId).get();
    if (!payoutDoc.exists) {
      throw new HttpsError('not-found', 'Payout not found');
    }

    const payoutData = payoutDoc.data()!;
    const wiseTransferId = payoutData.wiseTransferId;

    if (!wiseTransferId) {
      throw new HttpsError('failed-precondition', 'Payout has no Wise transfer ID');
    }

    // Get transfer status from Wise
    const transfer = await wiseApiRequest(`/v1/transfers/${wiseTransferId}`) as WiseTransfer;

    // Map Wise status to our status
    let newStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'processing';
    if (transfer.status === 'outgoing_payment_sent' || transfer.status === 'funds_converted') {
      newStatus = 'completed';
    } else if (transfer.status === 'cancelled' || transfer.status === 'funds_refunded') {
      newStatus = 'failed';
    }

    // Update payout record
    const updateData: Record<string, any> = {
      status: newStatus,
      wiseStatus: transfer.status,
      lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (newStatus === 'completed') {
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await db.collection('payouts').doc(payoutId).update(updateData);

    // Update associated transaction
    const transactionQuery = await db.collection('transactions')
      .where('metadata.payoutId', '==', payoutId)
      .limit(1)
      .get();

    if (!transactionQuery.empty) {
      await transactionQuery.docs[0].ref.update({
        status: newStatus,
        completedAt: newStatus === 'completed' ? admin.firestore.FieldValue.serverTimestamp() : null,
      });
    }

    console.log(`Payout ${payoutId} status updated to ${newStatus} (Wise: ${transfer.status})`);

    return {
      success: true,
      payoutId,
      status: newStatus,
      wiseStatus: transfer.status,
    };
  } catch (error: unknown) {
    console.error('Error syncing payout status:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to sync payout status';
    throw new HttpsError('internal', message);
  }
});

/**
 * GET WISE BALANCE
 * Get the current balance of the Wise business account
 */
export const getWiseBalance = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin role
    const adminId = request.auth.uid;
    const adminDoc = await db.collection('users').doc(adminId).get();
    const adminData = adminDoc.data();
    if (!adminData?.roles?.includes('ADMIN')) {
      throw new HttpsError('permission-denied', 'Only admins can view Wise balance');
    }

    const balances = await wiseApiRequest(`/v4/profiles/${WISE_PROFILE_ID}/balances?types=STANDARD`);

    return {
      success: true,
      balances: balances.map((b: any) => ({
        currency: b.currency,
        amount: b.amount.value,
        available: b.amount.value,
      })),
    };
  } catch (error: unknown) {
    console.error('Error getting Wise balance:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to get Wise balance';
    throw new HttpsError('internal', message);
  }
});

/**
 * VALIDATE WISE ACCOUNT
 * Validates that bank details are correct before creating a recipient
 */
interface ValidateAccountRequest {
  sortCode: string;
  accountNumber: string;
}

export const validateWiseAccount = onCall(callableOptions, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as ValidateAccountRequest;
    const { sortCode, accountNumber } = data;

    if (!sortCode || !accountNumber) {
      throw new HttpsError('invalid-argument', 'Sort code and account number are required');
    }

    // Clean up sort code
    const cleanSortCode = sortCode.replace(/-/g, '');

    // Validate format
    if (cleanSortCode.length !== 6 || !/^\d{6}$/.test(cleanSortCode)) {
      return {
        valid: false,
        error: 'Sort code must be 6 digits',
      };
    }

    if (accountNumber.length !== 8 || !/^\d{8}$/.test(accountNumber)) {
      return {
        valid: false,
        error: 'Account number must be 8 digits',
      };
    }

    // Use Wise's account validation API
    try {
      const validationResult = await wiseApiRequest('/v1/validators/sort-code-account-number', 'POST', {
        sortCode: cleanSortCode,
        accountNumber,
      });

      return {
        valid: validationResult.valid !== false,
        bankName: validationResult.bankName,
        branchName: validationResult.branchName,
      };
    } catch {
      // If validation endpoint fails, assume valid (format was checked)
      return {
        valid: true,
        warning: 'Could not verify with bank, but format is correct',
      };
    }
  } catch (error: unknown) {
    console.error('Error validating account:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Failed to validate account';
    throw new HttpsError('internal', message);
  }
});
