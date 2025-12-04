/**
 * Drift Firebase Authentication Service - React Native Firebase v22 Modular API
 *
 * CORRECT v22 MODULAR API USAGE:
 * ✅ Import functions directly from module
 * ✅ Pass auth instance as first parameter
 * ✅ Use serverTimestamp from Firestore
 * ❌ Do NOT use getAuth(), getFirestore(), getApp()
 * ❌ Do NOT chain methods like auth().signInWithEmailAndPassword()
 */

import auth, {
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

import firestore, {
  collection,
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
// Get Firebase instances - v22 modular way
// ============================================================================

const authInstance = auth();
const firestoreInstance = firestore();

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

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    offlineAccess: true,
  });
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
    
    await setDoc(userRef, {
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
    });

    console.log('✅ Firestore user document created successfully');

    const userData: DriftUser = {
      id: firebaseUser.uid,
      email: data.email,
      name: data.fullName,
      phone: data.phone || '',
      photoURL: firebaseUser.photoURL || '',
      roles: [data.role],
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
export async function signInWithGoogle(role: UserRole = 'RIDER'): Promise<DriftUser> {
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
      
      // Update last login
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      });

      const data = userDoc.data();
      return {
        ...data,
        id: firebaseUser.uid,
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

    await reload(user);
    return user.emailVerified;
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
    await signOut(authInstance);
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