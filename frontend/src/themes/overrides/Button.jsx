// ==============================|| OVERRIDES - BUTTON ||============================== //

export default function Button(borderRadius) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: `${borderRadius}px`
        },
        sizeMedium: {
          height: 40
        }
      }
    }
  };
}
