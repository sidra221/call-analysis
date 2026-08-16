import PropTypes from 'prop-types';
import { useEffect } from 'react';
import useTranslation from 'hooks/useTranslation';

export default function LocaleProvider({ children }) {
  const { language, dir } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  return children;
}

LocaleProvider.propTypes = {
  children: PropTypes.node
};
