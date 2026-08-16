import PropTypes from 'prop-types';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import useTranslation from 'hooks/useTranslation';

export default function LogoutConfirmDialog({ open, onClose, onConfirm }) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('header.logoutConfirmTitle')}</DialogTitle>
      <DialogContent>
        {t('header.logoutConfirmBody')}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          {t('header.logout')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

LogoutConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};
