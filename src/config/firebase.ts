// Firebase v22+ Modular API Configuration
import { getApp } from '@react-native-firebase/app';
import auth, { getAuth } from '@react-native-firebase/auth';
import firestore, { getFirestore } from '@react-native-firebase/firestore';

// Initialize Firebase (automatically done via google-services.json)
// Just export the modular instances

// Get the default Firebase app instance
export const firebaseApp = getApp();

// Export modular auth and firestore
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);

// Export default instances for convenience
export { auth, firestore };