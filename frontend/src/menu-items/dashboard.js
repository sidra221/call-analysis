const user = JSON.parse(localStorage.getItem('authUser'));
const role = user?.role;

import { IconDashboard, IconPhone, IconRefresh, IconUser, IconSettings2, IconUpload , IconUsers,IconReportAnalytics } from '@tabler/icons-react';

const icons = { IconDashboard, IconPhone, IconRefresh, IconUser, IconSettings2, IconUpload,  IconUsers,IconReportAnalytics  };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {

  
  type: 'group',
  children: [
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
      id: 'followups',
      title: 'Follow-ups',
      type: 'item',
      url: '/followups',
      icon: icons.IconRefresh,
      breadcrumbs: false
    },
  
    ...(role === 'manager'
      ? [{
          id: 'users',
          title: 'Users',
          type: 'item',
          url: '/users',
          icon: icons.IconUsers,
          breadcrumbs: false
        }]
      : []),
  
    ...(['manager', 'qa'].includes(role)
      ? [{
          id: 'reports',
          title: 'Reports',
          type: 'item',
          url: '/reports',
          icon: icons.IconReportAnalytics,
          breadcrumbs: false
        }]
      : []),
  
    {
      id: 'profile',
      title: 'Profile',
      type: 'item',
      url: '/profile',
      icon: icons.IconSettings2,
      breadcrumbs: false
    }
  ]

};

export default dashboard;
