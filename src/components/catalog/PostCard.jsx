// src/components/catalog/PostCard.jsx
import { Link } from 'react-router-dom'
import { Heart, Download, Eye } from 'lucide-react'
import { cloudinaryThumb } from '../../services/cloudinary'
import VerifiedBadge from '../ui/VerifiedBadge'
import { CATEGORIES } from '../../services/posts'
import styles from './PostCard.module.css'

export default function PostCard({ post }) {
  const cat = CATEGORIES.find(c => c.id === post.category)

  return (
    <Link to={`/post/${post.id}`} className={styles.card}>
      <div className={styles.thumbWrap}>
        {post.imageUrl ? (
          <img
            src={cloudinaryThumb(post.imageUrl, { w: 400, h: 400 })}
            alt={post.name}
            loading="lazy"
            decoding="async"
            className={styles.thumb}
          />
        ) : (
          <div className={styles.thumbFallback}>{cat?.icon || '📦'}</div>
        )}
        {cat && <span className={styles.catBadge}>{cat.icon} {cat.label}</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{post.name}</h3>
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
