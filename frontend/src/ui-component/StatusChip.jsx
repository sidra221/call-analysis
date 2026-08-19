import PropTypes from 'prop-types';
import { Chip, useTheme } from '@mui/material';
import { getCallStatusChipColor, getChipSx, stateColor } from 'constants/status';
import useTranslation from 'hooks/useTranslation';

const CUSTOM_STATUS_KEYS = {
  reviewed: { key: 'status.reviewed' },
  approved: { key: 'status.reviewed' },
  published: { key: 'status.published' },
  draft: { key: 'status.draft' },
  in_progress: { key: 'status.in_progress' },
  done: { key: 'status.done' }
};

export default function StatusChip({ status, label }) {
  const theme = useTheme();
  const { t, statusLabel } = useTranslation();
  const normalizedStatus = (status || '').toLowerCase();
  const color = getCallStatusChipColor(theme, normalizedStatus);
  const config = CUSTOM_STATUS_KEYS[normalizedStatus];
  const chipLabel = label
    || (stateColor[normalizedStatus] ? statusLabel(normalizedStatus) : null)
    || (config ? t(config.key) : status);

  return (
    <Chip
      label={chipLabel}
      size="small"
      variant="outlined"
      sx={getChipSx(color, { theme })}
    />
  );
}

StatusChip.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string
};
