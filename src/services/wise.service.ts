/**
 * WISE PAYOUT SERVICE
 * Frontend service for Wise payout operations
 *
 * Uses Firebase Cloud Functions for secure API calls
 */

import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { getAuth } from '@react-native-firebase/auth';

// Get Firebase instances
const app = getApp();
const functions = getFunctions(app, 'us-east1');
const auth = getAuth(app);

/**
 * Helper to get fresh auth token before API calls
 */
async function refreshToken(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await user.getIdToken(true);
  }
}

/**
 * Types
 */
export interface WiseRecipientResult {
  success: boolean;
  recipientId: number;
}

export interface WisePayoutResult {
  success: boolean;
  payoutId: string;
  wiseTransferId: number;
  sourceAmount: number;
  targetAmount: number;
  exchangeRate: number;
  fee: number;
}

export interface BatchPayoutItem {
  driverId: string;
  amount: number;
}

export interface BatchPayoutResult {
  success: boolean;
  batchId: string;
  successCount: number;
  failedCount: number;
  results: Array<{
    driverId: string;
    success: boolean;
    payoutId?: string;
    wiseTransferId?: number;
    error?: string;
  }>;
}

export interface WiseTransferStatus {
  transferId: number;
  status: string;
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  created: string;
}

export interface WiseBalance {
  currency: string;
  amount: number;
  available: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  bankName?: string;
  branchName?: string;
  warning?: string;
}

/**
 * Wise Service
 */
export const WiseService = {
  /**
   * Create a Wise recipient for a driver's payout method
   * (Admin only)
   */
  async createRecipient(
    driverId: string,
    payoutMethodId: string
  ): Promise<WiseRecipientResult> {
    try {
      await refreshToken();

      const createWiseRecipient = httpsCallable<
        { driverId: string; payoutMethodId: string },
        WiseRecipientResult
      >(functions, 'createWiseRecipient');

      const result = await createWiseRecipient({ driverId, payoutMethodId });
      return result.data;
    } catch (error) {
      console.error('Error creating Wise recipient:', error);
      throw error;
    }
  },

  /**
   * Process a single payout to a driver
   * (Admin only)
   */
  async processPayout(
    driverId: string,
    amount: number,
    reference?: string
  ): Promise<WisePayoutResult> {
    try {
      await refreshToken();

      const processWisePayout = httpsCallable<
        { driverId: string; amount: number; reference?: string },
        WisePayoutResult
      >(functions, 'processWisePayout');

      const result = await processWisePayout({ driverId, amount, reference });
      return result.data;
    } catch (error) {
      console.error('Error processing Wise payout:', error);
      throw error;
    }
  },

  /**
   * Process multiple payouts in a batch
   * (Admin only)
   */
  async processBatchPayouts(payouts: BatchPayoutItem[]): Promise<BatchPayoutResult> {
    try {
      await refreshToken();

      const processBatchWisePayouts = httpsCallable<
        { payouts: BatchPayoutItem[] },
        BatchPayoutResult
      >(functions, 'processBatchWisePayouts');

      const result = await processBatchWisePayouts({ payouts });
      return result.data;
    } catch (error) {
      console.error('Error processing batch payouts:', error);
      throw error;
    }
  },

  /**
   * Get the status of a Wise transfer
   */
  async getTransferStatus(wiseTransferId: number): Promise<WiseTransferStatus> {
    try {
      await refreshToken();

      const getWiseTransferStatus = httpsCallable<
        { wiseTransferId: number },
        WiseTransferStatus
      >(functions, 'getWiseTransferStatus');

      const result = await getWiseTransferStatus({ wiseTransferId });
      return result.data;
    } catch (error) {
      console.error('Error getting transfer status:', error);
      throw error;
    }
  },

  /**
   * Sync payout status with Wise
   */
  async syncPayoutStatus(payoutId: string): Promise<{
    success: boolean;
    payoutId: string;
    status: string;
    wiseStatus: string;
  }> {
    try {
      await refreshToken();

      const syncWisePayoutStatus = httpsCallable<
        { payoutId: string },
        { success: boolean; payoutId: string; status: string; wiseStatus: string }
      >(functions, 'syncWisePayoutStatus');

      const result = await syncWisePayoutStatus({ payoutId });
      return result.data;
    } catch (error) {
      console.error('Error syncing payout status:', error);
      throw error;
    }
  },

  /**
   * Get Wise business account balance
   * (Admin only)
   */
  async getBalance(): Promise<{ success: boolean; balances: WiseBalance[] }> {
    try {
      await refreshToken();

      const getWiseBalance = httpsCallable<
        Record<string, never>,
        { success: boolean; balances: WiseBalance[] }
      >(functions, 'getWiseBalance');

      const result = await getWiseBalance({});
      return result.data;
    } catch (error) {
      console.error('Error getting Wise balance:', error);
      throw error;
    }
  },

  /**
   * Validate bank account details before adding
   */
  async validateAccount(
    sortCode: string,
    accountNumber: string
  ): Promise<ValidationResult> {
    try {
      await refreshToken();

      const validateWiseAccount = httpsCallable<
        { sortCode: string; accountNumber: string },
        ValidationResult
      >(functions, 'validateWiseAccount');

      const result = await validateWiseAccount({ sortCode, accountNumber });
      return result.data;
    } catch (error) {
      console.error('Error validating account:', error);
      throw error;
    }
  },
};
