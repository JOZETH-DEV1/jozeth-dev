// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { updateDoc } from 'firebase/firestore'
import { UserPlus, UserCheck, Edit3 } from 'lucide-react'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { toggleFollow, isFollowing } from '../services/social'
import VerifiedBadge from '../components/ui/VerifiedBadge'
import PostCard from '../components/catalog/PostCard'
import gridStyles from '../components/catalog/PostGrid.module.css'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { uid } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts]     = useState([])
  const [following, setFollowingState] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ displayName: '', photoURL: '', bio: '' })
  const [saving, setSaving] = useState(false)

  const handleEditSave = async () => {
    if (!editData.displayName.trim()) return toast.error('El nombre no puede estar vacío')
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName: editData.displayName.trim(),
        photoURL: editData.photoURL.trim(),
        bio: editData.bio.trim()
      })
      setProfile(p => ({ ...p, ...editData }))
      setIsEditing(false)
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }


  useEffect(() => {
    let active = true
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (!active) return
        if (snap.exists()) { const data = snap.data(); setProfile({ uid, ...data }); setEditData({ displayName: data.displayName || '', photoURL: data.photoURL || '', bio: data.bio || '' }) }

        const postsSnap = await getDocs(query(
          collection(db, 'posts'), where('authorId', '==', uid),
          where('status', '==', 'active'), orderBy('createdAt', 'desc')
        ))
        if (active) setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        if (user && user.uid !== uid) {
          const f = await isFollowing(user.uid, uid)
          if (active) setFollowingState(f)
        }
      } catch (err) {
        console.error('Error cargando perfil:', err)
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [uid, user])

  async function handleFollow() {
    if (!user) return toast.error('Inicia sesión para seguir')
    try {
      const newState = await toggleFollow(user.uid, uid)
      setFollowingState(newState)
      setProfile(p => ({ ...p, followers: (p.followers || 0) + (newState ? 1 : -1) }))
    } catch (err) { toast.error(err.message) }
  }

  if (loading) return <div className="skeleton" style={{ height: 200, margin: '20px 0' }} />
  if (error) return (
    <div className={gridStyles.empty}>
      ⚠️ Error al cargar el perfil.<br />
      <span style={{ fontSize: '0.78rem', color: 'var(--t3)' }}>{error}</span>
    </div>
  )
  if (!profile) return <div className={gridStyles.empty}>Usuario no encontrado.</div>

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        {profile.photoURL
          ? <img src={profile.photoURL} alt="" className={styles.avatar} />
          : <div className={styles.avatarFallback}>{profile.displayName?.[0]?.toUpperCase()}</div>}
        <div>
          <h1 className={styles.name}>
            {profile.displayName} {profile.verified && <VerifiedBadge large />}
          </h1>
          <div className={styles.statsRow}>
            <span><strong>{posts.length}</strong> publicaciones</span>
            <span><strong>{profile.followers || 0}</strong> seguidores</span>
            <span><strong>{profile.following || 0}</strong> siguiendo</span>
          </div>
        {profile.bio && !isEditing && <p style={{ fontSize: '0.85rem', color: 'var(--t2)', marginTop: 8 }}>{profile.bio}</p>}
        </div>
        {user && user.uid !== uid && (
          <button className="btn btn-primary btn-sm" onClick={handleFollow} style={{ marginLeft: 'auto' }}>
            {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
            {following ? 'Siguiendo' : 'Seguir'}
          </button>
        )}
        {user && user.uid === uid && !isEditing && (
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)} style={{ marginLeft: 'auto' }}>
            <Edit3 size={14} /> Editar
          </button>
        )}
      </div>

      {isEditing && (
        <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Editar Perfil</h3>
          <input type="text" className="input" placeholder="Nombre a mostrar" value={editData.displayName} onChange={e => setEditData({...editData, displayName: e.target.value})} style={{ marginBottom: 12 }} />
          <input type="text" className="input" placeholder="URL de la foto de perfil" value={editData.photoURL} onChange={e => setEditData({...editData, photoURL: e.target.value})} style={{ marginBottom: 12 }} />
          <textarea className="input" placeholder="Biografía corta" value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} rows={2} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleEditSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>Cancelar</button>
          </div>
        </div>
      )}
      {posts.length ? (
        <div className={gridStyles.grid}>
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      ) : (
        <div className={gridStyles.empty}>Sin publicaciones todavía.</div>
      )}
    </div>
  )
}
