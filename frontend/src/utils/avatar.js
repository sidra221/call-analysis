import { getRoleColor } from 'constants/colors';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function getAvatarStyle(user) {
  if (user?.avatar) return 'custom';
  return 'initial';
}

export function getAvatarInitial(displayName, user) {
  const name = displayName || user?.user || user?.username || 'User';
  return name[0]?.toUpperCase() || '?';
}

export function getAvatarUrl(user, displayName) {
  if (user?.avatar) {
    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }
    const base = API_URL.replace(/\/$/, '');
    const path = user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`;
    return `${base}${path}`;
  }

  return undefined;
}

export function getRoleAvatarBorderSx(role, width = 2, theme) {
  const { color, bg } = getRoleColor(role, theme);
  return {
    border: `${width}px solid`,
    borderColor: color,
    bgcolor: bg,
    color,
  };
}

export function buildSavedAvatarState() {
  return {
    pendingFile: null,
    previewUrl: null,
    removeCustom: false,
    fileError: '',
  };
}

export function isAvatarDraftDirty(savedUser, draftAvatar) {
  if (draftAvatar.pendingFile) return true;
  if (draftAvatar.removeCustom && savedUser?.avatar) return true;
  return false;
}

export function resolveAvatarPreview(user, draft, displayName) {
  if (draft.previewUrl) {
    return { src: draft.previewUrl, showInitial: false, hasCustom: true };
  }

  if (draft.removeCustom) {
    return { src: undefined, showInitial: true, hasCustom: false };
  }

  if (user?.avatar) {
    return { src: getAvatarUrl(user, displayName), showInitial: false, hasCustom: true };
  }

  return { src: undefined, showInitial: true, hasCustom: false };
}
