// src/components/ui/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error capturado por ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
          background: '#0b0b10', color: '#f2f2f6', fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>⚠️ Algo salió mal</h1>
          <p style={{ color: '#a6a6b3', maxWidth: 480, marginBottom: 16 }}>
            Ocurrió un error al cargar la aplicación. Detalle técnico abajo — compártelo si pides ayuda.
          </p>
          <pre style={{
            background: '#16161d', border: '1px solid #26262f', borderRadius: 8,
            padding: 14, maxWidth: '100%', overflow: 'auto', fontSize: '0.78rem',
            color: '#f472b6', textAlign: 'left',
          }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 18, padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', color: '#fff',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
