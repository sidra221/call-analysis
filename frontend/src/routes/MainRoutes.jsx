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

// Logs page فقط
const LogsPage = Loadable(lazy(() => import('pages/Logs')));

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),

  children: [
    {
      path: '/',
      element: <DashboardPage />
    },

    {
      path: 'dashboard',
      element: <DashboardPage />
    },

    // ================= CALLS =================
    {
      path: 'calls',
      element: (
        <ProtectedRoute allowedRoles={['manager', 'qa']}>
          <CallsPage />
        </ProtectedRoute>
      )
    },

    // ================= FOLLOWUPS =================
    {
      path: 'followups',
      element: (
        <ProtectedRoute allowedRoles={['qa']}>
          <FollowupsPage />
        </ProtectedRoute>
      )
    },

    // ================= REPORTS =================
    {
      path: 'reports',
      element: (
        <ProtectedRoute allowedRoles={['manager', 'qa']}>
          <ReportsPage />
        </ProtectedRoute>
      )
    },

    // ================= USERS =================
    {
      path: 'users',
      element: (
        <ProtectedRoute allowedRoles={['manager']}>
          <UsersPage />
        </ProtectedRoute>
      )
    },

    // ================= LOGS =================
    {
      path: 'logs',
      element: (
        <ProtectedRoute allowedRoles={['manager']}>
          <LogsPage />
        </ProtectedRoute>
      )
    },

    // ================= PROFILE =================
    {
      path: 'profile',
      element: <ProfilePage />
    }
  ]
};

export default MainRoutes;