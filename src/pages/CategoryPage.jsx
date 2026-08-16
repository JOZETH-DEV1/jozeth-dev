// src/pages/CategoryPage.jsx
import { useParams, Navigate } from 'react-router-dom'
import PostGrid from '../components/catalog/PostGrid'
import { CATEGORIES } from '../services/posts'

export default function CategoryPage() {
  const { category } = useParams()
  const valid = CATEGORIES.some(c => c.id === category)
  if (!valid) return <Navigate to="/" replace />
  return <PostGrid category={category} />
}
