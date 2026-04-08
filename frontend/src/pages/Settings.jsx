import { useState } from 'react';
import { Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Switch, Typography } from '@mui/material';

export default function Settings() {
  const [themeMode, setThemeMode] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage application preferences
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack>
                <Typography variant="subtitle1">Theme</Typography>
                <Typography variant="body2" color="text.secondary">
                  Switch between Light and Dark modes
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="body2">Light</Typography>
                <Switch checked={themeMode === 'dark'} onChange={(event) => setThemeMode(event.target.checked ? 'dark' : 'light')} />
                <Typography variant="body2">Dark</Typography>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack>
                <Typography variant="subtitle1">Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  Enable system notifications
                </Typography>
              </Stack>
              <Switch checked={notifications} onChange={(event) => setNotifications(event.target.checked)} />
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select value={language} label="Language" onChange={(event) => setLanguage(event.target.value)}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ar">Arabic</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
