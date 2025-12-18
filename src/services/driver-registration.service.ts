/**
 * Driver Registration Service
 * Handles complete driver registration flow with Firebase
 * Production-ready implementation
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
  deleteDoc,
  arrayUnion,
  serverTimestamp,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { getCurrentUser } from './firebase-auth-service';
import type { DriverRegistration, Document as DriverDocument } from '../stores/driver-store';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');
const storageRef = storage();

/**
 * Helper to check if document exists
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

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
    vin?: string;
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

    // Upload documents if they're local URIs, or use existing Firebase URLs
    const documentUrls: any = {};

    // License
    if (registrationData.documents.license) {
      const licenseFront = registrationData.documents.license.front;
      const licenseBack = registrationData.documents.license.back;

      if (licenseFront?.startsWith('file://')) {
        documentUrls.licenseFront = await uploadDocument(
          userId, 'license', licenseFront, 'front'
        );
      } else if (licenseFront) {
        // Already a Firebase URL
        documentUrls.licenseFront = licenseFront;
      }

      if (licenseBack?.startsWith('file://')) {
        documentUrls.licenseBack = await uploadDocument(
          userId, 'license', licenseBack, 'back'
        );
      } else if (licenseBack) {
        // Already a Firebase URL
        documentUrls.licenseBack = licenseBack;
      }
    }

    // Insurance
    const insuranceImage = registrationData.documents.insurance?.image;
    if (insuranceImage?.startsWith('file://')) {
      documentUrls.insurance = await uploadDocument(
        userId, 'insurance', insuranceImage
      );
    } else if (insuranceImage) {
      // Already a Firebase URL
      documentUrls.insurance = insuranceImage;
    }

    // Registration
    const registrationImage = registrationData.documents.registration?.image;
    if (registrationImage?.startsWith('file://')) {
      documentUrls.registration = await uploadDocument(
        userId, 'registration', registrationImage
      );
    } else if (registrationImage) {
      // Already a Firebase URL
      documentUrls.registration = registrationImage;
    }

    // Inspection (optional)
    const inspectionImage = registrationData.documents.inspection?.image;
    if (inspectionImage?.startsWith('file://')) {
      documentUrls.inspection = await uploadDocument(
        userId, 'inspection', inspectionImage
      );
    } else if (inspectionImage) {
      // Already a Firebase URL
      documentUrls.inspection = inspectionImage;
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
    const driverRef = doc(db, 'drivers', userId);
    await setDoc(driverRef, driverProfile);

    // Also save document URLs to a separate collection for admin review
    const documentsRef = doc(db, 'drivers', userId, 'documents', 'urls');
    await setDoc(documentsRef, {
      license: {
        front: documentUrls.licenseFront,
        back: documentUrls.licenseBack,
      },
      insurance: documentUrls.insurance,
      registration: documentUrls.registration,
      inspection: documentUrls.inspection,
      uploadedAt: new Date(),
    });

    // NOW add the DRIVER role to the user's roles array
    // This only happens after they successfully submit their complete application
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      roles: arrayUnion('DRIVER'),
      updatedAt: serverTimestamp(),
    });

    // Clear the registration progress since registration is complete
    const progressRef = doc(db, 'driverRegistrationProgress', userId);
    await deleteDoc(progressRef);

    console.log('✅ Driver registration submitted successfully');
    console.log('✅ DRIVER role added to user');
    console.log('🗑️ Registration progress cleared');
  } catch (error: any) {
    console.error('❌ Error submitting driver registration:', error);
    throw new Error(`Failed to submit registration: ${error.message}`);
  }
}

/**
 * Recursively remove undefined values from an object
 * Firestore doesn't accept undefined values
 */
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)).filter(item => item !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Save driver registration progress to Firebase
 * This allows users to continue where they left off, even on a different device
 */
export async function saveRegistrationProgress(
  userId: string,
  currentStep: number,
  registrationData: Partial<DriverRegistration>
): Promise<void> {
  try {
    console.log('💾 Saving registration progress at step:', currentStep, 'for user:', userId);

    // Clean the registration data to remove any undefined values
    const cleanedData = removeUndefinedValues(registrationData);

    console.log('📦 Cleaned data to save:', {
      hasPersonalInfo: !!cleanedData?.personalInfo,
      hasVehicle: !!cleanedData?.vehicle,
      vehiclePhotos: cleanedData?.vehicle?.photos ? Object.keys(cleanedData.vehicle.photos) : [],
      hasDocuments: !!cleanedData?.documents,
      documentKeys: cleanedData?.documents ? Object.keys(cleanedData.documents) : [],
    });

    const progressRef = doc(db, 'driverRegistrationProgress', userId);
    await setDoc(
      progressRef,
      {
        userId,
        currentStep,
        registrationData: cleanedData || {},
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('✅ Registration progress saved successfully to Firebase');
  } catch (error: any) {
    console.error('❌ Error saving registration progress:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    // Don't throw - this is non-critical, but log the full error
  }
}

/**
 * Load driver registration progress from Firebase
 */
export async function loadRegistrationProgress(
  userId: string
): Promise<{ currentStep: number; registrationData: Partial<DriverRegistration> } | null> {
  try {
    console.log('📖 Loading registration progress for:', userId);

    const progressRef = doc(db, 'driverRegistrationProgress', userId);
    const progressDoc = await getDoc(progressRef);

    if (!documentExists(progressDoc)) {
      console.log('📝 No registration progress found');
      return null;
    }

    const data = progressDoc.data();
    console.log('✅ Registration progress loaded at step:', data?.currentStep);

    return {
      currentStep: data?.currentStep || 1,
      registrationData: data?.registrationData || {},
    };
  } catch (error) {
    console.error('❌ Error loading registration progress:', error);
    return null;
  }
}

/**
 * Clear driver registration progress after successful submission
 */
export async function clearRegistrationProgress(userId: string): Promise<void> {
  try {
    const progressRef = doc(db, 'driverRegistrationProgress', userId);
    await deleteDoc(progressRef);
    console.log('🗑️ Registration progress cleared');
  } catch (error) {
    console.error('❌ Error clearing registration progress:', error);
  }
}

/**
 * Get driver registration status
 */
export async function getDriverRegistrationStatus(
  userId: string
): Promise<DriverProfile | null> {
  try {
    const driverRef = doc(db, 'drivers', userId);
    const driverDoc = await getDoc(driverRef);

    if (!documentExists(driverDoc)) {
      return null;
    }

    const data = driverDoc.data() as any;

    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      submittedAt: data.submittedAt?.toDate(),
      reviewedAt: data.reviewedAt?.toDate(),
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

    const driverRef = doc(db, 'drivers', userId);
    await updateDoc(driverRef, updates);

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

    const driverRef = doc(db, 'drivers', userId);
    await updateDoc(driverRef, updates);

    console.log(`✅ Document ${documentType} ${status} for user:`, userId);
  } catch (error) {
    console.error('❌ Error updating document status:', error);
    throw error;
  }
}

/**
 * Upload a document immediately during registration
 * This stores the file in Firebase Storage right away so it persists across app restarts
 * Returns the Firebase Storage URL that can be stored in registrationProgress
 */
export async function uploadDocumentImmediately(
  userId: string,
  documentType: 'license' | 'insurance' | 'registration' | 'inspection',
  imageUri: string,
  side?: 'front' | 'back'
): Promise<string> {
  // If it's already a Firebase URL, return as-is
  if (isFirebaseStorageUrl(imageUri)) {
    console.log(`📎 ${documentType} already uploaded, using existing URL`);
    return imageUri;
  }

  // Only upload if it's a local file
  if (!imageUri.startsWith('file://')) {
    console.warn('⚠️ Unexpected image URI format:', imageUri.substring(0, 50));
    return imageUri;
  }

  console.log(`📤 Uploading ${documentType} immediately...`);
  return await uploadDocument(userId, documentType, imageUri, side);
}

/**
 * Upload a vehicle photo immediately during registration
 * This stores the file in Firebase Storage right away so it persists across app restarts
 * Returns the Firebase Storage URL that can be stored in registrationProgress
 */
export async function uploadVehiclePhotoImmediately(
  userId: string,
  photoType: 'front' | 'back' | 'leftSide' | 'rightSide' | 'interior',
  imageUri: string
): Promise<string> {
  // If it's already a Firebase URL, return as-is
  if (isFirebaseStorageUrl(imageUri)) {
    console.log(`📎 Vehicle ${photoType} photo already uploaded, using existing URL`);
    return imageUri;
  }

  // Only upload if it's a local file
  if (!imageUri.startsWith('file://')) {
    console.warn('⚠️ Unexpected image URI format:', imageUri.substring(0, 50));
    return imageUri;
  }

  console.log(`📤 Uploading vehicle ${photoType} photo immediately...`);
  return await uploadVehiclePhoto(userId, photoType, imageUri);
}

/**
 * Check if a URI is a Firebase Storage URL (already uploaded)
 */
export function isFirebaseStorageUrl(uri: string | undefined | null): boolean {
  if (!uri) return false;
  return uri.startsWith('https://firebasestorage.googleapis.com') ||
         uri.startsWith('https://storage.googleapis.com') ||
         uri.startsWith('gs://');
}

export default {
  uploadDocument,
  uploadVehiclePhoto,
  uploadDocumentImmediately,
  uploadVehiclePhotoImmediately,
  isFirebaseStorageUrl,
  submitDriverRegistration,
  saveRegistrationProgress,
  loadRegistrationProgress,
  clearRegistrationProgress,
  getDriverRegistrationStatus,
  updateDriverRegistrationStatus,
  updateDocumentStatus,
};
