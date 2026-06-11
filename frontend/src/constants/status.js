export const stateColor = {
  pending: 'warning',
  processing: 'info',
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
  neutral: 'default'
};

/** Matches MUI Chip text color used in Calls table (light variant). */
export const getSentimentChipColor = (theme, sentiment) => {
  const colorKey = sentimentColor[sentiment];
  if (!colorKey || colorKey === 'default') {
    return theme.palette.text.secondary;
  }

  const paletteColor = theme.palette[colorKey];
  if (!paletteColor) {
    return theme.palette.text.secondary;
  }

  if (colorKey === 'success' || colorKey === 'warning') {
    return paletteColor.dark;
  }

  return paletteColor.main;
};

export const priorityColor = {
  high: 'error',
  medium: 'warning',
  low: 'success',
  critical: 'error'
};
