import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const AdminRoute = ({ children }) => {
  // const { isAuthenticated, user } = useSelector((state) => state.auth)
  // const location = useLocation()

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location }} replace />
  // }

  // if (user?.role !== 'admin') {
  //   return <Navigate to="/unauthorized" replace />
  // }

  return children
}

export default AdminRoute
