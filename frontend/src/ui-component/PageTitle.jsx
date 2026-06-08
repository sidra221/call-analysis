import PropTypes from 'prop-types';
import { Stack, Typography } from '@mui/material';

export default function PageTitle({ title, action }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {action}
    </Stack>
  );
}

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  action: PropTypes.node
};
