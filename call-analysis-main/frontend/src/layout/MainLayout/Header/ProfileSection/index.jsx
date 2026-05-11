import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import User1 from 'assets/images/users/user-round.svg';
import { IconLogout, IconLanguage, IconArrowLeft } from '@tabler/icons-react';
import useAuth from 'hooks/useAuth';

export default function ProfileSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const open = Boolean(anchorEl);

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
        disableFocusRipple
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
            src={User1}
            alt="user"
            sx={{ margin: '8px 0 8px 8px !important' }}
          />
        }
        label=""
        onClick={(event) => setAnchorEl(event.currentTarget)}
      />

      {/* Main Menu */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {!showLanguageMenu && (
          <>
            {/* Language */}
            <MenuItem
              onClick={() => {
                setShowLanguageMenu(true);
              }}
            >
              <ListItemIcon>
                <IconLanguage size={18} />
              </ListItemIcon>
              <ListItemText>Language</ListItemText>
            </MenuItem>

            {/* Logout */}
            <MenuItem
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
          </>
        )}

        {/* Language Submenu */}
        {showLanguageMenu && (
          <>
            {/* Back */}
            <MenuItem onClick={() => setShowLanguageMenu(false)}>
              <ListItemIcon>
                <IconArrowLeft size={18} />
              </ListItemIcon>
              <ListItemText>Back</ListItemText>
            </MenuItem>

            {/* Arabic */}
            <MenuItem
              onClick={() => {
                console.log('Arabic selected');
                handleClose();
              }}
            >
              <ListItemText>العربية</ListItemText>
            </MenuItem>

            {/* English */}
            <MenuItem
              onClick={() => {
                console.log('English selected');
                handleClose();
              }}
            >
              <ListItemText>English</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}
