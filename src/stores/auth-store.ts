/**
 * Drift Auth Store - React Native Firebase v22 Modular API
 * 
 * ✅ CORRECT v22 MODULAR API USAGE
 * ✅ No deprecation warnings
 * ✅ Proper auth state management
 */

import { create } from 'zustand';
import auth, { onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { doc, getDoc } from '@react-native-firebase/firestore';
import { signOutUser } from '../services/firebase-auth-service';

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
  setMode: (mode: 'RIDER' | 'DRIVER') => void;
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
   */
  setMode: (mode) => {
    console.log('🔄 Switching mode to:', mode);
    set({ currentMode: mode });
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
            
            if (userDoc.exists) {
              break; // Document found!
            }
            
            retries++;
            if (retries < maxRetries) {
              console.log(`⏳ Document not found yet, retry ${retries}/${maxRetries} in ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
          
          if (!userDoc || !userDoc.exists) {
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
              createdAt: userData.createdAt?.toDate?.() || new Date(),
              lastLoginAt: userData.lastLoginAt?.toDate?.() || new Date(),
            } as User;

            console.log('✅ User data loaded:', {
              id: user.id,
              email: user.email,
              roles: user.roles,
            });

            // Determine initial mode based on roles
            const initialMode = user.roles?.includes('DRIVER') ? 'DRIVER' : 'RIDER';

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