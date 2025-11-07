// Firebase Configuration - React Native Firebase
// Using @react-native-firebase packages with NEW modular API (v22+)
// Auto-initialized via google-services.json (Android) and GoogleService-Info.plist (iOS)

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage, { FirebaseStorageTypes } from '@react-native-firebase/storage';

// Firebase is automatically initialized by React Native Firebase
// No need to explicitly call getApp() - it's done automatically

// Auth instance
export const firebaseAuth = auth();

// Firestore instance
export const db = firestore();
export const firebaseDb = db; // Alias for consistency

// Storage instance
export const firebaseStorage = storage();

// Helper to get current user
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

// Helper to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return auth().currentUser !== null;
};

// Export types for TypeScript
export type User = FirebaseAuthTypes.User;
export type Firestore = FirebaseFirestoreTypes.Module;
export type DocumentReference = FirebaseFirestoreTypes.DocumentReference;
export type CollectionReference = FirebaseFirestoreTypes.CollectionReference;
export type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot;
export type QuerySnapshot = FirebaseFirestoreTypes.QuerySnapshot;

// Export default instances
export { auth, firestore, storage };

export default {
  auth: firebaseAuth,
  db,
  storage: firebaseStorage,
};