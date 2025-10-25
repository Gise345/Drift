import { firebaseAuth, firebaseDb } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from '@react-native-firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  serverTimestamp,
  onSnapshot,
  Timestamp
} from '@react-native-firebase/firestore';

export const FirebaseService = {
  // Authentication - v22 Modular API
  signUp: async (email: string, password: string, userData: any) => {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore using modular API
    const userRef = doc(firebaseDb, 'users', user.uid);
    await setDoc(userRef, {
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
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return userCredential.user;
  },

  signOut: async () => {
    await firebaseSignOut(firebaseAuth);
  },

  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth, email);
  },

  // Firestore Operations - v22 Modular API
  getUser: async (userId: string) => {
    const userRef = doc(firebaseDb, 'users', userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
  },

  updateUser: async (userId: string, data: any) => {
    const userRef = doc(firebaseDb, 'users', userId);
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  createCarpoolRequest: async (data: any) => {
    const requestsRef = collection(firebaseDb, 'carpoolRequests');
    const docRef = await addDoc(requestsRef, {
      ...data,
      status: 'MATCHING',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)) // 30 min
    });
    return docRef.id;
  },

  // Real-time listeners - v22 Modular API
  subscribeToTrip: (tripId: string, callback: (data: any) => void) => {
    const tripRef = doc(firebaseDb, 'trips', tripId);
    const unsubscribe = onSnapshot(tripRef, (docSnapshot) => {
      if (docSnapshot.exists) {
        callback({ id: docSnapshot.id, ...docSnapshot.data() });
      }
    });
    return unsubscribe;
  }
};