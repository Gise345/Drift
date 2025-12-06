/**
 * Drift Role Management Service
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 *
 * Handles adding/removing driver/rider roles to existing accounts
 * Allows users to have multiple roles and switch between them
 *
 * Location: src/services/role-service.ts
 */

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';
import { getCurrentUser } from './firebase-auth-service';

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

export type UserRole = 'RIDER' | 'DRIVER' | 'ADMIN';

/**
 * Add a role to current user
 * 
 * @param role - The role to add ('RIDER' or 'DRIVER')
 * @throws Error if user not signed in or role already exists
 */
export async function addRoleToUser(role: UserRole): Promise<void> {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    console.log(`📝 Adding ${role} role to user:`, currentUser.uid);

    // Check if user already has this role
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!documentExists(userDoc)) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    const currentRoles = userData?.roles || [];

    if (currentRoles.includes(role)) {
      throw new Error(`You already have a ${role} account`);
    }

    // Add role using arrayUnion (prevents duplicates)
    await updateDoc(userRef, {
      roles: arrayUnion(role),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ ${role} role added successfully`);
  } catch (error: any) {
    console.error('❌ Error adding role:', error);
    throw new Error(`Failed to add ${role} role: ${error.message}`);
  }
}

/**
 * Check if user has a specific role
 * 
 * @param userId - The user ID to check
 * @param role - The role to check for
 * @returns true if user has the role, false otherwise
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!documentExists(userDoc)) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.roles?.includes(role) || false;
  } catch (error) {
    console.error('❌ Error checking role:', error);
    return false;
  }
}

/**
 * Get all roles for a user
 * 
 * @param userId - The user ID
 * @returns Array of roles
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!documentExists(userDoc)) {
      return [];
    }

    const userData = userDoc.data();
    return userData?.roles || [];
  } catch (error) {
    console.error('❌ Error getting roles:', error);
    return [];
  }
}

/**
 * Remove a role from user
 * 
 * @param role - The role to remove
 * @throws Error if user not signed in or trying to remove last role
 */
export async function removeRoleFromUser(role: UserRole): Promise<void> {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!documentExists(userDoc)) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    const currentRoles = userData?.roles || [];

    // Prevent removing last role
    if (currentRoles.length <= 1) {
      throw new Error('Cannot remove your only role');
    }

    if (!currentRoles.includes(role)) {
      throw new Error(`You don't have a ${role} account`);
    }

    // Remove role using arrayRemove
    await updateDoc(userRef, {
      roles: arrayRemove(role),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ ${role} role removed successfully`);
  } catch (error: any) {
    console.error('❌ Error removing role:', error);
    throw new Error(`Failed to remove ${role} role: ${error.message}`);
  }
}

/**
 * Check if user can be a driver
 * 
 * @param userId - The user ID
 * @returns true if user meets driver requirements
 */
export async function canBecomeDriver(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!documentExists(userDoc)) {
      return false;
    }

    const userData = userDoc.data();
    
    // Check requirements
    const hasVerifiedEmail = userData?.emailVerified === true;
    const hasPhone = !!userData?.phone;
    const hasGoodRating = (userData?.rating || 0) >= 4.0;

    return hasVerifiedEmail && hasPhone && hasGoodRating;
  } catch (error) {
    console.error('❌ Error checking driver eligibility:', error);
    return false;
  }
}

/**
 * Update driver-specific information
 * 
 * @param driverInfo - Driver information (license, vehicle, etc.)
 */
export async function updateDriverInfo(driverInfo: {
  licenseNumber: string;
  vehicle: {
    make: string;
    model: string;
    year: string;
    color?: string;
    plate?: string;
  };
}): Promise<void> {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    const userRef = doc(db, 'users', currentUser.uid);
    
    await updateDoc(userRef, {
      driverInfo,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Driver info updated successfully');
  } catch (error: any) {
    console.error('❌ Error updating driver info:', error);
    throw new Error(`Failed to update driver info: ${error.message}`);
  }
}

/**
 * Get driver information
 * 
 * @param userId - The user ID
 * @returns Driver info or null
 */
export async function getDriverInfo(userId: string): Promise<any | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!documentExists(userDoc)) {
      return null;
    }

    const userData = userDoc.data();
    return userData?.driverInfo || null;
  } catch (error) {
    console.error('❌ Error getting driver info:', error);
    return null;
  }
}

export default {
  addRoleToUser,
  hasRole,
  getUserRoles,
  removeRoleFromUser,
  canBecomeDriver,
  updateDriverInfo,
  getDriverInfo,
};