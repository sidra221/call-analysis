import { Box } from '@mui/material';
import { IconSparkles } from '@tabler/icons-react';
import { VOCALYS_CYAN } from 'constants/brand';

const WAVE_BARS = [
  { h: 10, delay: '0s' },
  { h: 22, delay: '0.12s' },
  { h: 34, delay: '0.04s' },
  { h: 18, delay: '0.22s' },
  { h: 40, delay: '0.08s' },
  { h: 16, delay: '0.18s' },
  { h: 28, delay: '0.02s' },
  { h: 12, delay: '0.26s' }
];

const ORBITS = [
  { size: 108, duration: '7s', reverse: false },
  { size: 84, duration: '5.2s', reverse: true }
];

export default function AiWorkingAnimation({ compact = false }) {
  const size = compact ? 36 : 148;
  const iconSize = compact ? 16 : 32;

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '@keyframes aiPulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.35 },
          '50%': { transform: 'scale(1.18)', opacity: 0.08 }
        },
        '@keyframes aiSpin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        },
        '@keyframes aiWave': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' }
        },
        '@keyframes aiGlow': {
          '0%, 100%': { filter: `drop-shadow(0 0 6px ${VOCALYS_CYAN})` },
          '50%': { filter: `drop-shadow(0 0 16px ${VOCALYS_CYAN})` }
        }
      }}
    >
      {!compact && (
        <>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1px solid ${VOCALYS_CYAN}33`,
              animation: 'aiPulse 2.4s ease-in-out infinite'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 16,
              borderRadius: '50%',
              border: `1px solid ${VOCALYS_CYAN}55`,
              animation: 'aiPulse 2.4s ease-in-out infinite 0.4s'
            }}
          />
          {ORBITS.map((orbit) => (
            <Box
              key={orbit.size}
              sx={{
                position: 'absolute',
                width: orbit.size,
                height: orbit.size,
                borderRadius: '50%',
                animation: `aiSpin ${orbit.duration} linear infinite`,
                animationDirection: orbit.reverse ? 'reverse' : 'normal'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  left: '50%',
                  width: 8,
                  height: 8,
                  ml: '-4px',
                  borderRadius: '50%',
                  bgcolor: VOCALYS_CYAN,
                  boxShadow: `0 0 10px ${VOCALYS_CYAN}`
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -3,
                  left: '22%',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: VOCALYS_CYAN,
                  opacity: 0.7,
                  boxShadow: `0 0 8px ${VOCALYS_CYAN}`
                }}
              />
            </Box>
          ))}
        </>
      )}

      <Box
        sx={{
          width: compact ? 36 : 72,
          height: compact ? 36 : 72,
          borderRadius: '50%',
          bgcolor: `${VOCALYS_CYAN}18`,
          border: `1.5px solid ${VOCALYS_CYAN}88`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'aiGlow 1.8s ease-in-out infinite',
          zIndex: 1
        }}
      >
        <IconSparkles size={iconSize} color={VOCALYS_CYAN} />
      </Box>

      {!compact && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.5,
            height: 40,
            zIndex: 2
          }}
        >
          {WAVE_BARS.map((bar, i) => (
            <Box
              key={i}
              sx={{
                width: 4,
                height: bar.h,
                borderRadius: 1,
                bgcolor: VOCALYS_CYAN,
                transformOrigin: 'bottom',
                animation: `aiWave ${0.9 + (i % 3) * 0.15}s ease-in-out infinite`,
                animationDelay: bar.delay,
                opacity: 0.85
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
