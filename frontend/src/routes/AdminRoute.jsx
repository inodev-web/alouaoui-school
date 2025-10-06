import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import authService from '../services/api/auth.service'
import { loginSuccess, logout } from '../store/slices/authSlice'

const AdminRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    const ensureAuth = async () => {
      try {
        const storedToken = token || localStorage.getItem('token')
        if (!storedToken) return
        if (!user) {
          try {
            const profile = await authService.getProfile()
            if (profile && mounted) {
              dispatch(loginSuccess({ token: storedToken, user: profile }))
            }
          } catch (e) {
            if (mounted) dispatch(logout())
          }
        }
      } finally {
        if (mounted) setChecking(false)
      }
    }
    ensureAuth()
    return () => { mounted = false }
  }, [user, token, dispatch])

  if (checking) {
    return <div className="w-full h-screen flex items-center justify-center text-sm text-muted-foreground">Chargement...</div>
  }

  const effectiveUser = user || (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  const hasToken = !!(token || localStorage.getItem('token'))

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!effectiveUser || effectiveUser.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default AdminRoute
