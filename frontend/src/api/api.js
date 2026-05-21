const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function buildHeaders(isFormData = false) {
  const token = localStorage.getItem('access_token');
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function tryRefreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  const res = await fetch(`${API_URL}/api/accounts/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });
  if (!res.ok) return false;
  const { access } = await res.json();
  localStorage.setItem('access_token', access);
  return true;
}

async function request(path, options = {}, isFormData = false) {
  const url = `${API_URL}${path}`;

  let res = await fetch(url, {
    ...options,
    headers: { ...buildHeaders(isFormData), ...(options.headers || {}) }
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await fetch(url, {
        ...options,
        headers: { ...buildHeaders(isFormData), ...(options.headers || {}) }
      });
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
      return;
    }
  }

  // Handle 204 No Content (DELETE responses)
  if (res.status === 204) return { success: true };

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Request failed');
  return data;
}

// ─── Calls API ───────────────────────────────
export const callsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/calls/?${query}`);
  },
  get: (id) => request(`/api/calls/${id}/`),
  create: (formData) => request('/api/calls/', { method: 'POST', body: formData }, true),
  patch: (id, data) => request(`/api/calls/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/calls/${id}/`, { method: 'DELETE' }),
  process: (id) => request(`/api/calls/${id}/process/`, { method: 'POST' }),
  markReviewed: (id) => request(`/api/calls/${id}/mark-reviewed/`, { method: 'POST' }),
  downloadUrl: (id) => `${API_URL}/api/calls/${id}/download/`,
  positive: () => request('/api/calls/positive/'),
  negative: () => request('/api/calls/negative/'),
  neutral: () => request('/api/calls/neutral/')
};

// ─── Follow-ups API ──────────────────────────
export const followupsApi = {
  list: () => request('/api/calls/followups/'),
  create: (data) => request('/api/calls/followups/', { method: 'POST', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/api/calls/followups/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
};

// ─── Dashboard API ───────────────────────────
export const dashboardApi = {
  overview: () => request('/api/dashboard/'),
  summary: () => request('/api/dashboard/summary/'),
  topics: () => request('/api/dashboard/topics/'),
  live: () => request('/api/dashboard/live/')
};

// ─── Reports API ─────────────────────────────
export const reportsApi = {
  list: () => request('/api/reports/reports/'),
  get: (id) => request(`/api/reports/reports/${id}/`),
  generate: (data) => request('/api/reports/reports/generate/', { method: 'POST', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/api/reports/reports/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  publish: (id) => request(`/api/reports/reports/${id}/publish/`, { method: 'POST' }),
  delete: (id) => request(`/api/reports/reports/${id}/`, { method: 'DELETE' })
};

// ─── Accounts API ────────────────────────────
export const accountsApi = {
  me: () => request('/api/accounts/me/'),
  managerOnly: () => request('/api/accounts/manager-only/'),
  qaOnly: () => request('/api/accounts/qa-only/')
};

// ─── Users API ───────────────────────────────
export const usersApi = {
  list: () => request('/api/accounts/users/'),
  register: (data) => request('/api/accounts/register/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/accounts/users/${id}/`, { method: 'DELETE' })
};