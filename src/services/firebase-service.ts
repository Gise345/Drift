/**
 * Firebase Service - React Native Firebase v22+ Modular API
 *
 * General Firebase operations using the correct modular API
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from '@react-native-firebase/auth';

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';

/**
 * Helper to check if document exists
 * React Native Firebase can return exists as either a boolean or function depending on version
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

// ============================================================================
// Get Firebase instances - v22+ modular API with 'main' database
// ============================================================================

const app = getApp();
const authInstance = getAuth(app);
const firestoreInstance = getFirestore(app, 'main');

// ============================================================================
// Firebase Service
// ============================================================================

export const FirebaseService = {
  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string, userData: any) => {
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    const user = userCredential.user;

    // Create user document in Firestore using modular API
    const userRef = doc(firestoreInstance, 'users', user.uid);
    await setDoc(userRef, {
      ...userData,
      userId: user.uid,  // CRITICAL: Required by Firestore rules
      email,
      roles: ['RIDER'],
      status: 'ACTIVE',
      hasAcceptedTerms: false,
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return user;
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    return userCredential.user;
  },

  /**
   * Sign out
   */
  signOut: async () => {
    await firebaseSignOut(authInstance);
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(authInstance, email);
  },

  /**
   * Get user by ID
   */
  getUser: async (userId: string) => {
    const userRef = doc(firestoreInstance, 'users', userId);
    const userDoc = await getDoc(userRef);
    // Use helper that handles both boolean and function versions
    return documentExists(userDoc) ? { id: userDoc.id, ...userDoc.data() } : null;
  },

  /**
   * Update user
   */
  updateUser: async (userId: string, data: any) => {
    const userRef = doc(firestoreInstance, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Create carpool request
   */
  createCarpoolRequest: async (data: any) => {
    const requestsRef = collection(firestoreInstance, 'carpoolRequests');
    const docRef = await addDoc(requestsRef, {
      ...data,
      status: 'MATCHING',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)) // 30 min
    });
    return docRef.id;
  },

  /**
   * Subscribe to trip updates
   */
  subscribeToTrip: (tripId: string, callback: (data: any) => void) => {
    const tripRef = doc(firestoreInstance, 'trips', tripId);
    const unsubscribe = onSnapshot(tripRef, (docSnapshot) => {
      // Use helper that handles both boolean and function versions
      if (documentExists(docSnapshot)) {
        callback({ id: docSnapshot.id, ...docSnapshot.data() });
      }
    });
    return unsubscribe;
  }
};

export default FirebaseService;