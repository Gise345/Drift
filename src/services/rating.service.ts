/**
 * Rating and Review Service
 * Manages ratings, reviews, and performance statistics
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 * PRODUCTION READY - No mock data
 */

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
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

export interface Review {
  id: string;
  tripId: string;
  driverId: string;
  riderId: string;
  riderName: string;
  riderPhoto?: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt: Date;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface DriverRatingStats {
  average: number;
  total: number;
  distribution: RatingDistribution;
}

export interface PerformanceStats {
  acceptanceRate: number;
  completionRate: number;
  cancelRate: number;
  averageRating: number;
  totalTrips: number;
  totalEarnings: number;
  onlineHours: number;
  peakHours: string[];
  topRoutes: Array<{
    from: string;
    to: string;
    count: number;
  }>;
  weeklyData: Array<{
    day: string;
    trips: number;
    earnings: number;
  }>;
}

/**
 * Submit a rating for a driver from a rider
 */
export async function submitDriverRating(
  tripId: string,
  driverId: string,
  riderId: string,
  riderName: string,
  rating: number,
  comment?: string,
  tags?: string[]
): Promise<void> {
  try {
    console.log('📝 Submitting driver rating:', { tripId, driverId, rating });

    // Create the review document
    const reviewsRef = collection(db, 'reviews');
    const reviewDocRef = doc(reviewsRef);
    await setDoc(reviewDocRef, {
      tripId,
      driverId,
      riderId,
      riderName,
      rating,
      comment: comment || null,
      tags: tags || [],
      createdAt: serverTimestamp(),
    });

    // Update the trip with the rating
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      driverRating: rating,
      driverReviewId: reviewDocRef.id,
      ratedAt: serverTimestamp(),
    });

    // Update driver stats
    await updateDriverRatingStats(driverId);

    console.log('✅ Driver rating submitted successfully');
  } catch (error) {
    console.error('❌ Error submitting driver rating:', error);
    throw new Error('Failed to submit rating');
  }
}

/**
 * Update driver's rating statistics after a new review
 */
async function updateDriverRatingStats(driverId: string): Promise<void> {
  try {
    // Get all reviews for this driver
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('driverId', '==', driverId));
    const reviewsSnapshot = await getDocs(q);

    const reviews = reviewsSnapshot.docs;
    const totalReviews = reviews.length;

    if (totalReviews === 0) return;

    // Calculate distribution
    const distribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviews.forEach((docSnap) => {
      const rating = docSnap.data().rating;
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof RatingDistribution]++;
        totalRating += rating;
      }
    });

    const averageRating = totalRating / totalReviews;

    // Update driver document
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, {
      rating: Number(averageRating.toFixed(2)),
      totalRatings: totalReviews,
      ratingDistribution: distribution,
      lastRatedAt: serverTimestamp(),
    });

    console.log('✅ Driver rating stats updated:', { averageRating, totalReviews });
  } catch (error) {
    console.error('❌ Error updating driver rating stats:', error);
  }
}

/**
 * Get driver's rating statistics
 */
export async function getDriverRatingStats(driverId: string): Promise<DriverRatingStats> {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    const driverDoc = await getDoc(driverRef);
    const data = driverDoc.data();

    return {
      average: data?.rating || 5.0,
      total: data?.totalRatings || 0,
      distribution: data?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  } catch (error) {
    console.error('❌ Error getting driver rating stats:', error);
    return {
      average: 5.0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
}

/**
 * Get reviews for a driver with optional filtering
 */
export async function getDriverReviews(
  driverId: string,
  filterRating?: number,
  maxResults: number = 50
): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const constraints: any[] = [
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    ];

    if (filterRating) {
      constraints.push(where('rating', '==', filterRating));
    }

    const q = query(reviewsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        tripId: data.tripId,
        driverId: data.driverId,
        riderId: data.riderId,
        riderName: data.riderName,
        riderPhoto: data.riderPhoto,
        rating: data.rating,
        comment: data.comment,
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('❌ Error getting driver reviews:', error);
    return [];
  }
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: string): Promise<Review | null> {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!documentExists(reviewDoc)) {
      return null;
    }

    const data = reviewDoc.data();
    return {
      id: reviewDoc.id,
      tripId: data?.tripId || '',
      driverId: data?.driverId || '',
      riderId: data?.riderId || '',
      riderName: data?.riderName || '',
      riderPhoto: data?.riderPhoto,
      rating: data?.rating || 0,
      comment: data?.comment,
      tags: data?.tags || [],
      createdAt: data?.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('❌ Error getting review:', error);
    return null;
  }
}

