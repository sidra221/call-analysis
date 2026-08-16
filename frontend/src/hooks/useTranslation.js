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

  return {
    language,
    isAr,
    dir,
    locale,
    t: (key, params) => translate(language, key, params),
    setLanguage: (lang) => setField('language', lang),
    statusLabel: (status) => getStatusLabel(language, status),
    priorityLabel: (priority) => getPriorityLabel(language, priority),
    sentimentLabel: (sentiment) => getSentimentLabel(language, sentiment),
    roleLabel: (role) => getRoleLabel(language, role)
  };
}
