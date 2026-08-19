import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { AUTH_CORNER_LOGO } from 'constants/authLogoLayout';
import { brandLogoSrc } from 'constants/brand';
import useSplash from 'hooks/useSplash';

export default function AuthCornerLogo() {
  const theme = useTheme();
  const { cornerLogoVisible } = useSplash();

  if (!cornerLogoVisible) {
    return null;
  }

  return (
    <Box
      component="img"
      src={brandLogoSrc(theme, 'auth')}
      alt="Vocalys"
      sx={{
        position: 'fixed',
        top: AUTH_CORNER_LOGO.top,
        left: AUTH_CORNER_LOGO.left,
        zIndex: 10,
        width: 'auto',
        maxWidth: AUTH_CORNER_LOGO.maxWidth,
        height: 'auto',
        objectFit: 'contain',
        pointerEvents: 'none'
      }}
    />
  );
}
