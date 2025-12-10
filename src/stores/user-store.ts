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

export interface RecentSearch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface RecentTravel {
  id: string;
  tripId: string;
  pickup: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  vehicleType: string;
  cost: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  profilePhoto?: string;

  // Saved places (hard cached in Firebase)
  homeAddress?: SavedPlace;
  workAddress?: SavedPlace;
  savedPlaces?: SavedPlace[];

  // Recent searches (hard cached in Firebase - max 10)
  recentSearches?: RecentSearch[];

  // Recent travels (hard cached in Firebase - max 20)
  recentTravels?: RecentTravel[];

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

  // Recent Searches (hard cached in Firebase)
  addRecentSearch: (search: Omit<RecentSearch, 'id' | 'timestamp'>) => Promise<void>;
  getRecentSearches: () => RecentSearch[];
  clearRecentSearches: () => Promise<void>;

  // Recent Travels (hard cached in Firebase)
  addRecentTravel: (travel: Omit<RecentTravel, 'id' | 'timestamp'>) => Promise<void>;
  getRecentTravels: () => RecentTravel[];
  clearRecentTravels: () => Promise<void>;

  // Sync local storage with Firebase (for migration)
  syncLocalDataToFirebase: () => Promise<void>;

  // Reset store (for logout)
  resetStore: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,

  setUser: (user) => set({ user }),

  /**
   * Reset entire store - call on logout to prevent data leakage
   */
  resetStore: () => {
    console.log('🧹 Resetting user store...');
    set({
      user: null,
      loading: false,
    });
    console.log('✅ User store reset complete');
  },
  
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

  // Recent Searches - Hard cached in Firebase
  addRecentSearch: async (search) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');

      const newSearch: RecentSearch = {
        ...search,
        id: `search_${Date.now()}`,
        timestamp: Date.now(),
      };

      // Get existing searches, remove duplicates, add new one at the beginning
      const existingSearches = currentUser.recentSearches || [];
      const filteredSearches = existingSearches.filter(
        s => s.address !== search.address
      );
      const updatedSearches = [newSearch, ...filteredSearches].slice(0, 10); // Keep max 10

      await get().updateUser({ recentSearches: updatedSearches });
      console.log('Recent search saved to Firebase:', search.name);
    } catch (error) {
      console.error('Failed to add recent search:', error);
      throw error;
    }
  },

  getRecentSearches: () => {
    const currentUser = get().user;
    if (!currentUser) return [];
    return (currentUser.recentSearches || []).sort((a, b) => b.timestamp - a.timestamp);
  },

  clearRecentSearches: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');

      await get().updateUser({ recentSearches: [] });
      console.log('Recent searches cleared from Firebase');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
      throw error;
    }
  },

  // Recent Travels - Hard cached in Firebase
  addRecentTravel: async (travel) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');

      const newTravel: RecentTravel = {
        ...travel,
        id: `travel_${Date.now()}`,
        timestamp: Date.now(),
      };

      // Get existing travels, remove duplicates by tripId, add new one at the beginning
      const existingTravels = currentUser.recentTravels || [];
      const filteredTravels = existingTravels.filter(
        t => t.tripId !== travel.tripId
      );
      const updatedTravels = [newTravel, ...filteredTravels].slice(0, 20); // Keep max 20

      await get().updateUser({ recentTravels: updatedTravels });
      console.log('Recent travel saved to Firebase:', travel.tripId);
    } catch (error) {
      console.error('Failed to add recent travel:', error);
      throw error;
    }
  },

  getRecentTravels: () => {
    const currentUser = get().user;
    if (!currentUser) return [];
    return (currentUser.recentTravels || []).sort((a, b) => b.timestamp - a.timestamp);
  },

  clearRecentTravels: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');

      await get().updateUser({ recentTravels: [] });
      console.log('Recent travels cleared from Firebase');
    } catch (error) {
      console.error('Failed to clear recent travels:', error);
      throw error;
    }
  },

  // Sync local AsyncStorage data to Firebase (one-time migration)
  syncLocalDataToFirebase: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser) {
        console.log('No user logged in, skipping sync');
        return;
      }

      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      const STORAGE_KEYS = {
        HOME_ADDRESS: '@drift_home_address',
        WORK_ADDRESS: '@drift_work_address',
        CUSTOM_ADDRESSES: '@drift_custom_addresses',
        RECENT_SEARCHES: '@drift_recent_searches',
      };

      // Load all local data
      const [localHome, localWork, localCustom, localSearches] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HOME_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.WORK_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_ADDRESSES),
        AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES),
      ]);

      const updates: Partial<User> = {};
      let hasUpdates = false;

      // Migrate home address if not already in Firebase
      if (localHome && !currentUser.homeAddress) {
        const parsed = JSON.parse(localHome);
        updates.homeAddress = {
          id: 'home',
          type: 'home',
          label: 'Home',
          address: parsed.address,
          coordinates: {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        hasUpdates = true;
        console.log('Migrating home address to Firebase');
      }

      // Migrate work address if not already in Firebase
      if (localWork && !currentUser.workAddress) {
        const parsed = JSON.parse(localWork);
        updates.workAddress = {
          id: 'work',
          type: 'work',
          label: 'Work',
          address: parsed.address,
          coordinates: {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        hasUpdates = true;
        console.log('Migrating work address to Firebase');
      }

      // Migrate custom addresses if not already in Firebase
      if (localCustom && (!currentUser.savedPlaces || currentUser.savedPlaces.length === 0)) {
        const parsed = JSON.parse(localCustom);
        updates.savedPlaces = parsed.map((addr: any) => ({
          id: addr.id || `place_${Date.now()}_${Math.random()}`,
          type: 'custom' as const,
          label: addr.label,
          address: addr.address,
          coordinates: {
            latitude: addr.latitude,
            longitude: addr.longitude,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        hasUpdates = true;
        console.log('Migrating custom addresses to Firebase');
      }

      // Migrate recent searches if not already in Firebase
      if (localSearches && (!currentUser.recentSearches || currentUser.recentSearches.length === 0)) {
        const parsed = JSON.parse(localSearches);
        updates.recentSearches = parsed.map((search: any) => ({
          id: search.id || `search_${Date.now()}_${Math.random()}`,
          name: search.name,
          address: search.address,
          latitude: search.latitude,
          longitude: search.longitude,
          timestamp: search.timestamp || Date.now(),
        }));
        hasUpdates = true;
        console.log('Migrating recent searches to Firebase');
      }

      // Update Firebase if there are changes
      if (hasUpdates) {
        await get().updateUser(updates);
        console.log('Local data synced to Firebase successfully');
      } else {
        console.log('No local data to migrate or data already exists in Firebase');
      }
    } catch (error) {
      console.error('Failed to sync local data to Firebase:', error);
    }
  },
}));