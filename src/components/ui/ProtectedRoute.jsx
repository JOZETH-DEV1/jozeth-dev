// src/components/ui/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/entrar" replace />
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />

  return children
}
