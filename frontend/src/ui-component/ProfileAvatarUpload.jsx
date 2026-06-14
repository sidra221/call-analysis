import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import useConfig from 'hooks/useConfig';
import {
  getAvatarInitial,
  getRoleAvatarBorderSx,
  resolveAvatarPreview,
} from 'utils/avatar';

export default function ProfileAvatarUpload({
  size = 96,
  sx = {},
  editable = true,
  role = 'qa',
  displayName = 'User',
  user,
  value,
  onChange,
  error = ''
}) {
  const theme = useTheme();
  const { state: { language } } = useConfig();
  const isAr = language === 'ar';
  const inputRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const preview = useMemo(
    () => resolveAvatarPreview(user, value, displayName),
    [user, value, displayName]
  );

  const borderSx = getRoleAvatarBorderSx(role, 3);
  const roleColor = borderSx.borderColor;

  useEffect(() => () => {
    if (value.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(value.previewUrl);
    }
  }, [value.previewUrl]);

  const handleUploadClick = (e) => {
    e.stopPropagation();
    if (!editable) return;
    inputRef.current?.click();
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onChange({ ...value, fileError: isAr ? 'الحد الأقصى 2 ميجابايت' : 'Max file size is 2 MB' });
      return;
    }

    if (value.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(value.previewUrl);
    }

    onChange({
      pendingFile: file,
      previewUrl: URL.createObjectURL(file),
      removeCustom: false,
      fileError: '',
    });

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();

    if (value.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(value.previewUrl);
    }

    onChange({
      pendingFile: null,
      previewUrl: null,
      removeCustom: Boolean(user?.avatar),
      fileError: '',
    });
  };

  const displayError = error || value.fileError;
  const showUploadOverlay = editable && hovered;

  return (
    <Box sx={{ width: size, flexShrink: 0, ...sx }}>
      <Box
        onMouseEnter={() => editable && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          position: 'relative',
          width: size,
          height: size,
          mx: 'auto',
        }}
      >
        <Avatar
          src={preview.src}
          alt={displayName}
          onClick={handleUploadClick}
          sx={{
            width: size,
            height: size,
            ...borderSx,
            color: borderSx.borderColor,
            fontSize: size * 0.34,
            fontWeight: 700,
            boxShadow: theme.shadows[2],
            cursor: editable ? 'pointer' : 'default',
            transition: 'filter 0.2s ease',
            filter: showUploadOverlay ? 'brightness(0.92)' : 'none',
            '& img': { objectFit: 'cover' }
          }}
        >
          {preview.showInitial && getAvatarInitial(displayName, user)}
        </Avatar>

        {showUploadOverlay && (
          <Box
            onClick={handleUploadClick}
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              bgcolor: alpha(roleColor, 0.88),
              color: '#fff',
              cursor: 'pointer',
              boxShadow: `inset 0 0 0 2px ${alpha('#fff', 0.35)}`,
              zIndex: 1,
            }}
          >
            <IconUpload size={24} stroke={2.2} color="#fff" />
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ fontSize: '0.7rem', color: '#fff', letterSpacing: 0.2 }}
            >
              {isAr ? 'رفع صورة' : 'Upload'}
            </Typography>
          </Box>
        )}

        {editable && preview.hasCustom && (
          <IconButton
            size="small"
            onClick={handleRemove}
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              zIndex: 2,
              width: 26,
              height: 26,
              bgcolor: 'error.main',
              color: 'common.white',
              border: '2px solid',
              borderColor: 'background.paper',
              boxShadow: theme.shadows[3],
              opacity: 1,
              transition: 'transform 0.15s ease, opacity 0.15s ease',
              '&:hover': {
                bgcolor: 'error.dark',
                transform: 'scale(1.08)',
              },
            }}
          >
            <IconTrash size={14} stroke={2.2} />
          </IconButton>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={handleFile}
        />
      </Box>

      {displayError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: 'block', textAlign: 'center', mt: 0.75, maxWidth: size + 40, mx: 'auto' }}
        >
          {displayError}
        </Typography>
      )}
    </Box>
  );
}

ProfileAvatarUpload.propTypes = {
  size: PropTypes.number,
  sx: PropTypes.object,
  editable: PropTypes.bool,
  role: PropTypes.string,
  displayName: PropTypes.string,
  user: PropTypes.object,
  value: PropTypes.shape({
    pendingFile: PropTypes.object,
    previewUrl: PropTypes.string,
    removeCustom: PropTypes.bool,
    fileError: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
