import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';

// material-ui
import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// project imports
import { CSS_VAR_PREFIX, DEFAULT_THEME_MODE } from 'config';
import CustomShadows from './custom-shadows';
import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import { getRoleDefaultTheme, isLegacyPreset, resolvePresetColor } from 'constants/themes';
import { buildPalette } from './palette';
import Typography from './typography';
import componentsOverrides from './overrides';

// ==============================|| DEFAULT THEME - MAIN ||============================== //

export default function ThemeCustomization({ children }) {
  const {
    state: { borderRadius, fontFamily, outlinedFilled, presetColor },
    setField
  } = useConfig();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.role) return;
    if (isLegacyPreset(presetColor)) {
      setField('presetColor', getRoleDefaultTheme(user.role));
    }
  }, [user?.role, presetColor, setField]);

  const activePreset = useMemo(
    () => resolvePresetColor(presetColor, user?.role),
    [presetColor, user?.role]
  );

  const palette = useMemo(() => buildPalette(activePreset), [activePreset]);

  const themeTypography = useMemo(() => Typography(fontFamily), [fontFamily]);

  const themeOptions = useMemo(
    () => ({
      direction: 'ltr',
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
        }
      },

        dark: {
          palette: palette.dark,
          customShadows: CustomShadows(palette.dark, 'dark')
        },

      cssVariables: {
        cssVarPrefix: CSS_VAR_PREFIX,
        colorSchemeSelector: 'data-color-scheme'
      }
    }),
    [themeTypography, palette]
  );

  const themes = createTheme(themeOptions);
  themes.components = useMemo(() => componentsOverrides(themes, borderRadius, outlinedFilled), [themes, borderRadius, outlinedFilled]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider
        key={activePreset}
        disableTransitionOnChange
        theme={themes}
        modeStorageKey="theme-mode"
        defaultMode={DEFAULT_THEME_MODE}
      >
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

ThemeCustomization.propTypes = { children: PropTypes.node };
