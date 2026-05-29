import { lazy } from 'react';
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import ProtectedRoute from './ProtectedRoute';

const DashboardPage = Loadable(lazy(() => import('pages/Dashboard')));
const CallsPage = Loadable(lazy(() => import('pages/Calls')));
const FollowupsPage = Loadable(lazy(() => import('pages/Followups')));
const ReportsPage = Loadable(lazy(() => import('pages/Reports')));
const ProfilePage = Loadable(lazy(() => import('pages/Profile')));
const UsersPage = Loadable(lazy(() => import('pages/Users')));
const LogsPage = Loadable(lazy(() => import('pages/Logs')));

// Export as function to get fresh routes each time
export default function getMainRoutes() {
  return [
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'dashboard', element: <DashboardPage /> },
        { path: 'profile', element: <ProfilePage /> },
        {
          path: 'calls',
          element: (
            <ProtectedRoute allowedRoles={['manager', 'qa']}>
              <CallsPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'followups',
          element: (
            <ProtectedRoute allowedRoles={['qa']}>
              <FollowupsPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'reports',
          element: (
            <ProtectedRoute allowedRoles={['manager', 'qa']}>
              <ReportsPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'users',
          element: (
            <ProtectedRoute allowedRoles={['manager']}>
              <UsersPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'logs',
          element: (
            <ProtectedRoute allowedRoles={['manager']}>
              <LogsPage />
            </ProtectedRoute>
          )
        }
      ]
    }
  ];
}