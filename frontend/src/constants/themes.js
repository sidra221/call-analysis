export const ROLE_THEME_MAP = {
  manager: 'manager',
  qa: 'qa',
  agent: 'agent'
};

export const THEME_PRESETS = [
  {
    id: 'manager',
    swatch: '#2196f3',
    label: { en: 'Manager Blue', ar: 'أزرق المدير' }
  },
  {
    id: 'qa',
    swatch: '#ef6c00',
    label: { en: 'QA Orange', ar: 'برتقالي QA' }
  },
  {
    id: 'agent',
    swatch: '#2e7d32',
    label: { en: 'Agent Green', ar: 'أخضر الوكيل' }
  },
  {
    id: 'purple',
    swatch: '#7c3aed',
    label: { en: 'Purple', ar: 'بنفسجي' }
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

export function getRoleDefaultTheme(role) {
  const key = (role || '').toLowerCase();
  return ROLE_THEME_MAP[key] || 'manager';
}

export function resolvePresetColor(presetColor, role) {
  if (presetColor && presetColor !== 'role' && presetColor !== 'default') {
    return presetColor;
  }
  return getRoleDefaultTheme(role);
}

export function isLegacyPreset(presetColor) {
  return !presetColor || presetColor === 'role' || presetColor === 'default';
}
