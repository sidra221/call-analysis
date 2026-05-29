import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from 'hooks/useAuth';

export default function ProtectedRoute({
  children,
  allowedRoles = []
}) {
  const location = useLocation();

  const {
    isLoggedIn,
    user,
    loading
  } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // Redirect unauthenticated users

  if (!isLoggedIn) {
    console.log('🔴 Not logged in, redirecting to /login');
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }


  // Role-based protection
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user?.role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  allowedRoles: PropTypes.array
};