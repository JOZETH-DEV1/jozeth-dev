// src/services/auth.js
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

// Crea el documento de perfil en /users/{uid} si no existe todavía
export async function ensureUserDoc(firebaseUser) {
  const ref  = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data()

  const isAdmin = ADMIN_EMAILS.includes((firebaseUser.email || '').toLowerCase())
  const data = {
    uid:         firebaseUser.uid,
    email:       firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
    photoURL:    firebaseUser.photoURL || '',
    role:        isAdmin ? 'admin' : 'user',
    verified:    isAdmin,
    banned:      false,
    followers:   0,
    following:   0,
    createdAt:   serverTimestamp(),
  }
  await setDoc(ref, data)
  return data
}

// Combina el usuario de Firebase Auth con su perfil de Firestore
export async function buildUserObject(firebaseUser) {
  if (!firebaseUser) return null
  const profile = await ensureUserDoc(firebaseUser)
  return {
    uid:         firebaseUser.uid,
    email:       firebaseUser.email,
    displayName: profile.displayName || firebaseUser.displayName || 'Usuario',
    photoURL:    profile.photoURL || firebaseUser.photoURL || '',
    role:        profile.role || 'user',
    verified:    !!profile.verified,
    banned:      !!profile.banned,
    isAdmin:     profile.role === 'admin',
  }
}
