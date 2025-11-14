/**
 * Driver Registration Service
 * Handles complete driver registration flow with Firebase
 * Production-ready implementation
 */

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { getCurrentUser } from './firebase-auth-service';
import type { DriverRegistration, Document as DriverDocument } from '../stores/driver-store';

const db = firestore();
const storageRef = storage();

export interface DriverProfile {
  // Personal Info
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  profilePhotoUrl?: string;

  // Vehicle Info
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    seats: number;
    photos: {
      front?: string;
      back?: string;
      leftSide?: string;
      rightSide?: string;
      interior?: string;
    };
  };

  // Bank Details (encrypted in production)
  bankDetails: {
    accountHolderName: string;
    accountNumber: string; // Should be encrypted
    routingNumber: string; // Should be encrypted
    bankName: string;
    accountType: 'checking' | 'savings';
  };

  // Background Check
  backgroundCheck: {
    consented: boolean;
    consentedAt: Date;
    status: 'pending' | 'in_progress' | 'cleared' | 'failed';
    completedAt?: Date;
    provider?: string;
    reportId?: string;
  };

  // Documents Status
  documents: {
    driversLicense: {
      status: 'pending' | 'approved' | 'rejected';
      uploadedAt: Date;
      verifiedAt?: Date;
      expiryDate?: string;
      rejectionReason?: string;
    };
    insurance: {
      status: 'pending' | 'approved' | 'rejected';
      uploadedAt: Date;
      verifiedAt?: Date;
      expiryDate?: string;
      rejectionReason?: string;
    };
    registration: {
      status: 'pending' | 'approved' | 'rejected';
      uploadedAt: Date;
      verifiedAt?: Date;
      expiryDate?: string;
      rejectionReason?: string;
    };
    inspection?: {
      status: 'pending' | 'approved' | 'rejected';
      uploadedAt: Date;
      verifiedAt?: Date;
      expiryDate?: string;
      rejectionReason?: string;
    };
  };

  // Registration Status
  registrationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;

  // Driver Stats
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  status: 'active' | 'inactive' | 'suspended';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Upload document image to Firebase Storage
 */
export async function uploadDocument(
  userId: string,
  documentType: 'license' | 'insurance' | 'registration' | 'inspection',
  imageUri: string,
  side?: 'front' | 'back'
): Promise<string> {
  try {
    const filename = side
      ? `${documentType}_${side}_${Date.now()}.jpg`
      : `${documentType}_${Date.now()}.jpg`;

    const path = `drivers/${userId}/documents/${filename}`;
    const reference = storageRef.ref(path);

    console.log(`📤 Uploading ${documentType} to:`, path);

    // Upload file
    await reference.putFile(imageUri);

    // Get download URL
    const downloadURL = await reference.getDownloadURL();

    console.log(`✅ ${documentType} uploaded successfully`);
    return downloadURL;
  } catch (error) {
    console.error(`❌ Error uploading ${documentType}:`, error);
    throw new Error(`Failed to upload ${documentType}`);
  }
}

/**
 * Upload vehicle photo to Firebase Storage
 */
export async function uploadVehiclePhoto(
  userId: string,
  photoType: 'front' | 'back' | 'leftSide' | 'rightSide' | 'interior',
  imageUri: string
): Promise<string> {
  try {
    const filename = `vehicle_${photoType}_${Date.now()}.jpg`;
    const path = `drivers/${userId}/vehicle/${filename}`;
    const reference = storageRef.ref(path);

    console.log(`📤 Uploading vehicle photo (${photoType}) to:`, path);

    await reference.putFile(imageUri);
    const downloadURL = await reference.getDownloadURL();

    console.log(`✅ Vehicle photo (${photoType}) uploaded successfully`);
    return downloadURL;
  } catch (error) {
    console.error(`❌ Error uploading vehicle photo (${photoType}):`, error);
    throw new Error(`Failed to upload vehicle photo`);
  }
}

/**
 * Submit complete driver registration to Firebase
 */
