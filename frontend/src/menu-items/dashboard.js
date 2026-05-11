import { IconDashboard, IconPhone, IconRefresh, IconUser, IconSettings, IconUpload , IconUsers,IconReportAnalytics } from '@tabler/icons-react';

const icons = { IconDashboard, IconPhone, IconRefresh, IconUser, IconSettings, IconUpload,  IconUsers,IconReportAnalytics  };

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
   {
  id: 'users',
  title: 'Users',
  type: 'item',
  url: '/users',
  icon: icons.IconUsers,
   breadcrumbs: false
},
    {
  id: 'reports',
  title: 'Reports',
  type: 'item',
  url: '/reports',
  icon: IconReportAnalytics ,
  breadcrumbs: false
},
    {
      id: 'Profile',
      title: 'Profile',
      type: 'item',
      url: '/profile',
      icon: icons.IconUser,
      breadcrumbs: false
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: '/settings',
      icon: icons.IconSettings,
      breadcrumbs: false
    }

    
  ]
};

export default dashboard;
