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
  id: 'dashboard-group',
  title: '',

  children:
    role === 'manager'
      ? [
          {
            id: 'dashboard',
            titleKey: 'nav.dashboard',
            type: 'item',
            url: '/dashboard',
            icon: icons.IconDashboard,
            breadcrumbs: false
          },
          {
            id: 'calls',
            titleKey: 'nav.calls',
            type: 'item',
            url: '/calls',
            icon: icons.IconPhone,
            breadcrumbs: false
          },
          {
            id: 'reports',
            titleKey: 'nav.reports',
            type: 'item',
            url: '/reports',
            icon: icons.IconReportAnalytics,
            breadcrumbs: false
          },
          {
            id: 'logs',
            titleKey: 'nav.logs',
            type: 'item',
            url: '/logs',
            icon: icons.IconClipboardList,
            breadcrumbs: false
          },
          {
            id: 'users',
            titleKey: 'nav.users',
            type: 'item',
            url: '/users',
            icon: icons.IconUsers,
            breadcrumbs: false
          },
          {
            id: 'profile',
            titleKey: 'nav.settings',
            type: 'item',
            url: '/profile',
            icon: icons.IconSettings2,
            breadcrumbs: false
          }
        ]
      : [
          {
            id: 'dashboard',
            titleKey: 'nav.dashboard',
            type: 'item',
            url: '/dashboard',
            icon: icons.IconDashboard,
            breadcrumbs: false
          },
          {
            id: 'calls',
            titleKey: 'nav.calls',
            type: 'item',
            url: '/calls',
            icon: icons.IconPhone,
            breadcrumbs: false
          },
          {
            id: 'followups',
            titleKey: 'nav.followups',
            type: 'item',
            url: '/followups',
            icon: icons.IconRefresh,
            breadcrumbs: false
          },
          {
            id: 'reports',
            titleKey: 'nav.reports',
            type: 'item',
            url: '/reports',
            icon: icons.IconReportAnalytics,
            breadcrumbs: false
          },
          {
            id: 'profile',
            titleKey: 'nav.settings',
            type: 'item',
            url: '/profile',
            icon: icons.IconSettings2,
            breadcrumbs: false
          }
        ]
});

export default dashboard;
