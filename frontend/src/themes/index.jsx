import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef } from 'react';
import { CacheProvider } from '@emotion/react';

// material-ui
import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// project imports
import { CSS_VAR_PREFIX, DEFAULT_THEME_MODE } from 'config';
import CustomShadows from './custom-shadows';
import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import { getRoleDefaultTheme, getThemeForUser, hasCustomThemeForUser } from 'constants/themes';
import { buildPalette } from './palette';
import Typography from './typography';
import componentsOverrides from './overrides';
import { createEmotionCache } from 'utils/createEmotionCache';

// ==============================|| DEFAULT THEME - MAIN ||============================== //

export default function ThemeCustomization({ children }) {
  const {
    state: { borderRadius, outlinedFilled, presetColor, themeCustomized, themeUserId, language },
    setState
  } = useConfig();
  const { user } = useAuth();
  const prevUserIdRef = useRef(null);

  useEffect(() => {
    if (!user?.id || !user?.role) {
      prevUserIdRef.current = null;
      return;
    }

    const userChanged = prevUserIdRef.current !== user.id;
    if (!userChanged) return;

    prevUserIdRef.current = user.id;

    if (hasCustomThemeForUser({ presetColor, themeCustomized, themeUserId }, user.id)) {
      return;
    }

    const roleTheme = getRoleDefaultTheme(user.role);
    setState((prev) => ({
      ...prev,
      presetColor: roleTheme,
      themeCustomized: false,
      themeUserId: user.id,
    }));
  }, [user?.id, user?.role, presetColor, themeCustomized, themeUserId, setState]);

  const activePreset = useMemo(
    () => getThemeForUser({ presetColor, themeCustomized, themeUserId }, user),
    [presetColor, themeCustomized, themeUserId, user]
  );

  const palette = useMemo(() => buildPalette(activePreset), [activePreset]);

  const resolvedFontFamily = language === 'ar'
    ? "'Cairo', 'Roboto', sans-serif"
    : "'Roboto', sans-serif";
  const themeTypography = useMemo(() => Typography(resolvedFontFamily), [resolvedFontFamily]);

  const direction = language === 'ar' ? 'rtl' : 'ltr';
  const emotionCache = useMemo(() => createEmotionCache(direction), [direction]);

  const themeOptions = useMemo(
    () => ({
      direction,
      mixins: {
        toolbar: {
          minHeight: '48px',
          padding: '16px',
          '@media (min-width: 600px)': {
            minHeight: '48px'
          }
        }
      },
      typography: themeTypography,
      shape: {
        borderRadius
      },
      colorSchemes: {
        light: {
          palette: palette.light,
          customShadows: CustomShadows(palette.light, 'light')
        },
        dark: {
          palette: palette.dark,
          customShadows: CustomShadows(palette.dark, 'dark')
        }
      },

      cssVariables: {
        cssVarPrefix: CSS_VAR_PREFIX,
        colorSchemeSelector: 'data-color-scheme'
      }
    }),
    [themeTypography, palette, direction]
  );

  const themes = createTheme(themeOptions);
  themes.components = useMemo(() => componentsOverrides(themes, borderRadius, outlinedFilled), [themes, borderRadius, outlinedFilled]);

  return (
    <CacheProvider key={direction} value={emotionCache}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider
          key={`${activePreset}-${direction}`}
          disableTransitionOnChange
          theme={themes}
          modeStorageKey="theme-mode"
          defaultMode={DEFAULT_THEME_MODE}
        >
          <CssBaseline enableColorScheme />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
}

ThemeCustomization.propTypes = { children: PropTypes.node };
