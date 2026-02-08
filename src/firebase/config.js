// Firebase Configuration - FORCE ONLINE MODE
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration from environment variables
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized successfully');

// Initialize services with MINIMAL configuration to force online mode
export const auth = getAuth(app);
console.log('Firebase Auth initialized successfully');

// Use basic Firestore initialization - NO custom settings that could cause offline issues
export const db = getFirestore(app);
console.log('Firestore initialized in ONLINE-ONLY mode');

export const storage = getStorage(app);
console.log('Firebase Storage initialized successfully');

export default app;
