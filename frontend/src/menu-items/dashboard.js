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
      id: 'profile',
      title: 'profile',
      type: 'item',
      url: '/profile',
      icon: icons.IconSettings2,
      breadcrumbs: false
    }

    
  ]
};

export default dashboard;
