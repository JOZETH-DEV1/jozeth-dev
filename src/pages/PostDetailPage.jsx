// src/pages/PostDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Heart, Download, Eye, UserPlus, UserCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getPost, incrementDownload, incrementView, CATEGORIES } from '../services/posts'
import { toggleLike, hasLiked, toggleFollow, isFollowing } from '../services/social'
import VerifiedBadge from '../components/ui/VerifiedBadge'
import CommentsSection from '../components/comments/CommentsSection'
import styles from './PostDetailPage.module.css'

export default function PostDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [post, setPost]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked]   = useState(false)
  const [following, setFollowingState] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    getPost(id).then(p => {
      if (!active) return
      if (!p) { setNotFound(true); return }
      setPost(p)
      incrementView(id)
      if (user) {
        hasLiked(id, user.uid).then(setLiked)
        if (user.uid !== p.authorId) isFollowing(user.uid, p.authorId).then(setFollowingState)
      }
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, user])

  async function handleLike() {
    if (!user) return toast.error('Inicia sesión para dar like')
    const newState = await toggleLike(id, user.uid)
    setLiked(newState)
    setPost(p => ({ ...p, likes: (p.likes || 0) + (newState ? 1 : -1) }))
  }

  async function handleFollow() {
    if (!user) return toast.error('Inicia sesión para seguir')
    try {
      const newState = await toggleFollow(user.uid, post.authorId)
      setFollowingState(newState)
    } catch (err) { toast.error(err.message) }
  }

  async function handleDownload() {
    await incrementDownload(id)
    window.open(post.downloadUrl, '_blank', 'noopener,noreferrer')
  }

  if (notFound) return <Navigate to="/404" replace />
  if (loading || !post) {
    return <div className="skeleton" style={{ height: 400, margin: '20px 0' }} />
  }

  const cat = CATEGORIES.find(c => c.id === post.category)

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        {post.imageUrl
          ? <img src={post.imageUrl} alt={post.name} className={styles.image} />
          : <div className={styles.imageFallback}>{cat?.icon}</div>}
      </div>

      <div className={styles.info}>
        <span className={styles.catTag}>{cat?.icon} {cat?.label}</span>
        <h1 className={styles.name}>{post.name}</h1>

        <div className={styles.authorRow}>
          <span className={styles.authorName}>
            {post.authorName} {post.authorVerified && <VerifiedBadge />}
          </span>
          {user && user.uid !== post.authorId && (
            <button className="btn btn-sm btn-ghost" onClick={handleFollow}>
              {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
              {following ? 'Siguiendo' : 'Seguir'}
            </button>
          )}
        </div>

        <div className={styles.stats}>
          <button className={liked ? styles.likedBtn : styles.statBtn} onClick={handleLike}>
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {post.likes || 0}
          </button>
          <span className={styles.statBtn}><Eye size={16} /> {post.views || 0}</span>
          <span className={styles.statBtn}><Download size={16} /> {post.downloads || 0}</span>
        </div>

        {post.description && <p className={styles.description}>{post.description}</p>}
        {post.version && <p className={styles.meta}>Versión: {post.version}</p>}

        <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 16 }} onClick={handleDownload}>
          <Download size={18} /> Descargar
        </button>
      </div>

      <CommentsSection postId={id} authorId={post.authorId} />
    </div>
  )
}
