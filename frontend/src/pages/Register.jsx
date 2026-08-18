import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  CircularProgress,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';

import {
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

import useAuth from 'hooks/useAuth';
import useTranslation from 'hooks/useTranslation';
import AuthCard from 'ui-component/AuthCard';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      await register({
        username,
        email,
        password,
        role: 'qa'
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <AuthCard>
          <Typography
            variant="h3"
            sx={{
              mb: 1,
              fontWeight: 700,
              color: 'primary.main',
              textAlign: 'center'
            }}
          >
            {t('auth.register')}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 4,
              color: 'text.secondary',
              textAlign: 'center'
            }}
          >
            {t('auth.registerSubtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label={t('auth.username')}
              type="text"
              fullWidth
              size="medium"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />

            <TextField
              label={t('auth.email')}
              type="email"
              fullWidth
              size="medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete="off"
            />

            <TextField
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              fullWidth
              size="medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label={t('auth.confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              size="medium"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 2 }}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{ py: 1.4 }}
            >
              {loading
                ? <CircularProgress size={24} color="inherit" />
                : t('auth.register')}
            </Button>

            <Typography
              variant="body2"
              sx={{
                mt: 3,
                textAlign: 'center'
              }}
            >
              {t('auth.hasAccount')}{' '}
              <Link component={RouterLink} to="/login" underline="hover">
                {t('auth.login')}
              </Link>
            </Typography>
          </Box>
      </AuthCard>
    </Box>
  );
}
