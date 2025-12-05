/**
 * Google Sign-In Service - React Native Firebase v22 Modular API
 * 
 * CORRECT v22 MODULAR API USAGE:
 * ✅ Call auth() and firestore() directly
 * ✅ Import functions like signInWithCredential, signOut
 * ✅ Pass auth/firestore instance as first parameter
 * ❌ Do NOT use getAuth() or getFirestore()
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, {
  signInWithCredential,
  signOut,
  GoogleAuthProvider
} from '@react-native-firebase/auth';
import firestore, {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

// ============================================================================
// Get Firebase instances - v22 modular way
// ============================================================================

const authInstance = auth();
const firestoreInstance = firestore();

// ============================================================================
// Configuration
// ============================================================================

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  scopes: ['email', 'profile'],
  offlineAccess: true,
});

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
    // Sign out from Google
    await GoogleSignin.signOut();
    
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
    await GoogleSignin.revokeAccess();
    await signOut(authInstance);
  } catch (error) {
    console.error('❌ Revoke Access Error:', error);
    throw error;
  }
};