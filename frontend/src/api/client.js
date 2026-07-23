const API_BASE_URL = "http://127.0.0.1:8000";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

/**
 * Custom fetch wrapper to handle errors consistently
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  login: (credentials) => apiFetch("/auth/login", { method: 'POST', body: JSON.stringify(credentials) }),
  
  getHealth: () => apiFetch("/health"),
  
  getCases: (params) => {
    // Filter out undefined/null/empty strings from params
    const activeParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v != null && v !== '')
    );
    return apiFetch(`/cases?${new URLSearchParams(activeParams)}`);
  },
  getCaseById: (id) => apiFetch(`/cases/${id}`),
  
  createCase: (data) => apiFetch('/cases', { method: 'POST', body: JSON.stringify(data) }),
  
  searchCases: (query) => apiFetch(`/cases/search?q=${encodeURIComponent(query)}`),
  
  getDashboardStats: () => apiFetch("/dashboard/stats"),
  
  getMapCases: () => apiFetch("/cases/map"),
  
  getAnalyticsHotspots: () => apiFetch("/analytics/hotspots"),
  
  getSimilarCases: (id) => apiFetch(`/cases/${id}/similar`),
  
  // Alerts
  getAlerts: (status) => apiFetch(status ? `/alerts?status=${status}` : '/alerts'),
  getAlertById: (id) => apiFetch(`/alerts/${id}`),
  updateAlertStatus: (id, data) => apiFetch(`/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  refreshAlerts: () => apiFetch('/alerts/refresh', { method: 'POST' }),
  
  // Future endpoints to be implemented:
  getSummary: (id) => apiFetch(`/cases/${id}/summary`),
  regenerateSummary: (id) => apiFetch(`/cases/${id}/summary/regenerate`, { method: "POST" }),

  // Profile
  getProfile: () => apiFetch('/profile/me'),
  updateProfile: (data) => apiFetch('/profile/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // Demo Admin
  resetDemo: () => apiFetch('/demo/reset', { method: 'POST' }),
};
