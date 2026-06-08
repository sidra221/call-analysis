import PropTypes from 'prop-types';
import { Avatar, Stack, Typography } from '@mui/material';
import { getRoleColor } from 'constants/colors';

export const getUserRoleColor = getRoleColor;

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
