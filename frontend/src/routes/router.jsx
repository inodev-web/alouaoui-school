import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'
import StudentLayout from '../components/common/Layout/StudentLayout'
import AdminLayout from '../components/common/Layout/AdminLayout'

// Lazy load components for better performance
const HomePage = lazy(() => import('../pages/public/HomePage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))

// Student pages
const StudentDashboardPage = lazy(() => import('../pages/student/DashboardPage'))
const StudentProfilePage = lazy(() => import('../pages/student/ProfilePage'))
const StudentChaptersPage = lazy(() => import('../pages/student/ChaptersPage'))
const StudentCoursePage = lazy(() => import('../pages/student/CoursePage'))
const StudentLivesPage = lazy(() => import('../pages/student/LivesPage'))

// Admin pages
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'))
const AdminStudentsPage = lazy(() => import('../pages/admin/StudentsPage'))
const AdminTeachersPage = lazy(() => import('../pages/admin/TeachersPage'))
const AdminSessionsPage = lazy(() => import('../pages/admin/SessionsPage'))
const AdminChaptersPage = lazy(() => import('../pages/admin/ChaptersAdminPage'))
const AdminCheckInPage = lazy(() => import('../pages/admin/CheckInPage'))
const AdminEventsPage = lazy(() => import('../pages/admin/EventsPage'))

// Error pages
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <img src=".\public\loading.gif" alt="loading" />
  </div>
)

const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // Student routes (protected)
  {
    path: '/student',
    element: (
      <PrivateRoute allowedRoles={['student']}>
        <StudentLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <StudentDashboardPage />,
      },
      {
        path: 'profile',
        element: <StudentProfilePage />,
      },
      {
        path: 'chapters',
        element: <StudentChaptersPage />,
      },
      {
        path: 'course',
        element: <StudentCoursePage />,
      },
      {
        path: 'lives',
        element: <StudentLivesPage />,
      },
    ],
  },

  // Admin routes (protected)
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'students',
        element: <AdminStudentsPage />,
      },
      {
        path: 'teachers',
        element: <AdminTeachersPage />,
      },
      {
        path: 'sessions',
        element: <AdminSessionsPage />,
      },
      {
        path: 'chapters',
        element: <AdminChaptersPage />,
      },
      {
        path: 'check-in',
        element: <AdminCheckInPage />,
      },
      {
        path: 'events',
        element: <AdminEventsPage />,
      },
      {
        path: 'settings',
        element: <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage system settings and preferences</p>
          </div>
        </div>,
      },
    ],
  },

  // Error routes
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

export default AppRouter
