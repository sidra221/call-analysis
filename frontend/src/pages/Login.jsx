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
import AuthCard from 'ui-component/AuthCard';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter your username and password');
      return;
    }

    try {
      setLoading(true);

      await login({ username, password });

      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password');
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
            Login
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 4,
              color: 'text.secondary',
              textAlign: 'center'
            }}
          >
            Enter your credentials to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Username"
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
              label="Password"
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
                : 'Login'}
            </Button>

            <Typography
              variant="body2"
              sx={{
                mt: 3,
                textAlign: 'center'
              }}
            >
              Don&apos;t have an account?{' '}
              <Link component={RouterLink} to="/register" underline="hover">
                Register
              </Link>
            </Typography>
          </Box>
      </AuthCard>
    </Box>
  );
}
