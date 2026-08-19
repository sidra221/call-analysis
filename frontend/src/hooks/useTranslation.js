import { useCallback, useMemo } from 'react';
import useConfig from 'hooks/useConfig';
import {
  getDirection,
  getLocaleCode,
  getPriorityLabel,
  getRoleLabel,
  getSentimentLabel,
  getStatusLabel,
  translate
} from 'utils/i18n';

export default function useTranslation() {
  const {
    state: { language },
    setField
  } = useConfig();

  const isAr = language === 'ar';
  const dir = getDirection(language);
  const locale = getLocaleCode(language);

  const t = useCallback((key, params) => translate(language, key, params), [language]);
  const setLanguage = useCallback((lang) => setField('language', lang), [setField]);
  const statusLabel = useCallback((status) => getStatusLabel(language, status), [language]);
  const priorityLabel = useCallback((priority) => getPriorityLabel(language, priority), [language]);
  const sentimentLabel = useCallback((sentiment) => getSentimentLabel(language, sentiment), [language]);
  const roleLabel = useCallback((role) => getRoleLabel(language, role), [language]);

  return useMemo(() => ({
    language,
    isAr,
    dir,
    locale,
    t,
    setLanguage,
    statusLabel,
    priorityLabel,
    sentimentLabel,
    roleLabel
  }), [
    language,
    isAr,
    dir,
    locale,
    t,
    setLanguage,
    statusLabel,
    priorityLabel,
    sentimentLabel,
    roleLabel
  ]);
}
