import {
  IconDashboard,
  IconPhone,
  IconRefresh,
  IconUsers,
  IconReportAnalytics,
  IconSettings2,
  IconClipboardList
} from '@tabler/icons-react';

const icons = {
  IconDashboard,
  IconPhone,
  IconRefresh,
  IconUsers,
  IconReportAnalytics,
  IconSettings2,
  IconClipboardList
};

const dashboard = (role) => ({
  type: 'group',

  children:
    role === 'manager'
      ? [
          {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'item',
            url: '/dashboard',
            icon: icons.IconDashboard,
            breadcrumbs: false
          },

          {
            id: 'calls',
            title: 'Calls',
            type: 'item',
            url: '/calls',
            icon: icons.IconPhone,
            breadcrumbs: false
          },

          {
            id: 'reports',
            title: 'Published Reports',
            type: 'item',
            url: '/reports',
            icon: icons.IconReportAnalytics,
            breadcrumbs: false
          },

          {
            id: 'logs',
            title: 'Logs',
            type: 'item',
            url: '/logs',
            icon: icons.IconClipboardList,
            breadcrumbs: false
          },

          {
            id: 'users',
            title: 'Users',
            type: 'item',
            url: '/users',
            icon: icons.IconUsers,
            breadcrumbs: false
          },

          {
            id: 'profile',
            title: 'Profile',
            type: 'item',
            url: '/profile',
            icon: icons.IconSettings2,
            breadcrumbs: false
          }
        ]
      : [
          {
            id: 'dashboard',
            title: 'QA Dashboard',
            type: 'item',
            url: '/dashboard',
            icon: icons.IconDashboard,
            breadcrumbs: false
          },

          {
            id: 'calls',
            title: 'Calls',
            type: 'item',
            url: '/calls',
            icon: icons.IconPhone,
            breadcrumbs: false
          },

          {
            id: 'followups',
            title: 'Follow-ups',
            type: 'item',
            url: '/followups',
            icon: icons.IconRefresh,
            breadcrumbs: false
          },

          {
            id: 'reports',
            title: 'Reports',
            type: 'item',
            url: '/reports',
            icon: icons.IconReportAnalytics,
            breadcrumbs: false
          },

          {
            id: 'profile',
            title: 'Profile',
            type: 'item',
            url: '/profile',
            icon: icons.IconSettings2,
            breadcrumbs: false
          }
        ]
});

export default dashboard;