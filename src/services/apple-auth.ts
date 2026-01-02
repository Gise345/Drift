/**
 * Apple Sign-In Service for Drift
 *
 * Implements Sign in with Apple authentication using expo-apple-authentication
 * and integrates with Firebase Auth for user management.
 *
 * REQUIRED for App Store submission when offering third-party sign-in (Google)
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  signInWithCredential,
  OAuthProvider,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

// Types
export type UserRole = 'RIDER' | 'DRIVER' | 'ADMIN';

export interface AppleAuthUser {
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
}

export interface AppleAuthResult {
  success: boolean;
  user?: AppleAuthUser;
  error?: string;
  isNewUser?: boolean;
}

// Get Firebase instances
const app = getApp();
const authInstance = getAuth(app);
const firestoreInstance = getFirestore(app, 'main');

/**
 * Helper to check if document exists
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

/**
 * Check if Sign in with Apple is available on this device
 * Only available on iOS 13+ and some Apple Silicon Macs
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  // Only available on iOS
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error('Error checking Apple auth availability:', error);
    return false;
  }
}

/**
 * Generate a random nonce for Apple Sign-In
 * Required for secure authentication with Firebase
 */
async function generateNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const nonce = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  return { nonce, hashedNonce };
}

/**
 * Sign in with Apple
 *
 * @param role - The role to assign to new users (RIDER or DRIVER)
 * @param gender - Optional gender for safety features
 * @returns AppleAuthResult with user data or error
 */
export async function signInWithApple(
  role: UserRole = 'RIDER',
  gender?: 'male' | 'female'
): Promise<AppleAuthResult> {
  try {
    console.log('Starting Apple Sign-In...');

    // Check availability
    const isAvailable = await isAppleAuthAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Sign in with Apple is not available on this device',
      };
    }

    // Generate nonce for security
    const { nonce, hashedNonce } = await generateNonce();

    // Request Apple Sign-In
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    console.log('Apple Sign-In credential received');

    // Get identity token
    if (!credential.identityToken) {
      return {
        success: false,
        error: 'No identity token received from Apple',
      };
    }

    // Create Firebase OAuth credential
    const provider = new OAuthProvider('apple.com');
    const oauthCredential = provider.credential({
      idToken: credential.identityToken,
      rawNonce: nonce,
    });

    // Sign in to Firebase
    const userCredential = await signInWithCredential(authInstance, oauthCredential);
    const firebaseUser = userCredential.user;

    console.log('Firebase user authenticated:', firebaseUser.uid);

    // Build display name from Apple credential (only provided on first sign-in)
    let displayName = firebaseUser.displayName || '';
    if (credential.fullName) {
      const { givenName, familyName } = credential.fullName;
      if (givenName || familyName) {
        displayName = [givenName, familyName].filter(Boolean).join(' ');
      }
    }

    // Fall back to 'Drift User' if no name available
    if (!displayName) {
      displayName = 'Drift User';
    }

    // Get email (may be hidden/private relay email)
    const email = credential.email || firebaseUser.email || '';

    // Check if user exists in Firestore
    const userRef = doc(firestoreInstance, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    let isNewUser = false;
    let userData: AppleAuthUser;

    if (documentExists(userDoc)) {
      console.log('Existing user found, updating...');

      const data = userDoc.data();

      // Update last login and potentially gender
      const updates: any = {
        lastLoginAt: serverTimestamp(),
      };

      // Only update name if we got a new one and user doesn't have one
      if (displayName && displayName !== 'Drift User' && (!data?.name || data?.name === 'Drift User')) {
        updates.name = displayName;
      }

      // Only update gender if provided and not already set
      if (gender && !data?.gender) {
        updates.gender = gender;
      }

      await updateDoc(userRef, updates);

      userData = {
        ...data,
        id: firebaseUser.uid,
        name: updates.name || data?.name || displayName,
        gender: data?.gender || gender || null,
        emailVerified: true, // Apple emails are always verified
        createdAt: data?.createdAt?.toDate() || new Date(),
        lastLoginAt: new Date(),
      } as AppleAuthUser;
    } else {
      console.log('New user, creating document...');
      isNewUser = true;

      // Create new user document
      await setDoc(userRef, {
        userId: firebaseUser.uid,
        email: email,
        name: displayName,
        phone: '',
        photoURL: firebaseUser.photoURL || '',
        roles: [role],
        gender: gender || null,
        hasAcceptedTerms: true,
        emailVerified: true, // Apple emails are always verified
        rating: 5.0,
        totalTrips: 0,
        authProvider: 'apple',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      console.log('User document created successfully');

      userData = {
        id: firebaseUser.uid,
        email: email,
        name: displayName,
        phone: '',
        photoURL: firebaseUser.photoURL || '',
        roles: [role],
        gender: gender || null,
        hasAcceptedTerms: true,
        emailVerified: true,
        rating: 5.0,
        totalTrips: 0,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
    }

    console.log('Apple Sign-In successful');

    return {
      success: true,
      user: userData,
      isNewUser,
    };
  } catch (error: any) {
    console.error('Apple Sign-In error:', error);

    // Handle specific error codes
    if (error.code === 'ERR_CANCELED' || error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'cancelled',
      };
    }

    if (error.code === 'ERR_INVALID_OPERATION') {
      return {
        success: false,
        error: 'Sign in with Apple is not configured properly',
      };
    }

    return {
      success: false,
      error: error.message || 'An error occurred during Apple Sign-In',
    };
  }
}

/**
 * Get the credential state for a user
 * Can be used to check if the user's Apple ID is still valid
 */
export async function getAppleCredentialState(userId: string): Promise<AppleAuthentication.AppleAuthenticationCredentialState | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    return await AppleAuthentication.getCredentialStateAsync(userId);
  } catch (error) {
    console.error('Error getting Apple credential state:', error);
    return null;
  }
}
