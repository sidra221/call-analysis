import PropTypes from 'prop-types';
import { alpha, Avatar, Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';

export default function StatSummaryCard({ icon, label, value, color = 'primary' }) {
  const theme = useTheme();
  const paletteColor = theme.palette[color] || theme.palette.primary;

  return (
    <Card
      sx={{
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ bgcolor: alpha(paletteColor.main, 0.12), color: paletteColor.main, flexShrink: 0 }}>
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

StatSummaryCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string
};
