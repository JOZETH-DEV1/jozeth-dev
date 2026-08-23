// src/services/firebase.js
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbCreateUser,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  sendPasswordResetEmail as fbReset,
  GoogleAuthProvider as fbGoogle,
  signInWithPopup as fbPopup
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasFirebaseConfig = !!firebaseConfig.apiKey;

let app = {};
export let auth = {};
export let db = {};

if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} else {
  console.warn("Faltan variables de Firebase. Usando modo visual mockeado.");
}

export const onAuthStateChanged = (a, cb) => hasFirebaseConfig ? fbOnAuthStateChanged(a, cb) : (cb(null), () => {});
export const signInWithEmailAndPassword = fbSignIn;
export const createUserWithEmailAndPassword = fbCreateUser;
export const signOut = fbSignOut;
export const updateProfile = fbUpdateProfile;
export const sendPasswordResetEmail = fbReset;
export const GoogleAuthProvider = fbGoogle;
export const signInWithPopup = fbPopup;
