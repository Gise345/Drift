import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const FirebaseService = {
  // Authentication
  signUp: async (email: string, password: string, userData: any) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email,
      roles: ['RIDER'],
      status: 'ACTIVE',
      hasAcceptedTerms: false,
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return user;
  },
  
  signIn: async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  },
  
  signOut: async () => {
    await firebaseSignOut(auth);
  },
  
  // Firestore Operations
  getUser: async (userId: string) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  },
  
  createCarpoolRequest: async (data: any) => {
    const docRef = await addDoc(collection(db, 'carpoolRequests'), {
      ...data,
      status: 'MATCHING',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
    });
    return docRef.id;
  },
  
  // Real-time listeners
  subscribeToTrip: (tripId: string, callback: (data: any) => void) => {
    const unsubscribe = onSnapshot(doc(db, 'trips', tripId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
    return unsubscribe;
  }
};