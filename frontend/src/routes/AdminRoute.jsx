import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import authService from '../services/api/auth.service'
import { loginSuccess, logout } from '../store/slices/authSlice'

const AdminRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get stored values
        const storedToken = localStorage.getItem('token')
        const storedUserStr = localStorage.getItem('user')
        
        console.log('🔍 AdminRoute - Initializing auth:', {
          hasStoredToken: !!storedToken,
          hasReduxUser: !!user,
          hasStoredUser: !!storedUserStr
        })

        // If no token, redirect to login
        if (!storedToken) {
          console.log('❌ No token found, redirecting to login')
          setIsLoading(false)
          return
        }

        // If we already have a user in Redux, we're good
        if (user) {
          console.log('✅ User already in Redux, proceeding')
          setIsLoading(false)
          return
        }

        // If we have a stored user, validate the token
        if (storedUserStr) {
          try {
            const storedUser = JSON.parse(storedUserStr)
            
            // Validate token with API
            console.log('📡 Validating token with API...')
            const profile = await authService.getProfile()
            
            // If API call succeeds, use the fresh profile data
            if (profile) {
              console.log('✅ Token valid, updating Redux with fresh data')
              dispatch(loginSuccess({ token: storedToken, user: profile }))
              setIsLoading(false)
              return
            }
          } catch (apiError) {
            console.warn('⚠️ API validation failed:', apiError)
            
            // If 401, token is invalid
            if (apiError.response?.status === 401) {
              console.log('❌ Token invalid (401), clearing auth state')
              dispatch(logout())
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              localStorage.removeItem('device_uuid')
              setIsLoading(false)
              return
            }
            
            // For other errors, try using stored user as fallback
            try {
              const storedUser = JSON.parse(storedUserStr)
              if (storedUser.role === 'admin') {
                console.log('⚠️ Using stored admin user as fallback')
                dispatch(loginSuccess({ token: storedToken, user: storedUser }))
                setIsLoading(false)
                return
              }
            } catch (parseError) {
              console.error('❌ Failed to parse stored user:', parseError)
            }
          }
        }

        // If we get here, something went wrong
        console.log('❌ No valid authentication found, clearing state')
        dispatch(logout())
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('device_uuid')
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        dispatch(logout())
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('device_uuid')
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    // Only run once when component mounts
    if (!isInitialized) {
      initializeAuth()
    }
  }, []) // Empty dependency array - only run once

  // Show loading while initializing
  if (isLoading || !isInitialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  const currentUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })()

  const hasToken = !!(token || localStorage.getItem('token'))

  // Redirect to login if no token
  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect to unauthorized if not admin
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  // User is authenticated and is admin, render children
  return children
}

export default AdminRoute
