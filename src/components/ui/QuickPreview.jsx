// src/components/ui/QuickPreview.jsx
import { Link } from 'react-router-dom'
import { X, Heart, Download, Eye, ExternalLink } from 'lucide-react'
import { cloudinaryThumb } from '../../services/cloudinary'
import { playClickSound, playHoverSound } from '../../utils/interactions'
import styles from './QuickPreview.module.css'

export default function QuickPreview({ post, onClose }) {
  if (!post) return null

  const handleClose = (e) => {
    e.stopPropagation();
    playClickSound();
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose} onMouseEnter={playHoverSound}>
          <X size={20} />
        </button>
        
        <div className={styles.imageWrap}>
          {post.imageUrl ? (
            <img src={cloudinaryThumb(post.imageUrl, { w: 800, h: 450 })} alt={post.name} className={styles.image} />
          ) : (
            <div className={styles.fallback}>📦</div>
          )}
        </div>
        
        <div className={styles.content}>
          <h2 className={styles.title}>{post.name}</h2>
          <p className={styles.desc}>{post.description}</p>
          
          <div className={styles.meta}>
            <div className={styles.stats}>
              <span><Heart size={16} /> {post.likes || 0}</span>
              <span><Download size={16} /> {post.downloads || 0}</span>
              <span><Eye size={16} /> {post.views || 0}</span>
            </div>
            
            <Link to={`/post/${post.id}`} className="btn btn-primary" onClick={playClickSound} onMouseEnter={playHoverSound}>
              Ver Completo <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
