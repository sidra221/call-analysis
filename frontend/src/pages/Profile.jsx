import { useState } from 'react';
import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import {
  Card, CardContent, Typography, Button, Stack, Avatar, TextField,
  MenuItem, Switch, Box, Chip, Divider, useColorScheme, Alert,
  Grid, Paper, IconButton, InputAdornment, Collapse
} from '@mui/material';
import {
  IconUser, IconShieldLock, IconAdjustments, IconKey, IconMail, IconBriefcase,
  IconBell, IconMoon, IconSun, IconLanguage, IconLogout, IconEye, IconEyeOff,
  IconChevronDown, IconChevronUp
} from '@tabler/icons-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function ProfilePage() {
  const { mode, setMode } = useColorScheme();
  const { state: { language }, setField } = useConfig();
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const isAr = language === 'ar';

  // Get display name from user object
  const displayName = user?.user || user?.username || 'User';
  const userRole = user?.role?.toLowerCase() || 'agent';
  const userEmail = user?.email || '—';

  // Same avatar as in header - using dicebear
  const avatarSrc = `https://api.dicebear.com/7.x/notionists/svg?seed=${displayName}`;

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
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.message);
      setTimeout(() => setPwError(''), 3000);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      <Grid container spacing={3}>
        
        {/* Left Column - Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              {/* Avatar */}
              <Avatar
                src={avatarSrc}
                alt={displayName}
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  border: `3px solid ${roleColors[userRole]?.color || '#5e35b1'}`
                }}
              />

              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {displayName}
              </Typography>
              
              <Chip 
                label={user?.role?.toUpperCase() || 'Unknown'} 
                size="small" 
                sx={{
                  mt: 1,
                  mb: 2,
                  bgcolor: roleColors[userRole]?.bg,
                  color: roleColors[userRole]?.color,
                  fontWeight: 600,
                  px: 1
                }} 
              />

              <Divider sx={{ my: 2 }} />

              {/* User Info Items */}
              <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <IconMail size={18} color="#757575" />
                  <Typography variant="body2" color="text.secondary">
                    {userEmail}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <IconBriefcase size={18} color="#757575" />
                  <Typography variant="body2" color="text.secondary">
                    {user?.role?.toUpperCase() || 'Unknown'} Role
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Logout Button */}
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<IconLogout size={18} />}
                onClick={() => { logout(); window.location.href = '/login'; }}
                sx={{ borderRadius: 2, textTransform: 'none', mt: 2 }}
              >
                {isAr ? 'تسجيل الخروج' : 'Logout'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - All Settings Together */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              
              {/* All settings in one place - no separate cards */}
              <Stack spacing={3}>
                
                {/* Appearance & Language Section */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <IconAdjustments size={24} color={roleColors[userRole]?.color || '#5e35b1'} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {isAr ? 'المظهر واللغة' : 'Appearance & Language'}
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={2}>
                    {/* Dark/Light Mode */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {mode === 'dark' ? <IconMoon size={20} /> : <IconSun size={20} />}
                            <Typography variant="body2">
                              {mode === 'dark' ? (isAr ? 'ليلي' : 'Dark') : (isAr ? 'نهاري' : 'Light')}
                            </Typography>
                          </Stack>
                          <Switch 
                            checked={mode === 'dark'} 
                            onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')} 
                            size="small"
                          />
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Notifications */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <IconBell size={20} />
                            <Typography variant="body2">
                              {isAr ? 'إشعارات' : 'Alerts'}
                            </Typography>
                          </Stack>
                          <Switch defaultChecked size="small" />
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Language Dropdown */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconLanguage size={20} />
                          <Typography variant="body2" sx={{ minWidth: 70 }}>
                            {isAr ? 'اللغة' : 'Language'}
                          </Typography>
                          <TextField
                            select
                            value={language}
                            onChange={(e) => setField('language', e.target.value)}
                            size="small"
                            sx={{ 
                              ml: 'auto', 
                              width: 100,
                              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                              '& .MuiSelect-select': { p: 0.5 }
                            }}
                            variant="outlined"
                          >
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="ar">العربية</MenuItem>
                          </TextField>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Change Password Section - Collapsible */}
                <Box>
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    justifyContent="space-between" 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <IconShieldLock size={24} color={roleColors[userRole]?.color || '#5e35b1'} />
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                      </Typography>
                    </Stack>
                    {showPasswordSection ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                  </Stack>
                  
                  <Collapse in={showPasswordSection}>
                    <Divider sx={{ my: 3 }} />
                    
                    <Stack spacing={2.5}>
                      {/* Current Password */}
                      <TextField 
                        fullWidth 
                        type={showCurrentPassword ? 'text' : 'password'}
                        label={isAr ? 'كلمة المرور الحالية' : 'Current Password'}
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        size="medium"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                                {showCurrentPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                      
                      {/* New Password */}
                      <TextField 
                        fullWidth 
                        type={showNewPassword ? 'text' : 'password'}
                        label={isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        size="medium"
                        helperText={isAr ? 'يجب أن تكون 8 أحرف على الأقل' : 'At least 8 characters'}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                                {showNewPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                      
                      {/* Confirm Password */}
                      <TextField 
                        fullWidth 
                        type={showConfirmPassword ? 'text' : 'password'}
                        label={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        size="medium"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />

                      {pwError && <Alert severity="error">{pwError}</Alert>}
                      {pwSuccess && <Alert severity="success">{pwSuccess}</Alert>}

                      <Button 
                        variant="contained" 
                        startIcon={<IconKey size={18} />}
                        onClick={handleUpdatePassword} 
                        disabled={pwLoading}
                        sx={{ 
                          borderRadius: 2, 
                          textTransform: 'none',
                          alignSelf: 'flex-start',
                          px: 4,
                          py: 1
                        }}
                      >
                        {pwLoading ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
                      </Button>
                    </Stack>
                  </Collapse>
                </Box>

              </Stack>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}