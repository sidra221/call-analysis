// ==============================|| OVERRIDES - CARD ||============================== //

export default function Card(borderRadius) {
  return {
    MuiCard: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: `${borderRadius * 2}px`,
          border: 'none',
          boxShadow: theme.vars.customShadows?.z1 || '0 1px 3px rgba(0, 0, 0, 0.06)'
        })
      }
    }
  };
}
