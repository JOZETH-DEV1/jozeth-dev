// src/pages/HomePage.jsx
import PostGrid from '../components/catalog/PostGrid'
import styles from './HomePage.module.css'

export default function HomePage() {
  return (
    <div className={styles.homeContainer}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className="animate-fade-in-up">
            Descubre lo <span className={styles.highlight}>Extraordinario</span>
          </h1>
          <p className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Explora una colección curada de momentos, ideas y creaciones sacadas de película. 
            Sumérgete en la experiencia.
          </p>
          <div className={styles.heroActions + " animate-fade-in-up"} style={{ animationDelay: '0.2s' }}>
            <button className="btn btn-primary btn-lg">Explorar Ahora</button>
            <button className="btn btn-outline btn-lg">Saber Más</button>
          </div>
        </div>
        <div className={styles.heroGlow}></div>
      </header>
      
      <main className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className={styles.sectionTitle}>
          <h2>Últimos Lanzamientos</h2>
          <div className={styles.line}></div>
        </div>
        <PostGrid category={null} />
      </main>
    </div>
  )
}
