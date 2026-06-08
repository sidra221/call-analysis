export const roleColors = {
  manager: { bg: '#ede7f6', color: '#5e35b1' },
  agent: { bg: '#e3f2fd', color: '#1e88e5' },
  qa: { bg: '#fff3e0', color: '#ef6c00' }
};

export const defaultRoleColor = { bg: '#f5f5f5', color: '#757575' };

export const getRoleColor = (role) => {
  const key = (role || '').toLowerCase();
  return roleColors[key] || defaultRoleColor;
};

export const actionColors = {
  upload_call: 'primary.main',
  delete_call: 'error.main',
  call_processing: 'warning.main',
  call_status_change: 'secondary.main',
  review_call: 'success.main',
  publish_report: 'secondary.dark',
  generate_report: 'secondary.main',
  delete_report: 'error.dark',
  user_created: 'success.dark',
  user_deleted: 'error.main',
  create_followup: 'success.main',
  delete_followup: 'error.main',
  update_followup: 'warning.main'
};

export const getActionColor = (action) => actionColors[action] || 'text.secondary';

export const resolveThemeColor = (theme, path) => {
  const [group, shade = 'main'] = path.split('.');
  return theme.palette[group]?.[shade] ?? theme.palette.text.secondary;
};
