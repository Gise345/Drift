import { create } from 'zustand';
import { authInstance, firestore } from '../config/firebase';
import { FirebaseService } from '../services/firebase-service';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  roles: string[];
  hasAcceptedTerms: boolean;
  rating?: number;
  createdAt?: Date;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  currentMode: 'RIDER' | 'DRIVER';

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setMode: (mode: 'RIDER' | 'DRIVER') => void;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  currentMode: 'RIDER',

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setMode: (mode) => set({ currentMode: mode }),

  signOut: async () => {
    await FirebaseService.signOut();
    set({ user: null });
  },

  initialize: () => {
    // Listen to Firebase auth state
    authInstance.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch full user data from Firestore
          const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
          if (userDoc.exists) {
            set({
              user: { id: userDoc.id, ...userDoc.data() } as User,
              loading: false
            });
          } else {
            // User authenticated but no Firestore doc - sign them out
            console.warn('User authenticated but no Firestore document found');
            await authInstance.signOut();
            set({ user: null, loading: false });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({ user: null, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    });
  }
}));
