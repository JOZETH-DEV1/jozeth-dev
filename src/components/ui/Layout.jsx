// src/components/ui/Layout.jsx
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import CategoryTabs from '../catalog/CategoryTabs'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.layout}>
      <Navbar />
      <CategoryTabs />
      <main className={`container ${styles.main}`}>
        <Outlet />
      </main>
    </div>
  )
}
