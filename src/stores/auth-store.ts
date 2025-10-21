import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  roles: string[];
  hasAcceptedTerms: boolean;
  // ... other fields
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  currentMode: 'RIDER' | 'DRIVER';
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setMode: (mode: 'RIDER' | 'DRIVER') => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  currentMode: 'RIDER',
  
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setMode: (mode) => set({ currentMode: mode }),
  
  initialize: () => {
    // Listen to Firebase auth state
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch full user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          set({
            user: { id: userDoc.id, ...userDoc.data() } as User,
            loading: false
          });
        }
      } else {
        set({ user: null, loading: false });
      }
    });
  }
}));
