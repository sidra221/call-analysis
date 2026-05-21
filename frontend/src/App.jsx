import { RouterProvider } from 'react-router-dom';
import router from 'routes';
import NavigationScroll from 'layout/NavigationScroll';
import ThemeCustomization from 'themes';
import { AuthProvider } from 'contexts/AuthContext';

export default function App() {
  return (
    <ThemeCustomization>
      <AuthProvider>
        <NavigationScroll>
          <RouterProvider router={router} />
        </NavigationScroll>
      </AuthProvider>
    </ThemeCustomization>
  );
}