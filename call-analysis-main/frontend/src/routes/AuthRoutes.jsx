import { lazy } from 'react';
import MinimalLayout from 'layout/MinimalLayout';
import Loadable from 'ui-component/Loadable';

const LoginPage = Loadable(lazy(() => import('pages/Login')));
const RegisterPage = Loadable(lazy(() => import('pages/Register')));

const AuthRoutes = {
  path: '/',
  element: <MinimalLayout />,
  children: [
    { path: 'login', element: <LoginPage /> },
    { path: 'register', element: <RegisterPage /> }
  ]
};

export default AuthRoutes;
