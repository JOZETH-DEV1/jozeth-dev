// src/services/social.js
import {
  collection, doc, addDoc, deleteDoc, getDoc, getDocs, setDoc,
  query, where, orderBy, limit as fbLimit, serverTimestamp, increment, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

// ═══ LIKES ═══
// Un documento por (postId_uid) en /likes para poder verificar "¿ya dio like?" en O(1)
export async function toggleLike(postId, uid) {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return true;
  const likeId = `${postId}_${uid}`
  const ref = doc(db, 'likes', likeId)
  const snap = await getDoc(ref)
  const postRef = doc(db, 'posts', postId)

  if (snap.exists()) {
    await deleteDoc(ref)
    await updateDoc(postRef, { likes: increment(-1) })
    return false
  } else {
    await setDoc(ref, { postId, uid, createdAt: serverTimestamp() })
    await updateDoc(postRef, { likes: increment(1) })
    return true
  }
}

export async function hasLiked(postId, uid) {
  if (!uid || !import.meta.env.VITE_FIREBASE_API_KEY) return false;
  const snap = await getDoc(doc(db, 'likes', `${postId}_${uid}`))
  return snap.exists()
}

// ═══ SEGUIDOS ═══
// Documento en /follows/{followerId_followingId}
export async function toggleFollow(followerId, followingId) {
  if (followerId === followingId) throw new Error('No puedes seguirte a ti mismo')
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return true;
  const followId = `${followerId}_${followingId}`
  const ref = doc(db, 'follows', followId)
  const snap = await getDoc(ref)
  const followerRef  = doc(db, 'users', followerId)
  const followingRef = doc(db, 'users', followingId)

  if (snap.exists()) {
    await deleteDoc(ref)
    await updateDoc(followerRef,  { following: increment(-1) })
    await updateDoc(followingRef, { followers: increment(-1) })
    return false
  } else {
    await setDoc(ref, { followerId, followingId, createdAt: serverTimestamp() })
    await updateDoc(followerRef,  { following: increment(1) })
    await updateDoc(followingRef, { followers: increment(1) })
    return true
  }
}

export async function isFollowing(followerId, followingId) {
  if (!followerId || !import.meta.env.VITE_FIREBASE_API_KEY) return false;
  const snap = await getDoc(doc(db, 'follows', `${followerId}_${followingId}`))
  return snap.exists()
}

export async function getFollowedPosts(followerId, pageSize = 20) {
  const followsSnap = await getDocs(query(collection(db, 'follows'), where('followerId', '==', followerId)))
  const followingIds = followsSnap.docs.map(d => d.data().followingId)
  if (!followingIds.length) return []

  // Firestore permite máximo 30 valores en 'in' — se recorta si hace falta
  const ids = followingIds.slice(0, 30)
  const q = query(
    collection(db, 'posts'),
    where('authorId', 'in', ids),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    fbLimit(pageSize)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ═══ COMENTARIOS ═══
export async function addComment(postId, user, text) {
  if (!user) throw new Error('Debes iniciar sesión para comentar')
  const clean = (text || '').trim()
  if (!clean) throw new Error('El comentario no puede estar vacío')
  if (clean.length > 500) throw new Error('Máximo 500 caracteres')

  await addDoc(collection(db, 'posts', postId, 'comments'), {
    uid:         user.uid,
    displayName: user.displayName,
    photoURL:    user.photoURL || '',
    verified:    !!user.verified,
    text:        clean,
    createdAt:   serverTimestamp(),
  })
  await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) })
}

export async function deleteComment(postId, commentId) {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId))
  await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(-1) })
}

export async function getComments(postId, pageSize = 50) {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return [
    { id: '1', displayName: 'Usuario de prueba', text: '¡Increíble aporte! Muy buen diseño.', createdAt: new Date() }
  ];
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'desc'),
    fbLimit(pageSize)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
