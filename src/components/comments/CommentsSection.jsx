// src/components/comments/CommentsSection.jsx
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { addComment, deleteComment, getComments } from '../../services/social'
import VerifiedBadge from '../ui/VerifiedBadge'
import styles from './CommentsSection.module.css'

export default function CommentsSection({ postId, authorId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    getComments(postId).then(setComments).finally(() => setLoading(false))
  }, [postId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) { toast.error('Inicia sesión para comentar'); return }
    if (!text.trim()) return
    setSending(true)
    try {
      await addComment(postId, user, text)
      setComments(prev => [{ id: 'tmp-' + Date.now(), uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, verified: user.verified, text: text.trim(), createdAt: null }, ...prev])
      setText('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment(postId, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {
      toast.error('No se pudo eliminar')
    }
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Comentarios ({comments.length})</h2>

      {user ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className="inp" placeholder="Escribe un comentario..."
            value={text} onChange={e => setText(e.target.value)} maxLength={500}
          />
          <button className="btn btn-primary btn-sm" disabled={sending || !text.trim()}>
            {sending ? <span className="spinner" /> : 'Enviar'}
          </button>
        </form>
      ) : (
        <p className={styles.loginHint}>Inicia sesión para comentar.</p>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 60, marginTop: 12 }} />
      ) : comments.length === 0 ? (
        <p className={styles.empty}>Sé el primero en comentar.</p>
      ) : (
        <ul className={styles.list}>
          {comments.map(c => (
            <li key={c.id} className={styles.item}>
              {c.photoURL
                ? <img src={c.photoURL} alt="" className={styles.avatar} />
                : <div className={styles.avatarFallback}>{c.displayName?.[0]?.toUpperCase()}</div>}
              <div className={styles.body}>
                <div className={styles.head}>
                  <strong>{c.displayName}</strong>
                  {c.verified && <VerifiedBadge />}
                  {c.createdAt?.toDate && (
                    <span className={styles.time}>
                      {formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true, locale: es })}
                    </span>
                  )}
                </div>
                <p className={styles.text}>{c.text}</p>
              </div>
              {user && (user.uid === c.uid || user.uid === authorId || user.isAdmin) && (
                <button className={styles.delBtn} onClick={() => handleDelete(c.id)} aria-label="Eliminar">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
