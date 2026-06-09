import { Outlet } from 'react-router-dom';

import AuthCornerLogo from 'ui-component/AuthCornerLogo';

// ==============================|| MINIMAL LAYOUT ||============================== //

export default function MinimalLayout() {
  return (
    <>
      <AuthCornerLogo />
      <Outlet />
    </>
  );
}
