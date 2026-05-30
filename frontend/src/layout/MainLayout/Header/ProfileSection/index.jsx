import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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

// assets
import User1 from 'assets/images/users/user-round.svg';

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
import { useColorScheme } from '@mui/material/styles';

export default function ProfileSection() {
  const navigate = useNavigate();

  const { logout, user } = useAuth();

  const {
    state: { language },
    setField
  } = useConfig();

  const { mode, setMode } = useColorScheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const languageOpen = Boolean(languageAnchorEl);

  // Get username from user object
  const displayName = user?.user || user?.username || 'User';

  // Dynamic avatar by role
  const avatarSrc = useMemo(() => {
    const role = user?.role?.toLowerCase();

    if (role === 'manager') {
      return 'https://api.dicebear.com/7.x/notionists/svg?seed=Manager';
    }

    if (role === 'qa') {
      return 'https://api.dicebear.com/7.x/notionists/svg?seed=QA';
    }

    return User1;
  }, [user]);

  // Get role color for avatar border
  const getRoleColor = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'manager') return '#5e35b1';
    if (role === 'qa') return '#ef6c00';
    return '#1e88e5';
  };

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
            boxShadow: '0 0 8px 2px rgba(30, 136, 229, 0.5)'
          },

          '&:active .MuiAvatar-root': {
            boxShadow: '0 0 8px 2px rgba(30, 136, 229, 0.5)'
          }
        }}
        icon={
          <Avatar
            src={avatarSrc}
            alt="user"
            sx={{
              margin: '8px 0 8px 8px !important'
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
              border: `2px solid ${getRoleColor()}`
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
              bgcolor: user?.role === 'manager' ? '#ede7f6' : user?.role === 'qa' ? '#fff3e0' : '#e3f2fd',
              color: user?.role === 'manager' ? '#5e35b1' : user?.role === 'qa' ? '#ef6c00' : '#1e88e5',
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
            logout();
            navigate('/login');
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
    </>
  );
}