/**
 * Drift Firebase Authentication Service - React Native Firebase v22+ Modular API
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  sendEmailVerification,
  signOut,
  updateProfile,
  reload,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  FirebaseAuthTypes
} from '@react-native-firebase/auth';

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
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

import { GoogleSignin } from '@react-native-google-signin/google-signin';

// ============================================================================
// Get Firebase instances - v22+ modular API with 'main' database
// ============================================================================

const app = getApp();
const authInstance = getAuth(app);
const firestoreInstance = getFirestore(app, 'main');

// ============================================================================
// Types
// ============================================================================

export type UserRole = 'RIDER' | 'DRIVER' | 'ADMIN';

export interface DriftUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  roles: UserRole[];
  gender?: 'male' | 'female' | null;
  hasAcceptedTerms: boolean;
  emailVerified: boolean;
  rating: number;
  totalTrips: number;
  createdAt: Date;
  lastLoginAt: Date;
  stripeCustomerId?: string;
  stripeAccountId?: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  gender?: 'male' | 'female';
}

// ============================================================================
// Error Messages
// ============================================================================

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
  'auth/invalid-email': 'Invalid email address format.',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
};

function getErrorMessage(error: any): string {
  const code = error?.code || '';
  return AUTH_ERROR_MESSAGES[code] || error?.message || 'An error occurred. Please try again.';
}

// ============================================================================
// Configure Google Sign-In
// ============================================================================

let googleSignInConfigured = false;

export function configureGoogleSignIn() {
  if (googleSignInConfigured) return;

  try {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    const config: any = {
      scopes: ['email', 'profile'],
    };

    // Only add webClientId and offlineAccess if webClientId exists
    // offlineAccess requires a valid webClientId
    if (webClientId) {
      config.webClientId = webClientId;
      config.offlineAccess = true;
    }

    GoogleSignin.configure(config);
    googleSignInConfigured = true;
    console.log('✅ Google Sign-In configured (firebase-auth-service)');
  } catch (error) {
    console.error('❌ Failed to configure Google Sign-In:', error);
  }
}

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Register new user with email and password
 */
