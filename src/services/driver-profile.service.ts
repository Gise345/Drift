/**
 * Driver Profile Service
 * Loads and manages driver profile data from Firebase
 * PRODUCTION READY - No mock data
 */

import firestore from '@react-native-firebase/firestore';
import type { Driver, Vehicle, Document as DriverDocument } from '../stores/driver-store';

const db = firestore();

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

    const driverDoc = await db.collection('drivers').doc(userId).get();

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
      address: {
        street: data?.address?.street || '',
        city: data?.address?.city || '',
        postalCode: data?.address?.postalCode || '',
        country: data?.address?.country || 'Cayman Islands',
      },
      rating: data?.rating || 5.0,
      totalTrips: data?.totalTrips || 0,
      status: data?.registrationStatus === 'approved' ? 'approved' : data?.registrationStatus || 'pending',
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
 */
export async function loadDriverEarnings(userId: string) {
  try {
    const earningsDoc = await db
      .collection('drivers')
      .doc(userId)
      .collection('earnings')
      .doc('summary')
      .get();

    if (!earningsDoc.exists) {
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

    return earningsDoc.data();
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
 */
export async function loadDriverStats(userId: string) {
  try {
    const statsDoc = await db
      .collection('drivers')
      .doc(userId)
      .collection('stats')
      .doc('summary')
      .get();

    if (!statsDoc.exists) {
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

    return statsDoc.data();
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
 */
export async function loadDriverTripHistory(userId: string, limit: number = 50) {
  try {
    const tripsSnapshot = await db
      .collection('trips')
      .where('driverId', '==', userId)
      .where('status', 'in', ['COMPLETED', 'CANCELLED'])
      .orderBy('completedAt', 'desc')
      .limit(limit)
      .get();

    const trips = tripsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestedAt: data.requestedAt?.toDate(),
        acceptedAt: data.acceptedAt?.toDate(),
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        cancelledAt: data.cancelledAt?.toDate(),
      };
    });

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
