import PropTypes from 'prop-types';
import {
  Button, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle
} from '@mui/material';
import DialogCancelButton from './DialogCancelButton';

export default function LogoutConfirmDialog({ open, onClose, onConfirm, isAr = false }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isAr ? 'تأكيد تسجيل الخروج' : 'Confirm Logout'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {isAr
            ? 'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟'
            : 'Are you sure you want to log out of your account?'}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <DialogCancelButton onClick={onClose}>
          {isAr ? 'إلغاء' : 'Cancel'}
        </DialogCancelButton>
        <Button variant="contained" color="error" onClick={onConfirm}>
          {isAr ? 'تسجيل الخروج' : 'Logout'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

LogoutConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isAr: PropTypes.bool
};
