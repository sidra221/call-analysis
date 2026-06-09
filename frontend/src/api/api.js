const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────────

function getAccessToken() {
  return localStorage.getItem('access_token');
}

function buildHeaders(isFormData = false) {
  const token = getAccessToken();

  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────

async function tryRefreshToken() {
  const refresh = localStorage.getItem('refresh_token');

  if (!refresh) return false;

  try {
    const res = await fetch(`${API_URL}/api/accounts/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh })
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();

    // DRF SIMPLE JWT
    const newAccess =
      data?.access ||
      data?.data?.access;

    if (newAccess) {
      localStorage.setItem('access_token', newAccess);
      return true;
    }

    return false;
  } catch (err) {
    console.error('Refresh token failed:', err);
    return false;
  }
}

// ─────────────────────────────────────────────
// MAIN REQUEST
// ─────────────────────────────────────────────

async function request(path, options = {}, isFormData = false) {
  const url = `${API_URL}${path}`;

  let headers = {
    ...buildHeaders(isFormData),
    ...(options.headers || {})
  };

  let response = await fetch(url, {
    ...options,
    headers
  });

  // TOKEN EXPIRED
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      headers = {
        ...buildHeaders(isFormData),
        ...(options.headers || {})
      };

      response = await fetch(url, {
        ...options,
        headers
      });
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('authUser');

      window.location.href = '/login';
      return;
    }
  }

  // DELETE SUCCESS
  if (response.status === 204) {
    return { success: true };
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // ERROR HANDLING
  if (!response.ok) {
    console.error('API ERROR:', {
      path,
      status: response.status,
      data
    });

    throw new Error(
      data?.error?.message ||
      data?.message ||
      data?.detail ||
      'Request failed'
    );
  }

  return data;
}

// ─────────────────────────────────────────────
// CALLS API
// ─────────────────────────────────────────────

export const callsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();

    return request(`/api/calls/calls/${query ? `?${query}` : ''}`);
  },

  get: (id) =>
    request(`/api/calls/calls/${id}/`),

  create: (formData) =>
    request(
      '/api/calls/calls/',
      {
        method: 'POST',
        body: formData
      },
      true
    ),

  patch: (id, data) =>
    request(`/api/calls/calls/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    request(`/api/calls/calls/${id}/`, {
      method: 'DELETE'
    }),

  process: (id) =>
    request(`/api/calls/calls/${id}/process/`, {
      method: 'POST'
    }),

  markReviewed: (id) =>
    request(`/api/calls/calls/${id}/mark-reviewed/`, {
      method: 'POST'
    }),

  downloadUrl: (id) =>
    `${API_URL}/api/calls/calls/${id}/download/`,

  positive: () =>
    request('/api/calls/calls/positive/'),

  negative: () =>
    request('/api/calls/calls/negative/'),

  neutral: () =>
    request('/api/calls/calls/neutral/')
};

// ─────────────────────────────────────────────
// Followups API
// ─────────────────────────────────────────────

export const followupsApi = {
  list: () => request('/api/calls/followups/'),

  get: (id) =>
    request(`/api/calls/followups/${id}/`),

  create: (data) =>
    request('/api/calls/followups/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  patch: (id, data) =>
    request(`/api/calls/followups/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    request(`/api/calls/followups/${id}/`, {
      method: 'DELETE'
    })
};

// ─────────────────────────────────────────────
// DASHBOARD API
// ─────────────────────────────────────────────

export const dashboardApi = {
  overview: () =>
    request('/api/dashboard/'),

  summary: () =>
    request('/api/dashboard/summary/'),

  topics: () =>
    request('/api/dashboard/topics/'),

  live: () =>
    request('/api/dashboard/live/')
};

// ─────────────────────────────────────────────
// LOGS API
// ─────────────────────────────────────────────

export const logsApi = {
  list: () =>
    request('/api/logs/')
};

// ─────────────────────────────────────────────
// REPORTS API
// ─────────────────────────────────────────────

export const reportsApi = {
  list: () =>
    request('/api/reports/reports/'),

  downloadUrl: (id) =>
    `${API_URL}/api/reports/reports/${id}/download/`,

  get: (id) =>
    request(`/api/reports/reports/${id}/`),

  generate: (data) =>
    request('/api/reports/reports/generate/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  patch: (id, data) =>
    request(`/api/reports/reports/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  publish: (id) =>
    request(`/api/reports/reports/${id}/publish/`, {
      method: 'POST'
    }),

  approve: (id) =>
    request(`/api/reports/reports/${id}/approve/`, {
      method: 'POST'
    }),

  addNotes: (id, notes) =>
    request(`/api/reports/reports/${id}/add-notes/`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    }),

  delete: (id) =>
    request(`/api/reports/reports/${id}/`, {
      method: 'DELETE'
    })
};

// ─────────────────────────────────────────────
// ACCOUNTS API
// ─────────────────────────────────────────────

export const accountsApi = {
  me: () =>
    request('/api/accounts/me/'),

  uploadAvatar: (formData) =>
    request(
      '/api/accounts/me/avatar/',
      {
        method: 'POST',
        body: formData
      },
      true
    ),

  setAvatarStyle: (avatarStyle) =>
    request('/api/accounts/me/avatar/', {
      method: 'PUT',
      body: JSON.stringify({ avatar_style: avatarStyle })
    }),

  managerOnly: () =>
    request('/api/accounts/manager-only/'),

  qaOnly: () =>
    request('/api/accounts/qa-only/')
};

// ─────────────────────────────────────────────
// USERS API
// ─────────────────────────────────────────────

export const usersApi = {
  list: () =>
    request('/api/accounts/users/'),

  register: (data) =>
    request('/api/accounts/register/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  get: (id) =>
    request(`/api/accounts/users/${id}/`),

  stats: (id) =>
    request(`/api/accounts/users/${id}/stats/`),

  activity: (id) =>
    request(`/api/accounts/users/${id}/activity/`),

  update: (id, data) =>
    request(`/api/accounts/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    request(`/api/accounts/users/${id}/`, {
      method: 'DELETE'
    })
};