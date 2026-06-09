import PropTypes from 'prop-types';
import { Avatar, Stack, Typography } from '@mui/material';
import { getRoleColor } from 'constants/colors';
import { getAvatarInitial, getAvatarUrl, getRoleAvatarBorderSx } from 'utils/avatar';

export const getUserRoleColor = getRoleColor;

export default function UserAvatarWithName({ username, role, avatar, avatarStyle, size = 28 }) {
  const roleColor = getUserRoleColor(role);
  const userLike = { avatar, avatar_style: avatarStyle, username };
  const avatarSrc = getAvatarUrl(userLike, username);
  const showInitial = !avatarSrc;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar
        src={avatarSrc}
        sx={{
          width: size,
          height: size,
          ...getRoleAvatarBorderSx(role, 2),
          color: roleColor.color,
          fontSize: 12,
          fontWeight: 600,
          '& img': { objectFit: 'cover' },
        }}
      >
        {showInitial && getAvatarInitial(username)}
      </Avatar>
      <Typography variant="body2">{username}</Typography>
    </Stack>
  );
}

UserAvatarWithName.propTypes = {
  username: PropTypes.string,
  role: PropTypes.string,
  avatar: PropTypes.string,
  avatarStyle: PropTypes.string,
  size: PropTypes.number,
};
