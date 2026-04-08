import { use } from 'react';
import { AuthContext } from 'contexts/AuthContext';

export default function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
