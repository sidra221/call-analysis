import { useContext } from 'react';
import { SplashContext } from 'contexts/SplashContext';

export default function useSplash() {
  const context = useContext(SplashContext);

  if (!context) {
    throw new Error('useSplash must be used inside SplashProvider');
  }

  return context;
}
