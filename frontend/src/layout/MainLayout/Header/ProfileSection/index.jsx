import { useState } from 'react';
// material-ui
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';

// icons
import {
  IconLogout,
  IconLanguage,
  IconMoon,
  IconSun,
  IconChevronRight
} from '@tabler/icons-react';

// hooks
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import LogoutConfirmDialog from 'ui-component/LogoutConfirmDialog';
import { alpha, useColorScheme, useTheme } from '@mui/material/styles';
import { getAvatarUrl } from 'utils/avatar';

export default function ProfileSection() {
  const { logout, user } = useAuth();

  const {
    state: { language },
    setField
  } = useConfig();

  const { mode, setMode } = useColorScheme();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const open = Boolean(anchorEl);
  const languageOpen = Boolean(languageAnchorEl);

  // Get username from user object
  const displayName = user?.user || user?.username || 'User';

  const avatarSrc = getAvatarUrl(user, displayName);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  return (
    <>
      {/* Profile Button */}
      <Chip
        clickable
        disableRipple
        sx={{
          ml: 2,
          height: 48,
          borderRadius: '27px',
          bgcolor: 'transparent !important',
          border: 'none',
          outline: 'none',

          '&:hover': {
            bgcolor: 'transparent !important'
          },

          '&:active': {
            bgcolor: 'transparent !important'
          },

          '&:focus': {
            outline: 'none',
            bgcolor: 'transparent !important',
            boxShadow: 'none'
          },

          '&.Mui-focusVisible': {
            outline: 'none',
            boxShadow: 'none'
          },

          '& .MuiTouchRipple-root': {
            display: 'none'
          },

          '& .MuiAvatar-root': {
            transition: 'all 0.2s ease'
          },

          '&:hover .MuiAvatar-root': {
            opacity: 0.9
          },

          '&:active .MuiAvatar-root': {
            opacity: 0.85
          }
        }}
        icon={
          <Avatar
            src={avatarSrc}
            alt="user"
            sx={{
              margin: '8px 0 8px 8px !important',
              border: '2px solid',
              borderColor: 'primary.main',
              outline: 'none',
              boxShadow: 'none',
              bgcolor: 'transparent',
              '& img': {
                objectFit: 'cover'
              }
            }}
          />
        }
        label=""
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
        }}
      />

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 260,
            borderRadius: 3,
            mt: 1
          }
        }}
      >
        {/* User Info Section */}
        <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
          <Avatar
            src={avatarSrc}
            alt={displayName}
            sx={{
              width: 60,
              height: 60,
              mx: 'auto',
              mb: 1,
              border: '2px solid',
              borderColor: 'primary.main',
              boxShadow: 'none',
              bgcolor: 'transparent',
              '& img': { objectFit: 'cover' }
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Chip
            label={user?.role?.toUpperCase() || 'Unknown'}
            size="small"
            sx={{
              mt: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
              fontWeight: 600
            }}
          />
        </Box>

        <Divider />

        {/* Language Option with chevron - opens separate menu */}
        <MenuItem 
          onClick={handleLanguageClick}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <IconLanguage size={18} />
          </ListItemIcon>
          <ListItemText primary="Language" />
          <IconChevronRight size={16} />
        </MenuItem>

        {/* Dark Mode Option */}
        <MenuItem sx={{ py: 1.5 }}>
          <ListItemIcon>
            {mode === 'dark' ? <IconMoon size={18} /> : <IconSun size={18} />}
          </ListItemIcon>
          <ListItemText primary={mode === 'dark' ? 'Dark Mode' : 'Light Mode'} />
          <Switch
            checked={mode === 'dark'}
            onChange={() => setMode(mode === 'light' ? 'dark' : 'light')}
            size="small"
          />
        </MenuItem>

        <Divider />

        {/* Logout Option */}
        <MenuItem
          onClick={() => {
            handleClose();
            setLogoutDialogOpen(true);
          }}
          sx={{ color: 'error.main', py: 1.5 }}
        >
          <ListItemIcon>
            <IconLogout size={18} color="currentColor" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

      {/* Language Submenu - appears as nested menu */}
      <Menu
        anchorEl={languageAnchorEl}
        open={languageOpen}
        onClose={handleLanguageClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          sx: {
            width: 160,
            borderRadius: 3
          }
        }}
      >
        <MenuItem
          onClick={() => {
            setField('language', 'en');
            handleLanguageClose();
            handleClose();
          }}
          sx={{ justifyContent: 'space-between', py: 1.5 }}
        >
          English
          {language === 'en' && (
            <Typography variant="caption" color="primary.main">✓</Typography>
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setField('language', 'ar');
            handleLanguageClose();
            handleClose();
          }}
          sx={{ justifyContent: 'space-between', py: 1.5 }}
        >
          العربية
          {language === 'ar' && (
            <Typography variant="caption" color="primary.main">✓</Typography>
          )}
        </MenuItem>
      </Menu>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={() => {
          setLogoutDialogOpen(false);
          logout();
        }}
        isAr={language === 'ar'}
      />
    </>
  );
}