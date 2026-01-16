// Firebase Configuration - FORCE ONLINE MODE
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyDWzuEi0XvHj9SKEpj1xEe7TMLxfMh3r98",
    authDomain: "lifeasy-lib-9dc5b.firebaseapp.com",
    projectId: "lifeasy-lib-9dc5b",
    storageBucket: "lifeasy-lib-9dc5b.firebasestorage.app",
    messagingSenderId: "306247620264",
    appId: "1:306247620264:web:2f70fa76b1a9f3299e949d"
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
