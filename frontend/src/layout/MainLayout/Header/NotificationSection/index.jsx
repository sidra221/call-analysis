import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
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
import useTranslation from 'hooks/useTranslation';
import { getRoleAvatarBorderSx } from 'utils/avatar';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function NotificationSection() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const avatarRoleSx = getRoleAvatarBorderSx(user?.role, 2, theme);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const anchorRef = useRef(null);
  let intervalRef = useRef(null);

  const timeAgo = (dateString) => {
    if (!dateString) return t('common.unknown');
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return t('notifications.justNow');
    if (diffMins < 60) return t('notifications.minutesAgo', { count: diffMins });
    if (diffHours < 24) {
      return diffHours === 1
        ? t('notifications.hoursAgo', { count: diffHours })
        : t('notifications.hoursAgoPlural', { count: diffHours });
    }
    if (diffDays < 7) {
      return diffDays === 1
        ? t('notifications.daysAgo', { count: diffDays })
        : t('notifications.daysAgoPlural', { count: diffDays });
    }
    return date.toLocaleDateString(locale);
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
            user: call.uploaded_by_username || t('notifications.system'),
            text: t('notifications.callUploadedAction', { callId: call.id }),
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
          user: t('notifications.system'),
          text: t('notifications.followupAssigned', { callId: followup.call_id }),
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
        const isCompleted = followup.status === 'done';
        const statusText = isCompleted
          ? t('status.done')
          : t(`status.${followup.status}`, {}) !== `status.${followup.status}`
            ? t(`status.${followup.status}`)
            : followup.status;
        newNotifications.push({
          id: `followup-status-${followup.id}-${followup.updated_at}`,
          user: followup.updated_by_username || t('notifications.someone'),
          text: isCompleted
            ? t('notifications.followupStatusCompletedAction', { callId: followup.call_id })
            : t('notifications.followupStatusUpdatedAction', { callId: followup.call_id, status: statusText }),
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
          user: report.created_by_username || t('roles.qa'),
          text: t('notifications.reportPublishedAction', {
            period: report.period || t('notifications.reportFallback'),
          }),
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
        const period = report.period || t('notifications.reportFallback');

        newNotifications.push({
          id: `report-review-${notificationKey}`,
          user: report.reviewed_by_username || t('roles.manager'),
          text: hasNotes
            ? t('notifications.reportReviewNotesAction', { period })
            : t('notifications.reportReviewApprovedAction', { period }),
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
  }, [user, t, locale]);

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
            sx={{
              width: 32,
              height: 32,
              cursor: 'pointer',
              color: avatarRoleSx.color,
              backgroundColor: avatarRoleSx.bgcolor,
              boxShadow: 'none',
              outline: 'none',
              transition: 'box-shadow 0.22s ease',
              '&:hover': {
                color: `${avatarRoleSx.color} !important`,
                backgroundColor: `${avatarRoleSx.bgcolor} !important`,
                boxShadow: `0 6px 20px ${alpha(avatarRoleSx.color, 0.55)}`,
              },
              '&:active': {
                color: `${avatarRoleSx.color} !important`,
                backgroundColor: `${avatarRoleSx.bgcolor} !important`,
                boxShadow: `0 3px 12px ${alpha(avatarRoleSx.color, 0.42)}`,
              },
            }}
            ref={anchorRef}
            onClick={handleToggle}
          >
            <IconBell stroke={1.5} size={18} />
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
                    boxShadow: theme.vars?.customShadows?.z8 || theme.customShadows?.z8,
                    '&:hover': {
                      boxShadow: theme.vars?.customShadows?.z8 || theme.customShadows?.z8
                    }
                  }}
                >
                  <Stack>

                    {/* HEADER */}
                    <Stack direction="row" justifyContent="space-between" p={2}>
                      <Typography variant="h6">
                        {t('notifications.title')}
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
                        {t('notifications.markAllRead')}
                      </Typography>
                    </Stack>

                    {/* TABS */}
                    <Tabs
                      value={tab}
                      onChange={(e, v) => setTab(v)}
                      variant="fullWidth"
                    >
                      <Tab label={`${t('notifications.all')} (${notifications.length})`} value="all" />
                      <Tab label={`${t('notifications.unread')} (${unreadCount})`} value="unread" />
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
                          backgroundColor: theme.palette.mode === 'dark'
                            ? alpha(theme.palette.common.white, 0.24)
                            : alpha(theme.palette.common.black, 0.2),
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