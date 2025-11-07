// ============================================================================
// Google Sign-In Service - React Native Firebase Version (Updated)
// ============================================================================
// Works with @react-native-firebase/auth (NOT web Firebase SDK)
// Compatible with Expo SDK 52
// Returns User type that matches auth store
// ============================================================================

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

// ============================================================================
// Configuration
// ============================================================================

// Configure Google Sign-In
GoogleSignin.configure({
  // Web Client ID from Firebase Console (works for all platforms)
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
  
  // iOS Client ID (optional, can use webClientId)
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  
  // Request these permissions
  scopes: ['email', 'profile'],
  
  // Offline access for refresh tokens
  offlineAccess: true,
});

// ============================================================================
// Types - Matches your auth store
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
    // Step 1: Check if device supports Google Play Services (Android only)
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Step 2: Sign in with Google
    const response = await GoogleSignin.signIn();

    // Check if sign-in was successful
    if (response.type === 'cancelled') {
      return {
        success: false,
        error: 'Sign-in cancelled',
      };
    }

    // Step 3: Get the ID token from the response data
    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Step 4: Create Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Step 5: Sign in to Firebase with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);
    const firebaseUser = userCredential.user;

    // Step 6: Create or update user profile in Firestore
    const userRef = firestore().collection('users').doc(firebaseUser.uid);
    const userDoc = await userRef.get();

    let userData: User;

    if (!userDoc.exists) {
      // New user - create profile
      if (!firebaseUser.email) {
        throw new Error('No email address associated with Google account');
      }

      userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL,
        roles: ['RIDER'],
        hasAcceptedTerms: true, // Auto-accept for Google Sign-In
        rating: 5.0,
        emailVerified: firebaseUser.emailVerified,
        verified: true,
        createdAt: new Date(),
      };

      await userRef.set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Existing user - update profile and get roles
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

      await userRef.update({
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      user: userData,
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);

    // Handle specific error cases
    if (error.code === '12501') { // Sign-in cancelled (Android)
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
    // Sign out from Google
    await GoogleSignin.signOut();
    
    // Sign out from Firebase
    await auth().signOut();
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
    throw error;
  }
};

// ============================================================================
// Get Current User Function
// ============================================================================

export const getCurrentGoogleUser = async () => {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser;
  } catch (error) {
    console.error('Get Current User Error:', error);
    return null;
  }
};

// ============================================================================
// Check Sign-In Status
// ============================================================================

export const isSignedInWithGoogle = (): boolean => {
  try {
    return GoogleSignin.hasPreviousSignIn();
  } catch (error) {
    console.error('Check Sign-In Status Error:', error);
    return false;
  }
};

// ============================================================================
// Revoke Access Function (for testing)
// ============================================================================

export const revokeGoogleAccess = async (): Promise<void> => {
  try {
    await GoogleSignin.revokeAccess();
    await auth().signOut();
  } catch (error) {
    console.error('Revoke Access Error:', error);
    throw error;
  }
};