/**
 * Get driver's performance statistics
 */
export async function getDriverPerformanceStats(
  driverId: string,
  period: 'today' | 'week' | 'month' | 'all' = 'week'
): Promise<PerformanceStats> {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get all trips in the period
    const tripsRef = collection(db, 'trips');
    const tripsQ = query(
      tripsRef,
      where('driverId', '==', driverId),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    );
    const tripsSnapshot = await getDocs(tripsQ);

    const trips = tripsSnapshot.docs.map(doc => doc.data());

    // Calculate metrics
    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const canceledTrips = trips.filter(t => t.status === 'cancelled').length;

    // Get driver stats from driver document
    const driverDocRef = doc(db, 'drivers', driverId);
    const driverDoc = await getDoc(driverDocRef);
    const driverData = driverDoc.data();

    const acceptedTrips = completedTrips + canceledTrips;
    const totalRequests = driverData?.totalRequests || acceptedTrips;

    // Calculate total earnings
    const totalEarnings = trips
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.fare || 0), 0);

    // Calculate online hours (from driver sessions)
    let onlineHours = 0;
    try {
      const sessionsRef = collection(db, 'driverSessions');
      const sessionsQ = query(
        sessionsRef,
        where('driverId', '==', driverId),
        where('startTime', '>=', Timestamp.fromDate(startDate))
      );
      const sessionsSnapshot = await getDocs(sessionsQ);

      onlineHours = sessionsSnapshot.docs.reduce((total, doc) => {
        const session = doc.data();
        if (session.endTime) {
          const hours = (session.endTime.toDate().getTime() - session.startTime.toDate().getTime()) / (1000 * 60 * 60);
          return total + hours;
        }
        return total;
      }, 0);
    } catch (error) {
      console.warn('Could not calculate online hours:', error);
    }

    // Get weekly data (last 7 days)
    const weeklyData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayTrips = trips.filter(t => {
        const tripDate = t.createdAt?.toDate();
        return tripDate >= dayStart && tripDate < dayEnd && t.status === 'completed';
      });

      const dayEarnings = dayTrips.reduce((sum, t) => sum + (t.fare || 0), 0);

      weeklyData.push({
        day: daysOfWeek[date.getDay()],
        trips: dayTrips.length,
        earnings: dayEarnings,
      });
    }

    // Calculate top routes
    const routeCounts: { [key: string]: { from: string; to: string; count: number } } = {};
    trips
      .filter(t => t.status === 'completed' && t.pickup?.address && t.destination?.address)
      .forEach(t => {
        const routeKey = `${t.pickup.address}-${t.destination.address}`;
        if (routeCounts[routeKey]) {
          routeCounts[routeKey].count++;
        } else {
          routeCounts[routeKey] = {
            from: t.pickup.address,
            to: t.destination.address,
            count: 1,
          };
        }
      });

    const topRoutes = Object.values(routeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Calculate peak hours (simplified - could be more sophisticated)
    const peakHours = ['6-9 AM', '5-8 PM']; // Default peak hours

    return {
      acceptanceRate: totalRequests > 0 ? Math.round((acceptedTrips / totalRequests) * 100) : 0,
      completionRate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0,
      cancelRate: totalTrips > 0 ? Math.round((canceledTrips / totalTrips) * 100) : 0,
      averageRating: driverData?.rating || 5.0,
      totalTrips: completedTrips,
      totalEarnings,
      onlineHours: Math.round(onlineHours * 10) / 10,
      peakHours,
      topRoutes,
      weeklyData,
    };
  } catch (error) {
    console.error('❌ Error getting performance stats:', error);
    // Return empty stats on error
    return {
      acceptanceRate: 0,
      completionRate: 0,
      cancelRate: 0,
      averageRating: 5.0,
      totalTrips: 0,
      totalEarnings: 0,
      onlineHours: 0,
      peakHours: [],
      topRoutes: [],
      weeklyData: [],
    };
  }
}
