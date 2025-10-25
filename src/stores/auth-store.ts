import { create } from 'zustand';
import { firebaseAuth, firebaseDb } from '../config/firebase';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { FirebaseService } from '../services/firebase-service';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  roles: string[];
  hasAcceptedTerms: boolean;
  rating?: number;
  createdAt?: any;
  profilePhoto?: string;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  currentMode: 'RIDER' | 'DRIVER';

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setMode: (mode: 'RIDER' | 'DRIVER') => void;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
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

  logout: async () => {
    await FirebaseService.signOut();
    set({ user: null });
  },

  initialize: () => {
    // Listen to Firebase auth state with v22 modular API
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch full user data from Firestore using modular API
          const userRef = doc(firebaseDb, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists) {
            set({
              user: { id: userDoc.id, ...userDoc.data() } as User,
              loading: false
            });
          } else {
            // User authenticated but no Firestore doc - sign them out
            console.warn('User authenticated but no Firestore document found');
            await FirebaseService.signOut();
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

    return unsubscribe;
  }
}));