import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { AUTH_CORNER_LOGO, SPLASH_LOGO } from 'constants/authLogoLayout';
import { brandLogoSrc } from 'constants/brand';

const INTRO_DISPLAY_MS = 2200;
const LOGOUT_HOLD_MS = 1600;
const ANIM_MS = 800;

export default function SplashScreen({
  variant = 'intro',
  onComplete,
  onLogoutExitStart
}) {
  const theme = useTheme();
  const [phase, setPhase] = useState(() => {
    if (variant === 'logout') return 'enter-from-corner';
    return 'intro-center';
  });

  useEffect(() => {
    if (variant === 'intro') {
      const exitTimer = setTimeout(() => setPhase('exit-to-corner'), INTRO_DISPLAY_MS);
      const doneTimer = setTimeout(() => onComplete(), INTRO_DISPLAY_MS + ANIM_MS);
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(doneTimer);
      };
    }

    let enterFrame2;
    const enterFrame1 = requestAnimationFrame(() => {
      enterFrame2 = requestAnimationFrame(() => setPhase('logout-center'));
    });

    const exitTimer = setTimeout(
      () => setPhase('exit-to-corner'),
      ANIM_MS + LOGOUT_HOLD_MS
    );
    const doneTimer = setTimeout(
      () => onComplete(),
      ANIM_MS + LOGOUT_HOLD_MS + ANIM_MS
    );

    return () => {
      cancelAnimationFrame(enterFrame1);
      if (enterFrame2) cancelAnimationFrame(enterFrame2);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [variant, onComplete]);

  const exitStartedRef = useRef(false);

  useEffect(() => {
    if (variant === 'logout' && phase === 'exit-to-corner' && !exitStartedRef.current) {
      exitStartedRef.current = true;
      onLogoutExitStart?.();
    }
  }, [variant, phase, onLogoutExitStart]);

  const isAtCorner = phase === 'enter-from-corner' || phase === 'exit-to-corner';
  const overlayVisible = variant === 'intro'
    ? phase !== 'exit-to-corner'
    : phase === 'logout-center' || phase === 'exit-to-corner';

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          bgcolor: 'background.default',
          opacity: overlayVisible ? 1 : 0,
          transition: `opacity ${ANIM_MS}ms ease`,
          pointerEvents: 'auto'
        }}
      />

      <Box
        component="img"
          src={brandLogoSrc(theme, 'auth')}
          alt="Vocalys"
          sx={{
            position: 'fixed',
            zIndex: 9999,
            height: 'auto',
            objectFit: 'contain',
            pointerEvents: 'none',
            top: isAtCorner ? AUTH_CORNER_LOGO.top : '50%',
          left: isAtCorner ? AUTH_CORNER_LOGO.left : '50%',
          maxWidth: isAtCorner ? AUTH_CORNER_LOGO.maxWidth : SPLASH_LOGO.maxWidth,
          transform: isAtCorner ? 'translate(0, 0)' : 'translate(-50%, -50%)',
          transition: `
            top ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
            left ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
            max-width ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
            transform ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)
          `,
          animation: phase === 'intro-center'
            ? 'splashIn 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none'
        }}
      />

      <style>
        {`
          @keyframes splashIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.9);
            }

            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        `}
      </style>
    </>
  );
}

SplashScreen.propTypes = {
  variant: PropTypes.oneOf(['intro', 'logout']),
  onComplete: PropTypes.func.isRequired,
  onLogoutExitStart: PropTypes.func
};
