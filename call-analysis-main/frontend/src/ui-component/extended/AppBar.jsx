import PropTypes from 'prop-types';
import { cloneElement, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import MuiAppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project imports
import Logo from 'ui-component/Logo';

// assets
import { IconBook, IconCreditCard, IconDashboard, IconHome2 } from '@tabler/icons-react';
import MenuIcon from '@mui/icons-material/Menu';

function ElevationScroll({ children, window }) {
  const theme = useTheme();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
    target: window
  });

  return cloneElement(children, {
    elevation: trigger ? 1 : 0,
    sx: {
      backgroundColor: theme.vars.palette.background.default,
      color: theme.vars.palette.text.primary
    }
  });
}

export default function AppBar(props) {
  const [drawerToggle, setDrawerToggle] = useState(false);

  const drawerToggler = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerToggle(open);
  };

  return (
    <ElevationScroll {...props}>
      <MuiAppBar position="fixed" color="inherit" elevation={0}>
        <Container>
          <Toolbar>
            <Typography component={RouterLink} to="/" sx={{ flexGrow: 1 }}>
              <Logo />
            </Typography>

            <Stack direction="row" sx={{ gap: 2.5, display: { xs: 'none', sm: 'flex' } }}>
              <Button color="inherit">Home</Button>
              <Button color="inherit" component={RouterLink} to="/login">
                Dashboard
              </Button>
              <Button color="inherit" href="https://codedthemes.gitbook.io/berry" target="_blank">
                Documentation
              </Button>
              <Button variant="contained" color="primary">
                Purchase Now
              </Button>
            </Stack>

            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <IconButton color="inherit" onClick={drawerToggler(true)}>
                <MenuIcon />
              </IconButton>

              <Drawer anchor="top" open={drawerToggle} onClose={drawerToggler(false)}>
                <List>
                  <ListItemButton>
                    <ListItemIcon><IconHome2 /></ListItemIcon>
                    <ListItemText primary="Home" />
                  </ListItemButton>

                  <ListItemButton>
                    <ListItemIcon><IconDashboard /></ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItemButton>

                  <ListItemButton>
                    <ListItemIcon><IconBook /></ListItemIcon>
                    <ListItemText primary="Documentation" />
                  </ListItemButton>

                  <ListItemButton>
                    <ListItemIcon><IconCreditCard /></ListItemIcon>
                    <ListItemText primary="Purchase Now" />
                  </ListItemButton>
                </List>
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </MuiAppBar>
    </ElevationScroll>
  );
}

ElevationScroll.propTypes = {
  children: PropTypes.node
};