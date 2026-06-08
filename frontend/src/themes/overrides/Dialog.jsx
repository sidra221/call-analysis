// ==============================|| OVERRIDES - DIALOG ||============================== //

export default function Dialog(borderRadius) {
  return {
    MuiDialog: {
      styleOverrides: {
        paper: {
          padding: '12px 0',
          borderRadius: `${borderRadius * 2}px`
        }
      }
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: `${borderRadius * 2}px`
        }
      }
    }
  };
}
