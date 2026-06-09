import Box from '@mui/material/Box';
import logoAuth from 'assets/images/logo-auth.png';
import { AUTH_CORNER_LOGO } from 'constants/authLogoLayout';
import useSplash from 'hooks/useSplash';

export default function AuthCornerLogo() {
  const { cornerLogoVisible } = useSplash();

  if (!cornerLogoVisible) {
    return null;
  }

  return (
    <Box
      component="img"
      src={logoAuth}
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
