
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD83tQLQOKT6Mom6mIBFIIQUWhjZzgIN5Q",
  authDomain: "nagasaki-2026.firebaseapp.com",
  databaseURL: "https://nagasaki-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nagasaki-2026",
  storageBucket: "nagasaki-2026.firebasestorage.app",
  messagingSenderId: "745050256149",
  appId: "1:745050256149:web:eb312690e754c61a50ef1c"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);