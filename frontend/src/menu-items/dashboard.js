import { IconDashboard, IconPhone, IconRefresh, IconUser, IconSettings, IconUpload } from '@tabler/icons-react';

const icons = { IconDashboard, IconPhone, IconRefresh, IconUser, IconSettings, IconUpload };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {
  id: 'call-analysis',
  title: 'Call Analysis',
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
      id: 'upload-call',
      title: 'Upload Call',
      type: 'item',
      url: '/upload-call',
      icon: icons.IconUpload,
      breadcrumbs: false
    },
    {
      id: 'reports',
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
