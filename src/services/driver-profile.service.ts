/**
 * Driver Profile Service
 * Loads and manages driver profile data from Firebase
 * PRODUCTION READY - No mock data
 */

import firestore from '@react-native-firebase/firestore';
import type { Driver, Vehicle, Document as DriverDocument } from '../stores/driver-store';

const db = firestore();

/**
 * Determine driver approval status from Firebase data
 * Handles multiple possible field names and values for backwards compatibility
 *
 * NOTE: When admin approves a driver:
 * - registrationStatus is set to 'approved'
 * - status is set to 'active' (operational status)
 *
 * This function returns the REGISTRATION status (pending/approved/rejected/suspended)
 * which is used for determining if driver can go online.
 */
function determineDriverStatus(data: any): 'pending' | 'approved' | 'rejected' | 'suspended' {
  // Check various field names that might indicate approval status
  const registrationStatus = data?.registrationStatus;
  const status = data?.status; // Operational status: active, inactive, suspended
  const isApproved = data?.isApproved;
  const approved = data?.approved;

  console.log('🔍 Checking driver status fields:', {
    registrationStatus,
    status,
    isApproved,
    approved,
  });

  // Check if any field indicates approved status
  // NOTE: status === 'active' means driver was approved and is operational
  if (
    registrationStatus === 'approved' ||
    status === 'approved' ||
    status === 'active' || // 'active' operational status means they were approved
    isApproved === true ||
    approved === true
  ) {
    console.log('✅ Driver is APPROVED');
    return 'approved';
  }

  // Check for rejected status
  if (
    registrationStatus === 'rejected' ||
    status === 'rejected'
  ) {
    console.log('❌ Driver is REJECTED');
    return 'rejected';
  }

  // Check for suspended status
  if (
    registrationStatus === 'suspended' ||
    status === 'suspended'
  ) {
    console.log('⚠️ Driver is SUSPENDED');
    return 'suspended';
  }

  // Default to 'pending' if registrationStatus is pending or not set
  console.log('⏳ Driver is PENDING');
  return 'pending';
}

/**
 * Load complete driver profile from Firebase
 */
export async function loadDriverProfile(userId: string): Promise<{
  driver: Driver | null;
  vehicle: Vehicle | null;
  documents: DriverDocument[];
}> {
  try {
    console.log('📥 Loading driver profile for:', userId);
    console.log('📥 Firestore instance:', !!db);

    const driverDoc = await db.collection('drivers').doc(userId).get();
    console.log('📥 Driver doc exists:', driverDoc.exists);

    if (!driverDoc.exists) {
      console.log('⚠️ No driver profile found for:', userId);
      return { driver: null, vehicle: null, documents: [] };
    }

    const data = driverDoc.data();

    // Map driver data
    const driver: Driver = {
      id: userId,
      email: data?.email || '',
      phone: data?.phone || '',
      firstName: data?.firstName || '',
      lastName: data?.lastName || '',
      photoUrl: data?.profilePhotoUrl,
      dateOfBirth: data?.dateOfBirth || '',
      gender: data?.gender || 'male',
      address: {
        street: data?.address?.street || '',
        city: data?.address?.city || '',
        postalCode: data?.address?.postalCode || '',
        country: data?.address?.country || 'Cayman Islands',
      },
      rating: data?.rating || 5.0,
      totalTrips: data?.totalTrips || 0,
      status: determineDriverStatus(data),
      createdAt: data?.createdAt?.toDate() || new Date(),
    };

    // Map vehicle data
    const vehicle: Vehicle | null = data?.vehicle ? {
      make: data.vehicle.make,
      model: data.vehicle.model,
      year: data.vehicle.year,
      color: data.vehicle.color,
      licensePlate: data.vehicle.licensePlate,
      vin: data.vehicle.vin || '',
      seats: data.vehicle.seats,
      photos: {
        front: data.vehicle.photos?.front,
        back: data.vehicle.photos?.back,
        leftSide: data.vehicle.photos?.leftSide,
        rightSide: data.vehicle.photos?.rightSide,
        interior: data.vehicle.photos?.interior,
      },
    } : null;

    // Map documents data
    const documents: DriverDocument[] = [];

    if (data?.documents?.driversLicense) {
      const docsSnapshot = await db
        .collection('drivers')
        .doc(userId)
        .collection('documents')
        .doc('urls')
        .get();

      const docUrls = docsSnapshot.data();

      // Driver's License
      documents.push({
        id: 'license',
        type: 'license',
        status: data.documents.driversLicense.status || 'pending',
        frontImageUrl: docUrls?.license?.front,
        backImageUrl: docUrls?.license?.back,
        uploadedAt: data.documents.driversLicense.uploadedAt?.toDate() || new Date(),
        verifiedAt: data.documents.driversLicense.verifiedAt?.toDate(),
        rejectionReason: data.documents.driversLicense.rejectionReason,
      });

      // Insurance
      if (data.documents.insurance) {
        documents.push({
          id: 'insurance',
          type: 'insurance',
          status: data.documents.insurance.status || 'pending',
          frontImageUrl: docUrls?.insurance,
          expiryDate: data.documents.insurance.expiryDate,
          uploadedAt: data.documents.insurance.uploadedAt?.toDate() || new Date(),
          verifiedAt: data.documents.insurance.verifiedAt?.toDate(),
          rejectionReason: data.documents.insurance.rejectionReason,
        });
      }

      // Registration
      if (data.documents.registration) {
        documents.push({
          id: 'registration',
          type: 'registration',
          status: data.documents.registration.status || 'pending',
          frontImageUrl: docUrls?.registration,
          uploadedAt: data.documents.registration.uploadedAt?.toDate() || new Date(),
          verifiedAt: data.documents.registration.verifiedAt?.toDate(),
          rejectionReason: data.documents.registration.rejectionReason,
        });
      }

      // Inspection (optional)
      if (data.documents.inspection) {
        documents.push({
          id: 'inspection',
          type: 'inspection',
          status: data.documents.inspection.status || 'pending',
          frontImageUrl: docUrls?.inspection,
          uploadedAt: data.documents.inspection.uploadedAt?.toDate() || new Date(),
          verifiedAt: data.documents.inspection.verifiedAt?.toDate(),
          rejectionReason: data.documents.inspection.rejectionReason,
        });
      }
    }

    console.log('✅ Driver profile loaded successfully');
    return { driver, vehicle, documents };
  } catch (error) {
    console.error('❌ Error loading driver profile:', error);
    throw error;
  }
}

