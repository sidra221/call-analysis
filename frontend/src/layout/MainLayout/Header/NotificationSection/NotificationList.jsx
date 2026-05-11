import { Avatar, Box, Button, List, Stack, Typography } from '@mui/material';
import User1 from 'assets/images/users/user-round.svg';

function NotificationItem({ item, setNotifications }) {
  return (
    
     <Box
  onClick={() => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === item.id ? { ...n, unread: false } : n
      )
    );
  }}
  sx={{
    p: 2,
    borderBottom: '1px solid',
    borderColor: 'divider',
    cursor: 'pointer',

    bgcolor: item.unread ? 'grey.100' : 'transparent', // 👈 هون الفكرة

    '&:hover': {
      bgcolor: item.unread ? 'grey.200' : 'action.hover'
    }
  }}
>
      <Stack direction="row" spacing={2}>
        <Avatar src={User1} />

        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">
            <b>@{item.user}</b> {item.text}
          </Typography>

          {item.message && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 2 }}>
              <Typography variant="caption">
                {item.message}
              </Typography>
            </Box>
          )}

          {item.type === 'invite' && (
            <Stack direction="row" spacing={1} mt={1}>
              <Button size="small" variant="outlined">
                Decline
              </Button>
              <Button size="small" variant="contained">
                Accept
              </Button>
            </Stack>
          )}
        </Box>

        <Stack alignItems="flex-end" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            {item.time}
          </Typography>

          {item.unread && (
            <Box
             
    sx={{
    width: '100%',
    p: 1,
    borderRadius: 1,
    bgcolor: item.unread ? 'grey.100' : 'transparent',
    transition: 'all 0.2s ease-in-out'
              }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default function NotificationList({ notifications, setNotifications }) {
  return (
    <List sx={{ p: 0 }}>
      {notifications.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          setNotifications={setNotifications}
        />
      ))}
    </List>
  );
}