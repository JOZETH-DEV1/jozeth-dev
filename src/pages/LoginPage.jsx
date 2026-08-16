// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, GoogleAuthProvider, signInWithPopup,
} from '../services/firebase'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
        if (form.name.trim()) await updateProfile(cred.user, { displayName: form.name.trim() })
        toast.success('¡Cuenta creada!')
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password)
        toast.success('¡Bienvenido de vuelta!')
      }
      navigate('/')
    } catch (err) {
      toast.error(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      navigate('/')
    } catch {
      toast.error('No se pudo iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.card}`}>
        <h1 className={styles.title}>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</h1>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="inp-group">
              <label className="inp-label">Nombre</label>
              <input className="inp" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
          )}
          <div className="inp-group">
            <label className="inp-label">Correo</label>
            <input className="inp" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="inp-group">
            <label className="inp-label">Contraseña</label>
            <input className="inp" type="password" minLength={6} value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        <button className="btn btn-ghost btn-lg" style={{ width: '100%', marginTop: 10 }} onClick={handleGoogle} disabled={loading}>
          Continuar con Google
        </button>

        <p className={styles.switch}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Regístrate' : 'Entra'}
          </button>
        </p>
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos',
    'auth/email-already-in-use': 'Ese correo ya está registrado',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email': 'Correo inválido',
  }
  return map[code] || 'Ocurrió un error, intenta de nuevo'
}
