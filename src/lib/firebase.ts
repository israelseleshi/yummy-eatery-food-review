import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// Validate essential environment variables
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.warn(`Missing Firebase config: ${key}`);
  }
});

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence (with cross-tab sync)
enableIndexedDbPersistence(db, { synchronizeTabs: true }).catch((err) => {
  switch (err.code) {
    case 'failed-precondition':
      console.warn(
        'Multiple tabs open. Persistence can only be enabled in one tab at a time.'
      );
      break;
    case 'unimplemented':
      console.warn(
        'Persistence is not available in this browser.'
      );
      break;
    default:
      console.warn('Error enabling offline persistence:', err);
  }
});

export { app, auth, db, storage };
