// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Debug: Log environment variables
console.log('🔍 Firebase Environment Variables Debug:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? 'PRESENT' : 'MISSING');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('VITE_FIREBASE_DATABASE_URL:', import.meta.env.VITE_FIREBASE_DATABASE_URL);
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);

// Your web app's Firebase configuration using environment variables
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('🔥 Complete Firebase Config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
