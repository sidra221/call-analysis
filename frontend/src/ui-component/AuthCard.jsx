import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';

export default function AuthCard({ children }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 420,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.14),
        boxShadow: `
          0 2px 8px ${alpha(theme.palette.common.black, 0.06)},
          0 12px 36px ${alpha(theme.palette.primary.main, 0.14)},
          0 24px 56px ${alpha(theme.palette.common.black, 0.08)}
        `,
        animation: 'fadeIn 0.5s ease'
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {children}
      </CardContent>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Card>
  );
}

AuthCard.propTypes = {
  children: PropTypes.node
};
