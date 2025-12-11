/**
 * Google Sign-In Service - React Native Firebase v22+ Modular API
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  signInWithCredential,
  signOut,
  GoogleAuthProvider
} from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

// ============================================================================
// Get Firebase instances - v22+ modular API with 'main' database
// ============================================================================

const app = getApp();
const authInstance = getAuth(app);
const firestoreInstance = getFirestore(app, 'main');

// ============================================================================
// Configuration
// ============================================================================

// Track if Google Sign-In has been configured
let isGoogleSignInConfigured = false;

/**
 * Configure Google Sign-In (lazy initialization)
 * Called before any Google Sign-In operation to ensure it's configured
 */
function ensureGoogleSignInConfigured(): void {
  if (isGoogleSignInConfigured) return;

  try {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    // Only enable offlineAccess if webClientId is present (it's required for offline access)
    const config: any = {
      scopes: ['email', 'profile'],
    };

    // Only add webClientId and offlineAccess if webClientId exists
    if (webClientId) {
      config.webClientId = webClientId;
      config.offlineAccess = true;
    }

    // Add iOS client ID if present
    if (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
      config.iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    }

    GoogleSignin.configure(config);
    isGoogleSignInConfigured = true;
    console.log('✅ Google Sign-In configured successfully', { hasWebClientId: !!webClientId });
  } catch (error) {
    console.error('❌ Failed to configure Google Sign-In:', error);
    // Don't throw - let the actual sign-in attempt handle the error
  }
}

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string | null;
  roles: string[];
  hasAcceptedTerms: boolean;
  rating?: number;
  createdAt?: Date;
  verified?: boolean;
  emailVerified?: boolean;
}

export interface GoogleSignInResult {
  success: boolean;
  user?: User;
  error?: string;
}

// ============================================================================
// Google Sign-In Function
// ============================================================================

export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  try {
    console.log('🚀 Starting Google Sign-In...');

    // Ensure Google Sign-In is configured before attempting sign-in
    ensureGoogleSignInConfigured();

    console.log('📋 Web Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
    console.log('📋 iOS Client ID:', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
    console.log('📋 Platform:', Platform.OS);

    // Check if device supports Google Play Services (Android only)
    if (Platform.OS === 'android') {
      console.log('🔍 Checking Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Play Services available');
    }

    // Sign in with Google
    console.log('🔐 Calling GoogleSignin.signIn()...');
    const response = await GoogleSignin.signIn();
    console.log('✅ Google Sign-In response received');
    console.log('📋 Response type:', response.type);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));

    // Check if sign-in was successful
    if (response.type === 'cancelled') {
      return {
        success: false,
        error: 'Sign-in cancelled',
      };
    }

    // Get the ID token from the response data
    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    console.log('✅ Got ID token, creating Firebase credential...');

    // Create Firebase credential
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase with the credential using modular API
    console.log('🔐 Signing in to Firebase...');
    const userCredential = await signInWithCredential(authInstance, googleCredential);
    const firebaseUser = userCredential.user;

    console.log('✅ Firebase user authenticated:', firebaseUser.uid);

    // Create or update user profile in Firestore
    const userRef = doc(firestoreInstance, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    let userData: User;

    if (!userDoc.exists) {
      // New user - create profile
      console.log('✅ Creating new user profile...');

      if (!firebaseUser.email) {
        throw new Error('No email address associated with Google account');
      }

      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL,
        roles: ['RIDER'],
        hasAcceptedTerms: true,
        rating: 5.0,
        emailVerified: firebaseUser.emailVerified,
        verified: true,
        createdAt: new Date(),
      };

      // Create document with userId field to match Firestore rules
      await setDoc(userRef, {
        userId: firebaseUser.uid,  // CRITICAL: Required by Firestore rules
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL,
        roles: ['RIDER'],
        hasAcceptedTerms: true,
        rating: 5.0,
        emailVerified: firebaseUser.emailVerified,
        verified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ User profile created successfully');
    } else {
      // Existing user - update profile and get roles
      console.log('✅ Updating existing user profile...');

      const existingData = userDoc.data();

      if (!firebaseUser.email) {
        throw new Error('No email address associated with Google account');
      }

      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || existingData?.name || 'Google User',
        photoURL: firebaseUser.photoURL || existingData?.photoURL,
        phone: existingData?.phone,
        roles: existingData?.roles || ['RIDER'],
        hasAcceptedTerms: existingData?.hasAcceptedTerms || true,
        rating: existingData?.rating || 5.0,
        emailVerified: firebaseUser.emailVerified,
        verified: existingData?.verified || true,
        createdAt: existingData?.createdAt?.toDate() || new Date(),
      };

      await updateDoc(userRef, {
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ User profile updated successfully');
    }

    return {
      success: true,
      user: userData,
    };
  } catch (error: any) {
    console.error('❌ Google Sign-In Error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Handle specific error cases
    if (error.code === '12501') {
      return {
        success: false,
        error: 'Sign-in cancelled',
      };
    }

    if (error.code === 'SIGN_IN_CANCELLED') {
      return {
        success: false,
        error: 'Sign-in cancelled',
      };
    }

    if (error.code === 'IN_PROGRESS') {
      return {
        success: false,
        error: 'Sign-in already in progress',
      };
    }

    if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return {
        success: false,
        error: 'Google Play Services not available',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign in with Google',
    };
  }
};

// ============================================================================
// Sign Out Function
// ============================================================================

export const signOutGoogle = async (): Promise<void> => {
  try {
    // Ensure configured before sign out
    ensureGoogleSignInConfigured();

    // Only sign out from Google if there was a previous sign-in
    try {
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch (googleError) {
      console.log('ℹ️ Google sign-out skipped');
    }

    // Sign out from Firebase using modular API
    await signOut(authInstance);
  } catch (error) {
    console.error('❌ Google Sign-Out Error:', error);
    throw error;
  }
};

// ============================================================================
// Get Current User Function
// ============================================================================

export const getCurrentGoogleUser = async () => {
  try {
    ensureGoogleSignInConfigured();
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser;
  } catch (error) {
    console.error('❌ Get Current User Error:', error);
    return null;
  }
};

// ============================================================================
// Check Sign-In Status
// ============================================================================

export const isSignedInWithGoogle = (): boolean => {
  try {
    // Ensure configured before checking
    ensureGoogleSignInConfigured();
    return GoogleSignin.hasPreviousSignIn();
  } catch (error) {
    console.error('❌ Check Sign-In Status Error:', error);
    return false;
  }
};

// ============================================================================
// Revoke Access Function (for testing)
// ============================================================================

export const revokeGoogleAccess = async (): Promise<void> => {
  try {
    ensureGoogleSignInConfigured();

    // Only revoke if there was a previous sign-in
    try {
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.revokeAccess();
      }
    } catch (revokeError) {
      console.log('ℹ️ Google revoke skipped');
    }

    await signOut(authInstance);
  } catch (error) {
    console.error('❌ Revoke Access Error:', error);
    throw error;
  }
};
