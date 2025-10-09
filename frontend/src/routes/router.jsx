import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'
import StudentLayout from '../components/common/Layout/StudentLayout'
import AdminLayout from '../components/common/Layout/AdminLayout'

// Lazy load components for better performance
const HomePage = lazy(() => import('@/pages/public/HomePage.jsx'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage.jsx'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage.jsx'))

// Student pages
const StudentProfilePage = lazy(() => import('@/pages/student/ProfilePage.jsx'))
const StudentChaptersPage = lazy(() => import('@/pages/student/ChaptersPage.jsx'))
const StudentCoursePage = lazy(() => import('@/pages/student/CoursePage.jsx'))
const StudentLivesPage = lazy(() => import('@/pages/student/LivesPage.jsx'))
const StudentSettingsPage = lazy(() => import('@/pages/student/SettingsPage.jsx'))

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage.jsx'))
const AdminStudentsPage = lazy(() => import('@/pages/admin/StudentsPage.jsx'))
const AdminTeachersPage = lazy(() => import('@/pages/admin/TeachersPage.jsx'))
const AdminSessionsPage = lazy(() => import('@/pages/admin/SessionsPage.jsx'))
const AdminChaptersPage = lazy(() => import('@/pages/admin/ChaptersAdminPage.jsx'))
const AdminCheckInPage = lazy(() => import('@/pages/admin/CheckInPage.jsx'))
const AdminEventsPage = lazy(() => import('@/pages/admin/EventsPage.jsx'))

// Error pages
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'))
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage.jsx'))

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
      {
        path: 'settings',
        element: <StudentSettingsPage />,
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
