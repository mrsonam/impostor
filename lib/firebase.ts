import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

// Your Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_IDc
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Firestore collections
export const COLLECTIONS = {
  ROOMS: 'rooms',
  GAMES: 'games',
  PLAYERS: 'players'
} as const;

// Helper functions for Firebase operations
export const firebaseHelpers = {
  // Create or update a room
  async setRoom(roomId: string, roomData: any) {
    await setDoc(doc(db, COLLECTIONS.ROOMS, roomId), roomData);
  },

  // Get a room
  async getRoom(roomId: string) {
    const docRef = doc(db, COLLECTIONS.ROOMS, roomId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },

  // Update a room
  async updateRoom(roomId: string, updates: any) {
    const docRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await updateDoc(docRef, updates);
  },

  // Delete a room
  async deleteRoom(roomId: string) {
    const docRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await deleteDoc(docRef);
  },

  // Listen to room changes
  subscribeToRoom(roomId: string, callback: (data: any) => void) {
    const docRef = doc(db, COLLECTIONS.ROOMS, roomId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    });
  },

  // Check if room exists
  async roomExists(roomId: string) {
    const docRef = doc(db, COLLECTIONS.ROOMS, roomId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  },

  // Get all rooms (for cleanup purposes)
  async getAllRooms() {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ROOMS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
