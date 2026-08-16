import PropTypes from 'prop-types';
import { alpha, Chip, useTheme } from '@mui/material';
import { stateColor } from 'constants/status';
import useTranslation from 'hooks/useTranslation';

const CUSTOM_STATUS_KEYS = {
  reviewed: { key: 'status.reviewed', color: 'info' },
  approved: { key: 'status.reviewed', color: 'info' },
  published: { key: 'status.published', color: 'success' },
  draft: { key: 'status.draft', color: 'warning' },
  in_progress: { key: 'status.in_progress', color: 'primary' },
  done: { key: 'status.done', color: 'success' }
};

export default function StatusChip({ status, label }) {
  const theme = useTheme();
  const { t, statusLabel } = useTranslation();
  const normalizedStatus = (status || '').toLowerCase();

  if (stateColor[normalizedStatus]) {
    return (
      <Chip
        label={label || statusLabel(normalizedStatus)}
        color={stateColor[normalizedStatus]}
        size="small"
      />
    );
  }

  const config = CUSTOM_STATUS_KEYS[normalizedStatus];
  if (!config) {
    return <Chip label={label || status} size="small" />;
  }

  const paletteColor = theme.palette[config.color];

  return (
    <Chip
      label={label || t(config.key)}
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
