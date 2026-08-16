import { Avatar, Box, List, Stack, Typography, useTheme } from '@mui/material';
import useTranslation from 'hooks/useTranslation';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  IconPhone,
  IconRefresh,
  IconReportAnalytics,
  IconUser
} from '@tabler/icons-react';

function NotificationItem({ item, setNotifications, onMarkAsRead }) {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleClick = () => {
    // Mark as read when clicked
    if (item.unread) {
      let id;
      if (item.type === 'followup-status' || item.type === 'report-review') {
        id = item.id.split('-')[2] + '-' + item.id.split('-')[3];
      } else {
        id = item.id.split('-')[1];
      }
      onMarkAsRead(item.type, id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, unread: false } : n
        )
      );
    }

    // Navigate to the relevant page
    if (item.link) {
      navigate(item.link, { state: { selectedCallId: item.callId } });
    }
  };

  const getAvatar = () => {
    switch (item.type) {
      case 'call':
        return <IconPhone size={20} />;
      case 'followup':
        return <IconRefresh size={20} />;
      case 'followup-status':
        return <IconRefresh size={20} />;
      case 'report':
        return <IconReportAnalytics size={20} />;
      case 'report-review':
        return <IconReportAnalytics size={20} />;
      default:
        return <IconUser size={20} />;
    }
  };

  const getAvatarColor = () => {
    switch (item.type) {
      case 'call':
        return theme.palette.primary.main;
      case 'followup':
      case 'followup-status':
        return theme.palette.notification.followup;
      case 'report':
      case 'report-review':
        return theme.palette.notification.report;
      default:
        return theme.palette.text.secondary;
    }
  };

  const avatarColor = getAvatarColor();

  return (
    <Box
      onClick={handleClick}
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        bgcolor: item.unread ? 'action.hover' : 'transparent',
        '&:hover': {
          bgcolor: 'action.selected'
        }
      }}
    >
      <Stack direction="row" spacing={2}>
        <Avatar
          sx={{
            bgcolor: alpha(avatarColor, 0.12),
            color: avatarColor,
            width: 40,
            height: 40
          }}
        >
          {getAvatar()}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">
            <b>{item.user}</b> {item.text}
          </Typography>
        </Box>

        <Stack alignItems="flex-end" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            {item.time}
          </Typography>

          {item.unread && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'primary.main'
              }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default function NotificationList({ notifications, setNotifications, onMarkAsRead }) {
  const { t } = useTranslation();

  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('notifications.noNotifications')}
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {notifications.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          setNotifications={setNotifications}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </List>
  );
}
