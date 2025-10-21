import { authInstance, firestore } from '../config/firebase';

export const FirebaseService = {
  // Authentication
  signUp: async (email: string, password: string, userData: any) => {
    const userCredential = await authInstance.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await firestore().collection('users').doc(user.uid).set({
      ...userData,
      email,
      roles: ['RIDER'],
      status: 'ACTIVE',
      hasAcceptedTerms: false,
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });

    return user;
  },

  signIn: async (email: string, password: string) => {
    const userCredential = await authInstance.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  },

  signOut: async () => {
    await authInstance.signOut();
  },

  // Firestore Operations
  getUser: async (userId: string) => {
    const userDoc = await firestore().collection('users').doc(userId).get();
    return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
  },

  createCarpoolRequest: async (data: any) => {
    const docRef = await firestore().collection('carpoolRequests').add({
      ...data,
      status: 'MATCHING',
      createdAt: firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
    });
    return docRef.id;
  },

  // Real-time listeners
  subscribeToTrip: (tripId: string, callback: (data: any) => void) => {
    const unsubscribe = firestore().collection('trips').doc(tripId).onSnapshot((doc) => {
      if (doc.exists) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
    return unsubscribe;
  }
};
