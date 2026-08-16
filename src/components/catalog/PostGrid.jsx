// src/components/catalog/PostGrid.jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { getPosts } from '../../services/posts'
import PostCard from './PostCard'
import styles from './PostGrid.module.css'

export default function PostGrid({ category = null }) {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor]   = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef(null)

  const load = useCallback(async (isFirst = false) => {
    if (isFirst) setLoading(true); else setLoadingMore(true)
    try {
      const { posts: newPosts, lastDoc, hasMore: more } = await getPosts({
        category, cursor: isFirst ? null : cursor, pageSize: 16,
      })
      setPosts(prev => isFirst ? newPosts : [...prev, ...newPosts])
      setCursor(lastDoc)
      setHasMore(more)
    } finally {
      setLoading(false); setLoadingMore(false)
    }
  }, [category, cursor])

  useEffect(() => {
    setPosts([]); setCursor(null); setHasMore(true)
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  useEffect(() => {
    if (!hasMore || loading) return
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore) load(false)
    }, { rootMargin: '400px' })
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, loadingMore, cursor])

  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ aspectRatio: '1/1.35' }} />
        ))}
      </div>
    )
  }

  if (!posts.length) {
    return <div className={styles.empty}>📭 Aún no hay publicaciones aquí.</div>
  }

  return (
    <>
      <div className={styles.grid}>
        {posts.map(p => <PostCard key={p.id} post={p} />)}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className={styles.sentinel}>
          {loadingMore && <span className="spinner" />}
        </div>
      )}
    </>
  )
}
