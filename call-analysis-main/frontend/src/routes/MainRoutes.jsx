import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import ProtectedRoute from './ProtectedRoute';

const DashboardPage = Loadable(lazy(() => import('pages/Dashboard')));
const CallsPage = Loadable(lazy(() => import('pages/Calls')));
const FollowupsPage = Loadable(lazy(() => import('pages/Followups')));
const ReportsPage = Loadable(lazy(() => import('pages/Reports')));
const ProfilePage = Loadable(lazy(() => import('pages/Profile')));
const SettingsPage = Loadable(lazy(() => import('pages/Settings')));
const UsersPage = Loadable(lazy(() => import("pages/Users")));

// ==============================|| MAIN ROUTING ||============================== //

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
      element: <ReportsPage />
    },
    {
      path: 'profile',
      element: <ProfilePage />
    },
    {
      path: 'settings',
      element: <SettingsPage />
    },
    {
      path: 'users',
      element: <UsersPage />
    }
  ]
};

export default MainRoutes;
