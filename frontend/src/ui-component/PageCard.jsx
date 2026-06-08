import PropTypes from 'prop-types';
import { Card, CardContent } from '@mui/material';

export default function PageCard({ children, contentSX = {}, sx, bordered = false, ...props }) {
  return (
    <Card
      sx={{
        ...(bordered && {
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none'
        }),
        ...sx
      }}
      {...props}
    >
      <CardContent sx={{ p: 3, ...contentSX }}>{children}</CardContent>
    </Card>
  );
}

PageCard.propTypes = {
  children: PropTypes.node,
  contentSX: PropTypes.object,
  sx: PropTypes.object,
  bordered: PropTypes.bool
};
