/**
 * DRIVER SERVICE
 * Firebase integration for driver operations
 * 
 * EXPO SDK 52 Compatible
 */

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

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

export const DriverService = {
  /**
   * Get driver registration status
   */
  async getRegistrationStatus(driverId: string): Promise<RegistrationStatus | null> {
    try {
      const doc = await firestore()
        .collection('drivers')
        .doc(driverId)
        .collection('registration')
        .doc('status')
        .get();
      
      if (doc.exists) {
        return doc.data() as RegistrationStatus;
      }
      
      // Return mock data if no status exists yet
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
    } catch (error) {
      console.error('Error getting registration status:', error);
      // Return mock data on error
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
      const reference = storage().ref(filename);
      
      // Upload file
      await reference.putFile(uri);
      
      // Get download URL
      const url = await reference.getDownloadURL();
      
      // Update Firestore
      await firestore()
        .collection('drivers')
        .doc(driverId)
        .collection('documents')
        .doc(documentType)
        .set({
          url,
          uploadedAt: firestore.FieldValue.serverTimestamp(),
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
      await firestore()
        .collection('drivers')
        .doc(driverId)
        .collection('registration')
        .doc('status')
        .update({
          ...status,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('Error updating registration status:', error);
      throw error;
    }
  },
};