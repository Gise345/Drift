/**
 * Drift Firebase Authentication Service - React Native Firebase
 *
 * Production-ready authentication with:
 * - Email/Password registration and login
 * - Google Sign-In
 * - Email verification
 * - Password reset
 * - User profile management
 *
 * Uses @react-native-firebase for proper native mobile support
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// User roles type
export type UserRole = 'RIDER' | 'DRIVER' | 'ADMIN';

// User data interface
export interface DriftUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  roles: UserRole[];
  hasAcceptedTerms: boolean;
  emailVerified: boolean;
  rating: number;
  totalTrips: number;
  createdAt: Date;
  lastLoginAt: Date;
  stripeCustomerId?: string;
  stripeAccountId?: string; // For drivers
}

// Registration data interface
export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

// Authentication error messages
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

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: any): string {
  const code = error?.code || '';
  return AUTH_ERROR_MESSAGES[code] || error?.message || 'An error occurred. Please try again.';
}

/**
 * Register new user with email and password
 */
export async function registerWithEmail(data: RegistrationData): Promise<{ user: DriftUser; needsVerification: boolean }> {
  try {
    // Create Firebase Auth user
    const userCredential = await auth().createUserWithEmailAndPassword(
      data.email,
      data.password
    );

    // Update profile with display name
    await userCredential.user.updateProfile({
      displayName: data.fullName,
    });

    // Send email verification
    await userCredential.user.sendEmailVerification();

    // Create Firestore user document
    const userData: DriftUser = {
      id: userCredential.user.uid,
      email: data.email,
      name: data.fullName,
      phone: data.phone || '',
      photoURL: userCredential.user.photoURL || '',
      roles: [data.role],
      hasAcceptedTerms: true,
      emailVerified: false,
      rating: 5.0,
      totalTrips: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    await firestore().collection('users').doc(userCredential.user.uid).set({
      ...userData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      lastLoginAt: firestore.FieldValue.serverTimestamp(),
    });

    return {
      user: userData,
      needsVerification: true,
    };
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<DriftUser> {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);

    // Update last login timestamp
    await firestore().collection('users').doc(userCredential.user.uid).update({
      lastLoginAt: firestore.FieldValue.serverTimestamp(),
    });

    // Get user data from Firestore
    const userData = await getUserData(userCredential.user.uid);

    if (!userData) {
      throw new Error('User data not found. Please contact support.');
    }

    return userData;
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Configure Google Sign-In
 */
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    offlineAccess: true,
  });
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(role: UserRole = 'RIDER'): Promise<DriftUser> {
  try {
    // Configure Google Sign-In if not already configured
    configureGoogleSignIn();

    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Get the users ID token
    const response = await GoogleSignin.signIn();

    // Handle cancellation
    if (response.type === 'cancelled') {
      throw new Error('Sign-in cancelled');
    }

    const idToken = response.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);

    // Check if user already exists
    const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();

    if (userDoc.exists) {
      // Update last login
      await firestore().collection('users').doc(userCredential.user.uid).update({
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      });

      const data = userDoc.data();
      return {
        ...data,
        id: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified,
      } as DriftUser;
    } else {
      // Create new user document
      const userData: DriftUser = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || 'Drift User',
        phone: '',
        photoURL: userCredential.user.photoURL || '',
        roles: [role],
        hasAcceptedTerms: true,
        emailVerified: userCredential.user.emailVerified,
        rating: 5.0,
        totalTrips: 0,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      await firestore().collection('users').doc(userCredential.user.uid).set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      });

      return userData;
    }
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get user data from Firestore
 */
export async function getUserData(userId: string): Promise<DriftUser | null> {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
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
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await auth().sendPasswordResetEmail(email);
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Resend email verification
 */
export async function resendEmailVerification(): Promise<void> {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('No user is currently signed in.');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified.');
    }

    await user.sendEmailVerification();
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Check if email is verified
 */
export async function checkEmailVerification(): Promise<boolean> {
  try {
    const user = auth().currentUser;
    if (!user) {
      return false;
    }

    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  try {
    await auth().signOut();
    await GoogleSignin.signOut();
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<DriftUser>): Promise<void> {
  try {
    await firestore().collection('users').doc(userId).update(updates);
  } catch (error: any) {
    throw new Error('Failed to update profile. Please try again.');
  }
}

/**
 * Get current Firebase auth user
 */
export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
  return auth().onAuthStateChanged(callback);
}
