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
        },
        startIcon: {
          marginLeft: 0,
          marginRight: 0,
          marginInlineEnd: 8,
          marginInlineStart: 0
        }
      }
    }
  };
}