export async function registerWithEmail(
  data: RegistrationData
): Promise<{ user: DriftUser; needsVerification: boolean }> {
  try {
    console.log('🚀 Starting email registration...');

    // Step 1: Create Firebase Auth user using modular API
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      data.email,
      data.password
    );

    const firebaseUser = userCredential.user;
    console.log('✅ Firebase user created:', firebaseUser.uid);

    // Step 2: Update profile with display name
    await updateProfile(firebaseUser, {
      displayName: data.fullName,
    });
    console.log('✅ Profile updated with display name');

    // Step 3: Send email verification
    await sendEmailVerification(firebaseUser);
    console.log('✅ Verification email sent');

    // Step 4: Create Firestore user document using modular API
    const userRef = doc(firestoreInstance, 'users', firebaseUser.uid);

    // Prepare the document data
    const userDocData = {
      userId: firebaseUser.uid,  // CRITICAL: Required by Firestore security rules
      email: data.email,
      name: data.fullName,
      phone: data.phone || '',
      photoURL: firebaseUser.photoURL || '',
      roles: [data.role],
      gender: data.gender || null, // Gender for women-only ride feature
      hasAcceptedTerms: true,
      emailVerified: false,
      rating: 5.0,
      totalTrips: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    console.log('📝 Creating user document with data:', JSON.stringify({
      ...userDocData,
      gender: data.gender, // Log the exact gender value being saved
    }, null, 2));

    await setDoc(userRef, userDocData);

    console.log('✅ Firestore user document created successfully');

    const userData: DriftUser = {
      id: firebaseUser.uid,
      email: data.email,
      name: data.fullName,
      phone: data.phone || '',
      photoURL: firebaseUser.photoURL || '',
      roles: [data.role],
      gender: data.gender || null, // Include gender in returned user data
      hasAcceptedTerms: true,
      emailVerified: false,
      rating: 5.0,
      totalTrips: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    return {
      user: userData,
      needsVerification: true,
    };
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<DriftUser> {
  try {
    console.log('🚀 Starting email sign in...');

    const userCredential = await signInWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    console.log('✅ Firebase sign in successful:', firebaseUser.uid);

    // Update last login timestamp
    const userRef = doc(firestoreInstance, 'users', firebaseUser.uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });

    // Get user data from Firestore
    const userData = await getUserData(firebaseUser.uid);

    if (!userData) {
      throw new Error('User data not found. Please contact support.');
    }

    console.log('✅ User data fetched successfully');
    return userData;
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(role: UserRole = 'RIDER', gender?: 'male' | 'female'): Promise<DriftUser> {
  try {
    console.log('🚀 Starting Google sign in...');

    // Configure Google Sign-In if not already configured
    configureGoogleSignIn();

    // Check if device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Get the users ID token
    const response = await GoogleSignin.signIn();
    console.log('✅ Google Sign-In response received');

    // Handle cancellation
    if (response.type === 'cancelled') {
      throw new Error('Sign-in cancelled');
    }

    const idToken = response.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    console.log('✅ Got ID token, creating credential...');

    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential using modular API
    const userCredential = await signInWithCredential(authInstance, googleCredential);
    const firebaseUser = userCredential.user;

    console.log('✅ Firebase user authenticated:', firebaseUser.uid);

    // Check if user already exists
    const userRef = doc(firestoreInstance, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    // Use helper that handles both boolean and function versions
    if (documentExists(userDoc)) {
      console.log('✅ Existing user found, updating...');

      // Update last login (and gender if provided and not already set)
      const data = userDoc.data();
      const updates: any = {
        lastLoginAt: serverTimestamp(),
      };

      // Only update gender if it's provided and user doesn't have one set
      if (gender && !data?.gender) {
        updates.gender = gender;
      }

      await updateDoc(userRef, updates);

      return {
        ...data,
        id: firebaseUser.uid,
        gender: data?.gender || gender || null, // Use existing gender or new one
        emailVerified: firebaseUser.emailVerified,
        createdAt: data?.createdAt?.toDate() || new Date(),
        lastLoginAt: data?.lastLoginAt?.toDate() || new Date(),
      } as DriftUser;
    } else {
      console.log('✅ New user, creating document...');

      // Create new user document
      await setDoc(userRef, {
        userId: firebaseUser.uid,  // CRITICAL: Required by Firestore rules
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Drift User',
        phone: '',
        photoURL: firebaseUser.photoURL || '',
        roles: [role],
        gender: gender || null, // Gender for women-only ride feature
        hasAcceptedTerms: true,
        emailVerified: firebaseUser.emailVerified,
        rating: 5.0,
        totalTrips: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      console.log('✅ User document created successfully');

      const userData: DriftUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Drift User',
        phone: '',
        photoURL: firebaseUser.photoURL || '',
        roles: [role],
        gender: gender || null,
        hasAcceptedTerms: true,
        emailVerified: firebaseUser.emailVerified,
        rating: 5.0,
        totalTrips: 0,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      return userData;
    }
  } catch (error: any) {
    console.error('❌ Google sign in error:', error);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get user data from Firestore
 */
export async function getUserData(userId: string): Promise<DriftUser | null> {
  try {
    console.log('📖 Fetching user data for:', userId);

    const userRef = doc(firestoreInstance, 'users', userId);
    const userDoc = await getDoc(userRef);

    // Use helper that handles both boolean and function versions
    if (!documentExists(userDoc)) {
      console.warn('⚠️ User document not found');
      return null;
    }

    const data = userDoc.data();
    return {
      ...data,
      id: userId,
      createdAt: data?.createdAt?.toDate() || new Date(),
      lastLoginAt: data?.lastLoginAt?.toDate() || new Date(),
    } as DriftUser;
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    return null;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await firebaseSendPasswordReset(authInstance, email);
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Resend email verification
 */
export async function resendEmailVerification(): Promise<void> {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in.');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified.');
    }

    await sendEmailVerification(user);
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Check if email is verified
 */
export async function checkEmailVerification(): Promise<boolean> {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      return false;
    }

    // Reload the user to get fresh data from Firebase servers
    await reload(user);

    // IMPORTANT: Get the fresh user reference AFTER reload
    // The reload() updates the cached user data, but we need to
    // re-fetch the currentUser to get the updated emailVerified status
    const refreshedUser = authInstance.currentUser;

    if (!refreshedUser) {
      return false;
    }

    console.log('📧 Email verification status after reload:', refreshedUser.emailVerified);
    return refreshedUser.emailVerified;
  } catch (error) {
    console.error('❌ Error checking email verification:', error);
    return false;
  }
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  try {
    // Sign out from Firebase Auth first
    await signOut(authInstance);

    // Only sign out from Google if there was a previous Google sign-in
    // This prevents errors when user signed in with email only
    try {
      // Must configure before calling any GoogleSignin methods
      configureGoogleSignIn();
      const isSignedInWithGoogle = GoogleSignin.hasPreviousSignIn();
      if (isSignedInWithGoogle) {
        await GoogleSignin.signOut();
        console.log('✅ Signed out from Google');
      }
    } catch (googleError) {
      // Ignore Google sign-out errors - user may not have signed in with Google
      console.log('ℹ️ Google sign-out skipped (not signed in with Google)');
    }
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<DriftUser>): Promise<void> {
  try {
    const userRef = doc(firestoreInstance, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error: any) {
    throw new Error('Failed to update profile. Please try again.');
  }
}

/**
 * Get current Firebase auth user
 */
export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return authInstance.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
  return firebaseOnAuthStateChanged(authInstance, callback);
}

/**
 * Soft delete user account
 * - Marks user as deleted in Firestore (preserves data for legal/compliance)
 * - Deletes Firebase Auth account
 * - Admin can still see this user's data
 */
export async function softDeleteAccount(reason?: string): Promise<void> {
  try {
    const user = authInstance.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in.');
    }

    console.log('🗑️ Starting soft delete for user:', user.uid);

    // Step 1: Mark user as deleted in Firestore (preserves all data)
    const userRef = doc(firestoreInstance, 'users', user.uid);
    await updateDoc(userRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletionReason: reason || 'User requested account deletion',
      deletedByUserId: user.uid, // Self-deletion
    });
    console.log('✅ User marked as deleted in Firestore');

    // Step 2: Also mark driver record as deleted if exists
    const driverRef = doc(firestoreInstance, 'drivers', user.uid);
    const driverDoc = await getDoc(driverRef);
    if (documentExists(driverDoc)) {
      await updateDoc(driverRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletionReason: reason || 'User requested account deletion',
      });
      console.log('✅ Driver record marked as deleted');
    }

    // Step 3: Sign out from Google if applicable
    try {
      configureGoogleSignIn();
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch (e) {
      // Ignore Google sign out errors
    }

    // Step 4: Delete Firebase Auth account (this prevents re-login)
    await user.delete();
    console.log('✅ Firebase Auth account deleted');

  } catch (error: any) {
    console.error('❌ Soft delete error:', error);

    // If the error is requires-recent-login, inform the user
    if (error?.code === 'auth/requires-recent-login') {
      throw new Error('For security, please sign out and sign back in, then try again.');
    }

    throw new Error(error?.message || 'Failed to delete account. Please try again.');
  }
}
