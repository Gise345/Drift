/**
 * Drift Auth Store - React Native Firebase v22 Modular API
 * 
 * ✅ CORRECT v22 MODULAR API USAGE
 * ✅ No deprecation warnings
 * ✅ Proper auth state management
 */

import { create } from 'zustand';
import auth, { onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { doc, getDoc, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOutUser } from '../services/firebase-auth-service';

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

// Storage key for persisting the last active mode
const LAST_MODE_KEY = '@drift_last_mode';

// ============================================================================
// Get Firebase instances - v22 modular way
// ============================================================================

const authInstance = auth();
const db = firestore();

// ============================================================================
// Types
// ============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  profilePhoto?: string; // Alternative field name used by some screens
  roles: string[];
  hasAcceptedTerms: boolean;
  emailVerified?: boolean;
  rating?: number;
  totalTrips?: number;
  createdAt?: any;
  lastLoginAt?: any;
  stripeCustomerId?: string;
  stripeAccountId?: string;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  currentMode: 'RIDER' | 'DRIVER';
  initialized: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setMode: (mode: 'RIDER' | 'DRIVER') => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => () => void;
}

// ============================================================================
// Auth Store
// ============================================================================

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  currentMode: 'RIDER',
  initialized: false,

  /**
   * Set current user
   */
  setUser: (user) => {
    console.log('📝 Setting user:', user?.id || 'null');
    set({ user });
  },

  /**
   * Set loading state
   */
  setLoading: (loading) => set({ loading }),

  /**
   * Switch between rider and driver mode
   * Persists the mode to AsyncStorage so user returns to the same screen
   */
  setMode: async (mode) => {
    console.log('🔄 Switching mode to:', mode);
    set({ currentMode: mode });

    // Persist mode to AsyncStorage
    try {
      await AsyncStorage.setItem(LAST_MODE_KEY, mode);
      console.log('💾 Saved last mode to storage:', mode);
    } catch (error) {
      console.error('❌ Failed to save mode to storage:', error);
    }
  },

  /**
   * Sign out user
   */
  signOut: async () => {
    try {
      console.log('👋 Signing out...');
      await signOutUser();
      set({ user: null, currentMode: 'RIDER' });
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  },

  /**
   * Logout (alias for signOut)
   */
  logout: async () => {
    await get().signOut();
  },

  /**
   * Initialize auth state listener
   * Returns unsubscribe function
   */
  initialize: () => {
    console.log('🔧 Initializing auth store...');

    // Prevent multiple initializations
    if (get().initialized) {
      console.log('⚠️ Auth store already initialized');
      return () => {};
    }

    set({ initialized: true });

    // Listen to Firebase auth state with v22 modular API
    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser: FirebaseAuthTypes.User | null) => {
      console.log('🔐 Auth state changed:', firebaseUser ? firebaseUser.uid : 'No user');

      if (firebaseUser) {
        try {
          console.log('📖 Fetching user data from Firestore...');
          
          // Retry mechanism for race condition
          // Sometimes auth state changes before Firestore document is created
          let retries = 0;
          const maxRetries = 3;
          const retryDelay = 1000; // 1 second
          
          let userDoc = null;
          
          while (retries < maxRetries) {
            const userRef = doc(db, 'users', firebaseUser.uid);
            userDoc = await getDoc(userRef);

            // Use helper that handles both boolean and function versions
            if (documentExists(userDoc)) {
              break; // Document found!
            }

            retries++;
            if (retries < maxRetries) {
              console.log(`⏳ Document not found yet, retry ${retries}/${maxRetries} in ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }

          // Use helper that handles both boolean and function versions
          if (!userDoc || !documentExists(userDoc)) {
            // After all retries, document still doesn't exist
            console.warn('⚠️ User authenticated but no Firestore document found after retries');
            console.warn('⚠️ This usually means registration didn\'t complete properly');
            
            // Sign out the user since they don't have a proper account
            await signOutUser();
            
            set({ 
              user: null, 
              loading: false,
              currentMode: 'RIDER',
            });
            return;
          }
          
          // Document exists - fetch data
          const userData = userDoc.data();
          
          // Check if userData exists (TypeScript safety)
          if (!userData) {
            console.error('❌ User document exists but has no data');
            set({ user: null, loading: false, currentMode: 'RIDER' });
            return;
          }
            
            // Convert Firestore timestamps to Date objects
            const user: User = {
              id: userDoc.id,
              ...userData,
              // Map both photoURL and profilePhoto fields for consistency
              photoURL: userData.photoURL || userData.profilePhoto || '',
              createdAt: userData.createdAt?.toDate?.() || new Date(),
              lastLoginAt: userData.lastLoginAt?.toDate?.() || new Date(),
            } as User;

            console.log('✅ User data loaded:', {
              id: user.id,
              email: user.email,
              roles: user.roles,
            });

            // Try to load the last saved mode from AsyncStorage
            let initialMode: 'RIDER' | 'DRIVER' = 'RIDER';
            try {
              const savedMode = await AsyncStorage.getItem(LAST_MODE_KEY);
              if (savedMode === 'DRIVER' || savedMode === 'RIDER') {
                // Only use saved mode if user has that role
                if (savedMode === 'DRIVER' && user.roles?.includes('DRIVER')) {
                  initialMode = 'DRIVER';
                  console.log('📂 Restored last mode from storage: DRIVER');
                } else if (savedMode === 'RIDER' && user.roles?.includes('RIDER')) {
                  initialMode = 'RIDER';
                  console.log('📂 Restored last mode from storage: RIDER');
                } else {
                  // Saved mode doesn't match user's roles, default based on roles
                  initialMode = user.roles?.includes('DRIVER') ? 'DRIVER' : 'RIDER';
                  console.log('📂 Saved mode not available, defaulting to:', initialMode);
                }
              } else {
                // No saved mode, default based on roles
                initialMode = user.roles?.includes('DRIVER') ? 'DRIVER' : 'RIDER';
                console.log('📂 No saved mode, defaulting to:', initialMode);
              }
            } catch (error) {
              console.error('❌ Failed to load mode from storage:', error);
              initialMode = user.roles?.includes('DRIVER') ? 'DRIVER' : 'RIDER';
            }

            set({
              user,
              loading: false,
              currentMode: initialMode,
            });
        } catch (error: any) {
          console.error('❌ Error fetching user data:', error);
          console.error('Error code:', error?.code);
          console.error('Error message:', error?.message);
          
          // If permission denied, sign out
          if (error?.code === 'firestore/permission-denied') {
            console.error('🚫 Permission denied - signing out');
            await signOutUser();
          }
          
          set({ 
            user: null, 
            loading: false,
            currentMode: 'RIDER',
          });
        }
      } else {
        // No user signed in
        console.log('👤 No user signed in');
        set({ 
          user: null, 
          loading: false,
          currentMode: 'RIDER',
        });
      }
    });

    console.log('✅ Auth store initialized');

    // Return unsubscribe function
    return unsubscribe;
  }
}));

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current authenticated user from store
 */
export const getCurrentUser = (): User | null => {
  return useAuthStore.getState().user;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return useAuthStore.getState().user !== null;
};

/**
 * Check if user has specific role
 */
export const hasRole = (role: 'RIDER' | 'DRIVER' | 'ADMIN'): boolean => {
  const user = useAuthStore.getState().user;
  return user?.roles?.includes(role) || false;
};

/**
 * Check if user is a driver
 */
export const isDriver = (): boolean => {
  return hasRole('DRIVER');
};

/**
 * Check if user is a rider
 */
export const isRider = (): boolean => {
  return hasRole('RIDER');
};

/**
 * Get current mode
 */
export const getCurrentMode = (): 'RIDER' | 'DRIVER' => {
  return useAuthStore.getState().currentMode;
};

// ============================================================================
// Export
// ============================================================================

export default useAuthStore;