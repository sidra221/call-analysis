import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';

// project imports
import MenuList from '../MenuList';
import LogoSection from '../LogoSection';
import MiniDrawerStyled from './MiniDrawerStyled';

import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import { drawerWidth } from 'store/constant';
import SimpleBar from 'ui-component/third-party/SimpleBar';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth(); // Add this
  const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const {
    state: { miniDrawer, language }
  } = useConfig();

  const logo = useMemo(
    () => (
      <Box sx={{ display: 'flex', p: 2 }}>
        <LogoSection />
      </Box>
    ),
    []
  );

  const drawer = useMemo(() => {
    const drawerSX = drawerOpen
      ? { paddingLeft: '16px', paddingRight: '16px', marginTop: '0px' }
      : { paddingLeft: '0px', paddingRight: '0px', marginTop: '20px' };

    // Add key to force re-render when user changes
    const content = <MenuList key={user?.id || user?.role || 'guest'} />;

    return downMD ? (
      <Box sx={drawerSX}>{content}</Box>
    ) : (
      <SimpleBar sx={{ height: 'calc(100vh - 90px)', ...drawerSX }}>
        {content}
      </SimpleBar>
    );
  }, [downMD, drawerOpen, user?.id, user?.role]); // Add dependencies

  return (
    <Box component="nav" sx={{ flexShrink: { md: 0 }, width: { xs: 'auto', md: drawerWidth } }}>
      {downMD || (miniDrawer && drawerOpen) ? (
        <Drawer
          variant={downMD ? 'temporary' : 'persistent'}
          anchor={language === 'ar' ? 'right' : 'left'}
          open={drawerOpen}
          onClose={() => handlerDrawerOpen(false)}
          slotProps={{
            paper: {
              sx: {
                mt: downMD ? 0 : 11,
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
          {downMD && logo}
          {drawer}
        </Drawer>
      ) : (
        <MiniDrawerStyled variant="permanent" open={drawerOpen}>
          {logo}
          {drawer}
        </MiniDrawerStyled>
      )}
    </Box>
  );
}

export default Sidebar;