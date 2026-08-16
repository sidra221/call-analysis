import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import useTranslation from 'hooks/useTranslation';

export default function DialogCancelButton({ children, ...props }) {
  const { t } = useTranslation();

  return (
    <Button variant="outlined" color="inherit" {...props}>
      {children || t('common.cancel')}
    </Button>
  );
}

DialogCancelButton.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func
};
