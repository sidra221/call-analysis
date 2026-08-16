import { useState } from 'react';
import {
  Link as RouterLink,
  useNavigate,
  useLocation
} from 'react-router-dom';

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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username || !password) {
      setError(t('auth.enterCredentials'));
      return;
    }

    try {
      setLoading(true);

      await login({ username, password });

      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || t('auth.invalidCredentials'));
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
        bgcolor: 'grey.50',
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
            {t('auth.login')}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 4,
              color: 'text.secondary',
              textAlign: 'center'
            }}
          >
            {t('auth.loginSubtitle')}
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

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{ py: 1.4 }}
            >
              {loading
                ? <CircularProgress size={24} color="inherit" />
                : t('auth.login')}
            </Button>

            <Typography
              variant="body2"
              sx={{
                mt: 3,
                textAlign: 'center'
              }}
            >
              {t('auth.noAccount')}{' '}
              <Link component={RouterLink} to="/register" underline="hover">
                {t('auth.register')}
              </Link>
            </Typography>
          </Box>
      </AuthCard>
    </Box>
  );
}
