// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/ui/Layout'
import ProtectedRoute from './components/ui/ProtectedRoute'
import ErrorBoundary from './components/ui/ErrorBoundary'

import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import LoginPage from './pages/LoginPage'
import UploadPage from './pages/UploadPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import FollowingPage from './pages/FollowingPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" toastOptions={{
            style: { background: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border)' },
          }} />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/categoria/:category" element={<CategoryPage />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/post/:id" element={<PostDetailPage />} />
              <Route path="/perfil/:uid" element={<ProfilePage />} />
              <Route path="/entrar" element={<LoginPage />} />
              <Route
                path="/subir"
                element={<ProtectedRoute><UploadPage /></ProtectedRoute>}
              />
              <Route
                path="/seguidos"
                element={<ProtectedRoute><FollowingPage /></ProtectedRoute>}
              />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}
