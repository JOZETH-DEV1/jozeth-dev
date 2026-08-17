// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { UserPlus, UserCheck } from 'lucide-react'
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

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (!active) return
        if (snap.exists()) setProfile({ uid, ...snap.data() })

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
        </div>
        {user && user.uid !== uid && (
          <button className="btn btn-primary btn-sm" onClick={handleFollow} style={{ marginLeft: 'auto' }}>
            {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
            {following ? 'Siguiendo' : 'Seguir'}
          </button>
        )}
      </div>

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
