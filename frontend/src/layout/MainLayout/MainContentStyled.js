// material-ui
import { styled } from '@mui/material/styles';

// project imports
import { drawerWidth } from 'store/constant';

// ==============================|| MAIN LAYOUT - STYLED ||============================== //

const MainContentStyled = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'borderRadius'
})(({ theme, open, borderRadius }) => ({
  backgroundColor: theme.palette.mode === 'dark'
    ? theme.palette.background.default
    : theme.palette.grey[100],
  minWidth: '1%',
  width: '100%',
  minHeight: 'calc(100vh - 88px)',
  flexGrow: 1,
  padding: 24,
  marginTop: 88,
  marginInlineEnd: 0,
  borderRadius: `${Math.min(borderRadius, 8)}px`,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  ...(!open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.shorter + 200
    }),
    [theme.breakpoints.up('md')]: {
      marginInlineStart: -(drawerWidth - 72),
      width: `calc(100% - ${drawerWidth}px)`,
      marginTop: 88
    }
  }),
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.shorter + 200
    }),
    marginInlineStart: 0,
    marginTop: 88,
    width: `calc(100% - ${drawerWidth}px)`,
    [theme.breakpoints.up('md')]: {
      marginTop: 88
    }
  }),
  [theme.breakpoints.down('md')]: {
    marginInlineStart: 12,
    marginInlineEnd: 12,
    padding: 16,
    marginTop: 88,
    ...(!open && {
      width: `calc(100% - ${drawerWidth}px)`
    })
  },
  [theme.breakpoints.down('sm')]: {
    marginInlineStart: 8,
    marginInlineEnd: 8
  }
}));

export default MainContentStyled;
