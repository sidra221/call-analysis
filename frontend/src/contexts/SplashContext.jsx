import PropTypes from 'prop-types';
import { createContext, useCallback, useMemo, useRef, useState } from 'react';

const SPLASH_SESSION_KEY = 'splash_seen';

export const SplashContext = createContext(undefined);

export function SplashProvider({ children }) {
  const logoutExitRef = useRef(null);

  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem(SPLASH_SESSION_KEY)
  );
  const [splashVariant, setSplashVariant] = useState('intro');
  const [cornerLogoVisible, setCornerLogoVisible] = useState(
    () => !!sessionStorage.getItem(SPLASH_SESSION_KEY)
  );

  const completeSplash = useCallback(() => {
    if (splashVariant === 'intro') {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    }

    setCornerLogoVisible(true);
    setShowSplash(false);
    setSplashVariant('intro');
  }, [splashVariant]);

  const handleLogoutExitStart = useCallback(() => {
    logoutExitRef.current?.();
    logoutExitRef.current = null;
  }, []);

  const playLogoutSplash = useCallback((onExitStart) => {
    logoutExitRef.current = onExitStart;
    setCornerLogoVisible(false);
    setSplashVariant('logout');
    setShowSplash(true);
  }, []);

  const value = useMemo(
    () => ({
      showSplash,
      splashVariant,
      cornerLogoVisible,
      completeSplash,
      playLogoutSplash,
      handleLogoutExitStart
    }),
    [
      showSplash,
      splashVariant,
      cornerLogoVisible,
      completeSplash,
      playLogoutSplash,
      handleLogoutExitStart
    ]
  );

  return (
    <SplashContext.Provider value={value}>
      {children}
    </SplashContext.Provider>
  );
}

SplashProvider.propTypes = {
  children: PropTypes.node
};
