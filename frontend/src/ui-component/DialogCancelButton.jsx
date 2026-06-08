import PropTypes from 'prop-types';
import { Button } from '@mui/material';

export default function DialogCancelButton({ children = 'Cancel', ...props }) {
  return (
    <Button variant="outlined" color="inherit" {...props}>
      {children}
    </Button>
  );
}

DialogCancelButton.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func
};
