import logoLight from 'assets/images/logo.png';
import logoDark from 'assets/images/logo-dark.png';
import logoAuthLight from 'assets/images/logo-auth.png';
import logoAuthDark from 'assets/images/logo-auth-dark.png';
import logoIconLight from 'assets/images/logo-icon.png';
import logoIconDark from 'assets/images/logo-icon-dark.png';

export const VOCALYS_CYAN = '#00B8E6';
export const VOCALYS_CYAN_DARK = '#0087AB';

export function brandLogoSrc(theme, kind = 'wordmark') {
  const dark = theme.palette.mode === 'dark';
  if (kind === 'auth') return dark ? logoAuthDark : logoAuthLight;
  if (kind === 'icon') return dark ? logoIconDark : logoIconLight;
  return dark ? logoDark : logoLight;
}
