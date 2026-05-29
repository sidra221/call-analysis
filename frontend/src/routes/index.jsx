import { createBrowserRouter } from 'react-router-dom';
import { useMemo } from 'react';
import useAuth from 'hooks/useAuth';

// routes
import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';

// ==============================|| ROUTING RENDER ||============================== //

// Hook to get dynamic routes
export const useAppRouter = () => {
  const { user, isLoggedIn, loading } = useAuth();
  
  // Force re-creation of routes when user changes
  const router = useMemo(() => {
    const mainRoutes = MainRoutes();
    
    return createBrowserRouter([...mainRoutes, AuthRoutes], {
      basename: import.meta.env.VITE_APP_BASE_NAME
    });
  }, [user, isLoggedIn, loading]);
  
  return router;
};

// For backward compatibility - returns static router
const router = createBrowserRouter([...MainRoutes(), AuthRoutes], {
  basename: import.meta.env.VITE_APP_BASE_NAME
});

export default router;