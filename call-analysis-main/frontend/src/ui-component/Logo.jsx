import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AnalyticsIcon from '@mui/icons-material/Analytics';

export default function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <AnalyticsIcon fontSize="small" />
      </Box>
      <Typography variant="h4" sx={{ lineHeight: 1, letterSpacing: 0.2 }}>
        Call Analysis
      </Typography>
    </Box>
  );
}
