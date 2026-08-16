import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';

// project imports
import MenuList from '../MenuList';
import LogoSection from '../LogoSection';
import MiniDrawerStyled from './MiniDrawerStyled';

import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import { drawerWidth } from 'store/constant';
import SimpleBar from 'ui-component/third-party/SimpleBar';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// assets
import { IconMenu2 } from '@tabler/icons-react';

function Sidebar() {
  const theme = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const {
    state: { miniDrawer, language }
  } = useConfig();

  // Logo with hamburger button
  const logo = useMemo(
    () => (
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <LogoSection />
        <Avatar
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            cursor: 'pointer',
            transition: 'all .2s ease-in-out',
            color: theme.vars.palette.primary.dark,
            background: theme.vars.palette.primary.light,
            '&:hover': {
              color: theme.vars.palette.primary.light,
              background: theme.vars.palette.primary.dark
            }
          }}
          onClick={() => handlerDrawerOpen(!drawerOpen)}
        >
          <IconMenu2 stroke={1.5} size="18px" />
        </Avatar>
      </Stack>
    ),
    [drawerOpen, theme]
  );

  const drawer = useMemo(() => {
    const drawerSX = drawerOpen
      ? { paddingInline: '16px', marginTop: '0px' }
      : { paddingInline: '0px', marginTop: '20px' };

    const content = <MenuList key={user?.id || user?.role || 'guest'} />;

    return downMD ? (
      <Box sx={drawerSX}>{content}</Box>
    ) : (
      <SimpleBar sx={{ height: 'calc(100vh - 90px)', ...drawerSX }}>
        {content}
      </SimpleBar>
    );
  }, [downMD, drawerOpen, user?.id, user?.role]);

  // Mini drawer content with hamburger
  const miniDrawerContent = useMemo(() => {
    return (
      <>
        <Stack direction="row" alignItems="center" justifyContent="center" sx={{ p: 2 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 32,
              height: 32,
              cursor: 'pointer',
              transition: 'all .2s ease-in-out',
              color: theme.vars.palette.primary.dark,
              background: theme.vars.palette.primary.light,
              '&:hover': {
                color: theme.vars.palette.primary.light,
                background: theme.vars.palette.primary.dark
              }
            }}
            onClick={() => handlerDrawerOpen(!drawerOpen)}
          >
            <IconMenu2 stroke={1.5} size="18px" />
          </Avatar>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <MenuList key={user?.id || user?.role || 'guest'} />
        </Box>
      </>
    );
  }, [drawerOpen, theme, user?.id, user?.role]);

  return (
    <Box component="nav" sx={{ flexShrink: { md: 0 }, width: { xs: 'auto', md: drawerWidth } }}>
      {/* Mobile view or temporary drawer */}
      {downMD ? (
        <Drawer
          variant="temporary"
          anchor={language === 'ar' ? 'right' : 'left'}
          open={drawerOpen}
          onClose={() => handlerDrawerOpen(false)}
          slotProps={{
            paper: {
              sx: {
                mt: 0,
                zIndex: 1099,
                width: drawerWidth,
                bgcolor: 'background.default',
                color: 'text.primary',
                borderRight: 'none'
              }
            }
          }}
          ModalProps={{ keepMounted: true }}
        >
          {logo}
          {drawer}
        </Drawer>
      ) : (
        // Desktop view - always use MiniDrawerStyled
        <MiniDrawerStyled variant="permanent" open={drawerOpen} anchor={language === 'ar' ? 'right' : 'left'}>
          {logo}
          {drawer}
        </MiniDrawerStyled>
      )}
    </Box>
  );
}

export default Sidebar;