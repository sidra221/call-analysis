import useConfig from 'hooks/useConfig';

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
  Box,
  Chip,
  Divider,
  useColorScheme
} from '@mui/material';

// Icons
import {
  IconUser,
  IconShieldLock,
  IconAdjustments,
  IconUpload,
  IconDeviceFloppy,
  IconKey
} from '@tabler/icons-react';

export default function ProfilePage() {
  const { mode, setMode } = useColorScheme();
  const {
    state: { language },
    setField
  } = useConfig();

  const isAr = language === 'ar';

  return (
    <Stack spacing={3}>

      {/* ================= PROFILE ================= */}
      <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
        <CardContent>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              <IconUser size={20} />
              {isAr ? 'المعلومات الشخصية' : 'Personal Information'}
            </Typography>

            <Button
              variant="contained"
              startIcon={<IconDeviceFloppy size={18} />}
              sx={{
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              {isAr ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </Stack>

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
            <Box
              sx={{
                position: 'relative',
                width: 72,
                height: 72,
                cursor: 'pointer',
                '&:hover .upload-overlay': {
                  opacity: 1
                }
              }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: '#5e35b1',
                  fontWeight: 600
                }}
              >
                AH
              </Avatar>

              <Box
                className="upload-overlay"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(0,0,0,0.45)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: '0.2s'
                }}
              >
                <IconUpload size={20} color="#fff" />
              </Box>
            </Box>

            <Box>
              <Typography fontWeight={600}>
                Ahmed Al-Shammari
              </Typography>

              <Typography variant="body2" color="text.secondary">
                System Administrator
              </Typography>
            </Box>
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

        </CardContent>
      </Card>

      {/* ================= SECURITY ================= */}
      <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
        <CardContent>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              <IconShieldLock size={20} />
              {isAr ? 'الأمان' : 'Security'}
            </Typography>

            <Button
              variant="contained"
              startIcon={<IconKey size={18} />}
              sx={{
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              {isAr ? 'تحديث كلمة المرور' : 'Update Password'}
            </Button>
          </Stack>

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

        </CardContent>
      </Card>

      {/* ================= PREFERENCES ================= */}
      <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
        <CardContent>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              <IconAdjustments size={20} />
              {isAr ? 'التفضيلات' : 'Preferences'}
            </Typography>

            <Button
              variant="contained"
              startIcon={<IconDeviceFloppy size={18} />}
              sx={{
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              {isAr ? 'حفظ التفضيلات' : 'Save Preferences'}
            </Button>
          </Stack>

          <Stack spacing={2}>

            {/* Toggles */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
            >
              <Box
                sx={{
                  flex: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={mode === 'dark'}
                      onChange={(e) =>
                        setMode(e.target.checked ? 'dark' : 'light')
                      }
                    />
                  }
                  label={isAr ? 'الوضع الليلي' : 'Dark Mode'}
                />
              </Box>

              <Box
                sx={{
                  flex: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2
                }}
              >
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label={isAr ? 'الإشعارات' : 'Notifications'}
                />
              </Box>
            </Stack>

            {/* Language */}
            <TextField
              select
              fullWidth
              label={isAr ? 'اللغة' : 'Language'}
              value={language}
              onChange={(e) => setField('language', e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                },

                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.8
                }
              }}
            >
              <MenuItem value="ar">العربية</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </TextField>

          </Stack>

        </CardContent>
      </Card>

    </Stack>
  );
}