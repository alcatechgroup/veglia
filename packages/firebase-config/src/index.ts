import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBAIkDujC-hwziBoN6USc97OmD0TgatAXE",
  authDomain: "veglia-6e734.firebaseapp.com",
  projectId: "veglia-6e734",
  storageBucket: "veglia-6e734.firebasestorage.app",
  messagingSenderId: "848052093163",
  appId: "1:848052093163:web:b40cdc01763cbfa4f8beae",
};

// Evita re-inicialização em hot reload (dev) e SSR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
