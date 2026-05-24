import { useState, useMemo } from 'react';
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
  IconArrowLeft,
  IconMoon,
  IconSun,
  IconUser
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
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const open = Boolean(anchorEl);

  // ─────────────────────────────────────
  // Dynamic avatar by role
  // ─────────────────────────────────────

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

  // ─────────────────────────────────────
  // Apply default theme by role
  // ─────────────────────────────────────

  const applyRoleTheme = (role) => {
    if (role === 'manager') {
      setMode('light');
    } else if (role === 'qa') {
      setMode('dark');
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowLanguageMenu(false);
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
            boxShadow: '0 0 8px 2px rgba(255, 193, 7, 0.7)'
          },

          '&:active .MuiAvatar-root': {
            boxShadow: '0 0 8px 2px rgba(255, 193, 7, 0.7)'
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
          applyRoleTheme(user?.role?.toLowerCase());
          setAnchorEl(event.currentTarget);
        }}
      />

      {/* Main Menu */}
      <Menu
  anchorEl={anchorEl}
  open={open}
  onClose={handleClose}
  PaperProps={{
    sx: {
      width: 220,
      borderRadius: 3
    }
  }}
>
  {!showLanguageMenu && (
    [
      <MenuItem key="profile-name" disabled>
        <ListItemText
          primary={user?.username || 'User'}
          secondary={user?.role || ''}
        />
      </MenuItem>,

      <MenuItem key="language" onClick={() => setShowLanguageMenu(true)}>
        <ListItemIcon>
          <IconLanguage size={18} />
        </ListItemIcon>
        <ListItemText>Language</ListItemText>
      </MenuItem>,

      <MenuItem key="theme">
        <ListItemIcon>
          {mode === 'dark' ? <IconMoon size={18} /> : <IconSun size={18} />}
        </ListItemIcon>

        <ListItemText>
          {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </ListItemText>

        <Switch
          checked={mode === 'dark'}
          onChange={() =>
            setMode(mode === 'light' ? 'dark' : 'light')
          }
        />
      </MenuItem>,

      <MenuItem
        key="logout"
        onClick={() => {
          handleClose();
          logout();
          navigate('/login');
        }}
      >
        <ListItemIcon>
          <IconLogout size={18} />
        </ListItemIcon>

        <ListItemText>Logout</ListItemText>
      </MenuItem>
    ]
  )}

  {showLanguageMenu && (
    [
      <MenuItem
        key="back"
        onClick={() => setShowLanguageMenu(false)}
      >
        <ListItemIcon>
          <IconArrowLeft size={18} />
        </ListItemIcon>

        <ListItemText>Back</ListItemText>
      </MenuItem>,

      <MenuItem
        key="ar"
        onClick={() => {
          setField('language', 'ar');
          handleClose();
        }}
      >
        <ListItemText>العربية</ListItemText>
      </MenuItem>,

      <MenuItem
        key="en"
        onClick={() => {
          setField('language', 'en');
          handleClose();
        }}
      >
        <ListItemText>English</ListItemText>
      </MenuItem>
    ]
  )}
</Menu>
    </>
  );
}