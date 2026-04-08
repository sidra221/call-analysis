import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import User1 from 'assets/images/users/user-round.svg';
import { IconLogout, IconSettings, IconUser } from '@tabler/icons-react';
import useAuth from 'hooks/useAuth';

export default function ProfileSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Chip
        sx={{ ml: 2, height: 48, borderRadius: '27px' }}
        icon={<Avatar src={User1} alt="user" sx={{ margin: '8px 0 8px 8px !important' }} />}
        label=""
        onClick={(event) => setAnchorEl(event.currentTarget)}
        color="primary"
      />
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            handleClose();
            navigate('/profile');
          }}
        >
          <ListItemIcon>
            <IconUser size={18} />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            navigate('/settings');
          }}
        >
          <ListItemIcon>
            <IconSettings size={18} />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
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
      </Menu>
    </>
  );
}
