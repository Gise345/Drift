/**
 * Firebase Configuration - React Native Firebase v21
 *
 * CURRENT VERSION: v21.14.0
 * The deprecation warnings about using getApp() are for v22 migration.
 * Current implementation is CORRECT for v21.
 *
 * When upgrading to v22:
 * - Follow migration guide: https://rnfirebase.io/migrating-to-v22
 * - Update to modular API matching Firebase Web SDK
 *
 * Current setup (v21):
 * - Call auth(), firestore() directly (CORRECT)
 * - Auto-initialized via google-services.json (Android) and GoogleService-Info.plist (iOS)
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage, { FirebaseStorageTypes } from '@react-native-firebase/storage';

// ============================================================================
// Firebase Instances - v22 Modular API
// ============================================================================

// Auth instance - call auth() directly, don't use getAuth()
export const firebaseAuth = auth();

// Firestore instance - call firestore() directly, don't use getFirestore()
export const firebaseDb = firestore();
export const db = firebaseDb; // Alias for consistency

// Storage instance
export const firebaseStorage = storage();

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
};