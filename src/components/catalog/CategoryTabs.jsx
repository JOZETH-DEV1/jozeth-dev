// src/components/catalog/CategoryTabs.jsx
import { NavLink } from 'react-router-dom'
import { CATEGORIES } from '../../services/posts'
import styles from './CategoryTabs.module.css'

export default function CategoryTabs() {
  return (
    <nav className={styles.tabs} aria-label="Categorías">
      <div className={`container ${styles.inner}`}>
        <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : styles.tab}>
          ✨ Todo
        </NavLink>
        {CATEGORIES.map(c => (
          <NavLink key={c.id} to={`/categoria/${c.id}`} className={({ isActive }) => isActive ? styles.active : styles.tab}>
            {c.icon} {c.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
