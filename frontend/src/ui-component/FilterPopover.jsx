import PropTypes from 'prop-types';
import { Button, Popover, Stack, Typography } from '@mui/material';

export default function FilterPopover({
  open,
  anchorEl,
  onClose,
  onApply,
  title,
  children,
  width = 300,
  applyLabel = 'Apply Filters'
}) {
  const handleApply = () => {
    if (onApply) onApply();
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { p: 3, width, mt: 1.5 } }}
    >
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        {title}
      </Typography>
      <Stack spacing={2.5}>
        {children}
        <Button variant="contained" fullWidth onClick={handleApply}>
          {applyLabel}
        </Button>
      </Stack>
    </Popover>
  );
}

FilterPopover.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  width: PropTypes.number,
  applyLabel: PropTypes.string
};
