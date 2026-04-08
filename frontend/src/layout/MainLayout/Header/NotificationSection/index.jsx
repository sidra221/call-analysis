import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { IconBell } from '@tabler/icons-react';

const notifications = ['Analysis completed', 'High priority call detected', 'Follow-up assigned'];

export default function NotificationSection() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Box sx={{ ml: 2 }}>
        <Avatar
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            transition: 'all .2s ease-in-out',
            color: theme.vars.palette.warning.dark,
            background: theme.vars.palette.warning.light
          }}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <IconBell stroke={1.5} size="20px" />
        </Avatar>
      </Box>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <Box sx={{ px: 2, pt: 1 }}>
          <Typography variant="subtitle1">Notifications</Typography>
        </Box>
        <List dense sx={{ minWidth: 300 }}>
          {notifications.map((item) => (
            <ListItem key={item}>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
      </Menu>
    </>
  );
}