export async function submitDriverRegistration(
  registrationData: DriverRegistration
): Promise<void> {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    const userId = currentUser.uid;

    console.log('📝 Submitting driver registration for:', userId);

    // Upload vehicle photos if they're local URIs
    const vehiclePhotos: any = {};
    if (registrationData.vehicle.photos) {
      const photoTypes: Array<'front' | 'back' | 'leftSide' | 'rightSide' | 'interior'> =
        ['front', 'back', 'leftSide', 'rightSide', 'interior'];

      for (const type of photoTypes) {
        const photoUri = registrationData.vehicle.photos[type];
        if (photoUri && photoUri.startsWith('file://')) {
          vehiclePhotos[type] = await uploadVehiclePhoto(userId, type, photoUri);
        } else if (photoUri) {
          vehiclePhotos[type] = photoUri;
        }
      }
    }

    // Upload documents if they're local URIs
    const documentUrls: any = {};

    // License
    if (registrationData.documents.license) {
      if (registrationData.documents.license.front?.startsWith('file://')) {
        documentUrls.licenseFront = await uploadDocument(
          userId, 'license', registrationData.documents.license.front, 'front'
        );
      }
      if (registrationData.documents.license.back?.startsWith('file://')) {
        documentUrls.licenseBack = await uploadDocument(
          userId, 'license', registrationData.documents.license.back, 'back'
        );
      }
    }

    // Insurance
    if (registrationData.documents.insurance?.image?.startsWith('file://')) {
      documentUrls.insurance = await uploadDocument(
        userId, 'insurance', registrationData.documents.insurance.image
      );
    }

    // Registration
    if (registrationData.documents.registration?.image?.startsWith('file://')) {
      documentUrls.registration = await uploadDocument(
        userId, 'registration', registrationData.documents.registration.image
      );
    }

    // Inspection (optional)
    if (registrationData.documents.inspection?.image?.startsWith('file://')) {
      documentUrls.inspection = await uploadDocument(
        userId, 'inspection', registrationData.documents.inspection.image
      );
    }

    // Create driver profile document
    const driverProfile: DriverProfile = {
      userId,
      firstName: registrationData.personalInfo.firstName,
      lastName: registrationData.personalInfo.lastName,
      email: registrationData.personalInfo.email,
      phone: registrationData.personalInfo.phone,
      dateOfBirth: registrationData.personalInfo.dateOfBirth,
      address: registrationData.personalInfo.address,

      vehicle: {
        make: registrationData.vehicle.make,
        model: registrationData.vehicle.model,
        year: registrationData.vehicle.year,
        color: registrationData.vehicle.color,
        licensePlate: registrationData.vehicle.licensePlate,
        vin: registrationData.vehicle.vin,
        seats: registrationData.vehicle.seats,
        photos: vehiclePhotos,
      },

      bankDetails: {
        accountHolderName: registrationData.bankDetails.accountHolderName,
        accountNumber: registrationData.bankDetails.accountNumber,
        routingNumber: registrationData.bankDetails.routingNumber,
        bankName: registrationData.bankDetails.bankName,
        accountType: 'checking', // Default to checking
      },

      backgroundCheck: {
        consented: registrationData.backgroundCheck.consented,
        consentedAt: registrationData.backgroundCheck.consentedAt || new Date(),
        status: 'pending',
      },

      documents: {
        driversLicense: {
          status: 'pending',
          uploadedAt: new Date(),
        },
        insurance: {
          status: 'pending',
          uploadedAt: new Date(),
        },
        registration: {
          status: 'pending',
          uploadedAt: new Date(),
        },
        ...(documentUrls.inspection && {
          inspection: {
            status: 'pending',
            uploadedAt: new Date(),
          },
        }),
      },

      registrationStatus: 'pending',
      submittedAt: new Date(),

      rating: 5.0,
      totalTrips: 0,
      totalEarnings: 0,
      status: 'inactive', // Will be 'active' after approval

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    await db.collection('drivers').doc(userId).set(driverProfile);

    // Also save document URLs to a separate collection for admin review
    await db.collection('drivers').doc(userId).collection('documents').doc('urls').set({
      license: {
        front: documentUrls.licenseFront,
        back: documentUrls.licenseBack,
      },
      insurance: documentUrls.insurance,
      registration: documentUrls.registration,
      inspection: documentUrls.inspection,
      uploadedAt: new Date(),
    });

    console.log('✅ Driver registration submitted successfully');
  } catch (error: any) {
    console.error('❌ Error submitting driver registration:', error);
    throw new Error(`Failed to submit registration: ${error.message}`);
  }
}

/**
 * Get driver registration status
 */
export async function getDriverRegistrationStatus(
  userId: string
): Promise<DriverProfile | null> {
  try {
    const driverDoc = await db.collection('drivers').doc(userId).get();

    if (!driverDoc.exists) {
      return null;
    }

    const data = driverDoc.data() as any;

    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      submittedAt: data.submittedAt?.toDate(),
      reviewedAt: data.reviewedAt?.toDate(),
      backgroundCheck: {
        ...data.backgroundCheck,
        consentedAt: data.backgroundCheck?.consentedAt?.toDate(),
        completedAt: data.backgroundCheck?.completedAt?.toDate(),
      },
    } as DriverProfile;
  } catch (error) {
    console.error('❌ Error getting driver registration status:', error);
    return null;
  }
}

/**
 * Update driver registration status (Admin only)
 */
export async function updateDriverRegistrationStatus(
  userId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  rejectionReason?: string
): Promise<void> {
  try {
    const updates: any = {
      registrationStatus: status,
      reviewedAt: new Date(),
      reviewedBy,
      updatedAt: new Date(),
    };

    if (status === 'approved') {
      updates.status = 'active';
    } else if (rejectionReason) {
      updates.rejectionReason = rejectionReason;
    }

    await db.collection('drivers').doc(userId).update(updates);

    console.log(`✅ Driver registration ${status} for user:`, userId);
  } catch (error) {
    console.error('❌ Error updating driver registration status:', error);
    throw error;
  }
}

/**
 * Update document verification status (Admin only)
 */
export async function updateDocumentStatus(
  userId: string,
  documentType: 'driversLicense' | 'insurance' | 'registration' | 'inspection',
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<void> {
  try {
    const updates: any = {
      [`documents.${documentType}.status`]: status,
      [`documents.${documentType}.verifiedAt`]: new Date(),
      updatedAt: new Date(),
    };

    if (rejectionReason) {
      updates[`documents.${documentType}.rejectionReason`] = rejectionReason;
    }

    await db.collection('drivers').doc(userId).update(updates);

    console.log(`✅ Document ${documentType} ${status} for user:`, userId);
  } catch (error) {
    console.error('❌ Error updating document status:', error);
    throw error;
  }
}

export default {
  uploadDocument,
  uploadVehiclePhoto,
  submitDriverRegistration,
  getDriverRegistrationStatus,
  updateDriverRegistrationStatus,
  updateDocumentStatus,
};
