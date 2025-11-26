import { create } from 'zustand';
import { firebaseDb, firebaseAuth } from '../config/firebase';
import {
  doc,
  getDoc,
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

export interface SavedPlace {
  id: string;
  type: 'home' | 'work' | 'custom';
  label: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  profilePhoto?: string;
  
  // Saved places
  homeAddress?: SavedPlace;
  workAddress?: SavedPlace;
  savedPlaces?: SavedPlace[];
  
  // Stats
  rating?: number;
  totalTrips?: number;
  memberSince?: Date;
  
  // Preferences
  defaultPaymentMethod?: string;
  notificationsEnabled?: boolean;
  locationSharingEnabled?: boolean;
  
  roles: string[];
  hasAcceptedTerms: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserStore {
  user: User | null;
  loading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  saveHomeAddress: (place: Omit<SavedPlace, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  saveWorkAddress: (place: Omit<SavedPlace, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addSavedPlace: (place: Omit<SavedPlace, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeSavedPlace: (placeId: string) => Promise<void>;
  fetchUserData: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,
  
  setUser: (user) => set({ user }),
  
  updateUser: async (updates) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');
      
      const userRef = doc(firebaseDb, 'users', currentUser.id);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      // Update local state
      set({ user: { ...currentUser, ...updates } as User });
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },
  
  saveHomeAddress: async (place) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');
      
      const homeAddress: SavedPlace = {
        ...place,
        id: 'home',
        type: 'home',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await get().updateUser({ homeAddress });
    } catch (error) {
      console.error('Failed to save home address:', error);
      throw error;
    }
  },
  
  saveWorkAddress: async (place) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');
      
      const workAddress: SavedPlace = {
        ...place,
        id: 'work',
        type: 'work',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await get().updateUser({ workAddress });
    } catch (error) {
      console.error('Failed to save work address:', error);
      throw error;
    }
  },
  
  addSavedPlace: async (place) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');
      
      const newPlace: SavedPlace = {
        ...place,
        id: `place_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const savedPlaces = [...(currentUser.savedPlaces || []), newPlace];
      await get().updateUser({ savedPlaces });
    } catch (error) {
      console.error('Failed to add saved place:', error);
      throw error;
    }
  },
  
  removeSavedPlace: async (placeId) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');
      
      const savedPlaces = (currentUser.savedPlaces || []).filter(
        place => place.id !== placeId
      );
      
      await get().updateUser({ savedPlaces });
    } catch (error) {
      console.error('Failed to remove saved place:', error);
      throw error;
    }
  },
  
  fetchUserData: async () => {
    try {
      set({ loading: true });
      
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        set({ user: null, loading: false });
        return;
      }
      
      const userRef = doc(firebaseDb, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      // Use helper that handles both boolean and function versions
      if (documentExists(userDoc)) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        set({ user: userData, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      set({ loading: false });
      throw error;
    }
  },
}));