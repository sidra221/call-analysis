import { alpha } from '@mui/material/styles';

export const stateColor = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  failed: 'error'
};

export const statusLabel = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed'
};

export const sentimentColor = {
  positive: 'success',
  negative: 'error',
  neutral: 'secondary'
};

/** Resolves chip text/icon color for sentiment (neutral → text.secondary). */
export const getSentimentChipColor = (theme, sentiment) => {
  switch (sentiment) {
    case 'positive':
      return theme.palette.success.dark;
    case 'negative':
      return theme.palette.error.main;
    case 'neutral':
      return theme.palette.text.secondary;
    default:
      return theme.palette.text.secondary;
  }
};

export const getSentimentChipSx = (theme, sentiment) => {
  const color = getSentimentChipColor(theme, sentiment);
  return {
    bgcolor: alpha(color, 0.12),
    color,
    borderColor: alpha(color, 0.25),
    fontWeight: 600
  };
};

export const priorityColor = {
  critical: 'error',
  high: 'orange',
  medium: 'warning',
  low: 'success'
};

/** Resolves chip text/icon color for priority (high → palette.orange.main). */
export const getPriorityChipColor = (theme, priority) => {
  switch (priority) {
    case 'critical':
      return theme.palette.error.main;
    case 'high':
      return theme.palette.orange.main;
    case 'medium':
      return theme.palette.warning.dark;
    case 'low':
      return theme.palette.success.main;
    default:
      return theme.palette.text.secondary;
  }
};

export const getPriorityChipSx = (theme, priority) => {
  const color = getPriorityChipColor(theme, priority);
  return {
    bgcolor: alpha(color, 0.12),
    color,
    borderColor: alpha(color, 0.25),
    fontWeight: 600
  };
};

/** Dashboard priority cards — avatar/icon accent colors. */
export const getPriorityCardStyle = (theme, level) => {
  const main = getPriorityChipColor(theme, level);
  const hover = level === 'high' ? theme.palette.orange.dark : main;

  return {
    avatarBg: alpha(main, 0.14),
    iconColor: main,
    hoverColor: hover
  };
};

export const confidenceColor = (pct) => {
  if (pct == null) return 'default';
  if (pct >= 70) return 'success';
  if (pct >= 40) return 'warning';
  return 'error';
};
