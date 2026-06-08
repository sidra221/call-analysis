// ==============================|| OVERRIDES - AVATAR ||============================== //

export default function Avatar(theme) {
  return {
    MuiAvatar: {
      styleOverrides: {
        root: {
          '--avatar-default-color': theme.vars.palette.primary.dark,
          '--avatar-default-bg': theme.vars.palette.primary[200],
          color: 'var(--avatar-default-color)',
          backgroundColor: 'var(--avatar-default-bg)',
          border: 'none',
          boxShadow: 'none'
        },
        img: {
          border: 'none'
        }
      }
    }
  };
}
