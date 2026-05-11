// ==============================|| OVERRIDES - LIST ITEM BUTTON ||============================== //

export default function ListItemButton(theme) {
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: theme.vars.palette.text.primary,
          paddingTop: '10px',
          paddingBottom: '10px',

          '&.Mui-selected': {
            color: theme.vars.palette.primary.dark,
            backgroundColor: theme.vars.palette.primary.light,
            '&:hover': {
              backgroundColor: theme.vars.palette.primary.light
            },
            '& .MuiListItemIcon-root': {
              color: theme.vars.palette.primary.dark
            }
          },

          '&:hover': {
            backgroundColor: theme.vars.palette.primary.light,
            color: theme.vars.palette.primary.dark,
            '& .MuiListItemIcon-root': {
              color: theme.vars.palette.primary.dark
            }
          }
        }
      }
    }
  };
}
