import PropTypes from 'prop-types';
import { Avatar, Stack, Typography } from '@mui/material';

export const roleColors = {
  manager: { bg: '#ede7f6', color: '#5e35b1' },
  agent: { bg: '#e3f2fd', color: '#1e88e5' },
  qa: { bg: '#fff3e0', color: '#ef6c00' },
};

export const getUserRoleColor = (roleName) => {
  const role = (roleName || '').toLowerCase();
  return roleColors[role] || { bg: '#f5f5f5', color: '#757575' };
};

export default function UserAvatarWithName({ username, role, size = 28 }) {
  const roleColor = getUserRoleColor(role);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar
        sx={{
          width: size,
          height: size,
          bgcolor: roleColor.bg,
          color: roleColor.color,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {username?.[0]?.toUpperCase() || '?'}
      </Avatar>
      <Typography variant="body2">{username}</Typography>
    </Stack>
  );
}

UserAvatarWithName.propTypes = {
  username: PropTypes.string,
  role: PropTypes.string,
  size: PropTypes.number,
};
