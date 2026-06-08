import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Grid, Link,
  MenuItem, TextField, Typography, Alert, CircularProgress
} from '@mui/material';
import useAuth from 'hooks/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'qa'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
      <Card sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Register
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your account for Call Analysis
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Username"
                  fullWidth
                  required
                  value={form.username}
                  onChange={onChange('username')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={form.email}
                  onChange={onChange('email')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  value={form.password}
                  onChange={onChange('password')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  required
                  value={form.confirmPassword}
                  onChange={onChange('confirmPassword')}
                />
              </Grid>

              {/* Role selector — required by Backend */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  label="Role"
                  fullWidth
                  required
                  value={form.role}
                  onChange={onChange('role')}
                >
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="qa">QA</MenuItem>
                  <MenuItem value="agent">Agent</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{ py: 1.4 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                </Button>
              </Grid>

            </Grid>
          </Box>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Login
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}