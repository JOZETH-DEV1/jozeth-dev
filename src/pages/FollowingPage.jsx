// src/pages/FollowingPage.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getFollowedPosts } from '../services/social'
import PostCard from '../components/catalog/PostCard'
import gridStyles from '../components/catalog/PostGrid.module.css'

export default function FollowingPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getFollowedPosts(user.uid).then(setPosts).finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className={gridStyles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ aspectRatio: '1/1.35' }} />
        ))}
      </div>
    )
  }

  if (!posts.length) {
    return <div className={gridStyles.empty}>📭 Sigue a algunos creadores para ver sus publicaciones aquí.</div>
  }

  return (
    <div className={gridStyles.grid}>
      {posts.map(p => <PostCard key={p.id} post={p} />)}
    </div>
  )
}
