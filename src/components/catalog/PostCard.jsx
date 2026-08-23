import { Link } from 'react-router-dom'
import { Heart, Download, Eye, Bookmark } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { cloudinaryThumb } from '../../services/cloudinary'
import VerifiedBadge from '../ui/VerifiedBadge'
import { CATEGORIES } from '../../services/posts'
import { playHoverSound, playClickSound, triggerHapticFeedback } from '../../utils/interactions'
import styles from './PostCard.module.css'

export default function PostCard({ post, onPreview }) {
  const cat = CATEGORIES.find(c => c.id === post.category)
  const cardRef = useRef(null)
  const [tiltStyle, setTiltStyle] = useState({})
  
  // Feature 6: Favoritos
  const [isSaved, setIsSaved] = useState(false)
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]')
    setIsSaved(saved.includes(post.id))
  }, [post.id])

  const toggleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    playClickSound()
    triggerHapticFeedback()
    const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]')
    if (isSaved) {
      localStorage.setItem('saved_posts', JSON.stringify(saved.filter(id => id !== post.id)))
      setIsSaved(false)
    } else {
      localStorage.setItem('saved_posts', JSON.stringify([...saved, post.id]))
      setIsSaved(true)
    }
  }

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'none'
    })
  }

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
    })
  }
  
  const handleMouseEnter = () => {
    playHoverSound()
  }

  const handleClick = (e) => {
    playClickSound()
    triggerHapticFeedback()
    if (onPreview) onPreview(e)
  }

  const [imgLoaded, setImgLoaded] = useState(false)
  const isDataUrl = post.imageUrl?.startsWith('data:')

  return (
    <Link 
      to={`/post/${post.id}`} 
      className={styles.card}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      style={tiltStyle}
    >
      <div className={styles.thumbWrap}>
        {/* Feature 2: Blur-Up Image Loading */}
        <div className={styles.blurPlaceholder} style={{ 
          backgroundImage: `url(${post.imageUrl && !isDataUrl ? cloudinaryThumb(post.imageUrl, { w: 20, h: 10 }) : ''})`,
          backgroundSize: 'cover',
          filter: (imgLoaded || isDataUrl) ? 'none' : 'blur(10px)',
          transition: 'filter 0.4s ease'
        }}>
          {post.imageUrl ? (
            <img
              src={cloudinaryThumb(post.imageUrl, { w: 600, h: 338 })}
              alt={post.name}
              loading="lazy"
              decoding="async"
              className={styles.thumb}
              style={{ opacity: (imgLoaded || isDataUrl) ? 1 : 0 }}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className={styles.thumbFallback}>{cat?.icon || '📦'}</div>
          )}
        </div>
        {cat && <span className={styles.catBadge}>{cat.icon} {cat.label}</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.headerRow}>
          <h3 className={styles.name}>{post.name}</h3>
          <button className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`} onClick={toggleSave}>
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
        <div className={styles.author}>
          {post.authorName}
          {post.authorVerified && <VerifiedBadge />}
        </div>
        <div className={styles.stats}>
          <span><Heart size={13} /> {post.likes || 0}</span>
          <span><Download size={13} /> {post.downloads || 0}</span>
          <span><Eye size={13} /> {post.views || 0}</span>
        </div>
      </div>
    </Link>
  )
}
