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

function normalizeUserData(userData) {
  if (!userData) return userData;
  return {
    ...userData,
    avatar_style: userData.avatar_style === 'dicebear' ? 'initial' : (userData.avatar_style || 'initial'),
  };
}

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
    return savedUser ? normalizeUserData(JSON.parse(savedUser)) : null;
  });

  const [loading, setLoading] = useState(true);

  // ========================================
  // Restore auth state on refresh
  // ========================================

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('authUser');

    if (savedUser) {
      setUser(normalizeUserData(JSON.parse(savedUser)));
    }

    if (!token) {
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    fetch(`${API_URL}/api/accounts/me/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        const userData = normalizeUserData(data?.data || data);
        localStorage.setItem('authUser', JSON.stringify(userData));
        setUser(userData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ========================================
  // Login - Using original endpoint
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
      const errorData = await tokenResponse.json();
      throw new Error(errorData?.detail || 'Invalid username or password');
    }

    const tokenData = await tokenResponse.json();

    const access = tokenData?.access;
    const refresh = tokenData?.refresh;

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

    const userData = normalizeUserData(meData?.data || meData);

    // Save user
    localStorage.setItem('authUser', JSON.stringify(userData));

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
  // Logout - Force reload to clear all state
  // ========================================
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('authUser');
  
    setUser(null);
    setIsLoggedIn(false);
    
    // Force reload to clear all routes and state
    window.location.href = '/login';
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

    const access = data?.access;

    if (!access) {
      logout();
      return null;
    }

    localStorage.setItem('access_token', access);

    return access;

  }, [logout]);

  // ========================================
  // Update user (e.g. after avatar upload)
  // ========================================

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = normalizeUserData({ ...prev, ...partial });
      localStorage.setItem('authUser', JSON.stringify(next));
      return next;
    });
  }, []);

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
    refreshToken,
    updateUser
  }), [
    isLoggedIn,
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateUser
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