/**
 * Load driver earnings from Firebase
 * First tries to load from summary doc, then calculates from trips if not available
 */
export async function loadDriverEarnings(userId: string) {
  try {
    // First, try to get the summary document
    const earningsDoc = await db
      .collection('drivers')
      .doc(userId)
      .collection('earnings')
      .doc('summary')
      .get();

    if (earningsDoc.exists) {
      const data = earningsDoc.data();
      console.log('📊 Loaded earnings from summary:', data);
      return data;
    }

    // If no summary exists, calculate from completed trips
    console.log('📊 No earnings summary, calculating from trips...');

    // Get date boundaries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Query all completed trips for this driver
    const tripsSnapshot = await db
      .collection('trips')
      .where('driverId', '==', userId)
      .where('status', '==', 'COMPLETED')
      .get();

    let today = 0;
    let yesterday = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    let allTime = 0;

    tripsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const completedAt = data.completedAt?.toDate?.() || data.completedAt;
      const tripEarnings = (data.finalCost || data.estimatedCost || 0) + (data.tip || 0);

      if (!completedAt) return;

      const completedDate = new Date(completedAt);
      allTime += tripEarnings;

      if (completedDate >= startOfToday) {
        today += tripEarnings;
      } else if (completedDate >= startOfYesterday && completedDate < startOfToday) {
        yesterday += tripEarnings;
      }

      if (completedDate >= startOfWeek) {
        thisWeek += tripEarnings;
      }

      if (completedDate >= startOfMonth) {
        thisMonth += tripEarnings;
      }
    });

    const earnings = {
      today,
      yesterday,
      thisWeek,
      lastWeek: 0, // Would need additional query for last week
      thisMonth,
      lastMonth: 0, // Would need additional query for last month
      allTime,
    };

    console.log('📊 Calculated earnings from trips:', earnings);
    return earnings;
  } catch (error) {
    console.error('❌ Error loading driver earnings:', error);
    return {
      today: 0,
      yesterday: 0,
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      allTime: 0,
    };
  }
}

/**
 * Load driver stats from Firebase
 * First tries to load from summary doc, then calculates from driver doc and trips
 */
export async function loadDriverStats(userId: string) {
  try {
    // First, try to get the summary document
    const statsDoc = await db
      .collection('drivers')
      .doc(userId)
      .collection('stats')
      .doc('summary')
      .get();

    if (statsDoc.exists) {
      const data = statsDoc.data();
      console.log('📈 Loaded stats from summary:', data);
      return data;
    }

    // If no summary exists, calculate from driver doc and trips
    console.log('📈 No stats summary, calculating from driver doc and trips...');

    // Get driver document for rating and totalTrips
    const driverDoc = await db.collection('drivers').doc(userId).get();
    const driverData = driverDoc.data();

    // Count completed and cancelled trips
    const completedTripsSnapshot = await db
      .collection('trips')
      .where('driverId', '==', userId)
      .where('status', '==', 'COMPLETED')
      .get();

    const cancelledTripsSnapshot = await db
      .collection('trips')
      .where('driverId', '==', userId)
      .where('status', '==', 'CANCELLED')
      .get();

    const totalTrips = completedTripsSnapshot.size;
    const cancelledTrips = cancelledTripsSnapshot.size;
    const allTrips = totalTrips + cancelledTrips;

    // Calculate total distance from completed trips
    let totalDistance = 0;
    completedTripsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalDistance += data.distance || data.actualDistance || 0;
    });

    const stats = {
      totalTrips,
      acceptanceRate: allTrips > 0 ? Math.round((totalTrips / allTrips) * 100) : 100,
      cancellationRate: allTrips > 0 ? Math.round((cancelledTrips / allTrips) * 100) : 0,
      rating: driverData?.rating || 5.0,
      totalRatings: driverData?.totalRatings || 0,
      onlineHours: driverData?.onlineHours || 0,
      totalDistance: totalDistance / 1000, // Convert to km
    };

    console.log('📈 Calculated stats from trips:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error loading driver stats:', error);
    return {
      totalTrips: 0,
      acceptanceRate: 0,
      cancellationRate: 0,
      rating: 5.0,
      totalRatings: 0,
      onlineHours: 0,
      totalDistance: 0,
    };
  }
}

