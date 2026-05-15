import PropTypes from 'prop-types';
import { createContext, useMemo, useState, useCallback } from 'react';

// ─────────────────────────────────────────
// API base URL — reads from environment variable
// ─────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  // ─────────────────────────────────────────
  // State — initialized from localStorage for persistence across refreshes
  // ─────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem('access_token')
  );

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('authUser');
    return saved ? JSON.parse(saved) : null;
  });

  // ─────────────────────────────────────────
  // Login — calls Backend JWT endpoint
  // ─────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    // Step 1: Get JWT tokens from Backend
    const tokenRes = await fetch(`${API_URL}/api/accounts/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });

    if (!tokenRes.ok) {
      throw new Error('Invalid credentials');
    }

    const { access, refresh } = (await tokenRes.json());

    // Step 2: Save tokens to localStorage
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    // Step 3: Fetch current user profile using the access token
    const meRes = await fetch(`${API_URL}/api/accounts/me/`, {
      headers: { Authorization: `Bearer ${access}` }
    });

    if (!meRes.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const meData = await meRes.json();
    const userData = meData.data;

    // Step 4: Save user info and update state
    localStorage.setItem('authUser', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  }, []);

  // ─────────────────────────────────────────
  // Register — calls Backend register endpoint
  // ─────────────────────────────────────────
  const register = useCallback(async ({ username, email, password, role }) => {
    const res = await fetch(`${API_URL}/api/accounts/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || 'Registration failed');
    }

    return await res.json();
  }, []);

  // ─────────────────────────────────────────
  // Logout — clears all stored tokens and state
  // ─────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('authUser');
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  // ─────────────────────────────────────────
  // Token refresh — called automatically when access token expires
  // ─────────────────────────────────────────
  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      logout();
      return null;
    }

    const res = await fetch(`${API_URL}/api/accounts/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    });

    if (!res.ok) {
      logout();
      return null;
    }

    const { access } = await res.json();
    localStorage.setItem('access_token', access);
    return access;
  }, [logout]);

  // ─────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────
  const value = useMemo(
    () => ({ isLoggedIn, user, login, register, logout, refreshToken }),
    [isLoggedIn, user, login, register, logout, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node };