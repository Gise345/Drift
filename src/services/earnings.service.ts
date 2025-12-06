/**
 * EARNINGS SERVICE
 * Firebase integration for driver earnings data
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
  query,
  where,
  onSnapshot,
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

export interface EarningsData {
  amount: number;
  trips: number;
  hours: number;
}

export const EarningsService = {
  /**
   * Get today's earnings for a driver
   */
  async getTodayEarnings(driverId: string): Promise<EarningsData> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('driverId', '==', driverId),
        where('completedAt', '>=', startOfDay),
        where('status', '==', 'COMPLETED')
      );
      const snapshot = await getDocs(q);

      // Calculate earnings from finalCost or estimatedCost (driver gets the fare)
      const earnings = snapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        // Use finalCost if available, otherwise estimatedCost, also add any tips
        const tripEarnings = data.finalCost || data.estimatedCost || 0;
        const tip = data.tip || 0;
        return total + tripEarnings + tip;
      }, 0);
      
      // Calculate hours (placeholder - implement actual logic)
      const hours = snapshot.size * 0.5; // Assume 30 min per trip average
      
      return {
        amount: earnings,
        trips: snapshot.size,
        hours: hours,
      };
    } catch (error) {
      console.error('Error getting today earnings:', error);
      return {
        amount: 0,
        trips: 0,
        hours: 0,
      };
    }
  },

  /**
   * Get weekly earnings for a driver
   */
  async getWeeklyEarnings(driverId: string): Promise<EarningsData> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('driverId', '==', driverId),
        where('completedAt', '>=', startOfWeek),
        where('status', '==', 'COMPLETED')
      );
      const snapshot = await getDocs(q);

      // Calculate earnings from finalCost or estimatedCost (driver gets the fare)
      const earnings = snapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        const tripEarnings = data.finalCost || data.estimatedCost || 0;
        const tip = data.tip || 0;
        return total + tripEarnings + tip;
      }, 0);
      
      const hours = snapshot.size * 0.5;
      
      return {
        amount: earnings,
        trips: snapshot.size,
        hours: hours,
      };
    } catch (error) {
      console.error('Error getting weekly earnings:', error);
      return {
        amount: 0,
        trips: 0,
        hours: 0,
      };
    }
  },

  /**
   * Get monthly earnings for a driver
   */
  async getMonthlyEarnings(driverId: string): Promise<EarningsData> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('driverId', '==', driverId),
        where('completedAt', '>=', startOfMonth),
        where('status', '==', 'COMPLETED')
      );
      const snapshot = await getDocs(q);

      // Calculate earnings from finalCost or estimatedCost (driver gets the fare)
      const earnings = snapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        const tripEarnings = data.finalCost || data.estimatedCost || 0;
        const tip = data.tip || 0;
        return total + tripEarnings + tip;
      }, 0);
      
      const hours = snapshot.size * 0.5;
      
      return {
        amount: earnings,
        trips: snapshot.size,
        hours: hours,
      };
    } catch (error) {
      console.error('Error getting monthly earnings:', error);
      return {
        amount: 0,
        trips: 0,
        hours: 0,
      };
    }
  },

  /**
   * Listen to real-time earnings updates
   */
  subscribeToEarnings(
    driverId: string,
    callback: (earnings: EarningsData) => void
  ): () => void {
    const earningsRef = doc(db, 'drivers', driverId, 'earnings', 'current');

    const unsubscribe = onSnapshot(
      earningsRef,
      (docSnap) => {
        if (documentExists(docSnap)) {
          const data = docSnap.data();
          callback({
            amount: data?.todayEarnings || 0,
            trips: data?.todayTrips || 0,
            hours: data?.todayHours || 0,
          });
        }
      },
      (error) => {
        console.error('Error subscribing to earnings:', error);
      }
    );

    return unsubscribe;
  },
};