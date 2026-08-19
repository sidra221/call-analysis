// ==============================|| OVERRIDES - OUTLINED INPUT ||============================== //

export default function OutlinedInput(borderRadius, outlinedFilled) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: outlinedFilled ? theme.vars.palette.background.paper : 'transparent',
          borderRadius: `${borderRadius}px`,

          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.vars.palette.divider
          },

          '&:hover:not(.Mui-disabled):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main
          },

          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 2
          },

          '&.MuiInputBase-multiline': {
            padding: 1
          }
        }),
        input: ({ theme }) => ({
          fontWeight: 500,
          background: outlinedFilled ? theme.vars.palette.background.paper : 'transparent',
          padding: '15.5px 14px',
          borderRadius: `${borderRadius}px`,

          '&.MuiInputBase-inputSizeSmall': {
            padding: '10px 14px',

            '&.MuiInputBase-inputAdornedStart': {
              paddingLeft: 0
            }
          }
        }),
        inputAdornedStart: {
          paddingLeft: 4
        },
        notchedOutline: {
          borderRadius: `${borderRadius}px`
        }
      }
    }
  };
}
