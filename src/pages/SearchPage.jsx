// src/pages/SearchPage.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Fuse from 'fuse.js'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../services/firebase'
import PostCard from '../components/catalog/PostCard'
import gridStyles from '../components/catalog/PostGrid.module.css'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    // Trae un lote reciente y filtra en cliente — suficiente para un catálogo
    // de tamaño moderado sin pagar por un servicio de búsqueda dedicado.
    getDocs(query(collection(db, 'posts'), where('status', '==', 'active'), limit(300)))
      .then(snap => {
        if (!active) return
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (!q.trim()) { setResults([]); return }
        const fuse = new Fuse(all, { keys: ['name', 'description'], threshold: 0.35 })
        setResults(fuse.search(q).map(r => r.item))
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [q])

  return (
    <div>
      <h1 style={{ fontSize: '1.1rem', margin: '16px 0 4px' }}>
        Resultados para "{q}"
      </h1>
      {loading ? (
        <div className={gridStyles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1/1.35' }} />
          ))}
        </div>
      ) : results.length ? (
        <div className={gridStyles.grid}>
          {results.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      ) : (
        <div className={gridStyles.empty}>🔍 Sin resultados.</div>
      )}
    </div>
  )
}
