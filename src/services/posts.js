// src/services/posts.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit, startAfter, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from './firebase'

export const CATEGORIES = [
  { id: 'apks',      label: 'APKs',       icon: '📱' },
  { id: 'addons',    label: 'Addons',     icon: '🧩' },
  { id: 'mods',      label: 'Mods',       icon: '🎮' },
  { id: 'tutoriales', label: 'Tutoriales', icon: '📚' },
]

const POSTS = 'posts'

// ── Crear publicación (cualquier usuario logueado puede publicar) ──
export async function createPost({ name, description, category, imageUrl, downloadUrl, version, size }, user) {
  if (!user) throw new Error('Debes iniciar sesión para publicar')
  if (!CATEGORIES.some(c => c.id === category)) throw new Error('Categoría inválida')
  if (!name?.trim()) throw new Error('El nombre es obligatorio')
  if (!downloadUrl?.trim()) throw new Error('El enlace de descarga es obligatorio')

  const ref = await addDoc(collection(db, POSTS), {
    name: name.trim(),
    description: (description || '').trim(),
    category,
    imageUrl:    imageUrl || '',
    downloadUrl: downloadUrl.trim(),
    version:     version || '',
    size:        size || '',
    authorId:    user.uid,
    authorName:  user.displayName,
    authorPhoto: user.photoURL || '',
    authorVerified: !!user.verified,
    status:      'active',
    likes:       0,
    downloads:   0,
    views:       0,
    commentsCount: 0,
    createdAt:   serverTimestamp(),
  })
  return ref.id
}

export async function updatePost(postId, changes) {
  await updateDoc(doc(db, POSTS, postId), changes)
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, POSTS, postId))
}

export async function getPost(postId) {
  const snap = await getDoc(doc(db, POSTS, postId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Listado paginado por categoría (o todas) ──
export async function getPosts({ category = null, pageSize = 20, cursor = null } = {}) {
  const clauses = [where('status', '==', 'active')]
  if (category) clauses.push(where('category', '==', category))
  clauses.push(orderBy('createdAt', 'desc'))
  clauses.push(limit(pageSize))
  if (cursor) clauses.push(startAfter(cursor))

  const q = query(collection(db, POSTS), ...clauses)
  const snap = await getDocs(q)
  return {
    posts: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === pageSize,
  }
}

export async function incrementDownload(postId) {
  await updateDoc(doc(db, POSTS, postId), { downloads: increment(1) })
}

export async function incrementView(postId) {
  await updateDoc(doc(db, POSTS, postId), { views: increment(1) })
}

export function getPostUrl(post) {
  return `/post/${post.id}`
}
