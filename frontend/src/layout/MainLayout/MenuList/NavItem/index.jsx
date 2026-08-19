import PropTypes from 'prop-types';
import { Activity, useEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import useConfig from 'hooks/useConfig';
import useTranslation from 'hooks/useTranslation';

// assets
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export default function NavItem({ item, level, isParents = false, setSelectedID }) {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const ref = useRef(null);

  const { pathname } = useLocation();
  const {
    state: { borderRadius }
  } = useConfig();
  const { t } = useTranslation();

  const itemTitle = item.titleKey ? t(item.titleKey) : item.title;

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const isSelected = !!matchPath({ path: item?.link ? item.link : item.url, end: false }, pathname);

  const [hoverStatus, setHover] = useState(false);

  const compareSize = () => {
    const compare = ref.current && ref.current.scrollWidth > ref.current.clientWidth;
    setHover(compare);
  };

  useEffect(() => {
    compareSize();
    window.addEventListener('resize', compareSize);
    return () => window.removeEventListener('resize', compareSize);
  }, []);

  const Icon = item?.icon;
  const itemIcon = item?.icon ? (
    <Icon stroke={1.5} size={drawerOpen ? '20px' : '24px'} style={{ ...(isParents && { fontSize: 20, stroke: '1.5' }) }} />
  ) : (
    <FiberManualRecordIcon sx={{ width: isSelected ? 8 : 6, height: isSelected ? 8 : 6 }} fontSize={level > 0 ? 'inherit' : 'medium'} />
  );

  let itemTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  const itemHandler = () => {
    if (downMD) handlerDrawerOpen(false);

    if (isParents && setSelectedID) {
      setSelectedID();
    }
  };

  const showTooltip = !drawerOpen;
  const tooltipPlacement = theme.direction === 'rtl' ? 'left' : 'right';

  return (
    <>
      <Tooltip
        title={itemTitle}
        placement={tooltipPlacement}
        arrow
        disableHoverListener={!showTooltip}
        PopperProps={{
          sx: {
            '& .MuiTooltip-tooltip': {
              backgroundColor: theme.vars.palette.grey[500],
              color: theme.vars.palette.common.white,
              fontSize: '0.75rem',
              fontWeight: 500,
              padding: '6px 12px'
            },
            '& .MuiTooltip-arrow': {
              color: theme.vars.palette.grey[500]
            }
          }
        }}
      >
        <ListItemButton
          component={Link}
          to={item.url}
          state={item.url === '/calls' ? { reset: true } : null}
          target={itemTarget}
          disabled={item.disabled}
          disableRipple={!drawerOpen}
          sx={{
            zIndex: 1201,
            borderRadius: `${borderRadius}px`,
            mb: 0.5,
            gap: drawerOpen ? 1.25 : 0,
            justifyContent: drawerOpen ? 'flex-start' : 'center',
            ...(drawerOpen && level !== 1 && { ms: `${level * 18}px` }),
            ...(!drawerOpen && { px: 1.25 }),
            ...((!drawerOpen || level !== 1) && {
              py: level === 1 ? 0 : 1,
              '&:hover': { bgcolor: 'transparent' },
              '&.Mui-selected': {
                '&:hover': { bgcolor: 'transparent' },
                bgcolor: 'transparent'
              }
            })
          }}
          selected={isSelected}
          onClick={() => itemHandler()}
        >
          <ListItemIcon
            sx={{
              minWidth: drawerOpen ? (level === 1 ? 36 : 18) : 0,
              color: isSelected ? 'primary.main' : 'text.primary',
              justifyContent: 'center',
              ...(!drawerOpen &&
                level === 1 && {
                  borderRadius: `${borderRadius}px`,
                  width: 46,
                  height: 46,
                  alignItems: 'center',
                  '&:hover': { bgcolor: 'primary.light' },
                  ...(isSelected && {
                    bgcolor: 'primary.light',
                    '&:hover': { bgcolor: 'primary.light' }
                  })
                })
            }}
          >
            {itemIcon}
          </ListItemIcon>

          {(drawerOpen || (!drawerOpen && level !== 1)) && (
            <ListItemText
              sx={{
                my: 0,
                flex: drawerOpen ? '1 1 auto' : '0 0 auto',
                minWidth: 0
              }}
              primary={
                <Typography
                  ref={ref}
                  noWrap
                  variant={isSelected ? 'h5' : 'body1'}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'start',
                    color: 'inherit'
                  }}
                >
                  {itemTitle}
                </Typography>
              }
              secondary={
                item.caption && (
                  <Typography
                    variant="caption"
                    gutterBottom
                    sx={{
                      display: 'block',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      color: 'text.primary',
                      textTransform: 'capitalize',
                      lineHeight: 1.66,
                      textAlign: 'start'
                    }}
                  >
                    {item.caption}
                  </Typography>
                )
              }
            />
          )}

          <Activity mode={drawerOpen && item.chip ? 'visible' : 'hidden'}>
            <Chip
              color={item.chip?.color}
              variant={item.chip?.variant}
              size={item.chip?.size}
              label={item.chip?.label}
              avatar={
                <Activity mode={item.chip?.avatar ? 'visible' : 'hidden'}>
                  <Avatar>{item.chip?.avatar}</Avatar>
                </Activity>
              }
            />
          </Activity>
        </ListItemButton>
      </Tooltip>
    </>
  );
}

NavItem.propTypes = { item: PropTypes.any, level: PropTypes.number, isParents: PropTypes.bool, setSelectedID: PropTypes.func };
