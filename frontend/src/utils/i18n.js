import en from 'locales/en.json';
import ar from 'locales/ar.json';

const messages = { en, ar };

export function getDirection(language) {
  return language === 'ar' ? 'rtl' : 'ltr';
}

export function translate(language, key, params = {}) {
  const keys = key.split('.');
  let value = messages[language] || messages.en;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }

  if (typeof value !== 'string') {
    value = messages.en;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
  }

  if (typeof value !== 'string') return key;

  return value.replace(/\{(\w+)\}/g, (_, param) => {
    if (params[param] === undefined || params[param] === null) return `{${param}}`;
    return String(params[param]);
  });
}

export function getStatusLabel(language, status) {
  const key = `status.${(status || '').toLowerCase()}`;
  const translated = translate(language, key);
  return translated === key ? status : translated;
}

export function getPriorityLabel(language, priority) {
  const key = `priority.${(priority || '').toLowerCase()}`;
  const translated = translate(language, key);
  return translated === key ? priority : translated;
}

export function getSentimentLabel(language, sentiment) {
  const key = `sentiment.${(sentiment || '').toLowerCase()}`;
  const translated = translate(language, key);
  return translated === key ? sentiment : translated;
}

export function getRoleLabel(language, role) {
  const key = `roles.${(role || '').toLowerCase()}`;
  const translated = translate(language, key);
  return translated === key ? role : translated;
}

export function getLocaleCode(language) {
  return language === 'ar' ? 'ar-SA' : 'en-US';
}
