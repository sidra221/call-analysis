export const ROLE_THEME_MAP = {
  manager: 'manager',
  qa: 'purple',
};

export const THEME_PRESETS = [
  {
    id: 'manager',
    swatch: '#2196f3',
    label: { en: 'Blue', ar: 'أزرق' }
  },
  {
    id: 'orange',
    swatch: '#ef6c00',
    label: { en: 'Orange', ar: 'برتقالي' }
  },
  {
    id: 'purple',
    swatch: '#7c3aed',
    label: { en: 'Purple', ar: 'بنفسجي' }
  },
  {
    id: 'green',
    swatch: '#2e7d32',
    label: { en: 'Green', ar: 'أخضر' }
  },
  {
    id: 'teal',
    swatch: '#00897b',
    label: { en: 'Teal', ar: 'تركوازي' }
  },
  {
    id: 'indigo',
    swatch: '#3949ab',
    label: { en: 'Indigo', ar: 'نيلي' }
  },
  {
    id: 'rose',
    swatch: '#e91e63',
    label: { en: 'Rose', ar: 'وردي' }
  }
];

export function normalizePresetColor(presetColor) {
  if (presetColor === 'qa') return 'purple';
  if (presetColor === 'agent') return 'orange';
  return presetColor;
}

export function getRoleDefaultTheme(role) {
  const key = (role || '').toLowerCase();
  return ROLE_THEME_MAP[key] || 'manager';
}

export function resolvePresetColor(presetColor, role) {
  if (presetColor && presetColor !== 'role' && presetColor !== 'default') {
    return normalizePresetColor(presetColor);
  }
  return getRoleDefaultTheme(role);
}

export function isLegacyPreset(presetColor) {
  return !presetColor || presetColor === 'role' || presetColor === 'default';
}

export function hasCustomThemeForUser(configState, userId) {
  return Boolean(
    configState?.themeCustomized
    && userId
    && configState?.themeUserId === userId
    && configState?.presetColor
    && !isLegacyPreset(configState.presetColor)
  );
}

export function getThemeForUser(configState, user) {
  if (hasCustomThemeForUser(configState, user?.id)) {
    return normalizePresetColor(configState.presetColor);
  }
  return getRoleDefaultTheme(user?.role);
}
