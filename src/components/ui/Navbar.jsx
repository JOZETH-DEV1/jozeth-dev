// src/components/ui/Navbar.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, Search, Upload, LogOut, User, Menu, X, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { auth, signOut } from '../../services/firebase'
import VerifiedBadge from './VerifiedBadge'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')

  function handleSearch(e) {
    e.preventDefault()
    if (q.trim()) navigate(`/buscar?q=${encodeURIComponent(q.trim())}`)
  }

  async function handleLogout() {
    await signOut(auth)
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>⚡ Jozeth<span>Dev</span></Link>

        <form className={styles.search} onSubmit={handleSearch}>
          <Search size={16} className={styles.searchIcon} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar APKs, mods, addons..."
            aria-label="Buscar"
          />
        </form>

        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Cambiar tema" title="Cambiar tema">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {user ? (
            <>
              <Link to="/seguidos" className={styles.iconBtn} title="Seguidos">
                <Users size={18} />
              </Link>
              <Link to="/subir" className="btn btn-primary btn-sm">
                <Upload size={15} /> Publicar
              </Link>
              <div className={styles.userMenu}>
                <button className={styles.avatarBtn} onClick={() => setMenuOpen(o => !o)}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className={styles.avatar} />
                    : <div className={styles.avatarFallback}>{user.displayName?.[0]?.toUpperCase()}</div>}
                  {user.verified && <VerifiedBadge />}
                </button>
                {menuOpen && (
                  <div className={styles.dropdown}>
                    <Link to={`/perfil/${user.uid}`} onClick={() => setMenuOpen(false)}>
                      <User size={15} /> Mi perfil
                    </Link>
                    <button onClick={handleLogout}>
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/entrar" className="btn btn-primary btn-sm">Entrar</Link>
          )}

          <button className={styles.iconBtn + ' ' + styles.mobileOnly} onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
