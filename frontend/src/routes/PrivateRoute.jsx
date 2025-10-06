import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import authService from '../services/api/auth.service'
import { loginSuccess, logout } from '../store/slices/authSlice'

/**
 * PrivateRoute
 * - Vérifie authentification via Redux ou localStorage (token)
 * - Charge le profil backend si user manquant (synchronisation uuid/role)
 * - Applique un filtrage par rôle si allowedRoles fourni
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    let isMounted = true
    const syncAuth = async () => {
      try {
        const storedToken = token || localStorage.getItem('token')
        if (!storedToken) {
            if (isMounted) setChecking(false)
            return
        }
        // Si l'utilisateur Redux est absent, tenter de récupérer le profil
        if (!user) {
          try {
            const profile = await authService.getProfile()
            if (profile && isMounted) {
              dispatch(loginSuccess({ token: storedToken, user: profile }))
            }
          } catch (e) {
            console.warn('Profile fetch failed in PrivateRoute:', e)
            if (isMounted) {
              dispatch(logout())
            }
          }
        }
      } finally {
        if (isMounted) setChecking(false)
      }
    }
    syncAuth()
    return () => { isMounted = false }
  }, [user, token, dispatch])

  // Pendant vérification, on peut afficher un loader minimal
  if (checking) {
    return <div className="w-full h-screen flex items-center justify-center text-sm text-muted-foreground">Chargement...</div>
  }

  const effectiveUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })()
  const hasToken = !!(token || localStorage.getItem('token'))

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0) {
    const role = effectiveUser?.role
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}

export default PrivateRoute
