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
    {
      path: 'calls',
      element: <CallsPage />
    },
    {
      path: 'followups',
      element: <FollowupsPage />
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
      path: 'profile',
      element: <ProfilePage />
    },
    {
      path: 'users',
      element: (
        <ProtectedRoute allowedRoles={['manager']}>
          <UsersPage />
        </ProtectedRoute>
      )
    }
  ]
};

export default MainRoutes;