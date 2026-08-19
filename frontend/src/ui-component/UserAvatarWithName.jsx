import PropTypes from 'prop-types';
import { Avatar, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getRoleColor } from 'constants/colors';
import { getAvatarInitial, getAvatarUrl, getRoleAvatarBorderSx } from 'utils/avatar';

export const getUserRoleColor = getRoleColor;

export default function UserAvatarWithName({ username, role, avatar, avatarStyle, size = 28 }) {
  const theme = useTheme();
  const roleColor = getUserRoleColor(role, theme);
  const userLike = { avatar, avatar_style: avatarStyle, username };
  const avatarSrc = getAvatarUrl(userLike, username);
  const showInitial = !avatarSrc;

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, maxWidth: '100%' }}>
      <Avatar
        src={avatarSrc}
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          ...getRoleAvatarBorderSx(role, 2, theme),
          color: roleColor.color,
          fontSize: 12,
          fontWeight: 600,
          '& img': { objectFit: 'cover' },
        }}
      >
        {showInitial && getAvatarInitial(username)}
      </Avatar>
      <Typography variant="body2" noWrap title={username}>
        {username}
      </Typography>
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
