// src/pages/UploadPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { createPost, CATEGORIES } from '../services/posts'
import { uploadImage, validateImageFile } from '../services/cloudinary'
import { uploadToArchive, validateApkFile } from '../services/archive'
import { auth } from '../services/firebase'
import styles from './UploadPage.module.css'

export default function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', description: '', category: 'apks', version: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [apkFile, setApkFile] = useState(null)
  const [externalLink, setExternalLink] = useState('')
  const [useExternalLink, setUseExternalLink] = useState(false)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      validateImageFile(file)
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    } catch (err) { toast.error(err.message) }
  }

  function handleApkChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      validateApkFile(file)
      setApkFile(file)
    } catch (err) { toast.error(err.message) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    if (!useExternalLink && !apkFile) return toast.error('Sube un archivo o usa un enlace externo')
    if (useExternalLink && !externalLink.trim()) return toast.error('Escribe el enlace de descarga')

    setLoading(true)
    try {
      let imageUrl = ''
      if (imageFile) {
        setProgressLabel('☁️ Subiendo imagen...'); setProgress(10)
        const img = await uploadImage(imageFile, 'posts')
        imageUrl = img.url
      }

      let downloadUrl = externalLink.trim()
      if (!useExternalLink && apkFile) {
        const idToken = await auth.currentUser.getIdToken()
        const result = await uploadToArchive(apkFile, idToken, (pct, label) => {
          setProgress(pct); setProgressLabel(label)
        })
        downloadUrl = result.url
      }

      setProgressLabel('💾 Publicando...'); setProgress(97)
      const postId = await createPost({
        name: form.name, description: form.description, category: form.category,
        imageUrl, downloadUrl, version: form.version,
      }, user)

      setProgress(100)
      toast.success('¡Publicado con éxito!')
      navigate(`/post/${postId}`)
    } catch (err) {
      toast.error(err.message, { duration: 7000 })
    } finally {
      setLoading(false); setProgress(0); setProgressLabel('')
    }
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Nueva publicación</h1>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 20 }}>
        <div className="inp-group">
          <label className="inp-label">Categoría</label>
          <div className={styles.catGrid}>
            {CATEGORIES.map(c => (
              <button
                type="button" key={c.id}
                className={form.category === c.id ? styles.catActive : styles.catBtn}
                onClick={() => set('category', c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="inp-group">
          <label className="inp-label">Nombre</label>
          <input className="inp" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>

        <div className="inp-group">
          <label className="inp-label">Descripción</label>
          <textarea className="inp" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div className="inp-group">
          <label className="inp-label">Versión (opcional)</label>
          <input className="inp" value={form.version} onChange={e => set('version', e.target.value)} placeholder="Ej: 1.2.0" />
        </div>

        <div className="inp-group">
          <label className="inp-label">Imagen / miniatura</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && <img src={imagePreview} alt="" className={styles.preview} />}
        </div>

        <div className="inp-group">
          <div className={styles.toggleRow}>
            <label className="inp-label" style={{ margin: 0 }}>Archivo de descarga</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUseExternalLink(u => !u)}>
              {useExternalLink ? '📎 Usar enlace externo' : '📤 Subir archivo'}
            </button>
          </div>
          {useExternalLink ? (
            <input className="inp" placeholder="https://..." value={externalLink} onChange={e => setExternalLink(e.target.value)} />
          ) : (
            <input type="file" accept=".apk,.zip,.rar,.7z,.apks,.xapk,.tar,.gz" onChange={handleApkChange} />
          )}
          {apkFile && !useExternalLink && (
            <p style={{ fontSize: '0.8rem', color: 'var(--t3)', marginTop: 6 }}>
              {apkFile.name} · {(apkFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
        </div>

        {loading && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}><div style={{ width: `${progress}%` }} /></div>
            <p>{progressLabel}</p>
          </div>
        )}

        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Publicar'}
        </button>
      </form>
    </div>
  )
}
