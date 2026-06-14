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
import CircularProgress from '@mui/material/CircularProgress';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import NotificationList from './NotificationList';

// assets
import { IconBell } from '@tabler/icons-react';

// API
import { callsApi, followupsApi, reportsApi } from 'api/api';
import useAuth from 'hooks/useAuth';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function NotificationSection() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const anchorRef = useRef(null);
  let intervalRef = useRef(null);

  // Helper: time ago formatter
  const timeAgo = (dateString) => {
    if (!dateString) return 'unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Check if notification was already read (store in localStorage)
  const isUnread = (type, id) => {
    const readKey = `read_${type}_${id}`;
    return !localStorage.getItem(readKey);
  };

  const markAsRead = (type, id) => {
    const readKey = `read_${type}_${id}`;
    localStorage.setItem(readKey, 'true');
  };

  // Get current user info from auth context / localStorage
  const getAuthUser = () => {
    try {
      return JSON.parse(localStorage.getItem('authUser') || '{}');
    } catch {
      return {};
    }
  };

  const getCurrentUserId = () => {
    const authUser = getAuthUser();
    return user?.id || authUser?.id || null;
  };

  const getCurrentUsername = () => {
    const authUser = getAuthUser();
    const username = authUser?.user || authUser?.username || user?.user || user?.username || '';
    return username.toLowerCase();
  };

  const getCurrentRole = () => {
    const authUser = getAuthUser();
    return (user?.role || authUser?.role || '').toLowerCase();
  };

  const isReportOwner = (report) => {
    const currentUserId = getCurrentUserId();
    if (currentUserId && report.created_by) {
      return Number(report.created_by) === Number(currentUserId);
    }
    return (report.created_by_username || '').toLowerCase() === getCurrentUsername();
  };

  // Fetch real notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const newNotifications = [];
      const currentUser = getCurrentUsername();
      const currentRole = getCurrentRole();

      const getReportsList = (res) => res?.data || res?.results || [];

      // 1. Get recent completed calls (last 24 hours)
      // Notify manager + other QA only — never the uploader
      if (currentRole === 'manager' || currentRole === 'qa') {
        const callsRes = await callsApi.list();
        const recentCalls = (callsRes?.results || []).filter(call => {
          const callDate = new Date(call.created_at);
          const hoursAgo = (new Date() - callDate) / (1000 * 60 * 60);
          const uploaderUsername = (call.uploaded_by_username || '').toLowerCase();
          return (
            hoursAgo <= 24 &&
            call.status === 'completed' &&
            uploaderUsername !== currentUser
          );
        });

        recentCalls.forEach(call => {
          newNotifications.push({
            id: `call-${call.id}`,
            user: call.uploaded_by_username || 'System',
            text: `uploaded a new call #${call.id}`,
            time: timeAgo(call.created_at),
            createdAt: new Date(call.created_at).getTime(),
            unread: isUnread('call', call.id),
            type: 'call',
            link: `/calls`,
            callId: call.id
          });
        });
      }

      // 2. Get followups assigned to current user - PRIVATE (only for assigned user)
      const followupsRes = await followupsApi.list();
      const assignedFollowups = (followupsRes?.results || []).filter(
        f => f.assigned_to_username === currentUser
      );

      assignedFollowups.forEach(followup => {
        newNotifications.push({
          id: `followup-${followup.id}`,
          user: 'System',
          text: `You have a follow-up assigned for call #${followup.call_id}`,
          time: timeAgo(followup.created_at),
          createdAt: new Date(followup.created_at).getTime(),
          unread: isUnread('followup', followup.id),
          type: 'followup',
          link: `/followups`,
          followupId: followup.id,
          private: true
        });
      });

      // 3. Get followup status changes - PRIVATE (only for assigned user)
      const followupsForChanges = await followupsApi.list();
      const recentFollowupChanges = (followupsForChanges?.results || []).filter(f => {
        const updateDate = new Date(f.updated_at);
        const hoursAgo = (new Date() - updateDate) / (1000 * 60 * 60);
        return hoursAgo <= 24 && f.assigned_to_username === currentUser && f.updated_at !== f.created_at;
      });

      recentFollowupChanges.forEach(followup => {
        const statusText = followup.status === 'done' ? 'completed' : `updated to ${followup.status}`;
        newNotifications.push({
          id: `followup-status-${followup.id}-${followup.updated_at}`,
          user: followup.updated_by_username || 'Someone',
          text: `changed status of your follow-up for call #${followup.call_id} to ${statusText}`,
          time: timeAgo(followup.updated_at),
          createdAt: new Date(followup.updated_at).getTime(),
          unread: isUnread('followup-status', `${followup.id}-${followup.updated_at}`),
          type: 'followup-status',
          link: `/followups`,
          followupId: followup.id,
          private: true
        });
      });

      // 4. Get published reports - ONLY FOR MANAGER (QA publishes, Manager reviews)
      const reportsRes = await reportsApi.list();
      const recentReports = getReportsList(reportsRes).filter(report => {
        const reportDate = new Date(report.created_at);
        const hoursAgo = (new Date() - reportDate) / (1000 * 60 * 60);
        return hoursAgo <= 168 && report.status === 'published' && currentRole === 'manager';
      });

      recentReports.forEach(report => {
        newNotifications.push({
          id: `report-${report.id}`,
          user: report.created_by_username || 'QA',
          text: `published a new report "${report.period || 'Report'}"`,
          time: timeAgo(report.created_at),
          createdAt: new Date(report.created_at).getTime(),
          unread: isUnread('report', report.id),
          type: 'report',
          link: `/reports`,
          reportId: report.id
        });
      });

      // 5. Get report reviews/notes - PRIVATE (only for report creator - QA)
      const reportsForReviews = await reportsApi.list();
      const recentReportUpdates = getReportsList(reportsForReviews).filter(report => {
        if (currentRole !== 'qa' || !isReportOwner(report)) {
          return false;
        }
        if (!report.reviewed_at) {
          return false;
        }
        const reviewDate = new Date(report.reviewed_at);
        const hoursAgo = (new Date() - reviewDate) / (1000 * 60 * 60);
        return hoursAgo <= 48 && report.status !== 'draft';
      });

      recentReportUpdates.forEach(report => {
        const hasNotes = Boolean((report.manager_notes || '').trim());
        const notificationKey = hasNotes
          ? `${report.id}-${report.reviewed_at}-notes`
          : `${report.id}-${report.reviewed_at}-approve`;

        newNotifications.push({
          id: `report-review-${notificationKey}`,
          user: report.reviewed_by_username || 'Manager',
          text: hasNotes
            ? `added notes to your ${report.period || 'report'} report`
            : `reviewed your ${report.period || 'report'} report`,
          time: timeAgo(report.reviewed_at),
          createdAt: new Date(report.reviewed_at).getTime(),
          unread: isUnread('report-review', notificationKey),
          type: 'report-review',
          link: `/reports`,
          reportId: report.id,
          private: true
        });
      });

      // Sort by createdAt (newest first)
      newNotifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setNotifications(newNotifications.slice(0, 30));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => {
    notifications.forEach(notif => {
      const idParts = notif.id.split('-');
      const type = notif.type;
      let id;
      if (type === 'followup-status' || type === 'report-review') {
        id = notif.id.split('-')[2] + '-' + notif.id.split('-')[3];
      } else {
        id = idParts[1];
      }
      markAsRead(type, id);
    });
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchNotifications();
    
    intervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleToggle = () => setOpen((prev) => !prev);

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  // Filter by tab
  const filteredNotifications = Array.isArray(notifications)
    ? (tab === 'unread' ? notifications.filter((n) => n.unread) : notifications)
    : [];

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
              color: theme.vars.palette.primary.dark,
              backgroundColor: theme.vars.palette.primary.light,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                color: theme.vars.palette.primary.contrastText || '#fff',
                backgroundColor: theme.vars.palette.primary.main
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
                      boxShadow: '0px 8px 24px rgba(0,0,0,0.20)'
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
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress size={32} />
                        </Box>
                      ) : (
                        <NotificationList
                          notifications={filteredNotifications}
                          setNotifications={setNotifications}
                          onMarkAsRead={markAsRead}
                        />
                      )}
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