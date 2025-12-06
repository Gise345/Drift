/**
 * DRIVER SERVICE
 * Firebase integration for driver operations
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
  setDoc,
  updateDoc,
  serverTimestamp,
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@react-native-firebase/storage';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');
const storage = getStorage(app);

export interface RegistrationStatus {
  overall: 'incomplete' | 'pending' | 'approved' | 'rejected';
  documents: {
    driversLicense?: {
      status: 'not_started' | 'pending' | 'approved' | 'rejected';
      url?: string;
      uploadedAt?: Date;
      reviewedAt?: Date;
      rejectionReason?: string;
    };
    insurance?: {
      status: 'not_started' | 'pending' | 'approved' | 'rejected';
      url?: string;
      uploadedAt?: Date;
      reviewedAt?: Date;
      rejectionReason?: string;
    };
    registration?: {
      status: 'not_started' | 'pending' | 'approved' | 'rejected';
      url?: string;
      uploadedAt?: Date;
      reviewedAt?: Date;
      rejectionReason?: string;
    };
    inspection?: {
      status: 'not_started' | 'pending' | 'approved' | 'rejected';
      url?: string;
      uploadedAt?: Date;
      reviewedAt?: Date;
      rejectionReason?: string;
    };
    backgroundCheck?: {
      status: 'not_started' | 'pending' | 'approved' | 'rejected';
      uploadedAt?: Date;
      reviewedAt?: Date;
      rejectionReason?: string;
    };
  };
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

/**
 * Helper to check if document exists
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

export const DriverService = {
  /**
   * Get driver registration status from Firebase
   */
  async getRegistrationStatus(driverId: string): Promise<RegistrationStatus | null> {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      const driverDoc = await getDoc(driverRef);

      if (!documentExists(driverDoc)) {
        // No driver profile exists yet
        return {
          overall: 'incomplete',
          documents: {
            driversLicense: { status: 'not_started' },
            insurance: { status: 'not_started' },
            registration: { status: 'not_started' },
            inspection: { status: 'not_started' },
            backgroundCheck: { status: 'not_started' },
          },
        };
      }

      const driverData = driverDoc.data();

      // Convert driver profile to registration status format
      const registrationStatus: RegistrationStatus = {
        overall: driverData?.registrationStatus || 'incomplete',
        documents: {
          driversLicense: {
            status: driverData?.documents?.driversLicense?.status || 'not_started',
            uploadedAt: driverData?.documents?.driversLicense?.uploadedAt?.toDate(),
            reviewedAt: driverData?.documents?.driversLicense?.verifiedAt?.toDate(),
            rejectionReason: driverData?.documents?.driversLicense?.rejectionReason,
          },
          insurance: {
            status: driverData?.documents?.insurance?.status || 'not_started',
            uploadedAt: driverData?.documents?.insurance?.uploadedAt?.toDate(),
            reviewedAt: driverData?.documents?.insurance?.verifiedAt?.toDate(),
            rejectionReason: driverData?.documents?.insurance?.rejectionReason,
          },
          registration: {
            status: driverData?.documents?.registration?.status || 'not_started',
            uploadedAt: driverData?.documents?.registration?.uploadedAt?.toDate(),
            reviewedAt: driverData?.documents?.registration?.verifiedAt?.toDate(),
            rejectionReason: driverData?.documents?.registration?.rejectionReason,
          },
          inspection: driverData?.documents?.inspection ? {
            status: driverData?.documents?.inspection?.status || 'not_started',
            uploadedAt: driverData?.documents?.inspection?.uploadedAt?.toDate(),
            reviewedAt: driverData?.documents?.inspection?.verifiedAt?.toDate(),
            rejectionReason: driverData?.documents?.inspection?.rejectionReason,
          } : { status: 'not_started' },
          backgroundCheck: {
            status: driverData?.backgroundCheck?.status || 'not_started',
            uploadedAt: driverData?.backgroundCheck?.consentedAt?.toDate(),
            reviewedAt: driverData?.backgroundCheck?.completedAt?.toDate(),
          },
        },
        submittedAt: driverData?.submittedAt?.toDate(),
        approvedAt: driverData?.reviewedAt?.toDate(),
        rejectionReason: driverData?.rejectionReason,
      };

      return registrationStatus;
    } catch (error) {
      console.error('❌ Error getting registration status:', error);
      return null;
    }
  },

  /**
   * Upload document to Firebase Storage
   */
  async uploadDocument(
    driverId: string,
    documentType: string,
    uri: string
  ): Promise<string> {
    try {
      const filename = `${driverId}/${documentType}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      // For React Native, we need to use putFile which requires a different approach
      // Note: This may need adjustment based on actual storage API usage
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);

      // Get download URL
      const url = await getDownloadURL(storageRef);

      // Update Firestore
      const docRef = doc(db, 'drivers', driverId, 'documents', documentType);
      await setDoc(docRef, {
        url,
        uploadedAt: serverTimestamp(),
        status: 'pending',
      });

      return url;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  /**
   * Update registration status
   */
  async updateRegistrationStatus(
    driverId: string,
    status: Partial<RegistrationStatus>
  ): Promise<void> {
    try {
      const statusRef = doc(db, 'drivers', driverId, 'registration', 'status');
      await updateDoc(statusRef, {
        ...status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating registration status:', error);
      throw error;
    }
  },
};