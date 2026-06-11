import { useMemo, useState } from 'react';
import useConfig from 'hooks/useConfig';
import useAuth from 'hooks/useAuth';
import PageCard from 'ui-component/PageCard';
import ProfileAvatarUpload from 'ui-component/ProfileAvatarUpload';
import {
  Card, Typography, Button, Stack, TextField,
  MenuItem, Switch, Box, Divider, useColorScheme,
  Grid, IconButton, InputAdornment, Collapse, ToggleButton, ToggleButtonGroup,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  IconShieldLock, IconDeviceFloppy, IconMail, IconBriefcase,
  IconBell, IconMoon, IconSun, IconLanguage, IconEdit, IconEye, IconEyeOff,
  IconChevronDown, IconChevronUp, IconPalette, IconX,
  IconCircleCheck, IconAlertCircle
} from '@tabler/icons-react';
import { alpha, useTheme } from '@mui/material/styles';
import { THEME_PRESETS, getRoleDefaultTheme, isLegacyPreset } from 'constants/themes';
import { accountsApi } from 'api/api';
import {
  buildSavedAvatarState,
  isAvatarDraftDirty,
} from 'utils/avatar';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function SettingIcon({ children }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: 'primary.main',
        flexShrink: 0
      }}
    >
      {children}
    </Box>
  );
}

function SettingTile({ icon, title, description, control }) {
  return (
    <Card
      sx={{
        height: '100%',
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          p: 2.5,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 148
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <SettingIcon>{icon}</SettingIcon>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {description}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 'auto' }}>
          {control}
        </Box>
      </Box>
    </Card>
  );
}

