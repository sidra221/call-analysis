import PropTypes from 'prop-types';
import {
  createContext,
  useMemo,
  useState,
  useCallback,
  useEffect
} from 'react';

// ========================================
// API base URL
// ========================================

const API_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const AuthContext = createContext(undefined);

// ========================================
// Auth Provider
// ========================================

export function AuthProvider({ children }) {

  // ========================================
  // Auth state
  // ========================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem('access_token')
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('authUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  // ========================================
  // Restore auth state on refresh
  // ========================================

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('authUser');

    if (token) {
      setIsLoggedIn(true);
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // ========================================
  // Login
  // ========================================

  const login = useCallback(async ({ username, password }) => {

    const tokenResponse = await fetch(
      `${API_URL}/api/accounts/login/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Invalid username or password');
    }

    const tokenData = await tokenResponse.json();

    const access =
      tokenData?.access ||
      tokenData?.data?.access;

    const refresh =
      tokenData?.refresh ||
      tokenData?.data?.refresh;

    if (!access) {
      throw new Error('Login failed');
    }

    // Save tokens
    localStorage.setItem('access_token', access);

    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }

    // Fetch current user profile
    const meResponse = await fetch(
      `${API_URL}/api/accounts/me/`,
      {
        headers: {
          Authorization: `Bearer ${access}`
        }
      }
    );

    if (!meResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const meData = await meResponse.json();

    const userData =
      meData?.data || meData;

    // Save user
    localStorage.setItem(
      'authUser',
      JSON.stringify(userData)
    );

    setUser(userData);
    setIsLoggedIn(true);

  }, []);

  // ========================================
  // Register
  // ========================================

  const register = useCallback(async ({
    username,
    email,
    password,
    role
  }) => {

    const response = await fetch(
      `${API_URL}/api/accounts/register/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role
        })
      }
    );

    if (!response.ok) {

      const errorData = await response.json();

      throw new Error(
        errorData?.error?.message ||
        'Registration failed'
      );
    }

    return await response.json();

  }, []);

  // ========================================
  // Logout
  // ========================================

  const logout = useCallback(() => {

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('authUser');

    setUser(null);
    setIsLoggedIn(false);

  }, []);

  // ========================================
  // Refresh token
  // ========================================

  const refreshToken = useCallback(async () => {

    const refresh =
      localStorage.getItem('refresh_token');

    if (!refresh) {
      logout();
      return null;
    }

    const response = await fetch(
      `${API_URL}/api/accounts/token/refresh/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh
        })
      }
    );

    if (!response.ok) {
      logout();
      return null;
    }

    const data = await response.json();

    const access =
      data?.access ||
      data?.data?.access;

    if (!access) {
      logout();
      return null;
    }

    localStorage.setItem('access_token', access);

    return access;

  }, [logout]);

  // ========================================
  // Context value
  // ========================================

  const value = useMemo(() => ({
    isLoggedIn,
    user,
    loading,
    login,
    register,
    logout,
    refreshToken
  }), [
    isLoggedIn,
    user,
    loading,
    login,
    register,
    logout,
    refreshToken
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node
};