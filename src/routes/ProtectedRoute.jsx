import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

function SessionLoading() {
  return <main className="loading-screen"><span className="spinner"/><span>Checking your workspace…</span></main>
}

export default function ProtectedRoute({ children, guestOnly = false }) {
  const { user, checking } = useAuth()
  if (checking) return <SessionLoading/>
  if (guestOnly && user) return <Navigate to="/dashboard" replace/>
  if (!guestOnly && !user) return <Navigate to="/login" replace/>
  return children
}
