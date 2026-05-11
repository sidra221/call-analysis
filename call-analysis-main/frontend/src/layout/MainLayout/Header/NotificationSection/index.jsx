import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DoneAllIcon from '@mui/icons-material/DoneAll';
// project imports
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import NotificationList from './NotificationList';

// assets
import { IconBell } from '@tabler/icons-react';

export default function NotificationSection() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');

  const anchorRef = useRef(null);

  // 🔥 Notifications State
const [notifications, setNotifications] = useState([
  {
    id: 1,
    user: 'frankie',
    text: 'started following your workspace',
    time: '2 hours ago',
    unread: true
  },
  
  {
    id: 3,
    user: 'eleanor_mac',
    text: 'reviewed a call transcript',
    time: '3 hours ago',
    unread: false
  },
  {
    id: 4,
    user: 'ollie_diggs',
    text: 'invited you to join the Admin Dashboard',
    type: 'invite',
    time: '4 hours ago',
    unread: false
  },
  {
    id: 5,
    user: 'system',
    text: 'new call recording has been processed successfully',
    time: '5 hours ago',
    unread: true
  }
]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleToggle = () => setOpen((prev) => !prev);

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  // 🔥 filter حسب التاب
  const filteredNotifications =
    tab === 'unread'
      ? notifications.filter((n) => n.unread)
      : notifications;

      useEffect(() => {
  if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }

  return () => {
    document.body.style.overflow = 'auto';
  };
}, [open]);

  return (
    <>
      {/* 🔔 ICON WITH BADGE */}
      <Box sx={{ ml: 2 }}>
        <Badge badgeContent={unreadCount} color="error">
          <Avatar
  variant="rounded"
  sx={{
    ...theme.typography.commonAvatar,
    ...theme.typography.mediumAvatar,
    cursor: 'pointer',

    color: '#1e88e5',                // لون الأيقونة
    backgroundColor: '#e3f2fd',      // اللون العادي

    transition: 'all 0.2s ease-in-out',

    '&:hover': {
      color: '#e3f2fd',
      backgroundColor: '#1e88e5'
    }
  }}
  ref={anchorRef}
  onClick={handleToggle}
          >
            <IconBell stroke={1.5} size="20px" />
          </Avatar>
        </Badge>
      </Box>

      {/* 📥 DROPDOWN */}
      <Popper
        placement={downMD ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions in={open} {...TransitionProps}>
              <Paper>
<MainCard
 border={false}
  content={false}
  sx={{
    width: 360,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0px 8px 24px rgba(0,0,0,0.20)',
    
    '&:hover': {
      boxShadow: '0px 8px 24px rgba(0,0,0,0.20)' // 🔥 يثبت الشادو
    }
  }}
>
                  <Stack>

                    {/* HEADER */}
                    <Stack direction="row" justifyContent="space-between" p={2}>
                      <Typography variant="h6">
                        Your notifications
                      </Typography>
<Typography
  sx={{
    cursor: 'pointer',
    color: 'primary.main',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    '&:hover': {
      opacity: 0.8
    }
  }}
  onClick={markAllRead}
>
  <DoneAllIcon sx={{ fontSize: 18 }} />
  Mark all as read
</Typography>
                    </Stack>

                    {/* TABS */}
                    <Tabs
                      value={tab}
                      onChange={(e, v) => setTab(v)}
                      variant="fullWidth"
                    >
                      <Tab label={`All (${notifications.length})`} value="all" />
                      <Tab label={`Unread (${unreadCount})`} value="unread" />
                    </Tabs>

                    <Divider />

                    {/* LIST */}
                    <Box
  sx={{
    maxHeight: 400,
    overflowY: 'auto',
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
      width: 6
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 3
    }
  }}
>
                      <NotificationList
                        notifications={filteredNotifications}
                        setNotifications={setNotifications}
                      />
                    </Box>

                  </Stack>
                </MainCard>
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
}