import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKcyjMjYfZiZ-XjX79KVp0v5vugCZZphs",
  authDomain: "mood-tracker-6874d.firebaseapp.com",
  projectId: "mood-tracker-6874d",
  storageBucket: "mood-tracker-6874d.firebasestorage.app",
  messagingSenderId: "1561114015591",
  appId: "1:1561114015591:web:989157a5c13693aa1e0bc2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
