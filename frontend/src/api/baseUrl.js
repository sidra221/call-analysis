const trimSlash = (value) => value.replace(/\/$/, '');

export const API_URL = trimSlash(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'
);

export const WS_URL = trimSlash(
  import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8001'
);
