// src/services/firebase.js
import { initializeApp } from 'firebase/app'
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile,
  sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup,
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

// Si falta alguna variable de entorno, avisamos con un mensaje claro
// en vez de dejar que Firebase falle con un error críptico o que la
// app se quede en blanco sin explicación.
const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (missing.length) {
  throw new Error(
    `Faltan variables de entorno de Firebase: ${missing.join(', ')}. ` +
    `Configúralas en Cloudflare Pages → Settings → Environment variables y vuelve a desplegar.`
  )
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db    = getFirestore(app)

export {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup,
}