/**
 * Load driver's trip history from Firebase
 * Also fetches rider names from users collection if not stored in trip
 */
export async function loadDriverTripHistory(userId: string, limitCount: number = 50) {
  try {
    const tripsSnapshot = await db
      .collection('trips')
      .where('driverId', '==', userId)
      .where('status', 'in', ['COMPLETED', 'CANCELLED'])
      .orderBy('completedAt', 'desc')
      .limit(limitCount)
      .get();

    // Collect unique rider IDs that need name lookup
    const riderIdsToFetch = new Set<string>();
    const tripsData: any[] = [];

    tripsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      tripsData.push({ id: doc.id, ...data });

      // Check if we need to fetch rider info
      if (data.riderId && !data.riderName && !data.riderInfo?.name) {
        riderIdsToFetch.add(data.riderId);
      }
    });

    // Fetch rider names in batch
    const riderNames: Map<string, { name: string; rating: number; photo?: string }> = new Map();
    if (riderIdsToFetch.size > 0) {
      console.log('📋 Fetching rider names for', riderIdsToFetch.size, 'riders');

      // Fetch in batches of 10 (Firestore in-query limit)
      const riderIds = Array.from(riderIdsToFetch);
      for (let i = 0; i < riderIds.length; i += 10) {
        const batch = riderIds.slice(i, i + 10);
        const usersSnapshot = await db
          .collection('users')
          .where('__name__', 'in', batch)
          .get();

        usersSnapshot.docs.forEach((userDoc) => {
          const userData = userDoc.data();
          riderNames.set(userDoc.id, {
            name: userData.name || userData.firstName || 'Rider',
            rating: userData.rating || 5.0,
            photo: userData.profilePhotoUrl || userData.photoUrl,
          });
        });
      }
    }

    // Map trips with rider info
    const trips = tripsData.map((data) => {
      // Get rider info from trip data or from fetched users
      let riderInfo = data.riderInfo;
      if (!riderInfo?.name && data.riderId && riderNames.has(data.riderId)) {
        const fetchedRider = riderNames.get(data.riderId)!;
        riderInfo = {
          name: fetchedRider.name,
          rating: fetchedRider.rating,
          photoUrl: fetchedRider.photo,
        };
      }

      // Also check for riderName field directly
      if (!riderInfo?.name && data.riderName) {
        riderInfo = {
          ...riderInfo,
          name: data.riderName,
        };
      }

      return {
        id: data.id,
        ...data,
        riderInfo: riderInfo || { name: 'Rider', rating: 5.0 },
        requestedAt: data.requestedAt?.toDate?.() || data.requestedAt,
        acceptedAt: data.acceptedAt?.toDate?.() || data.acceptedAt,
        startedAt: data.startedAt?.toDate?.() || data.startedAt,
        completedAt: data.completedAt?.toDate?.() || data.completedAt,
        cancelledAt: data.cancelledAt?.toDate?.() || data.cancelledAt,
      };
    });

    console.log('📋 Loaded', trips.length, 'trips with rider info');
    return trips;
  } catch (error) {
    console.error('❌ Error loading trip history:', error);
    return [];
  }
}

/**
 * Update driver location in Firebase
 */
export async function updateDriverLocation(
  userId: string,
  location: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  }
) {
  try {
    await db.collection('drivers').doc(userId).update({
      'currentLocation.lat': location.lat,
      'currentLocation.lng': location.lng,
      'currentLocation.heading': location.heading || 0,
      'currentLocation.speed': location.speed || 0,
      'currentLocation.updatedAt': firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('❌ Error updating driver location:', error);
  }
}

/**
 * Update driver online status
 */
export async function updateDriverOnlineStatus(userId: string, isOnline: boolean) {
  try {
    await db.collection('drivers').doc(userId).update({
      isOnline,
      lastOnlineAt: isOnline ? firestore.FieldValue.serverTimestamp() : firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    console.log(`🟢 Driver is now ${isOnline ? 'online' : 'offline'}`);
  } catch (error) {
    console.error('❌ Error updating online status:', error);
  }
}

export default {
  loadDriverProfile,
  loadDriverEarnings,
  loadDriverStats,
  loadDriverTripHistory,
  updateDriverLocation,
  updateDriverOnlineStatus,
};
