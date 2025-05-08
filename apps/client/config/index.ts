import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable mobile device to access services running on host machine
const hostUri = Constants.expoConfig?.hostUri?.split(':')[0];
const origin = hostUri ?? '127.0.0.1';

if (process.env.NODE_ENV !== 'production') {
  connectAuthEmulator(auth, `http://${origin}:9099`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, origin, 8080);
  connectStorageEmulator(storage, origin, 9199);
}

export const API_HOST = process.env.EXPO_PUBLIC_API_HOST
  ? `${process.env.EXPO_PUBLIC_API_HOST}`
  : `http://${origin}:${process.env.EXPO_PUBLIC_API_PORT}`;
