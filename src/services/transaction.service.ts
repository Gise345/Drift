/**
 * TRANSACTION SERVICE
 * Firebase integration for driver wallet transactions
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  serverTimestamp,
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

/**
 * Helper to check if document exists
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

export type TransactionType = 'ride' | 'tip' | 'bonus' | 'cashout' | 'fee' | 'adjustment';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  driverId: string;
  type: TransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  createdAt: Date;
  completedAt?: Date;
  metadata?: {
    tripId?: string;
    riderId?: string;
    payoutMethod?: string;
    [key: string]: any;
  };
}

export interface WalletBalance {
  driverId: string;
  available: number;
  pending: number;
  totalEarnings: number;
  totalCashouts: number;
  lastUpdated: Date;
}

export const TransactionService = {
  /**
   * Get wallet balance for a driver
   */
  async getWalletBalance(driverId: string): Promise<WalletBalance> {
    try {
      const balanceRef = doc(db, 'drivers', driverId, 'wallet', 'balance');
      const balanceDoc = await getDoc(balanceRef);

      if (!documentExists(balanceDoc)) {
        // Return empty balance
        return {
          driverId,
          available: 0,
          pending: 0,
          totalEarnings: 0,
          totalCashouts: 0,
          lastUpdated: new Date(),
        };
      }

      const data = doc.data()!;
      return {
        driverId,
        available: data.available || 0,
        pending: data.pending || 0,
        totalEarnings: data.totalEarnings || 0,
        totalCashouts: data.totalCashouts || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return {
        driverId,
        available: 0,
        pending: 0,
        totalEarnings: 0,
        totalCashouts: 0,
        lastUpdated: new Date(),
      };
    }
  },

  /**
   * Get transactions for a driver
   */
  async getTransactions(
    driverId: string,
    maxResults = 50,
    type?: TransactionType
  ): Promise<Transaction[]> {
    try {
      const transactionsRef = collection(db, 'transactions');
      const constraints: any[] = [
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      ];

      if (type) {
        constraints.push(where('type', '==', type));
      }

      const q = query(transactionsRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          driverId: data.driverId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          metadata: data.metadata,
        };
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  /**
   * Get recent transactions (last 5)
   */
  async getRecentTransactions(driverId: string): Promise<Transaction[]> {
    return this.getTransactions(driverId, 5);
  },

  /**
   * Listen to real-time transactions
   */
  subscribeToTransactions(
    driverId: string,
    callback: (transactions: Transaction[]) => void,
    maxResults = 50
  ): () => void {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const transactions: Transaction[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            driverId: data.driverId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
            metadata: data.metadata,
          };
        });
        callback(transactions);
      },
      error => {
        console.error('Error subscribing to transactions:', error);
      }
    );

    return unsubscribe;
  },

  /**
   * Listen to real-time wallet balance
   */
  subscribeToWalletBalance(
    driverId: string,
    callback: (balance: WalletBalance) => void
  ): () => void {
    const balanceRef = doc(db, 'drivers', driverId, 'wallet', 'balance');

    const unsubscribe = onSnapshot(
      balanceRef,
      docSnap => {
        if (documentExists(docSnap)) {
          const data = docSnap.data()!;
            callback({
              driverId,
              available: data.available || 0,
              pending: data.pending || 0,
              totalEarnings: data.totalEarnings || 0,
              totalCashouts: data.totalCashouts || 0,
              lastUpdated: data.lastUpdated?.toDate() || new Date(),
            });
          } else {
            callback({
              driverId,
              available: 0,
              pending: 0,
              totalEarnings: 0,
              totalCashouts: 0,
              lastUpdated: new Date(),
            });
          }
        },
        error => {
          console.error('Error subscribing to wallet balance:', error);
        }
      );

    return unsubscribe;
  },

  /**
   * Request cashout
   */
  async requestCashout(
    driverId: string,
    amount: number,
    payoutMethod: string
  ): Promise<string> {
    try {
      // Check if driver has sufficient balance
      const balance = await this.getWalletBalance(driverId);

      if (balance.available < amount) {
        throw new Error('Insufficient balance');
      }

      if (amount < 25) {
        throw new Error('Minimum cashout amount is CI$25');
      }

      // Create cashout transaction
      const transactionsRef = collection(db, 'transactions');
      const docRef = await addDoc(transactionsRef, {
        driverId,
        type: 'cashout',
        amount: -amount,
        description: 'Cash out to bank account',
        status: 'pending',
        createdAt: serverTimestamp(),
        metadata: {
          payoutMethod,
          requestedAmount: amount,
        },
      });

      // Update wallet balance (deduct from available, add to pending)
      const balanceRef = doc(db, 'drivers', driverId, 'wallet', 'balance');
      await updateDoc(balanceRef, {
        available: increment(-amount),
        pending: increment(amount),
        lastUpdated: serverTimestamp(),
      });

      console.log('Cashout requested:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error requesting cashout:', error);
      throw error;
    }
  },

  /**
   * Create a transaction (typically used when trip completes)
   */
  async createTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const transactionsRef = collection(db, 'transactions');
      const docRef = await addDoc(transactionsRef, {
        ...transaction,
        createdAt: serverTimestamp(),
        completedAt: transaction.status === 'completed'
          ? serverTimestamp()
          : null,
      });

      // Update wallet balance if transaction is completed
      if (transaction.status === 'completed' && transaction.amount !== 0) {
        const field = transaction.amount > 0 ? 'available' : 'available';
        const balanceRef = doc(db, 'drivers', transaction.driverId, 'wallet', 'balance');
        await updateDoc(balanceRef, {
          [field]: increment(transaction.amount),
          totalEarnings: transaction.amount > 0
            ? increment(transaction.amount)
            : increment(0),
          lastUpdated: serverTimestamp(),
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  /**
   * Get transaction statistics for a period
   */
  async getTransactionStats(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEarnings: number;
    totalTips: number;
    totalBonuses: number;
    totalFees: number;
    totalCashouts: number;
    netEarnings: number;
  }> {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('driverId', '==', driverId),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        where('status', '==', 'completed')
      );
      const snapshot = await getDocs(q);

      let totalEarnings = 0;
      let totalTips = 0;
      let totalBonuses = 0;
      let totalFees = 0;
      let totalCashouts = 0;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const amount = data.amount || 0;

        switch (data.type) {
          case 'ride':
            totalEarnings += amount;
            break;
          case 'tip':
            totalTips += amount;
            break;
          case 'bonus':
            totalBonuses += amount;
            break;
          case 'fee':
            totalFees += Math.abs(amount);
            break;
          case 'cashout':
            totalCashouts += Math.abs(amount);
            break;
        }
      });

      return {
        totalEarnings,
        totalTips,
        totalBonuses,
        totalFees,
        totalCashouts,
        netEarnings: totalEarnings + totalTips + totalBonuses - totalFees,
      };
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      return {
        totalEarnings: 0,
        totalTips: 0,
        totalBonuses: 0,
        totalFees: 0,
        totalCashouts: 0,
        netEarnings: 0,
      };
    }
  },
};
