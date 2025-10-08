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
    let isMounted = true
    const syncAuth = async () => {
      try {
        const storedToken = token || localStorage.getItem('token')
        const storedUserStr = localStorage.getItem('user')
        
        console.log('🔍 AdminRoute - syncAuth check:', {
          hasToken: !!storedToken,
          hasReduxUser: !!user,
          hasStoredUser: !!storedUserStr
        })
        
        if (!storedToken) {
          if (isMounted) setChecking(false)
          return
        }
        
        // Si l'utilisateur Redux est absent, try localStorage first
        if (!user) {
          // First try to use cached user from localStorage (faster, no API call)
          if (storedUserStr) {
            try {
              const cachedUser = JSON.parse(storedUserStr)
              console.log('✅ AdminRoute - Using cached user from localStorage')
              dispatch(loginSuccess({ token: storedToken, user: cachedUser }))
              if (isMounted) setChecking(false)
              return // Don't fetch profile if we have cached user
            } catch (parseError) {
              console.warn('AdminRoute - Failed to parse cached user, will fetch from API:', parseError)
            }
          }
          
          // Only fetch profile if no cached user available and user is admin
          try {
            console.log('📡 AdminRoute - Fetching profile from API...')
            const profile = await authService.getProfile()
            if (profile && isMounted) {
              dispatch(loginSuccess({ token: storedToken, user: profile }))
            }
          } catch (e) {
            console.warn('AdminRoute - Profile fetch failed:', e)
            
            // For admins, be more lenient with API failures
            // Try to use cached user even if profile fetch fails
            if (storedUserStr) {
              try {
                const cachedUser = JSON.parse(storedUserStr)
                if (cachedUser.role === 'admin') {
                  console.log('✅ AdminRoute - Using cached admin user despite API failure')
                  dispatch(loginSuccess({ token: storedToken, user: cachedUser }))
                  if (isMounted) setChecking(false)
                  return
                }
              } catch (parseError) {
                console.error('AdminRoute - Failed to parse cached user:', parseError)
              }
            }
            
            // Only logout if it's a real auth error (401) 
            if (e.response?.status === 401 && isMounted) {
              console.log('AdminRoute - 401 Unauthorized - clearing auth state')
              dispatch(logout())
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              localStorage.removeItem('device_uuid')
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

  if (!effectiveUser || effectiveUser.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default AdminRoute
