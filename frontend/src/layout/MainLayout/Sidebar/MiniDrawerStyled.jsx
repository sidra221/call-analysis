// material-ui
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';

// project imports
import { drawerWidth } from 'store/constant';

function openedMixin(theme) {
  return {
    width: drawerWidth,
    borderRight: theme.direction === 'rtl' ? 'inherit' : 'none',
    borderLeft: theme.direction === 'rtl' ? 'none' : 'inherit',
    zIndex: 1099,
    background: theme.vars.palette.background.default,
    overflowX: 'hidden',
    boxShadow: 'none',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen + 200
    })
  };
}

function closedMixin(theme) {
  return {
    borderRight: theme.direction === 'rtl' ? 'inherit' : 'none',
    borderLeft: theme.direction === 'rtl' ? 'none' : 'inherit',
    zIndex: 1099,
    background: theme.vars.palette.background.default,
    overflowX: 'hidden',
    width: 72,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen + 200
    })
  };
}

// ==============================|| DRAWER - MINI STYLED ||============================== //

const MiniDrawerStyled = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  width: drawerWidth,
  borderRight: theme.direction === 'rtl' ? 'inherit' : '0px',
  borderLeft: theme.direction === 'rtl' ? '0px' : 'inherit',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme)
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme)
  })
}));

export default MiniDrawerStyled;
