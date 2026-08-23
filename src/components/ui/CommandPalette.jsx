// src/components/ui/CommandPalette.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { playClickSound, playHoverSound } from '../../utils/interactions'
import styles from './CommandPalette.module.css'

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        if (!isOpen) playClickSound()
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    } else {
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      playClickSound()
      setIsOpen(false)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.palette} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSearch} className={styles.form}>
          <Search className={styles.icon} size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar apps, mods, tutoriales..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={styles.input}
          />
          <button type="button" className={styles.closeBtn} onClick={() => setIsOpen(false)} onMouseEnter={playHoverSound}>
            <X size={20} />
          </button>
        </form>
        <div className={styles.hints}>
          <span>Presiona <strong>Enter</strong> para buscar</span>
          <span>Presiona <strong>Esc</strong> para cerrar</span>
        </div>
      </div>
    </div>
  )
}
