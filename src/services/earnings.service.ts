/**
 * EARNINGS SERVICE
 * Firebase integration for driver earnings data
 * 
 * EXPO SDK 52 Compatible
 */

import firestore from '@react-native-firebase/firestore';

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
      const snapshot = await firestore()
        .collection('trips')
        .where('driverId', '==', driverId)
        .where('completedAt', '>=', startOfDay)
        .where('status', '==', 'COMPLETED')
        .get();

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
      const snapshot = await firestore()
        .collection('trips')
        .where('driverId', '==', driverId)
        .where('completedAt', '>=', startOfWeek)
        .where('status', '==', 'COMPLETED')
        .get();

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
      const snapshot = await firestore()
        .collection('trips')
        .where('driverId', '==', driverId)
        .where('completedAt', '>=', startOfMonth)
        .where('status', '==', 'COMPLETED')
        .get();

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
    const unsubscribe = firestore()
      .collection('drivers')
      .doc(driverId)
      .collection('earnings')
      .doc('current')
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
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