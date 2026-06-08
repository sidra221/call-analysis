// ==============================|| OVERRIDES - TABLE CELL & ROW ||============================== //

export default function TableCell(theme) {
  return {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: theme.vars.palette.grey[200],
          fontSize: '0.875rem'
        },
        head: {
          fontSize: '0.875rem',
          color: theme.vars.palette.grey[900],
          fontWeight: 600,
          padding: '10px 12px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.4,
          '&.MuiTableCell-paddingCheckbox': {
            overflow: 'visible'
          }
        },
        body: {
          padding: '12px 12px',
          '&:not(.MuiTableCell-paddingCheckbox)': {
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        },
        paddingCheckbox: {
          width: 56,
          minWidth: 56,
          maxWidth: 56,
          padding: '8px 16px 8px 12px',
          overflow: 'visible',
          boxSizing: 'border-box'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': {
            borderBottom: 0
          }
        }
      }
    }
  };
}
