const pick = (theme, group, shade) => theme?.palette?.[group]?.[shade];

export const getRoleColor = (role, theme) => {
  const key = (role || '').toLowerCase();
  const isDark = theme?.palette?.mode === 'dark';

  if (key === 'manager') {
    return isDark
      ? { bg: pick(theme, 'primary', 'dark') || 'primary.dark', color: pick(theme, 'primary', 'light') || 'primary.light' }
      : { bg: pick(theme, 'primary', 'light') || 'primary.light', color: pick(theme, 'primary', 'dark') || 'primary.dark' };
  }

  if (key === 'qa') {
    return isDark
      ? { bg: pick(theme, 'secondary', 'dark') || 'secondary.dark', color: pick(theme, 'secondary', 'light') || 'secondary.light' }
      : { bg: pick(theme, 'secondary', 'light') || 'secondary.light', color: pick(theme, 'secondary', 'dark') || 'secondary.dark' };
  }

  return isDark
    ? { bg: pick(theme, 'grey', 700) || 'grey.700', color: pick(theme, 'grey', 100) || 'grey.100' }
    : { bg: theme?.palette?.action?.hover || 'action.hover', color: pick(theme, 'text', 'secondary') || 'text.secondary' };
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
  user_updated: 'info.main',
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
