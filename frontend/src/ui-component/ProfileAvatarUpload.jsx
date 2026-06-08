import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Box, CircularProgress, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconUpload } from '@tabler/icons-react';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import { accountsApi } from 'api/api';
import { getAvatarUrl } from 'utils/avatar';

export default function ProfileAvatarUpload({ size = 96, sx = {}, editable = true }) {
  const theme = useTheme();
  const { user, updateUser } = useAuth();
  const { state: { language } } = useConfig();
  const isAr = language === 'ar';

  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const displayName = user?.user || user?.username || 'User';
  const avatarSrc = getAvatarUrl(user, displayName);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError(isAr ? 'الحد الأقصى 2 ميجابايت' : 'Max file size is 2 MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('avatar', file);

      const res = await accountsApi.uploadAvatar(formData);
      const data = res?.data || res;

      updateUser({ avatar: data.avatar });
    } catch (err) {
      setError(err.message || (isAr ? 'فشل رفع الصورة' : 'Upload failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0, ...sx }}>
      <Avatar
        src={avatarSrc}
        alt={displayName}
        sx={{
          width: size,
          height: size,
          border: '3px solid',
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[2],
          '& img': { objectFit: 'cover' }
        }}
      />

      {editable && (
        <>
          <Box
            onClick={() => !uploading && inputRef.current?.click()}
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              bgcolor: alpha('#000', 0.55),
              color: 'common.white',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              cursor: uploading ? 'default' : 'pointer',
              '&:hover': {
                opacity: 1
              },
              ...(uploading && { opacity: 1 })
            }}
          >
            {uploading ? (
              <CircularProgress size={28} color="inherit" />
            ) : (
              <>
                <IconUpload size={22} />
                <Typography variant="caption" fontWeight={600}>
                  {isAr ? 'رفع' : 'Upload'}
                </Typography>
              </>
            )}
          </Box>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={handleFile}
          />
        </>
      )}

      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            mt: 0.5,
            whiteSpace: 'nowrap'
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}

ProfileAvatarUpload.propTypes = {
  size: PropTypes.number,
  sx: PropTypes.object,
  editable: PropTypes.bool
};
