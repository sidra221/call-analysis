import PropTypes from 'prop-types';
import { createContext, useMemo, useState } from 'react';

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('authUser');
    return saved ? JSON.parse(saved) : { username: 'Manager User', email: 'manager@callanalysis.com', role: 'Manager' };
  });

  const login = ({ email }) => {
    const nextUser = {
      username: email?.split('@')[0] || 'QA User',
      email: email || 'qa@callanalysis.com',
      role: email?.includes('manager') ? 'Manager' : 'QA'
    };
    setUser(nextUser);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('authUser', JSON.stringify(nextUser));
  };

  const register = ({ username, email }) => {
    const nextUser = {
      username: username || 'New User',
      email: email || 'user@callanalysis.com',
      role: 'QA'
    };
    setUser(nextUser);
    localStorage.setItem('authUser', JSON.stringify(nextUser));
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authUser');
  };

  const value = useMemo(() => ({ isLoggedIn, user, login, register, logout }), [isLoggedIn, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node };
