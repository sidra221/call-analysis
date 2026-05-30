import { Avatar, Box, List, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  IconPhone,
  IconRefresh,
  IconReportAnalytics,
  IconUser
} from '@tabler/icons-react';

function NotificationItem({ item, setNotifications, onMarkAsRead }) {
  const navigate = useNavigate();

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
        return '#1976d2';
      case 'followup':
        return '#ed6c02';
      case 'followup-status':
        return '#ed6c02';
      case 'report':
        return '#9c27b0';
      case 'report-review':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

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
            bgcolor: `${getAvatarColor()}15`,
            color: getAvatarColor(),
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
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No notifications yet
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