import { alpha } from '@mui/material/styles';

/** Light-mode status colors — same on web and mobile. */
export const STATUS_COLORS = {
  critical: '#B71C1C',
  high: '#F44336',
  medium: '#FB8C00',
  low: '#2E7D32',
  negative: '#E53935',
  positive: '#2E7D32',
  neutral: '#757575',
};

/** Brighter variants so chip text stays readable on dark surfaces. */
export const STATUS_COLORS_DARK = {
  critical: '#FF5252',
  high: '#FF8A80',
  medium: '#FFB74D',
  low: '#81C784',
  negative: '#EF5350',
  positive: '#81C784',
  neutral: '#C5CAE9',
};

export const statusPalette = (theme) => (
  theme?.palette?.mode === 'dark' ? STATUS_COLORS_DARK : STATUS_COLORS
);

export const getChipSx = (color, { strong = false, theme } = {}) => {
  const dark = theme?.palette?.mode === 'dark';
  return {
    bgcolor: alpha(color, dark ? (strong ? 0.26 : 0.2) : (strong ? 0.16 : 0.12)),
    color,
    borderColor: alpha(color, dark ? (strong ? 0.6 : 0.45) : (strong ? 0.35 : 0.25)),
    fontWeight: strong ? 700 : 600,
  };
};

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
  const palette = statusPalette(theme);
  switch (sentiment) {
    case 'positive':
      return palette.positive;
    case 'negative':
      return palette.negative;
    case 'neutral':
      return palette.neutral;
    default:
      return theme.palette.text.secondary;
  }
};

export const getSentimentChipSx = (theme, sentiment) => {
  return getChipSx(getSentimentChipColor(theme, sentiment), { theme });
};

export const priorityColor = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'success'
};

export const getPriorityChipColor = (theme, priority) => {
  const palette = statusPalette(theme);
  switch (priority) {
    case 'critical':
      return palette.critical;
    case 'high':
      return palette.high;
    case 'medium':
      return palette.medium;
    case 'low':
      return palette.low;
    default:
      return palette.neutral;
  }
};

export const getPriorityChipSx = (theme, priority) => {
  const color = getPriorityChipColor(theme, priority);
  return getChipSx(color, { strong: priority === 'critical' || priority === 'high', theme });
};

export const getCallStatusChipColor = (theme, status) => {
  const palette = statusPalette(theme);
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'published':
    case 'done':
      return palette.low;
    case 'failed':
      return palette.negative;
    case 'pending':
    case 'draft':
      return palette.medium;
    case 'processing':
    case 'in_progress':
      return theme?.palette?.primary?.light || theme?.palette?.primary?.main || '#90CAF9';
    default:
      return palette.neutral;
  }
};

export const getReviewedChipSx = (isReviewed, theme) => {
  const palette = statusPalette(theme);
  return getChipSx(isReviewed ? palette.low : palette.negative, { theme });
};

/** Dashboard priority cards — avatar/icon accent colors. */
export const getPriorityCardStyle = (theme, level) => {
  const main = getPriorityChipColor(theme, level);
  const hover = level === 'critical' ? '#7F0000' : main;

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

export const getConfidenceChipColor = (pct, theme) => {
  const palette = statusPalette(theme);
  if (pct == null) return palette.neutral;
  if (pct >= 70) return palette.low;
  if (pct >= 40) return palette.medium;
  return palette.negative;
};

export const getConfidenceChipSx = (pct, theme) => getChipSx(getConfidenceChipColor(pct, theme), { theme });
