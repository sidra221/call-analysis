const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function getAvatarUrl(user, displayName) {
  if (user?.avatar) {
    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }
    const base = API_URL.replace(/\/$/, '');
    const path = user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`;
    return `${base}${path}`;
  }

  const name = displayName || user?.user || user?.username || 'User';
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;
}
