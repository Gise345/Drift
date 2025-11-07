/**
 * Drift Authentication Store - TypeScript Fixed
 * 
 * Global state management for user authentication
 * Syncs with Firebase Auth state
 * Persists user data across app restarts
 * 
 * FIXES:
 * - Made phone optional to match Firebase auth service
 * - Compatible with existing codebase
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  getUserData,
  signOutUser,
  DriftUser,
} from '@/src/services/firebase-auth-service';

// User type that matches both Firebase and existing code
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string; // ✅ FIXED: Made optional to match DriftUser
  roles: string[];
  hasAcceptedTerms: boolean;
  rating?: number;
  createdAt?: any;
  profilePhoto?: string;
  emailVerified?: boolean;
  totalTrips?: number;
  lastLoginAt?: Date;
  stripeCustomerId?: string;
  stripeAccountId?: string;
}

interface AuthState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | DriftUser | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  
  // Role helpers
  isRider: () => boolean;
  isDriver: () => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Set user (from Firebase or mock data)
      setUser: (user) => {
        if (!user) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        // Convert DriftUser to User format
        const userData: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone, // ✅ Optional, so this works now
          roles: user.roles,
          hasAcceptedTerms: user.hasAcceptedTerms,
          rating: user.rating,
          createdAt: user.createdAt,
          profilePhoto: ('photoURL' in user) ? user.photoURL : ('profilePhoto' in user) ? user.profilePhoto : undefined,
          emailVerified: ('emailVerified' in user) ? user.emailVerified : undefined,
          totalTrips: ('totalTrips' in user) ? user.totalTrips : undefined,
          lastLoginAt: ('lastLoginAt' in user) ? user.lastLoginAt : undefined,
        };

        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      // Update user profile
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              ...updates,
            },
          });
        }
      },

      // Logout
      logout: async () => {
        try {
          await signOutUser();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          throw error;
        }
      },

      // Initialize auth state (listen to Firebase)
      initialize: async () => {
        set({ isLoading: true });

        // Set up Firebase auth listener
        onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in
            try {
              const userData = await getUserData(firebaseUser.uid);
              if (userData) {
                set({
                  user: {
                    id: userData.id,
                    email: userData.email,
                    name: userData.name,
                    phone: userData.phone, // ✅ Works now
                    roles: userData.roles,
                    hasAcceptedTerms: userData.hasAcceptedTerms,
                    rating: userData.rating,
                    totalTrips: userData.totalTrips,
                    emailVerified: userData.emailVerified,
                    createdAt: userData.createdAt,
                    lastLoginAt: userData.lastLoginAt,
                    profilePhoto: userData.photoURL,
                  },
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else {
                // User data not found in Firestore
                set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else {
            // User is signed out
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        });
      },

      // Role helpers
      isRider: () => {
        const user = get().user;
        return user?.roles.includes('RIDER') || false;
      },

      isDriver: () => {
        const user = get().user;
        return user?.roles.includes('DRIVER') || false;
      },

      hasRole: (role: string) => {
        const user = get().user;
        return user?.roles.includes(role as any) || false;
      },
    }),
    {
      name: 'drift-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data, not loading state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on app start (call this in app/_layout.tsx)
export function initializeAuth() {
  useAuthStore.getState().initialize();
}

// Export User type for use in other files
export type { User };