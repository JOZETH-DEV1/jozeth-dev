// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'

const rootEl = document.getElementById('root')
const root = ReactDOM.createRoot(rootEl)

function renderFatalError(error) {
  console.error('Error fatal al iniciar la app:', error)
  root.render(
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      background: '#0b0b10', color: '#f2f2f6', fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>⚠️ No se pudo iniciar la app</h1>
      <p style={{ color: '#a6a6b3', maxWidth: 480, marginBottom: 16 }}>
        Revisa las variables de entorno en Cloudflare Pages. Detalle técnico:
      </p>
      <pre style={{
        background: '#16161d', border: '1px solid #26262f', borderRadius: 8,
        padding: 14, maxWidth: '100%', overflow: 'auto', fontSize: '0.78rem',
        color: '#f472b6', textAlign: 'left',
      }}>
        {String(error?.message || error)}
      </pre>
    </div>
  )
}

// Import dinámico: si algo dentro de App (o de firebase.js, importado en
// cadena) lanza un error durante la carga del módulo, lo capturamos aquí
// en vez de dejar la pantalla en blanco sin explicación.
import('./App')
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
  .catch(renderFatalError)
