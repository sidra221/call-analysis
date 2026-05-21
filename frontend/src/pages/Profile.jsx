import { useState } from 'react';
import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import {
  Card, CardContent, Typography, Button, Stack, Avatar, TextField,
  MenuItem, Switch, FormControlLabel, Box, Chip, Divider, useColorScheme, Alert
} from '@mui/material';
import {
  IconUser, IconShieldLock, IconAdjustments, IconDeviceFloppy, IconKey
} from '@tabler/icons-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function ProfilePage() {
  const { mode, setMode } = useColorScheme();
  const { state: { language }, setField } = useConfig();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const isAr = language === 'ar';

  const roleColors = {
    manager: { bg: '#ede7f6', color: '#5e35b1' },
    agent:   { bg: '#e3f2fd', color: '#1e88e5' },
    qa:      { bg: '#fff3e0', color: '#ef6c00' }
  };

  const handleUpdatePassword = async () => {
    setPwError('');
    setPwSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }

    try {
      setPwLoading(true);
      const res = await fetch(`${API_URL}/api/accounts/me/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || 'Failed to update password');
      }

      setPwSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Stack spacing={3}>

      {/* Personal Information */}
      <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconUser size={20} />
              {isAr ? 'المعلومات الشخصية' : 'Personal Information'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" mb={4}
            sx={{ background: '#f8f9fa', p: 2, borderRadius: 3 }}>
            <Avatar sx={{
              width: 72, height: 72, fontWeight: 700, fontSize: 28,
              bgcolor: roleColors[user?.role]?.bg || '#ede7f6',
              color: roleColors[user?.role]?.color || '#5e35b1'
            }}>
              {user?.user?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Typography fontWeight={600}>{user?.user || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email || '—'}</Typography>
              {user?.role && (
                <Chip label={user.role} size="small" sx={{
                  mt: 0.5,
                  bgcolor: roleColors[user.role]?.bg,
                  color: roleColors[user.role]?.color,
                  fontWeight: 600
                }} />
              )}
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Username" value={user?.user || ''} disabled />
              <TextField fullWidth label="Email" value={user?.email || ''} disabled />
            </Stack>
            <TextField fullWidth label="Role" value={user?.role || ''} disabled />
          </Stack>
        </CardContent>
      </Card>

      {/* Security */}
      <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconShieldLock size={20} />
              {isAr ? 'الأمان' : 'Security'}
            </Typography>
            <Button variant="contained" startIcon={<IconKey size={18} />}
              onClick={handleUpdatePassword} disabled={pwLoading}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              {isAr ? 'تحديث كلمة المرور' : 'Update Password'}
            </Button>
          </Stack>

          {pwError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPwError('')}>{pwError}</Alert>}
          {pwSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPwSuccess('')}>{pwSuccess}</Alert>}

          <Stack spacing={2}>
            <TextField fullWidth type="password" label="Current Password"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth type="password" label="New Password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <TextField fullWidth type="password" label="Confirm Password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconAdjustments size={20} />
              {isAr ? 'التفضيلات' : 'Preferences'}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                <FormControlLabel
                  control={<Switch checked={mode === 'dark'} onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')} />}
                  label={isAr ? 'الوضع الليلي' : 'Dark Mode'}
                />
              </Box>
              <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                <FormControlLabel control={<Switch defaultChecked />}
                  label={isAr ? 'الإشعارات' : 'Notifications'} />
              </Box>
            </Stack>

            <TextField select fullWidth label={isAr ? 'اللغة' : 'Language'}
              value={language} onChange={(e) => setField('language', e.target.value)}
              InputLabelProps={{ shrink: true }}>
              <MenuItem value="ar">العربية</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

    </Stack>
  );
}