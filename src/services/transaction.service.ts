/**
 * TRANSACTION SERVICE
 * Firebase integration for driver wallet transactions
 *
 * EXPO SDK 52 Compatible
 */

import firestore from '@react-native-firebase/firestore';

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
      const doc = await firestore()
        .collection('drivers')
        .doc(driverId)
        .collection('wallet')
        .doc('balance')
        .get();

      if (!doc.exists) {
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
    limit = 50,
    type?: TransactionType
  ): Promise<Transaction[]> {
    try {
      let query = firestore()
        .collection('transactions')
        .where('driverId', '==', driverId)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (type) {
        query = query.where('type', '==', type);
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
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
    limit = 50
  ): () => void {
    const unsubscribe = firestore()
      .collection('transactions')
      .where('driverId', '==', driverId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot(
        snapshot => {
          const transactions: Transaction[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
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
    const unsubscribe = firestore()
      .collection('drivers')
      .doc(driverId)
      .collection('wallet')
      .doc('balance')
      .onSnapshot(
        doc => {
          if (doc.exists) {
            const data = doc.data()!;
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
      const docRef = await firestore()
        .collection('transactions')
        .add({
          driverId,
          type: 'cashout',
          amount: -amount,
          description: 'Cash out to bank account',
          status: 'pending',
          createdAt: firestore.FieldValue.serverTimestamp(),
          metadata: {
            payoutMethod,
            requestedAmount: amount,
          },
        });

      // Update wallet balance (deduct from available, add to pending)
      await firestore()
        .collection('drivers')
        .doc(driverId)
        .collection('wallet')
        .doc('balance')
        .update({
          available: firestore.FieldValue.increment(-amount),
          pending: firestore.FieldValue.increment(amount),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
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
      const docRef = await firestore()
        .collection('transactions')
        .add({
          ...transaction,
          createdAt: firestore.FieldValue.serverTimestamp(),
          completedAt: transaction.status === 'completed'
            ? firestore.FieldValue.serverTimestamp()
            : null,
        });

      // Update wallet balance if transaction is completed
      if (transaction.status === 'completed' && transaction.amount !== 0) {
        const field = transaction.amount > 0 ? 'available' : 'available';
        await firestore()
          .collection('drivers')
          .doc(transaction.driverId)
          .collection('wallet')
          .doc('balance')
          .update({
            [field]: firestore.FieldValue.increment(transaction.amount),
            totalEarnings: transaction.amount > 0
              ? firestore.FieldValue.increment(transaction.amount)
              : firestore.FieldValue.increment(0),
            lastUpdated: firestore.FieldValue.serverTimestamp(),
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
      const snapshot = await firestore()
        .collection('transactions')
        .where('driverId', '==', driverId)
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .where('status', '==', 'completed')
        .get();

      let totalEarnings = 0;
      let totalTips = 0;
      let totalBonuses = 0;
      let totalFees = 0;
      let totalCashouts = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
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
