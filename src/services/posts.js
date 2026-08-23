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

function generatePlaceholder(seed) {
  const colors = ['#e879f9', '#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171'];
  const color1 = colors[seed.length % colors.length];
  const color2 = colors[(seed.charCodeAt(0) || 0) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="40" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">Vista Previa</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function getMockPost(postId) {
  return {
    id: postId,
    name: `Post de Prueba (ID: ${postId})`,
    description: 'Esta es una vista previa de cómo se ve el detalle completo de un post usando datos falsos porque Firebase no está disponible.',
    category: 'apks',
    imageUrl: generatePlaceholder(postId),
    downloadUrl: '#',
    authorName: 'Jozeth',
    authorVerified: true,
    likes: 420,
    downloads: 1337,
    views: 9000,
    createdAt: new Date()
  };
}

export async function getPost(postId) {
  if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes('tu-')) {
    await new Promise(r => setTimeout(r, 400));
    return getMockPost(postId);
  }
  
  try {
    const snap = await Promise.race([
      getDoc(doc(db, POSTS, postId)),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
    ]);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error("Firebase getPost falló, usando datos falsos:", err);
    return getMockPost(postId);
  }
}

// ── Listado paginado por categoría (o todas) ──
export async function getPosts({ category = null, pageSize = 20, cursor = null } = {}) {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.log("Mocking getPosts because Firebase config is missing");
    await new Promise(r => setTimeout(r, 500)); // simulate network
    if (cursor) return { posts: [], lastDoc: null, hasMore: false }; // only one page of mock data
    const mockPosts = Array.from({ length: 8 }).map((_, i) => ({
      id: `mock-${i}`,
      name: `Elemento Cinematográfico ${i + 1}`,
      description: 'Una pieza de diseño exquisita con animaciones sutiles y estilo moderno.',
      category: category || 'apks',
      imageUrl: generatePlaceholder(`mock-${i}`),
      downloadUrl: '#',
      authorName: 'Jozeth',
      authorVerified: true,
      likes: Math.floor(Math.random() * 500),
      downloads: Math.floor(Math.random() * 1000),
      views: Math.floor(Math.random() * 5000),
      createdAt: new Date()
    }));
    return { posts: mockPosts, lastDoc: 'mock', hasMore: false };
  }

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
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return;
  await updateDoc(doc(db, POSTS, postId), { downloads: increment(1) })
}

export async function incrementView(postId) {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return;
  await updateDoc(doc(db, POSTS, postId), { views: increment(1) })
}

export function getPostUrl(post) {
  return `/post/${post.id}`
}
