import { useState } from 'react';
import {
  Link as RouterLink,
  useNavigate,
  useLocation
} from 'react-router-dom';

import {
  Box,
  Button,
  Card,
  CardContent,
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

export default function Login() {

  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  // ========================================
  // Form state
  // ========================================

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  // ========================================
  // Handle login
  // ========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError('');

    // Validate fields
    if (!username || !password) {
      setError(
        'Please enter your username and password'
      );
      return;
    }

    try {

      setLoading(true);

      await login({
        username,
        password
      });

      // Redirect user to requested page
      const from =
        location.state?.from?.pathname ||
        '/dashboard';

      navigate(from, {
        replace: true
      });

    } catch (err) {

      setError(
        err.message ||
        'Invalid username or password'
      );

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

      <Card
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 2px 14px rgba(32,40,45,0.08)',
          animation: 'fadeIn 0.5s ease'
        }}
      >

        <CardContent sx={{ p: 4 }}>

          {/* Title */}

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

          {/* Error message */}

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* Login form */}

          <Box
            component="form"
            onSubmit={handleSubmit}
          >

            {/* Username */}

            <TextField
              label="Username"
              type="text"
              fullWidth
              size="medium"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              sx={{ mb: 3 }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />

            {/* Password */}

            <TextField
              label="Password"
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              fullWidth
              size="medium"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              sx={{ mb: 3 }}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">

                    <IconButton
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      edge="end"
                    >
                      {showPassword
                        ? <Visibility />
                        : <VisibilityOff />}
                    </IconButton>

                  </InputAdornment>
                )
              }}
            />

            {/* Submit button */}

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{ py: 1.4 }}
            >

              {loading
                ? (
                  <CircularProgress
                    size={24}
                    color="inherit"
                  />
                )
                : 'Login'}

            </Button>

            {/* Register link */}

            <Typography
              variant="body2"
              sx={{
                mt: 3,
                textAlign: 'center'
              }}
            >
              Don&apos;t have an account?{' '}

              <Link
                component={RouterLink}
                to="/register"
                underline="hover"
              >
                Register
              </Link>

            </Typography>

          </Box>

        </CardContent>

      </Card>

      {/* Animation */}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

    </Box>
  );
}