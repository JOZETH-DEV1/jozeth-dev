// src/components/ui/VerifiedBadge.jsx
import styles from './VerifiedBadge.module.css'

export default function VerifiedBadge({ large = false, title = 'Verificado' }) {
  return (
    <span
      className={`${styles.badge} ${large ? styles.large : ''}`}
      title={title}
      aria-label="Verificado"
    >
      <svg viewBox="0 0 24 24" className={styles.svg} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="premiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#38bdf8" />
            <stop offset="50%"  stopColor="#818cf8" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Círculo de fondo cristalino */}
        <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.05)" />
        {/* Borde degradado fino */}
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="url(#premiumGrad)" strokeWidth="1" opacity="0.8" />
        
        {/* Check principal con glow */}
        <path 
          d="M7.5 12.5 L10.5 15.5 L16.5 8.5" 
          fill="none" 
          stroke="url(#premiumGrad)" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        {/* Check blanco central brillante */}
        <path 
          d="M7.5 12.5 L10.5 15.5 L16.5 8.5" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      <div className={styles.sheen}></div>
    </span>
  )
}
