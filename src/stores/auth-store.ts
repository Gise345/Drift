/**
 * Drift Auth Store - React Native Firebase v22+ Modular API
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 * ✅ Proper auth state management
 */

import { create } from 'zustand';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOutUser } from '../services/firebase-auth-service';
import { setMonitoringUser, clearMonitoringUser } from '../services/firebase-monitoring-service';

// ============================================================================
// AsyncStorage keys that need to be cleared on logout (user-specific data)
// ============================================================================
const USER_SPECIFIC_STORAGE_KEYS = [
  '@drift_home_address',
  '@drift_work_address',
  '@drift_custom_addresses',
  '@drift_recent_searches',
  '@drift_last_mode',
];

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
// Get Firebase instances - v22+ modular API with 'main' database
// ============================================================================

const app = getApp();
const authInstance = getAuth(app);
const db = getFirestore(app, 'main');

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
  gender?: 'male' | 'female' | null;
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
   * Sign out user and clear ALL user-specific data
   * This ensures no data leaks between different users on the same device
   */
  signOut: async () => {
    try {
      console.log('👋 Signing out...');

      // Step 1: Sign out from Firebase Auth (wrapped in try-catch to prevent crashes)
      try {
        await signOutUser();
        console.log('✅ Firebase Auth signed out');
      } catch (authError) {
        console.warn('⚠️ Firebase sign out error (continuing anyway):', authError);
        // Continue with cleanup even if Firebase sign out fails
      }

      // Step 2: Clear all user-specific AsyncStorage data
      console.log('🧹 Clearing user-specific AsyncStorage data...');
      try {
        await AsyncStorage.multiRemove(USER_SPECIFIC_STORAGE_KEYS);
        console.log('✅ AsyncStorage user data cleared');
      } catch (storageError) {
        console.warn('⚠️ Failed to clear some AsyncStorage data:', storageError);
      }

      // Step 3: Reset all Zustand stores to prevent data leakage
      console.log('🧹 Resetting all stores...');

      // Reset user store
      try {
        const { useUserStore } = require('./user-store');
        useUserStore.getState().resetStore();
        console.log('✅ User store reset');
      } catch (e) {
        console.warn('⚠️ Failed to reset user store:', e);
      }

      // Reset trip store
      try {
        const { useTripStore } = require('./trip-store');
        await useTripStore.getState().resetStore();
        console.log('✅ Trip store reset');
      } catch (e) {
        console.warn('⚠️ Failed to reset trip store:', e);
      }

      // Reset driver store
      try {
        const { useDriverStore } = require('./driver-store');
        useDriverStore.getState().resetStore();
        console.log('✅ Driver store reset');
      } catch (e) {
        console.warn('⚠️ Failed to reset driver store:', e);
      }

      // Reset location store
      try {
        const { useLocationStore } = require('./location-store');
        useLocationStore.getState().reset();
        console.log('✅ Location store reset');
      } catch (e) {
        console.warn('⚠️ Failed to reset location store:', e);
      }

      // Reset safety store
      try {
        const { useSafetyStore } = require('./safety-store');
        useSafetyStore.getState().reset();
        console.log('✅ Safety store reset');
      } catch (e) {
        console.warn('⚠️ Failed to reset safety store:', e);
      }

      // Reset messaging store
      try {
        const { useMessagingStore } = require('./messaging-store');
        useMessagingStore.getState().clearMessages();
        console.log('✅ Messaging store reset');
      } catch (e) {
        console.warn('⚠️ Failed to reset messaging store:', e);
      }

      // Reset carpool store
      try {
        const { useCarpoolStore } = require('./carpool-store');
        useCarpoolStore.getState().reset();
        console.log('✅ Carpool store reset');
      } catch (e) {
        console.warn('⚠️ Failed to reset carpool store:', e);
      }

      // Step 4: Clear monitoring user
      clearMonitoringUser();

      // Step 5: Reset auth store state
      set({ user: null, currentMode: 'RIDER' });

      console.log('✅ Signed out successfully - all user data cleared');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Don't throw - always complete sign out to prevent app getting stuck
      // Just reset the state to ensure clean state
      set({ user: null, currentMode: 'RIDER' });
      console.log('⚠️ Sign out completed with errors - state reset');
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

    // Track the Firestore listener so we can unsubscribe when auth state changes
    let userDocUnsubscribe: (() => void) | null = null;

    // Listen to Firebase auth state with v22 modular API
    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser: FirebaseAuthTypes.User | null) => {
      console.log('🔐 Auth state changed:', firebaseUser ? firebaseUser.uid : 'No user');

      // Clean up previous Firestore listener if exists
      if (userDocUnsubscribe) {
        console.log('🧹 Cleaning up previous Firestore listener');
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (firebaseUser) {
        try {
          console.log('📖 Setting up real-time listener for user data...');

          // First, do a one-time check with retry for new registrations
          // This handles the race condition where auth fires before Firestore doc is created
          let retries = 0;
          const maxRetries = 3;
          const retryDelay = 1000; // 1 second

          let userDoc = null;
          const userRef = doc(db, 'users', firebaseUser.uid);

          while (retries < maxRetries) {
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

          // Load initial mode from AsyncStorage (only do this once on initial load)
          let initialModeLoaded = false;

          // Set up real-time listener for user document updates
          userDocUnsubscribe = onSnapshot(
            userRef,
            async (snapshot) => {
              if (!documentExists(snapshot)) {
                console.warn('⚠️ User document was deleted');
                set({ user: null, loading: false, currentMode: 'RIDER' });
                return;
              }

              const userData = snapshot.data();

              if (!userData) {
                console.error('❌ User document exists but has no data');
                set({ user: null, loading: false, currentMode: 'RIDER' });
                return;
              }

              // Convert Firestore timestamps to Date objects
              // Ensure both photoURL and profilePhoto are synced from either field
              const photoUrl = userData.photoURL || userData.profilePhoto || '';
              const user: User = {
                id: snapshot.id,
                ...userData,
                // Map both photoURL and profilePhoto fields for consistency
                photoURL: photoUrl,
                profilePhoto: photoUrl,
                createdAt: userData.createdAt?.toDate?.() || new Date(),
                lastLoginAt: userData.lastLoginAt?.toDate?.() || new Date(),
              } as User;

              console.log('✅ User data updated (real-time):', {
                id: user.id,
                email: user.email,
                roles: user.roles,
                gender: user.gender,
              });

              // Only load mode from AsyncStorage on initial load
              if (!initialModeLoaded) {
                initialModeLoaded = true;

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

                // Set up monitoring user for Analytics/Crashlytics
                setMonitoringUser(user.id, initialMode, user.email);
              } else {
                // For subsequent updates, only update user data (preserve current mode)
                set({ user });
              }
            },
            (error: any) => {
              console.error('❌ Error in user document listener:', error);
              console.error('Error code:', error?.code);
              console.error('Error message:', error?.message);

              // If permission denied, sign out
              if (error?.code === 'firestore/permission-denied') {
                console.error('🚫 Permission denied - signing out');
                signOutUser();
              }

              set({
                user: null,
                loading: false,
                currentMode: 'RIDER',
              });
            }
          );

        } catch (error: any) {
          console.error('❌ Error setting up user listener:', error);
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
        // Clear monitoring user
        clearMonitoringUser();
        set({
          user: null,
          loading: false,
          currentMode: 'RIDER',
        });
      }
    });

    console.log('✅ Auth store initialized with real-time listener');

    // Return combined unsubscribe function
    return () => {
      console.log('🧹 Cleaning up auth store listeners');
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
      unsubscribe();
    };
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
