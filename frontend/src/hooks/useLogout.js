import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from 'hooks/useAuth';
import useSplash from 'hooks/useSplash';

export default function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { playLogoutSplash } = useSplash();

  return useCallback(() => {
    playLogoutSplash(() => {
      logout();
      navigate('/login', { replace: true });
    });
  }, [logout, navigate, playLogoutSplash]);
}
