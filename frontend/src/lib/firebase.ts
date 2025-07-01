// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAaFlHlUl9XYV23rxDUjO45BddUjVQ78pQ",
  authDomain: "quiz-cult.firebaseapp.com",
  databaseURL: "https://quiz-cult-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quiz-cult",
  storageBucket: "quiz-cult.appspot.com",
  messagingSenderId: "48334494536",
  appId: "1:48334494536:web:24e44fd77ebf51e7fd717d",
  measurementId: "G-HY97SK4HYP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
