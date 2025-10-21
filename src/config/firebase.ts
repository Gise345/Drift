// React Native Firebase - Modular API (v22+)
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase is auto-initialized via google-services.json on Android
// and GoogleService-Info.plist on iOS

// Export modular instances - don't pass app, let them use default
export const authInstance = auth();
export const db = firestore();

// Default exports for backward compatibility
export { auth, firestore };
