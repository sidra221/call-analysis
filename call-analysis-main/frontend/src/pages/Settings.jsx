import { useState } from 'react';

// MUI
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Avatar,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Box,
  Chip
} from '@mui/material';

// Icons
import {
  IconUser,
  IconShieldLock,
  IconAdjustments,
  IconSettings,
  IconUpload,
  IconDeviceFloppy,
  IconKey,
  IconUsers,
  IconMoodSmile,
  IconListCheck,
  IconAlertTriangle,
  IconRefreshAlert
} from '@tabler/icons-react';

const tabs = [
  { label: 'Profile', icon: <IconUser size={18} /> },
  { label: 'Security', icon: <IconShieldLock size={18} /> },
  { label: 'Preferences', icon: <IconAdjustments size={18} /> },
  { label: 'System', icon: <IconSettings size={18} /> }
];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      <CardContent>

        {/* Header */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            padding: '16px 2px',
            fontWeight: 600
          }}
        >
          Settings
        </Typography>

        {/* Tabs */}
        <Stack direction="row" spacing={1} mb={3}>
          {tabs.map((t, i) => (
            <Button
              key={i}
              startIcon={t.icon}
              onClick={() => setTab(i)}
              variant={tab === i ? 'contained' : 'outlined'}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              {t.label}
            </Button>
          ))}
        </Stack>

        {/* ================= PROFILE ================= */}
        {tab === 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
            <CardContent>

              <Typography
                variant="h6"
                mb={3}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600
                }}
              >
                <IconUser size={20} />
                Personal Information
              </Typography>

              {/* Avatar */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                mb={4}
                sx={{
                  background: '#f8f9fa',
                  p: 2,
                  borderRadius: 3
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: '#5e35b1',
                    fontWeight: 600
                  }}
                >
                  AH
                </Avatar>

                <Box>
                  <Typography fontWeight={600}>
                    Ahmed Al-Shammari
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    System Administrator
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<IconUpload size={18} />}
                  sx={{
                    ml: 'auto',
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Upload Photo
                </Button>
              </Stack>

              {/* Fields */}
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Name"
                    placeholder="Full name"
                  />

                  <TextField
                    fullWidth
                    disabled
                    label="Email"
                    defaultValue="ahmed@co.sa"
                  />
                </Stack>

                <TextField
                  fullWidth
                  disabled
                  label="Job Role"
                  defaultValue="System Administrator"
                />
              </Stack>

              <Button
                variant="contained"
                startIcon={<IconDeviceFloppy size={18} />}
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Save Changes
              </Button>

            </CardContent>
          </Card>
        )}

        {/* ================= SECURITY ================= */}
        {tab === 1 && (
          <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
            <CardContent>

              <Typography
                variant="h6"
                mb={3}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600
                }}
              >
                <IconShieldLock size={20} />
                Change Password
              </Typography>

              <Stack spacing={2}>

                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>

                  <Box width="100%">
                    <TextField
                      fullWidth
                      type="password"
                      label="New Password"
                    />

                    <Chip
                      label="Strong Password"
                      size="small"
                      sx={{
                        mt: 1,
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32'
                      }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm Password"
                  />
                </Stack>
              </Stack>

              <Button
                variant="contained"
                startIcon={<IconKey size={18} />}
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Update Password
              </Button>

            </CardContent>
          </Card>
        )}

        {/* ================= PREFERENCES ================= */}
        {tab === 2 && (
          <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
            <CardContent>

              <Typography
                variant="h6"
                mb={3}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600
                }}
              >
                <IconAdjustments size={20} />
                Preferences
              </Typography>

              <Stack spacing={2}>

                <FormControlLabel
                  control={<Switch />}
                  label="Dark Mode"
                />

                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Notifications"
                />

                <TextField
                  select
                  fullWidth
                  label="Language"
                  defaultValue="English"
                >
                  <MenuItem value="Arabic">Arabic</MenuItem>
                  <MenuItem value="English">English</MenuItem>
                </TextField>

              </Stack>

              <Button
                variant="contained"
                startIcon={<IconDeviceFloppy size={18} />}
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Save Preferences
              </Button>

            </CardContent>
          </Card>
        )}

        {/* ================= SYSTEM ================= */}
        {tab === 3 && (
          <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
            <CardContent>

              <Typography
                variant="h6"
                mb={3}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600
                }}
              >
                <IconSettings size={20} />
                System Settings — Admin
              </Typography>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                mb={3}
              >

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<IconUsers size={18} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  User Management
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<IconMoodSmile size={18} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Edit Sentiments
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<IconListCheck size={18} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Edit Priorities
                </Button>

              </Stack>

              <Divider sx={{ mb: 3 }} />

              {/* Danger Zone */}
              <Box
                sx={{
                  border: '1px solid #ffcdd2',
                  background: '#ffebee',
                  borderRadius: 3,
                  p: 3
                }}
              >

                <Typography
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#d32f2f',
                    fontWeight: 600,
                    mb: 1
                  }}
                >
                  <IconAlertTriangle size={18} />
                  Danger Zone
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#c62828',
                    mb: 2
                  }}
                >
                  This action cannot be undone. Proceed carefully.
                </Typography>

                <Button
                  color="error"
                  variant="contained"
                  startIcon={<IconRefreshAlert size={18} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Reset System
                </Button>

              </Box>

            </CardContent>
          </Card>
        )}

      </CardContent>
    </Card>
  );
}