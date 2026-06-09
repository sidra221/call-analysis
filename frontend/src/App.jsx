import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import NavigationScroll from 'layout/NavigationScroll';
import ThemeCustomization from 'themes';
import useAuth from 'hooks/useAuth';
import AuthRoutes from 'routes/AuthRoutes';
import getMainRoutes from 'routes/MainRoutes';
import { SplashProvider } from 'contexts/SplashContext';
import useSplash from 'hooks/useSplash';
import SplashScreen from 'ui-component/SplashScreen';

function AppContent() {
  const { user, loading } = useAuth();
  const { showSplash, splashVariant, completeSplash, handleLogoutExitStart } = useSplash();

  // Validate token on every render
  const token = localStorage.getItem('access_token');
  if (!token) {
    localStorage.removeItem('authUser');
    localStorage.removeItem('refresh_token');
  }

  const router = createBrowserRouter(
    [...getMainRoutes(), AuthRoutes],
    { basename: import.meta.env.VITE_APP_BASE_NAME }
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {showSplash && (
        <SplashScreen
          variant={splashVariant}
          onComplete={completeSplash}
          onLogoutExitStart={handleLogoutExitStart}
        />
      )}
      <RouterProvider router={router} key={user?.id || 'logout'} />
    </>
  );
}

export default function App() {
  return (
    <ThemeCustomization>
      <NavigationScroll>
        <SplashProvider>
          <AppContent />
        </SplashProvider>
      </NavigationScroll>
    </ThemeCustomization>
  );
}