export default function ProfilePage() {
  const theme = useTheme();
  const { mode, setMode } = useColorScheme();
  const {
    state: { language, presetColor, notificationsEnabled: savedNotifications },
    setState: setConfigState
  } = useConfig();
  const { user, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState({ open: false, type: 'success', message: '' });
  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const displayName = user?.user || user?.username || 'User';
  const userRole = user?.role?.toLowerCase() || 'agent';
  const userEmail = user?.email || '—';
  const roleDefaultTheme = getRoleDefaultTheme(userRole);
  const savedPreset = isLegacyPreset(presetColor) ? roleDefaultTheme : presetColor;
  const displayMode = mode === 'dark' ? 'dark' : 'light';

  const [draft, setDraft] = useState({
    language,
    presetColor: savedPreset,
    displayMode,
    notificationsEnabled: savedNotifications ?? true,
    avatar: buildSavedAvatarState(),
  });

  const isAr = language === 'ar';

  const resetDraft = () => {
    if (draft.avatar?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(draft.avatar.previewUrl);
    }

    setDraft({
      language,
      presetColor: savedPreset,
      displayMode,
      notificationsEnabled: savedNotifications ?? true,
      avatar: buildSavedAvatarState(),
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSaveFeedback({ open: false, type: 'success', message: '' });
    setShowPasswordSection(false);
  };

  const handleStartEdit = () => {
    resetDraft();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    resetDraft();
    setIsEditing(false);
  };

  const updateDraft = (key, value) => {
    if (!isEditing) return;
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaveFeedback({ open: false, type: 'success', message: '' });
  };

  const hasPasswordInput = Boolean(currentPassword || newPassword || confirmPassword);

  const isAvatarDirty = useMemo(
    () => isAvatarDraftDirty(user, draft.avatar),
    [user, draft.avatar]
  );

  const isDirty = useMemo(() => (
    draft.language !== language
    || draft.presetColor !== savedPreset
    || draft.displayMode !== displayMode
    || draft.notificationsEnabled !== (savedNotifications ?? true)
    || hasPasswordInput
    || isAvatarDirty
  ), [
    draft,
    language,
    savedPreset,
    displayMode,
    savedNotifications,
    hasPasswordInput,
    isAvatarDirty,
  ]);

  const handleSaveProfile = async () => {
    setSaveFeedback({ open: false, type: 'success', message: '' });

    if (!isDirty) return;

    try {
      setSaving(true);

      let savedUserData = user;

      if (isAvatarDirty) {
        if (draft.avatar.pendingFile) {
          const formData = new FormData();
          formData.append('avatar', draft.avatar.pendingFile);
          const res = await accountsApi.uploadAvatar(formData);
          savedUserData = res?.data || res;
          updateUser(savedUserData);
        } else if (draft.avatar.removeCustom) {
          const res = await accountsApi.setAvatarStyle('initial');
          savedUserData = res?.data || res;
          updateUser(savedUserData);
        }

        if (draft.avatar.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(draft.avatar.previewUrl);
        }
      }

      if (hasPasswordInput) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          throw new Error(isAr ? 'جميع حقول كلمة المرور مطلوبة' : 'All password fields are required');
        }
        if (newPassword !== confirmPassword) {
          throw new Error(isAr ? 'كلمتا المرور الجديدتان غير متطابقتين' : 'New passwords do not match');
        }
        if (newPassword.length < 8) {
          throw new Error(isAr ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters');
        }

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
          throw new Error(data?.error?.message || (isAr ? 'فشل تحديث كلمة المرور' : 'Failed to update password'));
        }

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      const themeWasChanged = draft.presetColor !== savedPreset;

      setConfigState((prev) => ({
        ...prev,
        language: draft.language,
        presetColor: draft.presetColor,
        notificationsEnabled: draft.notificationsEnabled,
        themeCustomized: themeWasChanged ? true : prev.themeCustomized,
        themeUserId: user.id,
      }));

      if (draft.displayMode !== displayMode) {
        setMode(draft.displayMode);
      }

      setSaveFeedback({
        open: true,
        type: 'success',
        message: hasPasswordInput
          ? (isAr ? 'تم حفظ الإعدادات وكلمة المرور بنجاح.' : 'Your settings and password were saved successfully.')
          : (isAr ? 'تم حفظ التغييرات بنجاح.' : 'Your changes were saved successfully.'),
      });

      setDraft({
        language: draft.language,
        presetColor: draft.presetColor,
        displayMode: draft.displayMode,
        notificationsEnabled: draft.notificationsEnabled,
        avatar: buildSavedAvatarState(),
      });
      setIsEditing(false);
    } catch (err) {
      setSaveFeedback({
        open: true,
        type: 'error',
        message: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageCard bordered contentSX={{ p: 0 }}>
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: 4,
          overflow: 'visible',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          spacing={3}
        >
          <ProfileAvatarUpload
            size={96}
            editable={isEditing}
            role={userRole}
            displayName={displayName}
            user={user}
            value={draft.avatar}
            onChange={(avatar) => updateDraft('avatar', avatar)}
          />

          <Box
            sx={{
              flex: 1,
              textAlign: { xs: 'center', sm: 'left' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: 96
            }}
          >
            <Typography variant="h4" fontWeight={700}>
              {displayName}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mt: 1 }}
              alignItems={{ xs: 'center', sm: 'center' }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <IconMail size={16} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary">{userEmail}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconBriefcase size={16} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary">
                  {user?.role?.toUpperCase() || 'Unknown'}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Stack
            spacing={1}
            alignItems={{ xs: 'center', sm: 'flex-end' }}
            sx={{ flexShrink: 0, alignSelf: 'center' }}
          >
            {!isEditing ? (
              <Button
                variant="outlined"
                startIcon={<IconEdit size={18} />}
                onClick={handleStartEdit}
              >
                {isAr ? 'تعديل' : 'Edit'}
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<IconX size={18} />}
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<IconDeviceFloppy size={18} />}
                  onClick={handleSaveProfile}
                  disabled={saving || !isDirty}
                >
                  {saving
                    ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                    : (isAr ? 'حفظ' : 'Save')}
                </Button>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
          <Grid size={{ xs: 12, sm: 4 }}>
            <SettingTile
              icon={draft.displayMode === 'dark' ? <IconMoon size={20} /> : <IconSun size={20} />}
              title={isAr ? 'وضع العرض' : 'Display Mode'}
              description={isAr ? 'اختر المظهر النهاري أو الليلي' : 'Choose light or dark appearance'}
              control={
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  disabled={!isEditing}
                  value={draft.displayMode}
                  onChange={(_, value) => value && updateDraft('displayMode', value)}
                >
                  <ToggleButton value="light" sx={{ textTransform: 'none', gap: 0.75 }}>
                    <IconSun size={16} />
                    {isAr ? 'نهاري' : 'Light'}
                  </ToggleButton>
                  <ToggleButton value="dark" sx={{ textTransform: 'none', gap: 0.75 }}>
                    <IconMoon size={16} />
                    {isAr ? 'ليلي' : 'Dark'}
                  </ToggleButton>
                </ToggleButtonGroup>
              }
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <SettingTile
              icon={<IconBell size={20} />}
              title={isAr ? 'الإشعارات' : 'Notifications'}
              description={isAr ? 'تنبيهات النظام والتحديثات' : 'System alerts and updates'}
              control={
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {draft.notificationsEnabled
                      ? (isAr ? 'مفعّلة' : 'Enabled')
                      : (isAr ? 'معطّلة' : 'Disabled')}
                  </Typography>
                  <Switch
                    checked={draft.notificationsEnabled}
                    onChange={(e) => updateDraft('notificationsEnabled', e.target.checked)}
                    disabled={!isEditing}
                    size="small"
                  />
                </Stack>
              }
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <SettingTile
              icon={<IconLanguage size={20} />}
              title={isAr ? 'اللغة' : 'Language'}
              description={isAr ? 'لغة واجهة التطبيق' : 'Application interface language'}
              control={
                <TextField
                  select
                  fullWidth
                  size="small"
                  disabled={!isEditing}
                  value={draft.language}
                  onChange={(e) => updateDraft('language', e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="ar">العربية</MenuItem>
                </TextField>
              }
            />
          </Grid>
        </Grid>

        {/* Theme picker */}
        <Card
          sx={{
            mb: 2,
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main'
                }}
              >
                <IconPalette size={20} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {isAr ? 'لون الثيم' : 'Theme Color'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isAr ? 'اختر لون واجهة التطبيق' : 'Choose your interface accent color'}
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={1.5}>
              {THEME_PRESETS.map((preset) => {
                const selected = draft.presetColor === preset.id;
                const label = isAr ? preset.label.ar : preset.label.en;
                return (
                  <Grid key={preset.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Box
                      onClick={() => isEditing && updateDraft('presetColor', preset.id)}
                      sx={{
                        cursor: isEditing ? 'pointer' : 'default',
                        p: 2,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: selected ? 'primary.main' : 'divider',
                        bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
                        opacity: isEditing ? 1 : 0.85,
                        transition: 'all 0.2s',
                        ...(isEditing && {
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          }
                        })
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: preset.swatch, flexShrink: 0 }} />
                        <Typography variant="body2" fontWeight={selected ? 600 : 500}>
                          {label}
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Card>

        {/* Password */}
        <Card
          sx={{
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box
            sx={{ p: 2.5, cursor: isEditing ? 'pointer' : 'default', opacity: isEditing ? 1 : 0.7 }}
            onClick={() => isEditing && setShowPasswordSection(!showPasswordSection)}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }}
                >
                  <IconShieldLock size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isAr ? 'تحديث كلمة المرور الحالية' : 'Update your current password'}
                  </Typography>
                </Box>
              </Stack>
              {showPasswordSection ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
            </Stack>
          </Box>

          <Collapse in={isEditing && showPasswordSection}>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  type={showCurrentPassword ? 'text' : 'password'}
                  label={isAr ? 'كلمة المرور الحالية' : 'Current Password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                <TextField
                  fullWidth
                  type={showNewPassword ? 'text' : 'password'}
                  label={isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={Boolean(newPassword && newPassword.length < 8)}
                  helperText={
                    newPassword && newPassword.length < 8
                      ? (isAr ? 'يجب أن تكون 8 أحرف على الأقل' : 'At least 8 characters')
                      : ''
                  }
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
                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  label={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              </Stack>
            </Box>
          </Collapse>
        </Card>
      </Box>

      <Dialog
        open={saveFeedback.open}
        onClose={() => setSaveFeedback((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          {saveFeedback.type === 'success' ? (
            <>
              <IconCircleCheck size={24} color={theme.palette.success.main} />
              {isAr ? 'تم حفظ التغييرات' : 'Changes Saved'}
            </>
          ) : (
            <>
              <IconAlertCircle size={24} color={theme.palette.error.main} />
              {isAr ? 'فشل الحفظ' : 'Save Failed'}
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{saveFeedback.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="contained"
            color={saveFeedback.type === 'success' ? 'primary' : 'error'}
            onClick={() => setSaveFeedback((prev) => ({ ...prev, open: false }))}
          >
            {isAr ? 'حسناً' : 'OK'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageCard>
  );
}
