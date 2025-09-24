import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6RflMj_ZAY3VvBfl0N67AOODz1CV4J5w",
  authDomain: "gen-lang-client-0758918655.firebaseapp.com",
  projectId: "gen-lang-client-0758918655",
  storageBucket: "gen-lang-client-0758918655.firebasestorage.app",
  messagingSenderId: "171782876101",
  appId: "1:171782876101:web:6d6be62ab0219f5608f9ac",
  measurementId: "G-XN10CLY7SV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in production)
let analytics: Analytics | null = null;
if (typeof window !== "undefined" && import.meta.env.MODE === "production") {
  analytics = getAnalytics(app);
}

export { analytics };

// Firestore collections
export const COLLECTIONS = {
  MASTER_DATA: "masterData",
  TOURS: "tours",
  SYNC_METADATA: "syncMetadata"
} as const;

// Sync metadata interface
export interface SyncMetadata {
  lastSync: string;
  version: number;
  userId: string;
  deviceId: string;
}