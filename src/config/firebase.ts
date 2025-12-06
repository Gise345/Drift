/**
 * Firebase Configuration - React Native Firebase v22+ Modular API
 *
 * UPGRADED TO v23.5.0
 * Using modular API with named database 'main' (restored from backup)
 */

import { getApp } from '@react-native-firebase/app';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getFirestore, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';
import { getFunctions } from '@react-native-firebase/functions';

// ============================================================================
// Firebase Instances - v22+ Modular API with 'main' database
// ============================================================================

// Get the default Firebase app
const app = getApp();

// Auth instance
export const firebaseAuth = getAuth(app);

// Firestore instance - using 'main' database (restored from backup)
export const firebaseDb = getFirestore(app, 'main');
export const db = firebaseDb; // Alias for consistency

// Functions instance - using us-east1 region
export const firebaseFunctions = getFunctions(app, 'us-east1');

// Storage instance
export const firebaseStorage = getStorage(app);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return firebaseAuth.currentUser;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return firebaseAuth.currentUser !== null;
};

// ============================================================================
// TypeScript Types
// ============================================================================

export type User = FirebaseAuthTypes.User;
export type Firestore = FirebaseFirestoreTypes.Module;
export type DocumentReference = FirebaseFirestoreTypes.DocumentReference;
export type CollectionReference = FirebaseFirestoreTypes.CollectionReference;
export type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot;
export type QuerySnapshot = FirebaseFirestoreTypes.QuerySnapshot;

// ============================================================================
// Default Export
// ============================================================================

export default {
  auth: firebaseAuth,
  db: firebaseDb,
  storage: firebaseStorage,
  functions: firebaseFunctions,
};
