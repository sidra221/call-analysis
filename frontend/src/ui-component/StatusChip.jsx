import PropTypes from 'prop-types';
import { alpha, Chip, useTheme } from '@mui/material';
import { stateColor, statusLabel } from 'constants/status';

const CUSTOM_STATUS = {
  reviewed: { label: 'Reviewed', color: 'info' },
  approved: { label: 'Reviewed', color: 'info' },
  published: { label: 'Published', color: 'success' },
  draft: { label: 'Draft', color: 'warning' },
  in_progress: { label: 'In Progress', color: 'info' },
  done: { label: 'Done', color: 'success' }
};

export default function StatusChip({ status, label }) {
  const theme = useTheme();
  const normalizedStatus = (status || '').toLowerCase();

  if (stateColor[normalizedStatus]) {
    return (
      <Chip
        label={label || statusLabel[normalizedStatus] || status}
        color={stateColor[normalizedStatus]}
        size="small"
      />
    );
  }

  const config = CUSTOM_STATUS[normalizedStatus];
  if (!config) {
    return <Chip label={label || status} size="small" />;
  }

  const paletteColor = theme.palette[config.color];

  return (
    <Chip
      label={label || config.label}
      size="small"
      sx={{
        bgcolor: alpha(paletteColor.main, 0.12),
        color: paletteColor.dark
      }}
    />
  );
}

StatusChip.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string
};
