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

export interface EarningsBreakdown {
  grossFare: number;           // Total fare before split (what rider paid for trip, excluding tips)
  driverShare: number;         // 80% of gross fare (driver's earnings from trips)
  platformFee: number;         // 20% of gross fare (Drift's commission)
  tips: number;                // 100% goes to driver
  totalDriverEarnings: number; // driverShare + tips
}

export interface EarningsData {
  amount: number;              // Total driver earnings (80% of fare + 100% of tips)
  trips: number;
  hours: number;
  breakdown: EarningsBreakdown;
}

// Driver gets 80% of trip fare, platform takes 20%
const DRIVER_SHARE_PERCENTAGE = 0.80;
const PLATFORM_FEE_PERCENTAGE = 0.20;

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

      // Calculate earnings breakdown - driver gets 80% of fare + 100% of tips
      let grossFare = 0;
      let tips = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const tripFare = data.finalCost || data.estimatedCost || 0;
        const tip = data.tip || 0;
        grossFare += tripFare;
        tips += tip;
      });

      const driverShare = grossFare * DRIVER_SHARE_PERCENTAGE;
      const platformFee = grossFare * PLATFORM_FEE_PERCENTAGE;
      const totalDriverEarnings = driverShare + tips;

      // Calculate hours (placeholder - implement actual logic)
      const hours = snapshot.size * 0.5; // Assume 30 min per trip average

      return {
        amount: totalDriverEarnings,
        trips: snapshot.size,
        hours: hours,
        breakdown: {
          grossFare,
          driverShare,
          platformFee,
          tips,
          totalDriverEarnings,
        },
      };
    } catch (error) {
      console.error('Error getting today earnings:', error);
      return {
        amount: 0,
        trips: 0,
        hours: 0,
        breakdown: {
          grossFare: 0,
          driverShare: 0,
          platformFee: 0,
          tips: 0,
          totalDriverEarnings: 0,
        },
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

      // Calculate earnings breakdown - driver gets 80% of fare + 100% of tips
      let grossFare = 0;
      let tips = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const tripFare = data.finalCost || data.estimatedCost || 0;
        const tip = data.tip || 0;
        grossFare += tripFare;
        tips += tip;
      });

      const driverShare = grossFare * DRIVER_SHARE_PERCENTAGE;
      const platformFee = grossFare * PLATFORM_FEE_PERCENTAGE;
      const totalDriverEarnings = driverShare + tips;

      const hours = snapshot.size * 0.5;

      return {
        amount: totalDriverEarnings,
        trips: snapshot.size,
        hours: hours,
        breakdown: {
          grossFare,
          driverShare,
          platformFee,
          tips,
          totalDriverEarnings,
        },
      };
    } catch (error) {
      console.error('Error getting weekly earnings:', error);
      return {
        amount: 0,
        trips: 0,
        hours: 0,
        breakdown: {
          grossFare: 0,
          driverShare: 0,
          platformFee: 0,
          tips: 0,
          totalDriverEarnings: 0,
        },
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

      // Calculate earnings breakdown - driver gets 80% of fare + 100% of tips
      let grossFare = 0;
      let tips = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const tripFare = data.finalCost || data.estimatedCost || 0;
        const tip = data.tip || 0;
        grossFare += tripFare;
        tips += tip;
      });

      const driverShare = grossFare * DRIVER_SHARE_PERCENTAGE;
      const platformFee = grossFare * PLATFORM_FEE_PERCENTAGE;
      const totalDriverEarnings = driverShare + tips;

      const hours = snapshot.size * 0.5;

      return {
        amount: totalDriverEarnings,
        trips: snapshot.size,
        hours: hours,
        breakdown: {
          grossFare,
          driverShare,
          platformFee,
          tips,
          totalDriverEarnings,
        },
      };
    } catch (error) {
      console.error('Error getting monthly earnings:', error);
      return {
        amount: 0,
        trips: 0,
        hours: 0,
        breakdown: {
          grossFare: 0,
          driverShare: 0,
          platformFee: 0,
          tips: 0,
          totalDriverEarnings: 0,
        },
      };
    }
  },

  /**
   * Get last month's earnings for a driver
   */
  async getLastMonthEarnings(driverId: string): Promise<EarningsData> {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return this.getEarningsForDateRange(driverId, startOfLastMonth, endOfLastMonth);
  },

  /**
   * Get last 3 months earnings for a driver
   */
  async getThreeMonthsEarnings(driverId: string): Promise<EarningsData> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    return this.getEarningsForDateRange(driverId, startDate, now);
  },

  /**
   * Get last 6 months earnings for a driver
   */
  async getSixMonthsEarnings(driverId: string): Promise<EarningsData> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    return this.getEarningsForDateRange(driverId, startDate, now);
  },

  /**
   * Get earnings for a specific year
   */
  async getYearEarnings(driverId: string, year: number): Promise<EarningsData> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    return this.getEarningsForDateRange(driverId, startOfYear, endOfYear);
  },

  /**
   * Helper: Get earnings for a custom date range
   */
  async getEarningsForDateRange(driverId: string, startDate: Date, endDate: Date): Promise<EarningsData> {
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('driverId', '==', driverId),
        where('completedAt', '>=', startDate),
        where('completedAt', '<=', endDate),
        where('status', '==', 'COMPLETED')
      );
      const snapshot = await getDocs(q);

      // Calculate earnings breakdown - driver gets 80% of fare + 100% of tips
      let grossFare = 0;
      let tips = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const tripFare = data.finalCost || data.estimatedCost || 0;
        const tip = data.tip || 0;
        grossFare += tripFare;
        tips += tip;
      });

      const driverShare = grossFare * DRIVER_SHARE_PERCENTAGE;
      const platformFee = grossFare * PLATFORM_FEE_PERCENTAGE;
      const totalDriverEarnings = driverShare + tips;

      const hours = snapshot.size * 0.5;

      return {
        amount: totalDriverEarnings,
        trips: snapshot.size,
        hours: hours,
        breakdown: {
          grossFare,
          driverShare,
          platformFee,
          tips,
          totalDriverEarnings,
        },
      };
    } catch (error) {
      console.error('Error getting earnings for date range:', error);
      return {
        amount: 0,
        trips: 0,
        hours: 0,
        breakdown: {
          grossFare: 0,
          driverShare: 0,
          platformFee: 0,
          tips: 0,
          totalDriverEarnings: 0,
        },
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